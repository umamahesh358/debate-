import express from 'express';
import Joi from 'joi';
import { AuthRequest } from '@/middleware/auth';
import { validate, gamificationSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { GamificationService } from '@/services/gamificationService';
import { logger } from '@/utils/logger';

const router = express.Router();

// Get user's gamification profile
router.get('/profile/:userId',
  validate({ params: { userId: Joi.string().required() } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { userId } = req.params;

    // Check if user is requesting their own profile or if they have permission
    if (!req.user || (req.user.id !== userId && !this.hasAdminPermission(req.user))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const stats = await GamificationService.getUserGamificationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Get current user's gamification profile (simpler endpoint)
router.get('/profile',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const stats = await GamificationService.getUserGamificationStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Award points to user
router.post('/points',
  validate({ body: gamificationSchemas.awardPoints }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check admin permissions for awarding points to others
    if (req.body.userId && req.body.userId !== req.user.id && !this.hasAdminPermission(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const targetUserId = req.body.userId || req.user.id;
    const { points, eventType, description, metadata } = req.body;

    const event = await GamificationService.awardPoints({
      userId: targetUserId,
      points,
      eventType,
      description,
      metadata
    });

    logger.info(`Points awarded: ${points} to user: ${targetUserId} by ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Points awarded successfully',
      data: {
        event
      }
    });
  })
);

// Get leaderboard
router.get('/leaderboard',
  validate({ query: gamificationSchemas.getLeaderboard }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { period = 'weekly', category = 'overall', limit = 10 } = req.query;

    const leaderboard = await GamificationService.getLeaderboard(
      period as any,
      category as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: leaderboard
    });
  })
);

// Get user's achievements
router.get('/achievements',
  validate({
    query: {
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { page = 1, limit = 20 } = req.query;

    const result = await GamificationService.getUserAchievements(
      req.user.id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result
    });
  })
);

// Get available achievements
router.get('/achievements/available',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const achievements = await GamificationService.getAvailableAchievements(req.user.id);

    res.json({
      success: true,
      data: achievements
    });
  })
);

// Get user's streak information
router.get('/streaks/:userId',
  validate({ params: { userId: Joi.string().required() } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { userId } = req.params;

    // Check permissions
    if (!req.user || (req.user.id !== userId && !this.hasAdminPermission(req.user))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        streak: true,
        experience: true,
        level: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate streak details
    const streakInfo = await this.calculateStreakDetails(userId);

    res.json({
      success: true,
      data: {
        currentStreak: userProfile.streak,
        longestStreak: streakInfo.longestStreak,
        streakHistory: streakInfo.history,
        nextMilestone: this.getNextStreakMilestone(userProfile.streak)
      }
    });
  })
);

// Get current user's streak information
router.get('/streaks',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        streak: true,
        experience: true,
        level: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    const streakInfo = await this.calculateStreakDetails(req.user.id);

    res.json({
      success: true,
      data: {
        currentStreak: userProfile.streak,
        longestStreak: streakInfo.longestStreak,
        streakHistory: streakInfo.history,
        nextMilestone: this.getNextStreakMilestone(userProfile.streak)
      }
    });
  })
);

// Get gamification events for user
router.get('/events',
  validate({
    query: {
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(50),
      eventType: Joi.string().optional()
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { page = 1, limit = 50, eventType } = req.query;

    const where: any = { userId: req.user.id };
    if (eventType) {
      where.eventType = eventType;
    }

    const [events, total] = await Promise.all([
      prisma.gamificationEvent.findMany({
        where,
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          eventType: true,
          points: true,
          description: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.gamificationEvent.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
          hasNext: parseInt(page as string) * parseInt(limit as string) < total,
          hasPrev: parseInt(page as string) > 1
        }
      }
    });
  })
);

// Helper methods
private async hasAdminPermission(user: any): Promise<boolean> {
  // TODO: Implement proper role-based permissions
  // For now, return false (no admin permissions)
  return false;
}

private async calculateStreakDetails(userId: string) {
  // Get recent gamification events to calculate streak
  const recentEvents = await prisma.gamificationEvent.findMany({
    where: {
      userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      eventType: true,
      points: true
    }
  });

  // Simple streak calculation - consecutive days with activity
  const streakDays = new Set();
  const today = new Date();

  for (const event of recentEvents) {
    const eventDate = new Date(event.createdAt);
    const dayKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

    if (eventDate <= today) {
      streakDays.add(dayKey);
    }
  }

  const sortedDays = Array.from(streakDays).sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const currentDate = new Date(sortedDays[i]);
    const previousDate = i > 0 ? new Date(sortedDays[i - 1]) : null;

    if (previousDate) {
      const dayDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (dayDiff > 1) {
        currentStreak = 1; // Start new streak
      }
    } else {
      currentStreak = 1; // First day in streak
      longestStreak = Math.max(longestStreak, currentStreak);
    }
  }

  return {
    longestStreak,
    history: sortedDays.map(day => ({
      date: day,
      hasActivity: true
    }))
  };
}

private getNextStreakMilestone(currentStreak: number) {
  const milestones = [1, 3, 7, 14, 30, 60, 100, 365];
  const nextMilestone = milestones.find(m => m > currentStreak);

  return nextMilestone || {
    days: currentStreak + 1,
    reward: `Continue your learning journey!`
  };
}

// Import prisma for the helper methods
import { prisma } from '@/config/prisma';

export default router;