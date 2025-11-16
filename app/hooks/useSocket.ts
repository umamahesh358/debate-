import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/services/api';

interface SocketState {
  connected: boolean;
  authenticated: boolean;
  connecting: boolean;
  error: string | null;
}

interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAuthenticate?: (success: boolean) => void;
  onError?: (error: string) => void;
  onDebateMessage?: (message: any) => void;
  onVoiceStarted?: (data: any) => void;
  onVoiceEnded?: (data: any) => void;
  onScoreUpdated?: (data: any) => void;
  onFeedbackGenerated?: (feedback: any) => void;
  onCoachingTip?: (tip: any) => void;
  onAchievementUnlocked?: (achievement: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
  onUserDisconnected?: (data: any) => void;
  onFeedbackAvailable?: (data: any) => void;
}

export const useSocket = (callbacks: SocketCallbacks = {}) => {
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    authenticated: false,
    connecting: false,
    error: null
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Initialize socket connection
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setSocketState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setSocketState(prev => ({ ...prev, connected: true, connecting: false, error: null }));
      reconnectAttempts.current = 0;

      // Authenticate automatically if user is logged in
      if (api.isAuthenticated()) {
        const auth = api.getCurrentUser();
        if (auth?.tokens?.accessToken) {
          socket.emit('authenticate', auth.tokens.accessToken);
        }
      }

      callbacks.onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      setSocketState(prev => ({ ...prev, connected: false, authenticated: false }));
      callbacks.onDisconnect?.();

      // Attempt to reconnect if not intentional disconnect
      if (reason !== 'io client disconnect') {
        handleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      setSocketState(prev => ({ ...prev, connecting: false, error: 'Connection failed' }));
      handleReconnect();
    });

    // Authentication events
    socket.on('authenticated', (data) => {
      setSocketState(prev => ({ ...prev, authenticated: data.success }));
      callbacks.onAuthenticate?.(data.success);
    });

    socket.on('authentication_error', (data) => {
      setSocketState(prev => ({ ...prev, authenticated: false, error: data.error }));
      callbacks.onError?.(data.error);
    });

    // Debate events
    socket.on('joined-debate', (data) => {
      console.log('Joined debate:', data);
      callbacks.onUserJoined?.(data);
    });

    socket.on('left-debate', (data) => {
      console.log('Left debate:', data);
      callbacks.onUserLeft?.(data);
    });

    socket.on('debate-message', (message) => {
      console.log('Debate message:', message);
      callbacks.onDebateMessage?.(message);
    });

    socket.on('voice-started', (data) => {
      console.log('Voice started:', data);
      callbacks.onVoiceStarted?.(data);
    });

    socket.on('voice-ended', (data) => {
      console.log('Voice ended:', data);
      callbacks.onVoiceEnded?.(data);
    });

    socket.on('score-updated', (data) => {
      console.log('Score updated:', data);
      callbacks.onScoreUpdated?.(data);
    });

    socket.on('feedback-generated', (feedback) => {
      console.log('Feedback generated:', feedback);
      callbacks.onFeedbackGenerated?.(feedback);
    });

    socket.on('feedback-available', (data) => {
      console.log('Feedback available:', data);
      callbacks.onFeedbackAvailable?.(data);
    });

    socket.on('coaching-tip', (tip) => {
      console.log('Coaching tip:', tip);
      callbacks.onCoachingTip?.(tip);
    });

    socket.on('achievement-unlocked', (achievement) => {
      console.log('Achievement unlocked:', achievement);
      callbacks.onAchievementUnlocked?.(achievement);
    });

    socket.on('user-joined', (data) => {
      console.log('User joined debate:', data);
      callbacks.onUserJoined?.(data);
    });

    socket.on('user-left', (data) => {
      console.log('User left debate:', data);
      callbacks.onUserLeft?.(data);
    });

    socket.on('user-disconnected', (data) => {
      console.log('User disconnected:', data);
      callbacks.onUserDisconnected?.(data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setSocketState(prev => ({ ...prev, error: error.message }));
      callbacks.onError?.(error.message);
    });

  }, [callbacks]);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect();
        }
      }, reconnectDelay);
    } else {
      console.log('Max reconnection attempts reached');
      setSocketState(prev => ({
        ...prev,
        connecting: false,
        error: 'Unable to connect after multiple attempts'
      }));
    }
  }, []);

  // Effect to manage socket connection
  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket]);

  // Authentication when user logs in/out
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      if (api.isAuthenticated()) {
        const auth = api.getCurrentUser();
        if (auth?.tokens?.accessToken) {
          socketRef.current.emit('authenticate', auth.tokens.accessToken);
        }
      } else {
        // Disconnect socket when user logs out
        socketRef.current.disconnect();
      }
    }
  }, [api.isAuthenticated()]);

  // Socket actions
  const actions = {
    // Debate room actions
    joinDebate: (sessionId: string) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('join-debate', sessionId);
      }
    },

    leaveDebate: (sessionId: string) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('leave-debate', sessionId);
      }
    },

    sendDebateMessage: (sessionId: string, message: string, type: 'text' | 'voice' | 'transcript' = 'text') => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('debate-message', {
          sessionId,
          message,
          type,
          timestamp: Date.now()
        });
      }
    },

    // Voice actions
    startVoice: (sessionId: string) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('voice-start', { sessionId });
      }
    },

    endVoice: (sessionId: string, duration: number) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('voice-end', { sessionId, duration });
      }
    },

    // AI actions
    requestFeedback: (sessionId: string, transcript: any, metrics: any) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('request-feedback', {
          sessionId,
          transcript,
          metrics
        });
      }
    },

    requestCoaching: (sessionId: string, context: string) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('request-coaching', {
          sessionId,
          context
        });
      }
    },

    updateScore: (sessionId: string, score: number, metrics: any) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('score-update', {
          sessionId,
          score,
          metrics
        });
      }
    },

    // Gamification actions
    checkAchievements: (userId?: string) => {
      if (socketRef.current?.connected && socketState.authenticated) {
        socketRef.current.emit('check-achievements', { userId });
      }
    }
  };

  return {
    socket: socketRef.current,
    socketState,
    actions,
    isConnected: socketState.connected && socketState.authenticated,
    isConnecting: socketState.connecting,
    error: socketState.error
  };
};

// Hook for managing debate sessions specifically
export const useDebateSocket = (sessionId?: string) => {
  const socket = useSocket({
    onDebateMessage: (message) => {
      if (message.sessionId === sessionId) {
        console.log('Debate message for current session:', message);
      }
    },
    onUserJoined: (data) => {
      if (data.sessionId === sessionId) {
        console.log('User joined current debate session:', data);
      }
    },
    onUserLeft: (data) => {
      if (data.sessionId === sessionId) {
        console.log('User left current debate session:', data);
      }
    }
  });

  const debateActions = {
    sendMessage: (message: string, type: 'text' | 'voice' | 'transcript' = 'text') => {
      if (sessionId) {
        socket.actions.sendDebateMessage(sessionId, message, type);
      }
    },

    startVoice: () => {
      if (sessionId) {
        socket.actions.startVoice(sessionId);
      }
    },

    endVoice: (duration: number) => {
      if (sessionId) {
        socket.actions.endVoice(sessionId, duration);
      }
    },

    requestFeedback: (transcript: any, metrics: any) => {
      if (sessionId) {
        socket.actions.requestFeedback(sessionId, transcript, metrics);
      }
    },

    requestCoaching: (context: string) => {
      if (sessionId) {
        socket.actions.requestCoaching(sessionId, context);
      }
    },

    updateScore: (score: number, metrics: any) => {
      if (sessionId) {
        socket.actions.updateScore(sessionId, score, metrics);
      }
    },

    join: () => {
      if (sessionId) {
        socket.actions.joinDebate(sessionId);
      }
    },

    leave: () => {
      if (sessionId) {
        socket.actions.leaveDebate(sessionId);
      }
    }
  };

  return {
    ...socket,
    debateActions
  };
};