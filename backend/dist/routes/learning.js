"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("@/middleware/validation");
const errorHandler_1 = require("@/middleware/errorHandler");
const learningService_1 = require("@/services/learningService");
const logger_1 = require("@/utils/logger");
const router = express_1.default.Router();
// Get available learning modules
router.get('/modules', (0, validation_1.validate)({ query: validation_1.learningSchemas.getModules }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { page = 1, limit = 20, level, category } = req.query;
    const filters = {
        level: level ? parseInt(level) : undefined,
        category: category
    };
    const result = await learningService_1.LearningService.getModules(filters, req.user.id, parseInt(page), parseInt(limit));
    res.json({
        success: true,
        data: result
    });
}));
// Get specific learning module
router.get('/modules/:id', (0, validation_1.validate)({ params: { id: joi_1.default.string().required() } }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { id } = req.params;
    const module = await learningService_1.LearningService.getModuleById(id, req.user.id);
    res.json({
        success: true,
        data: module
    });
}));
// Update learning progress
router.post('/progress', (0, validation_1.validate)({ body: validation_1.learningSchemas.updateProgress }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { moduleId, status, completion, timeSpent, notes } = req.body;
    const progress = await learningService_1.LearningService.updateProgress(req.user.id, {
        moduleId,
        status,
        completion,
        timeSpent,
        notes
    });
    logger_1.logger.info(`Learning progress updated: ${moduleId} by user: ${req.user.id}`);
    res.json({
        success: true,
        message: 'Learning progress updated successfully',
        data: {
            progress
        }
    });
}));
// Get user's learning progress
router.get('/progress', (0, validation_1.validate)({
    query: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20)
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { page = 1, limit = 20 } = req.query;
    const result = await learningService_1.LearningService.getUserProgress(req.user.id, parseInt(page), parseInt(limit));
    res.json({
        success: true,
        data: result
    });
}));
// Get user's learning path
router.get('/path', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const learningPath = await learningService_1.LearningService.getLearningPath(req.user.id);
    res.json({
        success: true,
        data: learningPath
    });
}));
// Get next recommended module
router.get('/next', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const nextModule = await learningService_1.LearningService.getNextModule(req.user.id);
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
}));
// Get learning statistics
router.get('/stats', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const stats = await learningService_1.LearningService.getLearningStats(req.user.id);
    res.json({
        success: true,
        data: stats
    });
}));
// Mark module as complete
router.post('/complete', (0, validation_1.validate)({
    body: {
        moduleId: joi_1.default.string().required(),
        completion: joi_1.default.number().min(0).max(1).default(1.0),
        timeSpent: joi_1.default.number().min(0).optional(),
        notes: joi_1.default.string().max(1000).optional()
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { moduleId, completion, timeSpent, notes } = req.body;
    const progress = await learningService_1.LearningService.updateProgress(req.user.id, {
        moduleId,
        status: 'completed',
        completion: completion || 1.0,
        timeSpent,
        notes
    });
    logger_1.logger.info(`Module completed: ${moduleId} by user: ${req.user.id}`);
    res.json({
        success: true,
        message: 'Module marked as complete',
        data: {
            progress
        }
    });
}));
// Rate learning module
router.post('/modules/:id/rate', (0, validation_1.validate)({
    params: { id: joi_1.default.string().required() },
    body: {
        rating: joi_1.default.number().min(1).max(5).required(),
        comment: joi_1.default.string().max(500).optional()
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
}));
// Search learning modules
router.get('/search', (0, validation_1.validate)({
    query: {
        q: joi_1.default.string().min(1).max(100).required(),
        level: joi_1.default.number().integer().min(1).max(5).optional(),
        category: joi_1.default.string().optional(),
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(50).default(20)
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        level: level ? parseInt(level) : undefined,
        category: category,
        search: q
    };
    const result = await learningService_1.LearningService.getModules(filters, req.user.id, parseInt(page), parseInt(limit));
    res.json({
        success: true,
        data: result,
        search: {
            query: q,
            filters: { level, category }
        }
    });
}));
exports.default = router;
//# sourceMappingURL=learning.js.map