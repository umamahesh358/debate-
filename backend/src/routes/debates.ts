import express from 'express';
import { AuthRequest } from '@/middleware/auth';
import { validate, debateSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { DebateService } from '@/services/debateService';
import { logger } from '@/utils/logger';

const router = express.Router();

// Get available debate topics
router.get('/topics',
  validate({ query: debateSchemas.getTopics }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      search,
      tags
    } = req.query;

    const filters = {
      category: category as string,
      difficulty: difficulty as any,
      search: search as string,
      tags: tags as string[] | string
    };

    const result = await DebateService.getTopics(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result
    });
  })
);

// Get specific debate topic
router.get('/topics/:id',
  validate({ params: { id: debateSchemas.getSession.extract('id') } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { id } = req.params;

    const topic = await DebateService.getTopicById(id);

    res.json({
      success: true,
      data: topic
    });
  })
);

// Get random debate topic
router.get('/topics/random',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { category, difficulty, tags } = req.query;

    const filters = {
      category: category as string,
      difficulty: difficulty as any,
      tags: tags as string[] | string
    };

    const topic = await DebateService.getRandomTopic(filters);

    res.json({
      success: true,
      data: topic
    });
  })
);

// Create new debate session
router.post('/sessions',
  validate({ body: debateSchemas.createSession }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { topicId, role } = req.body;

    const session = await DebateService.createSession({
      userId: req.user.id,
      topicId,
      role
    });

    logger.info(`New debate session created: ${session.id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Debate session created successfully',
      data: session
    });
  })
);

// Get specific debate session
router.get('/sessions/:id',
  validate({ params: debateSchemas.getSession }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    const session = await DebateService.getSessionById(id, req.user.id);

    res.json({
      success: true,
      data: session
    });
  })
);

// Update debate session
router.put('/sessions/:id',
  validate({
    params: { id: debateSchemas.getSession.extract('id') },
    body: debateSchemas.updateSession
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { transcript, feedback, score, duration, completedAt } = req.body;

    const session = await DebateService.updateSession(id, req.user.id, {
      transcript,
      feedback,
      score,
      duration,
      completedAt: completedAt ? new Date(completedAt) : undefined,
      metrics: req.body.metrics
    });

    res.json({
      success: true,
      message: 'Debate session updated successfully',
      data: session
    });
  })
);

// Get user's debate sessions
router.get('/sessions',
  validate({
    query: {
      page: debateSchemas.getTopics.extract('page'),
      limit: debateSchemas.getTopics.extract('limit')
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

    const result = await DebateService.getUserSessions(
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

// Get debate statistics
router.get('/stats',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const stats = await DebateService.getDebateStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Complete debate session (automatically calculates score)
router.post('/sessions/:id/complete',
  validate({
    params: { id: debateSchemas.getSession.extract('id') },
    body: {
      transcript: express.request.body.transcript ? Joi.object().required() : Joi.object().optional(),
      metrics: Joi.object().required(),
      duration: Joi.number().min(0).required()
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { transcript, metrics, duration } = req.body;

    // Get session to determine difficulty for scoring
    const existingSession = await DebateService.getSessionById(id, req.user.id);

    const calculatedScore = DebateService.calculateScore(
      metrics,
      existingSession.topic.difficulty
    );

    const session = await DebateService.updateSession(id, req.user.id, {
      transcript,
      score: calculatedScore,
      duration,
      completedAt: new Date(),
      metrics
    });

    logger.info(`Debate session completed: ${id} with score: ${calculatedScore}`);

    res.json({
      success: true,
      message: 'Debate session completed successfully',
      data: {
        session,
        score: calculatedScore
      }
    });
  })
);

// Generate AI feedback for debate session
router.post('/sessions/:id/feedback',
  validate({ params: { id: debateSchemas.getSession.extract('id') } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    // Get session data
    const session = await DebateService.getSessionById(id, req.user.id);

    if (!session.transcript) {
      return res.status(400).json({
        success: false,
        error: 'Debate transcript is required for feedback generation'
      });
    }

    // TODO: Integrate with AI service for feedback generation
    // For now, return a placeholder feedback
    const feedback = {
      overallScore: session.score || 0,
      strengths: [
        'Good argument structure',
        'Clear speaking style'
      ],
      improvements: [
        'Work on evidence usage',
        'Improve time management'
      ],
      detailedAnalysis: {
        argumentQuality: session.score ? (session.score / 100) * 4 : 0,
        clarity: 3.5,
        evidenceUsage: 2.8,
        timeManagement: 3.2,
        relevance: 3.7
      },
      nextSteps: [
        'Practice with more challenging topics',
        'Review debate fundamentals',
        'Work on persuasive techniques'
      ]
    };

    // Update session with feedback
    const updatedSession = await DebateService.updateSession(id, req.user.id, {
      feedback
    });

    res.json({
      success: true,
      message: 'Feedback generated successfully',
      data: {
        feedback,
        session: updatedSession
      }
    });
  })
);

export default router;