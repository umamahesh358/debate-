"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoAnalysisService = void 0;
const aiService_1 = require("./aiService");
const logger_1 = require("@/utils/logger");
const prisma_1 = require("@/config/prisma");
class VideoAnalysisService {
    static processingQueue = new Map();
    static isProcessing = false;
    // Queue video for analysis
    static async queueVideoAnalysis(videoId, userId, sessionId) {
        // Get video upload details
        const videoUpload = await prisma_1.prisma.videoUpload.findUnique({
            where: { id: videoId }
        });
        if (!videoUpload) {
            throw new Error('Video not found');
        }
        // Create processing job
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = {
            id: jobId,
            userId,
            sessionId,
            filePath: videoUpload.filePath,
            status: 'queued',
            progress: 0,
            createdAt: new Date()
        };
        this.processingQueue.set(jobId, job);
        // Update video upload status
        await prisma_1.prisma.videoUpload.update({
            where: { id: videoId },
            data: {
                status: 'processing',
                processingStarted: new Date()
            }
        });
        logger_1.logger.info(`Video analysis queued: ${videoId} for user: ${userId}`);
        // Start processing if not already running
        if (!this.isProcessing) {
            this.startProcessing();
        }
        return jobId;
    }
    // Start processing queue
    static async startProcessing() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        while (this.processingQueue.size > 0) {
            const jobs = Array.from(this.processingQueue.values());
            for (const job of jobs) {
                if (job.status === 'queued') {
                    await this.processVideoJob(job);
                }
            }
            // Wait a bit before checking next job
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.isProcessing = false;
    }
    // Process individual video job
    static async processVideoJob(job) {
        try {
            // Update job status
            job.status = 'processing';
            job.startedAt = new Date();
            job.progress = 10;
            this.updateJobProgress(job.id, 10, 'Starting video processing...');
            // Simulate video processing stages
            await this.simulateProcessingStages(job);
            // Actual AI analysis
            job.status = 'analyzing';
            job.progress = 80;
            this.updateJobProgress(job.id, 80, 'Analyzing video content...');
            // Read video file for analysis
            const fs = require('fs');
            const videoBuffer = fs.readFileSync(job.filePath);
            const analysisResult = await aiService_1.AIService.analyzeVideo(videoBuffer, {
                duration: 0, // Would be extracted from video metadata
                format: 'mp4'
            });
            // Complete processing
            job.status = 'completed';
            job.progress = 100;
            job.completedAt = new Date();
            job.result = analysisResult;
            this.updateJobProgress(job.id, 100, 'Analysis complete!', analysisResult);
            // Update database with results
            if (job.sessionId) {
                await prisma_1.prisma.videoUpload.update({
                    where: {
                        id: job.sessionId
                    },
                    data: {
                        status: 'completed',
                        processingCompleted: new Date(),
                        analysisResults: analysisResult
                    }
                });
            }
            logger_1.logger.info(`Video analysis completed: ${job.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Video analysis failed: ${job.id}`, error);
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.progress = 0;
            this.updateJobProgress(job.id, 0, job.error);
            // Update database
            if (job.sessionId) {
                await prisma_1.prisma.videoUpload.update({
                    where: { id: job.sessionId },
                    data: {
                        status: 'failed'
                    }
                });
            }
        }
        finally {
            // Remove from queue
            this.processingQueue.delete(job.id);
        }
    }
    // Simulate processing stages for demo purposes
    static async simulateProcessingStages(job) {
        const stages = [
            { progress: 20, message: 'Extracting video frames...', delay: 2000 },
            { progress: 40, message: 'Analyzing visual content...', delay: 3000 },
            { progress: 60, message: 'Processing audio tracks...', delay: 2000 },
            { progress: 70, message: 'Generating analysis report...', delay: 2000 }
        ];
        for (const stage of stages) {
            if (job.status !== 'processing')
                break;
            job.progress = stage.progress;
            this.updateJobProgress(job.id, stage.progress, stage.message);
            await new Promise(resolve => setTimeout(resolve, stage.delay));
        }
    }
    // Update job progress
    static updateJobProgress(jobId, progress, message, result) {
        const job = this.processingQueue.get(jobId);
        if (!job)
            return;
        job.progress = progress;
        if (result) {
            job.result = result;
        }
        // TODO: Emit progress via WebSocket to client
        // For now, just log
        logger_1.logger.debug(`Job ${jobId} progress: ${progress}% - ${message}`);
    }
    // Get job status
    static getJobStatus(jobId) {
        return this.processingQueue.get(jobId) || null;
    }
    // Cancel job
    static async cancelJob(jobId, userId) {
        const job = this.processingQueue.get(jobId);
        if (!job) {
            return false;
        }
        if (job.userId !== userId) {
            return false; // Can only cancel own jobs
        }
        if (job.status === 'completed' || job.status === 'failed') {
            return false; // Can't cancel completed jobs
        }
        // Update job status
        job.status = 'failed';
        job.error = 'Cancelled by user';
        job.progress = 0;
        // Update database
        if (job.sessionId) {
            await prisma_1.prisma.videoUpload.update({
                where: { id: job.sessionId },
                data: {
                    status: 'failed'
                }
            });
        }
        // Remove from queue
        this.processingQueue.delete(jobId);
        logger_1.logger.info(`Video analysis cancelled: ${jobId}`);
        return true;
    }
    // Get all jobs for user
    static getUserJobs(userId) {
        return Array.from(this.processingQueue.values())
            .filter(job => job.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    // Clean up old jobs
    static cleanupOldJobs() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        for (const [jobId, job] of this.processingQueue.entries()) {
            if (job.createdAt < oneHourAgo &&
                (job.status === 'completed' || job.status === 'failed')) {
                this.processingQueue.delete(jobId);
                logger_1.logger.debug(`Cleaned up old job: ${jobId}`);
            }
        }
    }
    // Ensure video never goes black during analysis
    static async preventBlackScreen(videoId, userId) {
        try {
            const videoUpload = await prisma_1.prisma.videoUpload.findUnique({
                where: { id: videoId }
            });
            if (!videoUpload) {
                return { status: 'Video not found' };
            }
            // If video is processing, provide streaming backup
            if (videoUpload.status === 'processing' || videoUpload.status === 'analyzing') {
                return {
                    status: 'processing',
                    backupUrl: `/uploads/videos/${videoUpload.fileName}`
                };
            }
            // If analysis failed, provide error backup
            if (videoUpload.status === 'failed') {
                return {
                    status: 'analysis_failed',
                    backupUrl: `/uploads/videos/${videoUpload.fileName}`
                };
            }
            // If completed successfully
            if (videoUpload.status === 'completed') {
                return {
                    status: 'completed',
                    backupUrl: `/uploads/videos/${videoUpload.fileName}`
                };
            }
            return { status: 'unknown' };
        }
        catch (error) {
            logger_1.logger.error('Error in preventBlackScreen:', error);
            return { status: 'error' };
        }
    }
    // Get analysis results
    static async getAnalysisResults(videoId, userId) {
        try {
            const videoUpload = await prisma_1.prisma.videoUpload.findFirst({
                where: {
                    id: videoId,
                    userId // Ensure user can only access their own videos
                },
                select: {
                    analysisResults: true,
                    status: true,
                    duration: true,
                    createdAt: true
                }
            });
            if (!videoUpload || videoUpload.status !== 'completed') {
                return null;
            }
            return videoUpload.analysisResults;
        }
        catch (error) {
            logger_1.logger.error('Error getting analysis results:', error);
            return null;
        }
    }
    // Get processing statistics
    static getProcessingStats() {
        const jobs = Array.from(this.processingQueue.values());
        return {
            totalJobs: jobs.length,
            processingJobs: jobs.filter(job => job.status === 'processing' || job.status === 'analyzing').length,
            completedJobs: jobs.filter(job => job.status === 'completed').length,
            failedJobs: jobs.filter(job => job.status === 'failed').length
        };
    }
    // Initialize periodic cleanup
    static initializeCleanup() {
        // Clean up old jobs every hour
        setInterval(() => {
            this.cleanupOldJobs();
        }, 60 * 60 * 1000);
        logger_1.logger.info('Video analysis cleanup initialized');
    }
}
exports.VideoAnalysisService = VideoAnalysisService;
//# sourceMappingURL=videoAnalysis.js.map