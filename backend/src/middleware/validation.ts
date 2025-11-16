import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/utils/logger';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

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
      logger.warn('Validation error:', errors);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid ID format'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),

  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'name', 'score').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  debateFilters: Joi.object({
    category: Joi.string().optional(),
    difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master').optional(),
    search: Joi.string().max(100).optional(),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional()
  }),

  fileUpload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid(
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'image/jpeg',
      'image/png',
      'image/webp'
    ).required(),
    size: Joi.number().max(100 * 1024 * 1024).required() // 100MB max
  })
};

// Specific validation schemas for different endpoints
export const authSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    username: commonSchemas.username,
    password: commonSchemas.password,
    displayName: Joi.string().min(2).max(50).required()
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  updateProfile: Joi.object({
    displayName: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    preferences: Joi.object().optional()
  })
};

export const debateSchemas = {
  createSession: Joi.object({
    topicId: commonSchemas.id,
    role: Joi.string().valid('government', 'opposition').required()
  }),

  updateSession: Joi.object({
    transcript: Joi.object().optional(),
    feedback: Joi.object().optional(),
    score: Joi.number().min(0).max(100).optional(),
    duration: Joi.number().min(0).optional(),
    completedAt: Joi.date().optional()
  }),

  getTopics: Joi.object({
    ...commonSchemas.pagination.describe().keys,
    ...commonSchemas.debateFilters.describe().keys
  }),

  getSession: Joi.object({
    id: commonSchemas.id.required()
  })
};

export const learningSchemas = {
  updateProgress: Joi.object({
    moduleId: commonSchemas.id.required(),
    status: Joi.string().valid('not_started', 'in_progress', 'completed').required(),
    completion: Joi.number().min(0).max(1).optional(),
    timeSpent: Joi.number().min(0).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  getModules: Joi.object({
    level: Joi.number().integer().min(1).max(5).optional(),
    category: Joi.string().optional(),
    ...commonSchemas.pagination.describe().keys
  })
};

export const gamificationSchemas = {
  getLeaderboard: Joi.object({
    period: Joi.string().valid('daily', 'weekly', 'monthly', 'overall').default('weekly'),
    category: Joi.string().default('overall'),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),

  awardPoints: Joi.object({
    userId: commonSchemas.id.required(),
    points: Joi.number().integer().min(-1000).max(1000).required(),
    eventType: Joi.string().required(),
    description: Joi.string().max(200).required(),
    metadata: Joi.object().optional()
  })
};

export const uploadSchemas = {
  videoUpload: Joi.object({
    sessionId: commonSchemas.id.optional()
  })
};

// Sanitization middleware
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous HTML from string inputs
  const sanitizeString = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
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