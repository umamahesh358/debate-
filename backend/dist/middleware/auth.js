"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = exports.optionalAuthMiddleware = exports.authMiddleware = exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("@/config/prisma");
const logger_1 = require("@/utils/logger");
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        username: user.username
    }, process.env.JWT_SECRET || 'your-super-secret-jwt-key', {
        expiresIn: '15m',
        issuer: 'debate-platform',
        audience: 'debate-platform-users'
    });
    const refreshToken = jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        username: user.username
    }, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', {
        expiresIn: '7d',
        issuer: 'debate-platform',
        audience: 'debate-platform-users'
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyToken = (token, secret) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret, {
            issuer: 'debate-platform',
            audience: 'debate-platform-users'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        else {
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyToken = verifyToken;
const authMiddleware = async (req, res, next) => {
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
            const decoded = (0, exports.verifyToken)(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
            // Fetch user from database to ensure they still exist
            const user = await prisma_1.prisma.user.findUnique({
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
        }
        catch (tokenError) {
            logger_1.logger.warn('Token verification failed:', tokenError.message);
            return res.status(401).json({
                success: false,
                error: tokenError.message || 'Invalid token'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};
exports.authMiddleware = authMiddleware;
// Optional authentication - doesn't fail if no token, but adds user if token exists
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        try {
            const decoded = (0, exports.verifyToken)(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
            const user = await prisma_1.prisma.user.findUnique({
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
        }
        catch (tokenError) {
            // Silent fail for optional auth
            logger_1.logger.debug('Optional auth token verification failed:', tokenError);
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional authentication middleware error:', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
// Rate limiting middleware for auth endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    return (req, res, next) => {
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
exports.authRateLimit = authRateLimit;
//# sourceMappingURL=auth.js.map