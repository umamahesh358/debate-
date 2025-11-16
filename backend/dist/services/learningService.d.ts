import { ProgressStatus } from '@prisma/client';
export interface UpdateProgressData {
    moduleId: string;
    status?: ProgressStatus;
    completion?: number;
    timeSpent?: number;
    notes?: string;
}
export interface ModuleFilters {
    level?: number;
    category?: string;
    prerequisites?: string[];
}
export declare class LearningService {
    static getModules(filters: ModuleFilters, userId?: string, page?: number, limit?: number): Promise<{
        modules: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static getModuleById(moduleId: string, userId?: string): Promise<any>;
    private static isModuleLocked;
    static getLearningPath(userId: string): Promise<{
        currentLevel: any;
        experience: any;
        completedModules: any;
        recommendedModules: any;
        upcomingModules: any;
        totalCompleted: any;
        estimatedTimeToNextLevel: number;
    }>;
    static updateProgress(userId: string, data: UpdateProgressData): Promise<any>;
    static getUserProgress(userId: string, page?: number, limit?: number): Promise<{
        progress: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static getNextModule(userId: string): Promise<any>;
    private static calculateTimeToNextLevel;
    static getLearningStats(userId: string): Promise<{
        totalModules: any;
        completedModules: any;
        averageCompletion: any;
        totalTimeSpent: any;
        averageTimePerModule: any;
        completionRate: number;
        levelPerformance: any;
        recentActivity: any;
    }>;
}
//# sourceMappingURL=learningService.d.ts.map