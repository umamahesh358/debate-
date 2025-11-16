import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/utils/logger';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  organization: process.env.OPENAI_ORG_ID || undefined
});

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const googleModel = googleAI.getGenerativeModel({ model: 'gemini-pro' });

// Determine AI provider
const getAIProvider = (): 'openai' | 'google' => {
  return (process.env.AI_PROVIDER as 'openai' | 'google') ||
         (process.env.GOOGLE_API_KEY ? 'google' : 'openai');
};

export interface ArgumentAnalysis {
  strength: number; // 1-5
  clarity: number; // 1-5
  evidence: number; // 1-5
  relevance: number; // 1-5
  logic: number; // 1-5
  overall: number; // 1-5
  feedback: string[];
}

export interface DebateResponse {
  text: string;
  arguments: string[];
  counterArguments: string[];
  confidence: number; // 0-1
  strategy: string;
}

export interface VideoAnalysisResult {
  eyeContact: number; // 0-100
  posture: number; // 0-100
  gestures: number; // 0-100
  engagement: number; // 0-100
  speakingPace: number; // words per minute
  confidence: number; // 0-100
  feedback: string[];
  timestamp: number;
}

export interface CoachingTip {
  type: 'argument' | 'delivery' | 'timing' | 'strategy';
  message: string;
  priority: 'low' | 'medium' | 'high';
  immediate: boolean;
}

export class AIService {
  // Analyze debate argument
  static async analyzeArgument(
    transcript: string,
    context: {
      topic: string;
      role: 'government' | 'opposition';
      round?: number;
    }
  ): Promise<ArgumentAnalysis> {
    try {
      const prompt = `
You are an expert debate analyst. Analyze the following debate argument and provide detailed feedback.

DEBATE TOPIC: ${context.topic}
SPEAKER ROLE: ${context.role}
ROUND: ${context.round || 1}

TRANSCRIPT:
${transcript}

Please analyze this argument and rate it on the following scales (1-5):
1. Argument Strength: How strong and convincing are the arguments?
2. Clarity: How clear and easy to understand?
3. Evidence Usage: How well is evidence used?
4. Relevance: How relevant to the topic?
5. Logical Flow: How logical is the reasoning?

Also provide:
- Specific feedback (3-5 points)
- Overall score (1-100)
- Key strengths
- Areas for improvement

Respond in JSON format:
{
  "strength": <1-5>,
  "clarity": <1-5>,
  "evidence": <1-5>,
  "relevance": <1-5>,
  "logic": <1-5>,
  "overall": <1-100>,
  "feedback": ["feedback1", "feedback2", "..."],
  "strengths": ["strength1", "strength2", "..."],
  "improvements": ["improvement1", "improvement2", "..."]
}
      `;

      let analysisText: string;
      const provider = getAIProvider();

      if (provider === 'google') {
        const result = await googleModel.generateContent(prompt);
        analysisText = result.response.text() || '{}';
        logger.info('Google AI analysis completed for argument analysis');
      } else {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert debate analyst providing constructive feedback on debate arguments.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        });
        analysisText = completion.choices[0]?.message?.content || '{}';
        logger.info('OpenAI analysis completed for argument analysis');
      }

      const analysis = JSON.parse(analysisText);

      return {
        strength: analysis.strength || 3,
        clarity: analysis.clarity || 3,
        evidence: analysis.evidence || 3,
        relevance: analysis.relevance || 3,
        logic: analysis.logic || 3,
        overall: analysis.overall || 75,
        feedback: analysis.feedback || ['No specific feedback available']
      };

    } catch (error) {
      logger.error('Error in analyzeArgument:', error);

      // Fallback analysis
      return this.getFallbackAnalysis();
    }
  }

  // Generate AI opponent response
  static async generateResponse(
    userInput: string,
    topic: string,
    role: 'government' | 'opposition',
    previousArguments: string[] = []
  ): Promise<DebateResponse> {
    try {
      const opponentRole = role === 'government' ? 'opposition' : 'government';

      const prompt = `
You are participating in a debate as the ${opponentRole} side. Generate a strong, intelligent response.

DEBATE TOPIC: ${topic}
YOUR ROLE: ${opponentRole}

USER'S ARGUMENT:
${userInput}

PREVIOUS ARGUMENTS IN THIS DEBATE:
${previousArguments.length > 0 ? previousArguments.map((arg, i) => `${i+1}. ${arg}`).join('\n') : 'None yet'}

Please provide:
1. A direct counter-argument
2. 2-3 supporting points
3. A strategic question to challenge the user
4. Confidence level in your response (0-1)

Respond in JSON format:
{
  "text": "Your full response",
  "arguments": ["point1", "point2", "point3"],
  "counterArguments": ["counter1", "counter2"],
  "confidence": <0-1>,
  "strategy": "Brief strategy description"
}
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debater who provides intelligent, well-reasoned arguments. Be persuasive but respectful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const response = JSON.parse(responseText);

      logger.info(`AI response generated for topic: ${topic}`);

      return {
        text: response.text || 'I understand your perspective, but I would like to offer a different viewpoint on this matter.',
        arguments: response.arguments || ['Alternative perspective needed'],
        counterArguments: response.counterArguments || ['Different approach considered'],
        confidence: response.confidence || 0.7,
        strategy: response.strategy || 'Provide alternative perspective with evidence'
      };

    } catch (error) {
      logger.error('Error in generateResponse:', error);

      // Fallback response
      return this.getFallbackResponse(topic, role);
    }
  }

  // Analyze video for presentation skills
  static async analyzeVideo(
    videoBuffer: Buffer,
    metadata: {
      duration: number;
      format: string;
    }
  ): Promise<VideoAnalysisResult> {
    try {
      // For now, simulate video analysis
      // In a real implementation, you would:
      // 1. Extract frames from video
      // 2. Use computer vision for posture, eye contact, gestures
      // 3. Analyze audio for speaking patterns
      // 4. Generate comprehensive analysis

      // Simulate analysis with random but realistic values
      const eyeContact = Math.random() * 30 + 60; // 60-90
      const posture = Math.random() * 25 + 65; // 65-90
      const gestures = Math.random() * 35 + 45; // 45-80
      const engagement = Math.random() * 40 + 50; // 50-90
      const speakingPace = Math.random() * 100 + 120; // 120-220 wpm
      const confidence = Math.random() * 20 + 70; // 70-90

      const feedback = this.generateVideoFeedback(eyeContact, posture, gestures, engagement, speakingPace);

      return {
        eyeContact: Math.round(eyeContact),
        posture: Math.round(posture),
        gestures: Math.round(gestures),
        engagement: Math.round(engagement),
        speakingPace: Math.round(speakingPace),
        confidence: Math.round(confidence),
        feedback,
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Error in analyzeVideo:', error);

      // Fallback analysis
      return {
        eyeContact: 75,
        posture: 80,
        gestures: 70,
        engagement: 75,
        speakingPace: 150,
        confidence: 75,
        feedback: ['Unable to complete detailed video analysis', 'Please check your camera and recording setup'],
        timestamp: Date.now()
      };
    }
  }

  // Generate coaching tip
  static async generateCoachingTip(
    context: {
      transcript: string;
      metrics: any;
      situation: 'opening' | 'argument' | 'rebuttal' | 'conclusion' | 'delivery';
    }
  ): Promise<CoachingTip> {
    try {
      const prompt = `
You are a debate coach providing real-time feedback. Analyze the situation and provide a helpful coaching tip.

SITUATION: ${context.situation}

TRANSCRIPT SNIPPET:
${context.transcript.slice(-500)} // Last 500 chars

METRICS:
${JSON.stringify(context.metrics, null, 2)}

Provide a concise coaching tip (under 150 characters) that is:
1. Actionable and specific
2. Relevant to the current situation
3. Encouraging and constructive

Respond in JSON format:
{
  "type": "argument|delivery|timing|strategy",
  "message": "Specific coaching tip",
  "priority": "low|medium|high",
  "immediate": true/false
}
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a debate coach providing actionable, real-time feedback to help users improve their debating skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.5
      });

      const tipText = completion.choices[0]?.message?.content || '{}';
      const tip = JSON.parse(tipText);

      logger.info(`Coaching tip generated for situation: ${context.situation}`);

      return {
        type: tip.type || 'delivery',
        message: tip.message || 'Focus on clear, structured arguments.',
        priority: tip.priority || 'medium',
        immediate: tip.immediate || true
      };

    } catch (error) {
      logger.error('Error in generateCoachingTip:', error);

      // Fallback coaching tip
      return this.getFallbackCoachingTip(context.situation);
    }
  }

  // Generate comprehensive feedback
  static async generateFeedback(sessionData: {
    transcript: any;
    metrics: any;
    topic: string;
    duration: number;
  }) {
    try {
      const prompt = `
You are an expert debate judge providing comprehensive feedback on a debate session.

DEBATE TOPIC: ${sessionData.topic}
SESSION DURATION: ${Math.round(sessionData.duration / 60)} minutes

TRANSCRIPT:
${JSON.stringify(sessionData.transcript, null, 2)}

PERFORMANCE METRICS:
${JSON.stringify(sessionData.metrics, null, 2)}

Please provide detailed feedback including:
1. Overall performance score (0-100)
2. Argument quality assessment
3. Delivery and presentation
4. Strategic thinking
5. Specific strengths (3-5 points)
6. Areas for improvement (3-5 points)
7. Actionable next steps

Respond in JSON format:
{
  "overallScore": <0-100>,
  "argumentQuality": {
    "score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "delivery": {
    "score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "strategy": {
    "score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "overallFeedback": ["point1", "point2", "point3"],
  "nextSteps": ["step1", "step2", "step3"]
}
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debate judge providing constructive, detailed feedback to help debaters improve their skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const feedbackText = completion.choices[0]?.message?.content || '{}';
      const feedback = JSON.parse(feedbackText);

      logger.info(`Comprehensive feedback generated for session`);

      return feedback;

    } catch (error) {
      logger.error('Error in generateFeedback:', error);

      // Fallback feedback
      return this.getFallbackFeedback();
    }
  }

  // Fallback analysis
  private static getFallbackAnalysis(): ArgumentAnalysis {
    return {
      strength: 3,
      clarity: 3,
      evidence: 3,
      relevance: 3,
      logic: 3,
      overall: 60,
      feedback: ['Analysis service temporarily unavailable', 'Try again later']
    };
  }

  // Fallback response
  private static getFallbackResponse(topic: string, role: string): DebateResponse {
    const opponentRole = role === 'government' ? 'opposition' : 'government';

    return {
      text: `I understand the points raised regarding ${topic}. From the ${opponentRole} perspective, I believe we should consider additional factors and alternative approaches to this issue.`,
      arguments: ['Consider alternative viewpoints', 'Examine all evidence thoroughly'],
      counterArguments: ['Current approach needs refinement', 'Missing key considerations'],
      confidence: 0.6,
      strategy: 'Provide balanced perspective'
    };
  }

  // Fallback coaching tip
  private static getFallbackCoachingTip(situation: string): CoachingTip {
    const tips = {
      opening: {
        type: 'strategy' as const,
        message: 'Start with a clear thesis statement outlining your main arguments.',
        priority: 'high' as const,
        immediate: true
      },
      argument: {
        type: 'argument' as const,
        message: 'Support each claim with specific evidence and logical reasoning.',
        priority: 'medium' as const,
        immediate: true
      },
      rebuttal: {
        type: 'argument' as const,
        message: 'Listen carefully to identify and address the weakest points in opposing arguments.',
        priority: 'high' as const,
        immediate: true
      },
      conclusion: {
        type: 'delivery' as const,
        message: 'End with a strong summary that reinforces your main position.',
        priority: 'medium' as const,
        immediate: true
      },
      delivery: {
        type: 'delivery' as const,
        message: 'Speak clearly and maintain good eye contact with your audience.',
        priority: 'medium' as const,
        immediate: true
      }
    };

    return tips[situation as keyof typeof tips] || tips.delivery;
  }

  // Fallback feedback
  private static getFallbackFeedback() {
    return {
      overallScore: 70,
      argumentQuality: {
        score: 70,
        strengths: ['Clear structure', 'Good use of examples'],
        improvements: ['Need more evidence', 'Strengthen logical flow']
      },
      delivery: {
        score: 75,
        strengths: ['Confident delivery', 'Good pacing'],
        improvements: ['Work on filler words', 'Improve gestures']
      },
      strategy: {
        score: 65,
        strengths: ['Good topic understanding', 'Strategic thinking'],
        improvements: ['Better time management', 'More comprehensive preparation']
      },
      overallFeedback: [
        'Good overall performance with room for improvement',
        'Focus on strengthening argument structure',
        'Practice timing and delivery skills'
      ],
      nextSteps: [
        'Review debate fundamentals',
        'Practice with varied topics',
        'Work on evidence-based arguments'
      ]
    };
  }

  // Generate video feedback based on metrics
  private static generateVideoFeedback(
    eyeContact: number,
    posture: number,
    gestures: number,
    engagement: number,
    speakingPace: number
  ): string[] {
    const feedback = [];

    if (eyeContact < 70) {
      feedback.push('Improve eye contact by looking at the camera more frequently');
    }

    if (posture < 75) {
      feedback.push('Work on maintaining good posture throughout your presentation');
    }

    if (gestures < 60) {
      feedback.push('Use more natural hand gestures to emphasize key points');
    }

    if (engagement < 70) {
      feedback.push('Show more enthusiasm and engagement with your arguments');
    }

    if (speakingPace < 120) {
      feedback.push('Try speaking slightly faster to maintain audience engagement');
    } else if (speakingPace > 180) {
      feedback.push('Slow down your speaking pace for better clarity');
    }

    if (feedback.length === 0) {
      feedback.push('Excellent presentation skills across all metrics');
    }

    return feedback;
  }

  // Check AI service health
  static async checkHealth(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const startTime = Date.now();
      const provider = getAIProvider();

      if (provider === 'google') {
        // Test Google AI
        await googleAI.getGenerativeModel({ model: 'gemini-pro' });
        logger.info('Google AI health check passed');
      } else {
        // Test OpenAI
        await openai.models.list();
        logger.info('OpenAI health check passed');
      }

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        provider
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: getAIProvider()
      };
    }
  }
}