import { LeaderboardPeriod } from '@prisma/client';
export interface AwardPointsData {
    userId: string;
    points: number;
    eventType: string;
    description: string;
    metadata?: any;
}
export interface LeaderboardEntry {
    userId: string;
    username: string;
    displayName: string;
    avatar?: string;
    score: number;
    level: number;
    rank: number;
    change: number;
}
export interface AchievementCriteria {
    debates?: number;
    wins?: number;
    score?: number;
    streak?: number;
    timeSpent?: number;
    modules?: number;
    [key: string]: any;
}
export declare class GamificationService {
    static awardPoints(data: AwardPointsData): Promise<any>;
    private static updateUserExperience;
    private static calculateLevel;
    static checkAchievements(userId: string, eventType: string, metadata?: any): Promise<void>;
    private static checkAchievementCriteria;
    private static awardAchievement;
    private static updateLeaderboards;
    private static updateLeaderboardPeriod;
    static getLeaderboard(period?: LeaderboardPeriod, category?: string, limit?: number): Promise<{
        period: LeaderboardPeriod;
        category: string;
        entries: LeaderboardEntry[];
        totalEntries: number;
        lastUpdated: any;
    }>;
    private static isLeaderboardFresh;
    private static generateLeaderboard;
    static getUserAchievements(userId: string, page?: number, limit?: number): Promise<{
        achievements: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static getAvailableAchievements(userId?: string): Promise<any>;
    static getUserGamificationStats(userId: string): Promise<{
        level: any;
        experience: any;
        experienceToNext: number;
        streak: any;
        totalDebates: any;
        wins: any;
        averageScore: any;
        achievements: any;
        totalPoints: any;
        events: any;
    }>;
}
//# sourceMappingURL=gamificationService.d.ts.map