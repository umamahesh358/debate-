"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("@/middleware/validation");
const errorHandler_1 = require("@/middleware/errorHandler");
const gamificationService_1 = require("@/services/gamificationService");
const prisma_1 = require("@/config/prisma");
const logger_1 = require("@/utils/logger");
const router = express_1.default.Router();
// Get user's gamification profile
router.get('/profile/:userId', (0, validation_1.validate)({ params: { userId: joi_1.default.string().required() } }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    // Check if user is requesting their own profile or if they have permission
    if (!req.user || (req.user.id !== userId && !await hasAdminPermission(req.user))) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    const stats = await gamificationService_1.GamificationService.getUserGamificationStats(userId);
    res.json({
        success: true,
        data: stats
    });
}));
// Get current user's gamification profile (simpler endpoint)
router.get('/profile', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const stats = await gamificationService_1.GamificationService.getUserGamificationStats(req.user.id);
    res.json({
        success: true,
        data: stats
    });
}));
// Award points to user
router.post('/points', (0, validation_1.validate)({ body: validation_1.gamificationSchemas.awardPoints }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    // Check admin permissions for awarding points to others
    if (req.body.userId && req.body.userId !== req.user.id && !await hasAdminPermission(req.user)) {
        return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
        });
    }
    const targetUserId = req.body.userId || req.user.id;
    const { points, eventType, description, metadata } = req.body;
    const event = await gamificationService_1.GamificationService.awardPoints({
        userId: targetUserId,
        points,
        eventType,
        description,
        metadata
    });
    logger_1.logger.info(`Points awarded: ${points} to user: ${targetUserId} by ${req.user.id}`);
    res.status(201).json({
        success: true,
        message: 'Points awarded successfully',
        data: {
            event
        }
    });
}));
// Get leaderboard
router.get('/leaderboard', (0, validation_1.validate)({ query: validation_1.gamificationSchemas.getLeaderboard }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = 'weekly', category = 'overall', limit = 10 } = req.query;
    const leaderboard = await gamificationService_1.GamificationService.getLeaderboard(period, category, parseInt(limit));
    res.json({
        success: true,
        data: leaderboard
    });
}));
// Get user's achievements
router.get('/achievements', (0, validation_1.validate)({
    query: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { page = 1, limit = 20 } = req.query;
    const result = await gamificationService_1.GamificationService.getUserAchievements(req.user.id, parseInt(page), parseInt(limit));
    res.json({
        success: true,
        data: result
    });
}));
// Get available achievements
router.get('/achievements/available', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const achievements = await gamificationService_1.GamificationService.getAvailableAchievements(req.user.id);
    res.json({
        success: true,
        data: achievements
    });
}));
// Get user's streak information
router.get('/streaks/:userId', (0, validation_1.validate)({ params: { userId: joi_1.default.string().required() } }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    // Check permissions
    if (!req.user || (req.user.id !== userId && !await hasAdminPermission(req.user))) {
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    const userProfile = await prisma_1.prisma.userProfile.findUnique({
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
    const streakInfo = await calculateStreakDetails(userId);
    res.json({
        success: true,
        data: {
            currentStreak: userProfile.streak,
            longestStreak: streakInfo.longestStreak,
            streakHistory: streakInfo.history,
            nextMilestone: getNextStreakMilestone(userProfile.streak)
        }
    });
}));
// Get current user's streak information
router.get('/streaks', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const userProfile = await prisma_1.prisma.userProfile.findUnique({
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
    const streakInfo = await calculateStreakDetails(req.user.id);
    res.json({
        success: true,
        data: {
            currentStreak: userProfile.streak,
            longestStreak: streakInfo.longestStreak,
            streakHistory: streakInfo.history,
            nextMilestone: getNextStreakMilestone(userProfile.streak)
        }
    });
}));
// Get gamification events for user
router.get('/events', (0, validation_1.validate)({
    query: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(50),
        eventType: joi_1.default.string().optional()
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { page = 1, limit = 50, eventType } = req.query;
    const where = { userId: req.user.id };
    if (eventType) {
        where.eventType = eventType;
    }
    const [events, total] = await Promise.all([
        prisma_1.prisma.gamificationEvent.findMany({
            where,
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
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
        prisma_1.prisma.gamificationEvent.count({ where })
    ]);
    res.json({
        success: true,
        data: {
            events,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        }
    });
}));
// Helper methods
async function hasAdminPermission(user) {
    // TODO: Implement proper role-based permissions
    // For now, return false (no admin permissions)
    return false;
}
async function calculateStreakDetails(userId) {
    // Get recent gamification events to calculate streak
    const recentEvents = await prisma_1.prisma.gamificationEvent.findMany({
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
            }
            else if (dayDiff > 1) {
                currentStreak = 1; // Start new streak
            }
        }
        else {
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
function getNextStreakMilestone(currentStreak) {
    const milestones = [1, 3, 7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find(m => m > currentStreak);
    return nextMilestone || {
        days: currentStreak + 1,
        reward: `Continue your learning journey!`
    };
}
exports.default = router;
//# sourceMappingURL=gamification.js.map