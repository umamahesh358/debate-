import { api } from './api';

export interface DebateTopic {
  id: string;
  title: string;
  motion: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimit: number;
  keyArguments: {
    government: string[];
    opposition: string[];
  };
}

export interface DebateSession {
  id: string;
  topicId: string;
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

export interface DebateMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: 'text' | 'voice' | 'transcript';
  timestamp: number;
}

export interface DebateFeedback {
  overallScore: number;
  argumentQuality: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  delivery: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  strategy: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  overallFeedback: string[];
  nextSteps: string[];
}

// Debate API integration service
export const debateApi = {
  // Topic APIs
  getTopics: async (params?: any) => {
    return await api.getTopics(params);
  },

  getTopicById: async (topicId: string) => {
    return await api.getTopicById(topicId);
  },

  getRandomTopic: async (params?: any) => {
    return await api.getRandomTopic(params);
  },

  // Session APIs
  createDebateSession: async (data: {
    topicId: string;
    role: 'government' | 'opposition';
  }) => {
    const response = await api.createDebateSession(data);

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create debate session');
  },

  getDebateSession: async (sessionId: string) => {
    return await api.getDebateSession(sessionId);
  },

  updateDebateSession: async (sessionId: string, data: any) => {
    return await api.updateDebateSession(sessionId, data);
  },

  getUserDebates: async (params?: any) => {
    return await api.getUserDebates(params);
  },

  getDebateStats: async () => {
    return await api.getDebateStats();
  },

  generateSessionFeedback: async (sessionId: string, data: {
    transcript: any;
    metrics: any;
  }) => {
    return await api.generateSessionFeedback(sessionId, data);
  }
  }
};