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
export declare class DebateService {
    static getTopics(filters: TopicFilters, page?: number, limit?: number): Promise<{
        topics: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static getTopicById(topicId: string): Promise<any>;
    static getRandomTopic(filters?: TopicFilters): Promise<any>;
    static createSession(data: CreateSessionData): Promise<any>;
    static getSessionById(sessionId: string, userId?: string): Promise<any>;
    static updateSession(sessionId: string, userId: string, data: UpdateSessionData): Promise<any>;
    static getUserSessions(userId: string, page?: number, limit?: number): Promise<{
        sessions: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static calculateScore(metrics: any, difficulty: DifficultyLevel): number;
    static getDebateStats(userId: string): Promise<{
        totalDebates: any;
        averageScore: any;
        highestScore: any;
        lowestScore: any;
        rolePerformance: any;
        difficultyPerformance: any;
        recentTrend: any;
    }>;
}
//# sourceMappingURL=debateService.d.ts.map