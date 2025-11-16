import { VideoAnalysisResult } from './aiService';
export interface VideoProcessingJob {
    id: string;
    userId: string;
    sessionId?: string;
    filePath: string;
    status: 'queued' | 'processing' | 'analyzing' | 'completed' | 'failed';
    progress: number;
    result?: VideoAnalysisResult;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export declare class VideoAnalysisService {
    private static processingQueue;
    private static isProcessing;
    static queueVideoAnalysis(videoId: string, userId: string, sessionId?: string): Promise<string>;
    private static startProcessing;
    private static processVideoJob;
    private static simulateProcessingStages;
    private static updateJobProgress;
    static getJobStatus(jobId: string): VideoProcessingJob | null;
    static cancelJob(jobId: string, userId: string): Promise<boolean>;
    static getUserJobs(userId: string): VideoProcessingJob[];
    static cleanupOldJobs(): void;
    static preventBlackScreen(videoId: string, userId: string): Promise<{
        status: string;
        backupUrl?: string;
    }>;
    static getAnalysisResults(videoId: string, userId: string): Promise<VideoAnalysisResult | null>;
    static getProcessingStats(): {
        totalJobs: number;
        processingJobs: number;
        completedJobs: number;
        failedJobs: number;
    };
    static initializeCleanup(): void;
}
//# sourceMappingURL=videoAnalysis.d.ts.map