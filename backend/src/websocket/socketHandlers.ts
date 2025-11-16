import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const socketHandlers = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  // Authenticate socket connection
  socket.on('authenticate', async (token: string) => {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key'
      ) as any;

      socket.userId = decoded.userId;
      socket.user = decoded;

      socket.emit('authenticated', { success: true });
      logger.info(`Socket authenticated: ${socket.id} for user: ${decoded.userId}`);

    } catch (error) {
      socket.emit('authentication_error', { error: 'Invalid token' });
      logger.warn(`Socket authentication failed: ${socket.id}`);
    }
  });

  // Join debate session room
  socket.on('join-debate', (sessionId: string) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const roomName = `debate-${sessionId}`;
    socket.join(roomName);

    socket.emit('joined-debate', { sessionId });
    logger.info(`User ${socket.userId} joined debate room: ${roomName}`);

    // Notify others in the room
    socket.to(roomName).emit('user-joined', {
      userId: socket.userId,
      username: socket.user?.username
    });
  });

  // Leave debate session room
  socket.on('leave-debate', (sessionId: string) => {
    const roomName = `debate-${sessionId}`;
    socket.leave(roomName);

    socket.emit('left-debate', { sessionId });
    logger.info(`User ${socket.userId} left debate room: ${roomName}`);

    // Notify others in the room
    socket.to(roomName).emit('user-left', {
      userId: socket.userId,
      username: socket.user?.username
    });
  });

  // Handle debate messages
  socket.on('debate-message', (data: {
    sessionId: string;
    message: string;
    type: 'text' | 'voice' | 'transcript';
    timestamp?: number;
  }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const roomName = `debate-${data.sessionId}`;
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.userId,
      username: socket.user?.username,
      message: data.message,
      type: data.type,
      timestamp: data.timestamp || Date.now()
    };

    // Broadcast to all users in the debate room
    io.to(roomName).emit('debate-message', messageData);

    logger.debug(`Debate message in room ${roomName} from user ${socket.userId}`);
  });

  // Voice recording started
  socket.on('voice-start', (data: { sessionId: string }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const roomName = `debate-${data.sessionId}`;
    socket.to(roomName).emit('voice-started', {
      userId: socket.userId,
      username: socket.user?.username
    });
  });

  // Voice recording ended
  socket.on('voice-end', (data: { sessionId: string; duration: number }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const roomName = `debate-${data.sessionId}`;
    socket.to(roomName).emit('voice-ended', {
      userId: socket.userId,
      username: socket.user?.username,
      duration: data.duration
    });
  });

  // Request AI feedback
  socket.on('request-feedback', async (data: {
    sessionId: string;
    transcript: any;
    metrics: any;
  }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      // TODO: Integrate with actual AI service
      // For now, simulate feedback generation
      const feedback = {
        sessionId: data.sessionId,
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        strengths: generateRandomStrengths(),
        improvements: generateRandomImprovements(),
        detailedAnalysis: {
          argumentQuality: (Math.random() * 2 + 3).toFixed(1),
          clarity: (Math.random() * 2 + 3).toFixed(1),
          evidenceUsage: (Math.random() * 2 + 2.5).toFixed(1),
          timeManagement: (Math.random() * 2 + 3.2).toFixed(1),
          relevance: (Math.random() * 2 + 3.5).toFixed(1)
        },
        nextSteps: [
          'Practice with more challenging topics',
          'Review argument structure',
          'Work on persuasive techniques'
        ]
      };

      // Send feedback to the requesting user
      socket.emit('feedback-generated', feedback);

      // Also broadcast to room if it's a live session
      const roomName = `debate-${data.sessionId}`;
      socket.to(roomName).emit('feedback-available', {
        sessionId: data.sessionId,
        userId: socket.userId
      });

      logger.info(`AI feedback generated for session: ${data.sessionId}`);

    } catch (error) {
      logger.error('Error generating AI feedback:', error);
      socket.emit('feedback-error', {
        error: 'Failed to generate feedback',
        sessionId: data.sessionId
      });
    }
  });

  // Live coaching tips
  socket.on('request-coaching', (data: {
    sessionId: string;
    context: string;
  }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    // TODO: Implement actual coaching logic
    const coachingTip = generateCoachingTip(data.context);

    // Send coaching tip to the user
    socket.emit('coaching-tip', {
      sessionId: data.sessionId,
      tip: coachingTip,
      timestamp: Date.now()
    });

    logger.info(`Coaching tip sent for session: ${data.sessionId}`);
  });

  // Real-time score updates
  socket.on('score-update', (data: {
    sessionId: string;
    score: number;
    metrics: any;
  }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const roomName = `debate-${data.sessionId}`;
    const scoreData = {
      sessionId: data.sessionId,
      userId: socket.userId,
      score: data.score,
      metrics: data.metrics,
      timestamp: Date.now()
    };

    // Broadcast score update to room
    io.to(roomName).emit('score-updated', scoreData);

    logger.debug(`Score updated in session ${data.sessionId}: ${data.score}`);
  });

  // Achievement notifications
  socket.on('check-achievements', (data: { userId?: string }) => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    // TODO: Implement actual achievement checking
    // For now, send a mock achievement
    const mockAchievement = {
      id: 'achievement_' + Date.now(),
      name: 'First Debate',
      description: 'Completed your first debate session',
      icon: 'trophy',
      points: 50,
      earnedAt: new Date().toISOString()
    };

    socket.emit('achievement-unlocked', mockAchievement);

    logger.info(`Achievement checked for user: ${socket.userId}`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);

    if (socket.userId) {
      // Leave all debate rooms for this user
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith('debate-'));

      rooms.forEach(roomName => {
        socket.to(roomName).emit('user-disconnected', {
          userId: socket.userId,
          username: socket.user?.username
        });
      });
    }
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
};

// Helper functions for mock data
function generateRandomStrengths(): string[] {
  const possibleStrengths = [
    'Clear argument structure',
    'Good use of evidence',
    'Strong opening statement',
    'Effective rebuttals',
    'Confident delivery',
    'Well-organized points',
    'Persuasive language',
    'Good time management'
  ];

  const count = Math.floor(Math.random() * 3) + 2; // 2-4 strengths
  const selected = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * possibleStrengths.length);
    if (!selected.includes(possibleStrengths[index])) {
      selected.push(possibleStrengths[index]);
    }
  }

  return selected;
}

function generateRandomImprovements(): string[] {
  const possibleImprovements = [
    'Work on evidence usage',
    'Improve time management',
    'Strengthen argument structure',
    'Use more persuasive language',
    'Practice confidence in delivery',
    'Develop better rebuttals',
    'Research more thoroughly',
    'Improve logical flow',
    'Use more examples',
    'Work on conclusion strength'
  ];

  const count = Math.floor(Math.random() * 3) + 1; // 1-3 improvements
  const selected = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * possibleImprovements.length);
    if (!selected.includes(possibleImprovements[index])) {
      selected.push(possibleImprovements[index]);
    }
  }

  return selected;
}

function generateCoachingTip(context: string): string {
  const tips = {
    'opening': 'Start with a strong, clear thesis statement that outlines your main arguments.',
    'argument': 'Support each claim with specific evidence and logical reasoning.',
    'rebuttal': 'Listen carefully to identify weaknesses in your opponent\'s arguments.',
    'conclusion': 'Summarize your key points and end with a memorable closing statement.',
    'delivery': 'Speak clearly and maintain good eye contact with your audience.',
    'timing': 'Practice managing your time to ensure you cover all important points.',
    'confidence': 'Project confidence through steady pace and controlled gestures.',
    'default': 'Focus on the strength of your arguments rather than just winning the debate.'
  };

  return tips[context as keyof typeof tips] || tips.default;
}