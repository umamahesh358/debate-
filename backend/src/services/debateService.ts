import { prisma } from '@/config/prisma';
import { logger } from '@/utils/logger';
import { DebateRole, DifficultyLevel } from '@prisma/client';

export interface CreateSessionData {
  userId: string;
  topicId: string;
  role: DebateRole;
}

export interface UpdateSessionData {
  transcript?: any;
  feedback?: any;
  score?: number;
  duration?: number;
  completedAt?: Date;
  metrics?: any;
}

export interface TopicFilters {
  category?: string;
  difficulty?: DifficultyLevel;
  search?: string;
  tags?: string[] | string;
}

export class DebateService {
  // Get debate topics with filters and pagination
  static async getTopics(filters: TopicFilters, page: number = 1, limit: number = 20) {
    const where: any = {
      isActive: true
    };

    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.search) {
      where.OR = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { motion: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.tags) {
      const tagArray = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      where.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    // Get topics and total count
    const [topics, total] = await Promise.all([
      prisma.debateTopic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { usageCount: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          motion: true,
          description: true,
          category: true,
          difficulty: true,
          timeLimit: true,
          tags: true,
          averageRating: true,
          ratingCount: true,
          usageCount: true
        }
      }),
      prisma.debateTopic.count({ where })
    ]);

    return {
      topics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Get specific topic by ID
  static async getTopicById(topicId: string) {
    const topic = await prisma.debateTopic.findUnique({
      where: { id: topicId, isActive: true },
      select: {
        id: true,
        title: true,
        motion: true,
        description: true,
        category: true,
        difficulty: true,
        timeLimit: true,
        keyArguments: true,
        tags: true,
        averageRating: true,
        ratingCount: true,
        usageCount: true
      }
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    return topic;
  }

  // Get random topic
  static async getRandomTopic(filters?: TopicFilters) {
    const where: any = {
      isActive: true
    };

    if (filters) {
      if (filters.category) where.category = filters.category;
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.tags) {
        const tagArray = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
        where.tags = { $in: tagArray };
      }
    }

    // Get count of matching topics
    const count = await prisma.debateTopic.count({ where });

    if (count === 0) {
      throw new Error('No topics found matching the criteria');
    }

    // Get random topic
    const randomIndex = Math.floor(Math.random() * count);
    const topics = await prisma.debateTopic.findMany({
      where,
      skip: randomIndex,
      take: 1,
      select: {
        id: true,
        title: true,
        motion: true,
        description: true,
        category: true,
        difficulty: true,
        timeLimit: true,
        keyArguments: true,
        tags: true
      }
    });

    if (topics.length === 0) {
      throw new Error('Failed to get random topic');
    }

    return topics[0];
  }

  // Create debate session
  static async createSession(data: CreateSessionData) {
    // Verify topic exists
    const topic = await prisma.debateTopic.findUnique({
      where: { id: data.topicId, isActive: true }
    });

    if (!topic) {
      throw new Error('Topic not found or inactive');
    }

    // Generate unique room ID for live sessions
    const roomId = `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = await prisma.debateSession.create({
      data: {
        userId: data.userId,
        topicId: data.topicId,
        role: data.role,
        roomId,
        isLive: true,
        maxScore: 100,
        createdAt: new Date()
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            motion: true,
            description: true,
            difficulty: true,
            timeLimit: true,
            keyArguments: true
          }
        }
      }
    });

    // Increment topic usage count
    await prisma.debateTopic.update({
      where: { id: data.topicId },
      data: {
        usageCount: { $increment: 1 },
        updatedAt: new Date()
      }
    });

    logger.info(`Debate session created: ${session.id} for user: ${data.userId}`);

    return session;
  }

  // Get debate session by ID
  static async getSessionById(sessionId: string, userId?: string) {
    const where: any = { id: sessionId };

    if (userId) {
      where.userId = userId; // Ensure user can only access their own sessions
    }

    const session = await prisma.debateSession.findFirst({
      where,
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            motion: true,
            description: true,
            difficulty: true,
            timeLimit: true,
            keyArguments: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                level: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new Error('Debate session not found');
    }

    return session;
  }

  // Update debate session
  static async updateSession(sessionId: string, userId: string, data: UpdateSessionData) {
    // Verify session belongs to user
    const existingSession = await prisma.debateSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!existingSession) {
      throw new Error('Debate session not found or access denied');
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (data.transcript !== undefined) updateData.transcript = data.transcript;
    if (data.feedback !== undefined) updateData.feedback = data.feedback;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.metrics !== undefined) updateData.metrics = data.metrics;

    // If session is being completed
    if (data.completedAt || data.score !== undefined) {
      updateData.completedAt = data.completedAt || new Date();
      updateData.isLive = false;
    }

    const updatedSession = await prisma.debateSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            motion: true,
            difficulty: true,
            timeLimit: true
          }
        }
      }
    });

    logger.info(`Debate session updated: ${sessionId}`);

    return updatedSession;
  }

  // Get user's debate sessions
  static async getUserSessions(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.debateSession.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              category: true
            }
          }
        },
        select: {
          id: true,
          role: true,
          score: true,
          maxScore: true,
          duration: true,
          completedAt: true,
          createdAt: true,
          topic: true
        }
      }),
      prisma.debateSession.count({ where: { userId } })
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Calculate debate score based on various metrics
  static calculateScore(metrics: any, difficulty: DifficultyLevel): number {
    let baseScore = 0;

    // Argument quality (40% weight)
    if (metrics.argumentStrength) {
      baseScore += metrics.argumentStrength * 0.4 * 100;
    }

    // Speaking clarity (20% weight)
    if (metrics.clarity) {
      baseScore += metrics.clarity * 0.2 * 100;
    }

    // Evidence usage (20% weight)
    if (metrics.evidenceUsage) {
      baseScore += metrics.evidenceUsage * 0.2 * 100;
    }

    // Time management (10% weight)
    if (metrics.timeManagement) {
      baseScore += metrics.timeManagement * 0.1 * 100;
    }

    // Relevance (10% weight)
    if (metrics.relevance) {
      baseScore += metrics.relevance * 0.1 * 100;
    }

    // Apply difficulty multiplier
    const difficultyMultipliers = {
      Beginner: 1.0,
      Intermediate: 1.1,
      Advanced: 1.2,
      Expert: 1.3,
      Master: 1.5
    };

    const finalScore = Math.min(100, Math.max(0, baseScore * (difficultyMultipliers[difficulty] || 1.0)));

    return Math.round(finalScore);
  }

  // Get debate statistics
  static async getDebateStats(userId: string) {
    const stats = await prisma.debateSession.aggregate({
      where: { userId, completedAt: { $ne: null } },
      _count: {
        id: true
      },
      _avg: {
        score: true
      },
      _max: {
        score: true
      },
      _min: {
        score: true
      }
    });

    const roleStats = await prisma.debateSession.groupBy({
      by: ['role'],
      where: { userId, completedAt: { $ne: null } },
      _count: {
        id: true
      },
      _avg: {
        score: true
      }
    });

    const difficultyStats = await prisma.debateSession.groupBy({
      by: ['topic'],
      where: { userId, completedAt: { $ne: null } },
      _count: true,
      _avg: {
        score: true
      }
    });

    // Get recent performance trend
    const recentSessions = await prisma.debateSession.findMany({
      where: {
        userId,
        completedAt: { $ne: null },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      select: {
        score: true,
        completedAt: true
      },
      orderBy: { completedAt: 'asc' }
    });

    return {
      totalDebates: stats._count.id || 0,
      averageScore: stats._avg.score || 0,
      highestScore: stats._max.score || 0,
      lowestScore: stats._min.score || 0,
      rolePerformance: roleStats,
      difficultyPerformance: difficultyStats,
      recentTrend: recentSessions.map(session => ({
        score: session.score,
        date: session.completedAt
      }))
    };
  }
}