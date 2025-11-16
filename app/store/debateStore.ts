import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useSocket } from '@/hooks/useSocket';

interface DebateSession {
  id: string;
  topicId: string;
  topic: {
    id: string;
    title: string;
    motion: string;
    description: string;
    difficulty: string;
    timeLimit: number;
  };
  role: 'government' | 'opposition';
  score?: number;
  maxScore: number;
  duration?: number;
  isLive: boolean;
  roomId?: string;
  transcript?: any;
  feedback?: any;
  metrics?: any;
  createdAt: string;
  updatedAt: string;
}

interface DebateMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: 'text' | 'voice' | 'transcript';
  timestamp: number;
}

interface DebateState {
  currentSession: DebateSession | null;
  isLoading: boolean;
  error: string | null;
  messages: DebateMessage[];
  isConnected: boolean;
  isRecording: boolean;
  recordingStartTime: number | null;
  speakingTime: number;
  currentRound: number;
  totalTime: number;
  timeRemaining: number;
}

interface DebateActions {
  createSession: (topicId: string, role: 'government' | 'opposition') => Promise<void>;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  updateSession: (sessionId: string, data: Partial<DebateSession>) => void;
  completeSession: (sessionId: string, data: {
    transcript: any;
    metrics: any;
    duration: number;
  }) => Promise<void>;
  sendMessage: (message: string, type?: 'text' | 'voice' | 'transcript') => void;
  startRecording: () => void;
  stopRecording: () => void;
  requestFeedback: (transcript: any, metrics: any) => void;
  requestCoaching: (context: string) => void;
  updateScore: (score: number, metrics: any) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  setCurrentRound: (round: number) => void;
  updateTimeRemaining: (time: number) => void;
  addMessage: (message: DebateMessage) => void;
  clearMessages: () => void;
  setIsConnected: (connected: boolean) => void;
}

type DebateStore = DebateState & DebateActions;

export const useDebateStore = create<DebateStore>()(
  subscribeWithSelector(
    (set, get) => {
      const { actions, debateActions } = useSocket({
        onDebateMessage: (message) => {
          if (message.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              messages: [...state.messages, message]
            }));
          }
        },
        onVoiceStarted: (data) => {
          if (data.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              isRecording: true,
              recordingStartTime: Date.now(),
              speakingTime: 0
            }));
          }
        },
        onVoiceEnded: (data) => {
          if (data.sessionId === get().currentSession?.id) {
            set(state => {
              const speakingTime = state.recordingStartTime
                ? (Date.now() - state.recordingStartTime) / 1000
                : 0;

              return {
                ...state,
                isRecording: false,
                recordingStartTime: null,
                speakingTime: state.speakingTime + speakingTime
              };
            });
          }
        },
        onScoreUpdated: (data) => {
          if (data.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              currentSession: state.currentSession ? {
                ...state.currentSession,
                score: data.score,
                metrics: data.metrics
              } : null
            }));
          }
        },
        onFeedbackGenerated: (feedback) => {
          if (feedback.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              currentSession: state.currentSession ? {
                ...state.currentSession,
                feedback: feedback
              } : null
            }));
          }
        },
        onFeedbackAvailable: (data) => {
          if (data.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              currentSession: state.currentSession ? {
                ...state.currentSession,
                feedback: data.feedback
              } : null
            }));
          }
        },
        onUserJoined: (data) => {
          if (data.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              messages: [...state.messages, {
                id: `join_${Date.now()}`,
                userId: data.userId,
                username: data.username,
                message: `${data.username} joined the debate`,
                type: 'text',
                timestamp: Date.now()
              }]
            }));
          }
        },
        onUserLeft: (data) => {
          if (data.sessionId === get().currentSession?.id) {
            set(state => ({
              ...state,
              messages: [...state.messages, {
                id: `leave_${Date.now()}`,
                userId: data.userId,
                username: data.username,
                message: `${data.username} left the debate`,
                type: 'text',
                timestamp: Date.now()
              }]
            }));
          }
        },
        setIsConnected: (connected) => {
          set(state => ({
            ...state,
            isConnected: connected
          }));
        }
      });

      return {
        // State
        currentSession: null,
        isLoading: false,
        error: null,
        messages: [],
        isConnected: false,
        isRecording: false,
        recordingStartTime: null,
        speakingTime: 0,
        currentRound: 1,
        totalTime: 0,
        timeRemaining: 0,

        // Actions
        createSession: async (topicId: string, role: 'government' | 'opposition') => {
          set({ isLoading: true, error: null });

          try {
            const session = await actions.createDebateSession({ topicId, role });

            set(state => ({
              ...state,
              currentSession: session,
              isLoading: false,
              messages: [],
              currentRound: 1,
              totalTime: 0,
              timeRemaining: session.topic?.timeLimit * 60 || 600 // Convert to seconds
            }));

            // Auto-join the session room
            if (session.id && session.roomId) {
              actions.joinDebate(session.id);
            }
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.message || 'Failed to create debate session'
            });
          }
        },

        joinSession: (sessionId: string) => {
          actions.joinDebate(sessionId);
        },

        leaveSession: (sessionId: string) => {
          actions.leaveDebate(sessionId);
          set(state => ({
            ...state,
            currentSession: null,
            messages: [],
            isRecording: false,
            speakingTime: 0,
            totalTime: 0,
            timeRemaining: 0
          }));
        },

        updateSession: async (sessionId: string, data: Partial<DebateSession>) => {
          if (sessionId !== get().currentSession?.id) return;

          try {
            await actions.updateDebateSession(sessionId, data);

            set(state => ({
              ...state,
              currentSession: state.currentSession ? {
                ...state.currentSession,
                ...data,
                updatedAt: new Date().toISOString()
              } : null
            }));
          } catch (error: any) {
            set({ error: error.message || 'Failed to update session' });
          }
        },

        completeSession: async (sessionId: string, data: {
          transcript: any;
          metrics: any;
          duration: number;
        }) => {
          if (sessionId !== get().currentSession?.id) return;

          set({ isLoading: true });

          try {
            const result = await actions.generateSessionFeedback(sessionId, {
              transcript: data.transcript,
              metrics: data.metrics
            });

            set(state => ({
              ...state,
              currentSession: state.currentSession ? {
                ...state.currentSession,
                transcript: data.transcript,
                feedback: result.feedback,
                metrics: data.metrics,
                duration: data.duration,
                score: result.score,
                completedAt: new Date().toISOString()
              } : null,
              isLoading: false
            }));
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.message || 'Failed to complete session'
            });
          }
        },

        sendMessage: (message: string, type: 'text' | 'voice' | 'transcript' = 'text') => {
          if (!get().currentSession?.id) return;

          const messageData = {
            sessionId: get().currentSession!.id,
            message,
            type,
            timestamp: Date.now()
          };

          actions.sendDebateMessage(messageData);
          set(state => ({
            ...state,
            messages: [...state.messages, {
              id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: 'self',
              username: 'You',
              message,
              type,
              timestamp: Date.now()
            }]
          }));
        },

        startRecording: () => {
          if (!get().currentSession?.id) return;

          actions.startVoice(get().currentSession!.id);
          set(state => ({
            ...state,
            isRecording: true,
            recordingStartTime: Date.now()
          }));
        },

        stopRecording: () => {
          if (!get().currentSession?.id || !get().isRecording) return;

          const recordingDuration = get().recordingStartTime
            ? (Date.now() - get().recordingStartTime) / 1000
            : 0;

          actions.endVoice(get().currentSession!.id, recordingDuration);
          set(state => ({
            ...state,
            isRecording: false,
            recordingStartTime: null,
            speakingTime: get().speakingTime + recordingDuration
          }));
        },

        requestFeedback: (transcript: any, metrics: any) => {
          if (!get().currentSession?.id) return;

          set({ isLoading: true });

          try {
            const feedback = await actions.generateSessionFeedback(get().currentSession!.id, {
              transcript,
              metrics
            });

            set(state => ({
              ...state,
              currentSession: state.currentSession ? {
                ...state.currentSession,
                feedback
              } : null,
              isLoading: false
            }));
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.message || 'Failed to generate feedback'
            });
          }
        },

        requestCoaching: (context: string) => {
          if (!get().currentSession?.id) return;

          actions.requestCoaching(get().currentSession!.id, context);
        },

        updateScore: (score: number, metrics: any) => {
          if (!get().currentSession?.id) return;

          set(state => ({
            ...state,
            currentSession: state.currentSession ? {
              ...state.currentSession,
              score,
              metrics
            } : null
          }));

          actions.updateScore(get().currentSession!.id, score, metrics);
        },

        setError: (error: string | null) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set({
            currentSession: null,
            isLoading: false,
            error: null,
            messages: [],
            isRecording: false,
            recordingStartTime: null,
            speakingTime: 0,
            currentRound: 1,
            totalTime: 0,
            timeRemaining: 0
          });
        },

        setCurrentRound: (round: number) => {
          set(state => ({
            ...state,
            currentRound: round
          }));
        },

        updateTimeRemaining: (time: number) => {
          set(state => ({
            ...state,
            timeRemaining: time
          }));
        },

        addMessage: (message: DebateMessage) => {
          set(state => ({
            ...state,
            messages: [...state.messages, message]
          }));
        },

        clearMessages: () => {
          set(state => ({
            ...state,
            messages: []
          }));
        },

        setIsConnected: (connected: boolean) => {
          set(state => ({
            ...state,
            isConnected: connected
          }));
        }
      };
    },
    {
      name: 'debate-store',
      partialize: (state) => ({
        currentSession: state.currentSession,
        isLoading: state.isLoading,
        error: state.error,
        messages: state.messages,
        isConnected: state.isConnected,
        isRecording: state.isRecording,
        recordingStartTime: state.recordingStartTime,
        speakingTime: state.speakingTime,
        currentRound: state.currentRound,
        totalTime: state.totalTime,
        timeRemaining: state.timeRemaining
      })
    }
  )
);

// Selectors for easier access
export const useCurrentDebateSession = () => useDebateStore(state => state.currentSession);
export const useDebateMessages = () => useDebateStore(state => state.messages);
export const useDebateIsLoading = () => useDebateStore(state => state.isLoading);
export const useDebateError = () => useDebateStore(state => state.error);
export const useDebateIsConnected = () => useDebateStore(state => state.isConnected);
export const useDebateIsRecording = () => useDebateStore(state => state.isRecording);
export const useDebateSpeakingTime = () => useDebateStore(state => state.speakingTime);
export const useDebateTimeRemaining = () => useDebateStore(state => state.timeRemaining);