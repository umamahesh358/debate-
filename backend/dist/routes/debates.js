"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const validation_1 = require("@/middleware/validation");
const errorHandler_1 = require("@/middleware/errorHandler");
const debateService_1 = require("@/services/debateService");
const logger_1 = require("@/utils/logger");
const router = express_1.default.Router();
// Get available debate topics
router.get('/topics', (0, validation_1.validate)({ query: validation_1.debateSchemas.getTopics }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, category, difficulty, search, tags } = req.query;
    const filters = {
        category: category,
        difficulty: difficulty,
        search: search,
        tags: tags
    };
    const result = await debateService_1.DebateService.getTopics(filters, parseInt(page), parseInt(limit));
    res.json({
        success: true,
        data: result
    });
}));
// Get specific debate topic
router.get('/topics/:id', (0, validation_1.validate)({ params: { id: joi_1.default.string().required() } }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const topic = await debateService_1.DebateService.getTopicById(id);
    res.json({
        success: true,
        data: topic
    });
}));
// Get random debate topic
router.get('/topics/random', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { category, difficulty, tags } = req.query;
    const filters = {
        category: category,
        difficulty: difficulty,
        tags: tags
    };
    const topic = await debateService_1.DebateService.getRandomTopic(filters);
    res.json({
        success: true,
        data: topic
    });
}));
// Create new debate session
router.post('/sessions', (0, validation_1.validate)({ body: validation_1.debateSchemas.createSession }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { topicId, role } = req.body;
    const session = await debateService_1.DebateService.createSession({
        userId: req.user.id,
        topicId,
        role
    });
    logger_1.logger.info(`New debate session created: ${session.id} by user: ${req.user.id}`);
    res.status(201).json({
        success: true,
        message: 'Debate session created successfully',
        data: session
    });
}));
// Get specific debate session
router.get('/sessions/:id', (0, validation_1.validate)({ params: validation_1.debateSchemas.getSession }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { id } = req.params;
    const session = await debateService_1.DebateService.getSessionById(id, req.user.id);
    res.json({
        success: true,
        data: session
    });
}));
// Update debate session
router.put('/sessions/:id', (0, validation_1.validate)({
    params: { id: validation_1.debateSchemas.getSession.extract('id') },
    body: validation_1.debateSchemas.updateSession
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { id } = req.params;
    const { transcript, feedback, score, duration, completedAt } = req.body;
    const session = await debateService_1.DebateService.updateSession(id, req.user.id, {
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
}));
// Get user's debate sessions
router.get('/sessions', (0, validation_1.validate)({
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
    const result = await debateService_1.DebateService.getUserSessions(req.user.id, parseInt(page), parseInt(limit));
    res.json({
        success: true,
        data: result
    });
}));
// Get debate statistics
router.get('/stats', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const stats = await debateService_1.DebateService.getDebateStats(req.user.id);
    res.json({
        success: true,
        data: stats
    });
}));
// Complete debate session (automatically calculates score)
router.post('/sessions/:id/complete', (0, validation_1.validate)({
    params: { id: joi_1.default.string().required() },
    body: {
        transcript: joi_1.default.object().required(),
        metrics: joi_1.default.object().required(),
        duration: joi_1.default.number().min(0).required()
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { id } = req.params;
    const { transcript, metrics, duration } = req.body;
    // Get session to determine difficulty for scoring
    const existingSession = await debateService_1.DebateService.getSessionById(id, req.user.id);
    const calculatedScore = debateService_1.DebateService.calculateScore(metrics, existingSession.topic.difficulty);
    const session = await debateService_1.DebateService.updateSession(id, req.user.id, {
        transcript,
        score: calculatedScore,
        duration,
        completedAt: new Date(),
        metrics
    });
    logger_1.logger.info(`Debate session completed: ${id} with score: ${calculatedScore}`);
    res.json({
        success: true,
        message: 'Debate session completed successfully',
        data: {
            session,
            score: calculatedScore
        }
    });
}));
// Generate AI feedback for debate session
router.post('/sessions/:id/feedback', (0, validation_1.validate)({ params: { id: joi_1.default.string().required() } }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    const { id } = req.params;
    // Get session data
    const session = await debateService_1.DebateService.getSessionById(id, req.user.id);
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
    const updatedSession = await debateService_1.DebateService.updateSession(id, req.user.id, {
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
}));
exports.default = router;
//# sourceMappingURL=debates.js.map