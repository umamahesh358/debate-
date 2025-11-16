import express from 'express';
import Joi from 'joi';
import { AuthRequest } from '@/middleware/auth';
import { validate, learningSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { LearningService } from '@/services/learningService';
import { logger } from '@/utils/logger';

const router = express.Router();

// Get available learning modules
router.get('/modules',
  validate({ query: learningSchemas.getModules }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      page = 1,
      limit = 20,
      level,
      category
    } = req.query;

    const filters = {
      level: level ? parseInt(level as string) : undefined,
      category: category as string
    };

    const result = await LearningService.getModules(
      filters,
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

// Get specific learning module
router.get('/modules/:id',
  validate({ params: { id: Joi.string().required() } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    const module = await LearningService.getModuleById(id, req.user.id);

    res.json({
      success: true,
      data: module
    });
  })
);

// Update learning progress
router.post('/progress',
  validate({ body: learningSchemas.updateProgress }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { moduleId, status, completion, timeSpent, notes } = req.body;

    const progress = await LearningService.updateProgress(req.user.id, {
      moduleId,
      status,
      completion,
      timeSpent,
      notes
    });

    logger.info(`Learning progress updated: ${moduleId} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Learning progress updated successfully',
      data: {
        progress
      }
    });
  })
);

// Get user's learning progress
router.get('/progress',
  validate({
    query: {
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
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

    const result = await LearningService.getUserProgress(
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

// Get user's learning path
router.get('/path',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const learningPath = await LearningService.getLearningPath(req.user.id);

    res.json({
      success: true,
      data: learningPath
    });
  })
);

// Get next recommended module
router.get('/next',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const nextModule = await LearningService.getNextModule(req.user.id);

    if (!nextModule) {
      return res.json({
        success: true,
        message: 'No recommended modules available',
        data: null
      });
    }

    res.json({
      success: true,
      data: nextModule
    });
  })
);

// Get learning statistics
router.get('/stats',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const stats = await LearningService.getLearningStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  })
);

// Mark module as complete
router.post('/complete',
  validate({
    body: {
      moduleId: Joi.string().required(),
      completion: Joi.number().min(0).max(1).default(1.0),
      timeSpent: Joi.number().min(0).optional(),
      notes: Joi.string().max(1000).optional()
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { moduleId, completion, timeSpent, notes } = req.body;

    const progress = await LearningService.updateProgress(req.user.id, {
      moduleId,
      status: 'completed',
      completion: completion || 1.0,
      timeSpent,
      notes
    });

    logger.info(`Module completed: ${moduleId} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Module marked as complete',
      data: {
        progress
      }
    });
  })
);

// Rate learning module
router.post('/modules/:id/rate',
  validate({
    params: { id: Joi.string().required() },
    body: {
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().max(500).optional()
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
    const { rating, comment } = req.body;

    // TODO: Implement rating system
    // For now, just return success
    res.json({
      success: true,
      message: 'Module rated successfully',
      data: {
        moduleId: id,
        rating,
        comment
      }
    });
  })
);

// Search learning modules
router.get('/search',
  validate({
    query: {
      q: Joi.string().min(1).max(100).required(),
      level: Joi.number().integer().min(1).max(5).optional(),
      category: Joi.string().optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20)
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { q, level, category, page = 1, limit = 20 } = req.query;

    // Use search in modules endpoint
    // TODO: Implement more sophisticated search with tags, content, etc.
    const filters = {
      level: level ? parseInt(level as string) : undefined,
      category: category as string,
      search: q as string
    };

    const result = await LearningService.getModules(
      filters,
      req.user.id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
      search: {
        query: q,
        filters: { level, category }
      }
    });
  })
);

export default router;