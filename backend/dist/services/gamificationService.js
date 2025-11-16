"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const prisma_1 = require("@/config/prisma");
const logger_1 = require("@/utils/logger");
class GamificationService {
    // Award points to user
    static async awardPoints(data) {
        const { userId, points, eventType, description, metadata } = data;
        // Create gamification event
        const event = await prisma_1.prisma.gamificationEvent.create({
            data: {
                userId,
                points,
                eventType,
                description,
                metadata,
                createdAt: new Date()
            }
        });
        // Update user's experience and level
        await this.updateUserExperience(userId, points);
        // Check for new achievements
        await this.checkAchievements(userId, eventType, metadata);
        // Update leaderboards
        await this.updateLeaderboards(userId, points);
        logger_1.logger.info(`Points awarded: ${points} to user: ${userId} for ${eventType}`);
        return event;
    }
    // Update user experience and calculate level
    static async updateUserExperience(userId, points) {
        // Get current user profile
        const userProfile = await prisma_1.prisma.userProfile.findUnique({
            where: { userId }
        });
        if (!userProfile) {
            throw new Error('User profile not found');
        }
        // Calculate new experience and level
        const newExperience = userProfile.experience + points;
        const newLevel = this.calculateLevel(newExperience);
        // Update profile
        await prisma_1.prisma.userProfile.update({
            where: { userId },
            data: {
                experience: newExperience,
                level: newLevel.level,
                updatedAt: new Date()
            }
        });
        return {
            previousLevel: userProfile.level,
            newLevel: newLevel.level,
            experienceGained: points,
            totalExperience: newExperience,
            experienceToNext: newLevel.experienceToNext
        };
    }
    // Calculate level based on experience
    static calculateLevel(experience) {
        // Formula: Level = floor((experience / 1000)^(1/2)) + 1
        // Or simpler: 1000 XP per level
        const level = Math.floor(experience / 1000) + 1;
        const experienceForCurrentLevel = (level - 1) * 1000;
        const experienceToNext = level * 1000 - experience;
        return {
            level,
            experienceForCurrentLevel,
            experienceToNext
        };
    }
    // Check and award achievements
    static async checkAchievements(userId, eventType, metadata) {
        // Get all active achievements
        const achievements = await prisma_1.prisma.achievement.findMany({
            where: { isActive: true }
        });
        // Get user's current achievements
        const userAchievements = await prisma_1.prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true }
        });
        const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
        // Check each achievement
        for (const achievement of achievements) {
            if (earnedAchievementIds.has(achievement.id)) {
                continue; // Already earned
            }
            const criteria = achievement.criteria;
            const earned = await this.checkAchievementCriteria(userId, criteria, eventType, metadata);
            if (earned) {
                await this.awardAchievement(userId, achievement.id, achievement);
            }
        }
    }
    // Check if user meets achievement criteria
    static async checkAchievementCriteria(userId, criteria, eventType, metadata) {
        // Get user stats based on criteria
        if (criteria.debates) {
            const debateCount = await prisma_1.prisma.debateSession.count({
                where: {
                    userId,
                    completedAt: { $ne: null }
                }
            });
            if (debateCount < criteria.debates)
                return false;
        }
        if (criteria.wins) {
            const debateSessions = await prisma_1.prisma.debateSession.findMany({
                where: {
                    userId,
                    completedAt: { $ne: null },
                    score: { $gte: 70 } // Assuming 70+ is a win
                },
                select: { score: true }
            });
            const wins = debateSessions.length;
            if (wins < criteria.wins)
                return false;
        }
        if (criteria.score) {
            const bestScore = await prisma_1.prisma.debateSession.findFirst({
                where: { userId },
                orderBy: { score: 'desc' },
                select: { score: true }
            });
            if (!bestScore || bestScore.score < criteria.score)
                return false;
        }
        if (criteria.streak) {
            const userProfile = await prisma_1.prisma.userProfile.findUnique({
                where: { userId },
                select: { streak: true }
            });
            if (!userProfile || userProfile.streak < criteria.streak)
                return false;
        }
        if (criteria.timeSpent) {
            const totalTime = await prisma_1.prisma.learningProgress.aggregate({
                where: { userId },
                _sum: { timeSpent: true }
            });
            if (!totalTime._sum.timeSpent || totalTime._sum.timeSpent < criteria.timeSpent)
                return false;
        }
        if (criteria.modules) {
            const completedModules = await prisma_1.prisma.learningProgress.count({
                where: {
                    userId,
                    status: 'completed'
                }
            });
            if (completedModules < criteria.modules)
                return false;
        }
        // Event-specific criteria
        if (eventType === 'debate_completed' && criteria.firstDebate) {
            // This is handled by the debate count check above
        }
        return true;
    }
    // Award achievement to user
    static async awardAchievement(userId, achievementId, achievement) {
        await prisma_1.prisma.$transaction(async (tx) => {
            // Create user achievement
            await tx.userAchievement.create({
                data: {
                    userId,
                    achievementId,
                    earnedAt: new Date()
                }
            });
            // Update achievement earned count
            await tx.achievement.update({
                where: { id: achievementId },
                data: {
                    earnedCount: { $increment: 1 },
                    updatedAt: new Date()
                }
            });
            // Award achievement points
            await this.updateUserExperience(userId, achievement.points);
        });
        logger_1.logger.info(`Achievement awarded: ${achievement.name} to user: ${userId}`);
        return achievement;
    }
    // Update leaderboards
    static async updateLeaderboards(userId, points) {
        const periods = ['daily', 'weekly', 'monthly', 'overall'];
        for (const period of periods) {
            try {
                await this.updateLeaderboardPeriod(userId, period, points);
            }
            catch (error) {
                logger_1.logger.error(`Failed to update ${period} leaderboard:`, error);
            }
        }
    }
    // Update specific leaderboard period
    static async updateLeaderboardPeriod(userId, period, points) {
        const leaderboard = await prisma_1.prisma.leaderboard.findUnique({
            where: { period_category: { period, category: 'overall' } }
        });
        if (!leaderboard) {
            // Create new leaderboard
            await prisma_1.prisma.leaderboard.create({
                data: {
                    period,
                    category: 'overall',
                    entries: [], // Will be updated by a separate process
                    isActive: true,
                    lastUpdated: new Date()
                }
            });
            return;
        }
        // TODO: Implement more efficient leaderboard updates
        // For now, just mark as needing update
        await prisma_1.prisma.leaderboard.update({
            where: { period_category: { period, category: 'overall' } },
            data: {
                lastUpdated: new Date()
            }
        });
    }
    // Get leaderboard
    static async getLeaderboard(period = 'weekly', category = 'overall', limit = 10) {
        // Get or create leaderboard
        let leaderboard = await prisma_1.prisma.leaderboard.findUnique({
            where: { period_category: { period, category } }
        });
        if (!leaderboard || !this.isLeaderboardFresh(leaderboard.lastUpdated)) {
            // Generate fresh leaderboard
            leaderboard = await this.generateLeaderboard(period, category);
        }
        const entries = (leaderboard?.entries || []);
        const limitedEntries = entries.slice(0, limit);
        return {
            period,
            category,
            entries: limitedEntries,
            totalEntries: entries.length,
            lastUpdated: leaderboard?.lastUpdated
        };
    }
    // Check if leaderboard is fresh enough
    static isLeaderboardFresh(lastUpdated) {
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        return hoursSinceUpdate < 1; // Fresh if less than 1 hour old
    }
    // Generate fresh leaderboard
    static async generateLeaderboard(period, category) {
        // Calculate date range for period
        const now = new Date();
        let dateFilter = {};
        switch (period) {
            case 'daily':
                dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
                break;
            case 'weekly':
                const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { $gte: weekStart };
                break;
            case 'monthly':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { $gte: monthStart };
                break;
            case 'overall':
                dateFilter = {}; // No filter
                break;
        }
        // Get top users based on experience (points)
        const topUsers = await prisma_1.prisma.userProfile.findMany({
            where: {},
            orderBy: { experience: 'desc' },
            take: 100,
            select: {
                userId: true,
                displayName: true,
                avatar: true,
                level: true,
                experience: true,
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });
        // Filter by category if needed
        let filteredUsers = topUsers;
        if (category === 'debates') {
            // Filter by debate performance
            const debateStats = await Promise.all(topUsers.map(async (user) => {
                const stats = await prisma_1.prisma.debateSession.aggregate({
                    where: {
                        userId: user.userId,
                        completedAt: { $ne: null },
                        ...(period !== 'overall' && { createdAt: dateFilter })
                    },
                    _avg: { score: true },
                    _count: { id: true }
                });
                return {
                    ...user,
                    categoryScore: stats._avg.score || 0,
                    categoryCount: stats._count.id || 0
                };
            }));
            filteredUsers = debateStats.sort((a, b) => b.categoryScore - a.categoryScore).slice(0, 100);
        }
        // Create leaderboard entries
        const entries = filteredUsers.map((user, index) => ({
            userId: user.userId,
            username: user.user?.username || 'Unknown',
            displayName: user.displayName,
            avatar: user.avatar,
            score: user.experience,
            level: user.level,
            rank: index + 1,
            change: 0 // TODO: Calculate rank change from previous period
        }));
        // Update or create leaderboard
        const leaderboard = await prisma_1.prisma.leaderboard.upsert({
            where: { period_category: { period, category } },
            update: {
                entries,
                lastUpdated: new Date()
            },
            create: {
                period,
                category,
                entries,
                isActive: true,
                lastUpdated: new Date()
            }
        });
        return leaderboard;
    }
    // Get user's achievements
    static async getUserAchievements(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [achievements, total] = await Promise.all([
            prisma_1.prisma.userAchievement.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { earnedAt: 'desc' },
                include: {
                    achievement: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            icon: true,
                            type: true,
                            tier: true,
                            points: true
                        }
                    }
                }
            }),
            prisma_1.prisma.userAchievement.count({ where: { userId } })
        ]);
        return {
            achievements,
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
    // Get available achievements
    static async getAvailableAchievements(userId) {
        const achievements = await prisma_1.prisma.achievement.findMany({
            where: { isActive: true },
            orderBy: [
                { tier: 'asc' },
                { type: 'asc' },
                { name: 'asc' }
            ]
        });
        // If user ID provided, mark earned achievements
        if (userId) {
            const userAchievements = await prisma_1.prisma.userAchievement.findMany({
                where: { userId },
                select: { achievementId: true }
            });
            const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));
            return achievements.map(achievement => ({
                ...achievement,
                earned: earnedIds.has(achievement.id),
                progress: earnedIds.has(achievement.id) ? 100 : 0 // TODO: Calculate actual progress
            }));
        }
        return achievements;
    }
    // Get gamification statistics for user
    static async getUserGamificationStats(userId) {
        const [profile, achievements, events] = await Promise.all([
            prisma_1.prisma.userProfile.findUnique({
                where: { userId },
                select: {
                    level: true,
                    experience: true,
                    streak: true,
                    totalDebates: true,
                    wins: true,
                    averageScore: true
                }
            }),
            prisma_1.prisma.userAchievement.count({ where: { userId } }),
            prisma_1.prisma.gamificationEvent.aggregate({
                where: { userId },
                _count: { id: true },
                _sum: { points: true }
            })
        ]);
        return {
            level: profile?.level || 1,
            experience: profile?.experience || 0,
            experienceToNext: this.calculateLevel(profile?.experience || 0).experienceToNext,
            streak: profile?.streak || 0,
            totalDebates: profile?.totalDebates || 0,
            wins: profile?.wins || 0,
            averageScore: profile?.averageScore || 0,
            achievements: achievements,
            totalPoints: events._sum.points || 0,
            events: events._count.id || 0
        };
    }
}
exports.GamificationService = GamificationService;
//# sourceMappingURL=gamificationService.js.map