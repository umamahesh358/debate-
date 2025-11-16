import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = error.details;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database error occurred';
  } else if (error.message?.includes('E11000')) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    if (error.message?.includes('email')) {
      message = 'Email already exists';
    } else if (error.message?.includes('username')) {
      message = 'Username already exists';
    }
  } else if (error.message?.includes('Token expired')) {
    statusCode = 401;
    message = 'Token has expired';
  } else if (error.message?.includes('Invalid token')) {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (error.message?.includes('User not found')) {
    statusCode = 404;
    message = 'User not found';
  } else if (error.message?.includes('Unauthorized') || error.message?.includes('Access denied')) {
    statusCode = 403;
    message = 'Access denied';
  } else if (error.message?.includes('Not found')) {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'File not found';
  } else if (error.code === 'EACCES' || error.code === 'EPERM') {
    statusCode = 403;
    message = 'Permission denied';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message || 'Request failed';
    details = error.details;
  }

  // Prisma error handling
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    statusCode = 400;
    message = 'Database operation failed';

    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Unique constraint violated';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
    }
  } else if (error.name === 'PrismaClientUnknownRequestError') {
    statusCode = 500;
    message = 'Unknown database error';
  } else if (error.name === 'PrismaClientRustPanicError') {
    statusCode = 500;
    message = 'Database connection error';
  } else if (error.name === 'PrismaClientInitializationError') {
    statusCode = 500;
    message = 'Database initialization error';
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid database query';
  }

  // Don't expose stack trace in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse: any = {
    success: false,
    error: message,
    statusCode
  };

  if (details) {
    errorResponse.details = details;
  }

  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.name = error.name;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
  error.statusCode = 404;
  next(error);
};