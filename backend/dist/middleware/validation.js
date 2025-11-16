"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = exports.uploadSchemas = exports.gamificationSchemas = exports.learningSchemas = exports.debateSchemas = exports.authSchemas = exports.commonSchemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("@/utils/logger");
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate request body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => `Body: ${detail.message}`));
            }
        }
        // Validate query parameters
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => `Query: ${detail.message}`));
            }
        }
        // Validate route parameters
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(detail => `Params: ${detail.message}`));
            }
        }
        if (errors.length > 0) {
            logger_1.logger.warn('Validation error:', errors);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        next();
    };
};
exports.validate = validate;
// Common validation schemas
exports.commonSchemas = {
    id: joi_1.default.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': 'Invalid ID format'
    }),
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: joi_1.default.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    }),
    username: joi_1.default.string().alphanum().min(3).max(30).required().messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
    }),
    pagination: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        sort: joi_1.default.string().valid('createdAt', 'updatedAt', 'name', 'score').default('createdAt'),
        order: joi_1.default.string().valid('asc', 'desc').default('desc')
    }),
    debateFilters: joi_1.default.object({
        category: joi_1.default.string().optional(),
        difficulty: joi_1.default.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master').optional(),
        search: joi_1.default.string().max(100).optional(),
        tags: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.array().items(joi_1.default.string())).optional()
    }),
    fileUpload: joi_1.default.object({
        fieldname: joi_1.default.string().required(),
        originalname: joi_1.default.string().required(),
        encoding: joi_1.default.string().required(),
        mimetype: joi_1.default.string().valid('video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp').required(),
        size: joi_1.default.number().max(100 * 1024 * 1024).required() // 100MB max
    })
};
// Specific validation schemas for different endpoints
exports.authSchemas = {
    register: joi_1.default.object({
        email: exports.commonSchemas.email,
        username: exports.commonSchemas.username,
        password: exports.commonSchemas.password,
        displayName: joi_1.default.string().min(2).max(50).required()
    }),
    login: joi_1.default.object({
        email: exports.commonSchemas.email,
        password: joi_1.default.string().required()
    }),
    refreshToken: joi_1.default.object({
        refreshToken: joi_1.default.string().required()
    }),
    updateProfile: joi_1.default.object({
        displayName: joi_1.default.string().min(2).max(50).optional(),
        bio: joi_1.default.string().max(500).optional(),
        preferences: joi_1.default.object().optional()
    })
};
exports.debateSchemas = {
    createSession: joi_1.default.object({
        topicId: exports.commonSchemas.id,
        role: joi_1.default.string().valid('government', 'opposition').required()
    }),
    updateSession: joi_1.default.object({
        transcript: joi_1.default.object().optional(),
        feedback: joi_1.default.object().optional(),
        score: joi_1.default.number().min(0).max(100).optional(),
        duration: joi_1.default.number().min(0).optional(),
        completedAt: joi_1.default.date().optional()
    }),
    getTopics: joi_1.default.object({
        ...exports.commonSchemas.pagination.describe().keys,
        ...exports.commonSchemas.debateFilters.describe().keys
    }),
    getSession: joi_1.default.object({
        id: exports.commonSchemas.id.required()
    })
};
exports.learningSchemas = {
    updateProgress: joi_1.default.object({
        moduleId: exports.commonSchemas.id.required(),
        status: joi_1.default.string().valid('not_started', 'in_progress', 'completed').required(),
        completion: joi_1.default.number().min(0).max(1).optional(),
        timeSpent: joi_1.default.number().min(0).optional(),
        notes: joi_1.default.string().max(1000).optional()
    }),
    getModules: joi_1.default.object({
        level: joi_1.default.number().integer().min(1).max(5).optional(),
        category: joi_1.default.string().optional(),
        ...exports.commonSchemas.pagination.describe().keys
    })
};
exports.gamificationSchemas = {
    getLeaderboard: joi_1.default.object({
        period: joi_1.default.string().valid('daily', 'weekly', 'monthly', 'overall').default('weekly'),
        category: joi_1.default.string().default('overall'),
        limit: joi_1.default.number().integer().min(1).max(50).default(10)
    }),
    awardPoints: joi_1.default.object({
        userId: exports.commonSchemas.id.required(),
        points: joi_1.default.number().integer().min(-1000).max(1000).required(),
        eventType: joi_1.default.string().required(),
        description: joi_1.default.string().max(200).required(),
        metadata: joi_1.default.object().optional()
    })
};
exports.uploadSchemas = {
    videoUpload: joi_1.default.object({
        sessionId: exports.commonSchemas.id.optional()
    })
};
// Sanitization middleware
const sanitize = (req, res, next) => {
    // Remove potentially dangerous HTML from string inputs
    const sanitizeString = (value) => {
        if (typeof value === 'string') {
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        }
        return value;
    };
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    };
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.sanitize = sanitize;
//# sourceMappingURL=validation.js.map