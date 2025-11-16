import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/prisma';
import { logger } from '@/utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export const generateTokens = (user: { id: string; email: string; username: string }) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    {
      expiresIn: '15m',
      issuer: 'debate-platform',
      audience: 'debate-platform-users'
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username
    },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    {
      expiresIn: '7d',
      issuer: 'debate-platform',
      audience: 'debate-platform-users'
    }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, secret: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'debate-platform',
      audience: 'debate-platform-users'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');

      // Fetch user from database to ensure they still exist
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          profile: {
            select: {
              level: true,
              experience: true,
              streak: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Add user info to request object
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username
      };

      next();
    } catch (tokenError: any) {
      logger.warn('Token verification failed:', tokenError.message);

      return res.status(401).json({
        success: false,
        error: tokenError.message || 'Invalid token'
      });
    }
  } catch (error: any) {
    logger.error('Authentication middleware error:', error);

    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Optional authentication - doesn't fail if no token, but adds user if token exists
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true
        }
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username
        };
      }
    } catch (tokenError) {
      // Silent fail for optional auth
      logger.debug('Optional auth token verification failed:', tokenError);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

// Rate limiting middleware for auth endpoints
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const attempt = attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (attempt.count >= maxAttempts) {
      const resetIn = Math.ceil((attempt.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        error: `Too many attempts. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn
      });
    }

    attempt.count++;
    next();
  };
};