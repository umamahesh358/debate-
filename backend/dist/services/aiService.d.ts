export interface ArgumentAnalysis {
    strength: number;
    clarity: number;
    evidence: number;
    relevance: number;
    logic: number;
    overall: number;
    feedback: string[];
}
export interface DebateResponse {
    text: string;
    arguments: string[];
    counterArguments: string[];
    confidence: number;
    strategy: string;
}
export interface VideoAnalysisResult {
    eyeContact: number;
    posture: number;
    gestures: number;
    engagement: number;
    speakingPace: number;
    confidence: number;
    feedback: string[];
    timestamp: number;
}
export interface CoachingTip {
    type: 'argument' | 'delivery' | 'timing' | 'strategy';
    message: string;
    priority: 'low' | 'medium' | 'high';
    immediate: boolean;
}
export declare class AIService {
    static analyzeArgument(transcript: string, context: {
        topic: string;
        role: 'government' | 'opposition';
        round?: number;
    }): Promise<ArgumentAnalysis>;
    static generateResponse(userInput: string, topic: string, role: 'government' | 'opposition', previousArguments?: string[]): Promise<DebateResponse>;
    static analyzeVideo(videoBuffer: Buffer, metadata: {
        duration: number;
        format: string;
    }): Promise<VideoAnalysisResult>;
    static generateCoachingTip(context: {
        transcript: string;
        metrics: any;
        situation: 'opening' | 'argument' | 'rebuttal' | 'conclusion' | 'delivery';
    }): Promise<CoachingTip>;
    static generateFeedback(sessionData: {
        transcript: any;
        metrics: any;
        topic: string;
        duration: number;
    }): Promise<any>;
    private static getFallbackAnalysis;
    private static getFallbackResponse;
    private static getFallbackCoachingTip;
    private static getFallbackFeedback;
    private static generateVideoFeedback;
    static checkHealth(): Promise<{
        status: string;
        latency?: number;
        error?: string;
    }>;
}
//# sourceMappingURL=aiService.d.ts.map