"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const joi_1 = __importDefault(require("joi"));
const prisma_1 = require("@/config/prisma");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const router = express_1.default.Router();
// Register new user
router.post('/register', (0, auth_1.authRateLimit)(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
(0, validation_1.validate)({ body: validation_1.authSchemas.register }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, username, password, displayName } = req.body;
    // Check if user already exists
    const existingUser = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });
    if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        throw new errorHandler_1.CustomError(`${field} already exists`);
    }
    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    // Create user and profile in a transaction
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                username,
                passwordHash
            }
        });
        const profile = await tx.userProfile.create({
            data: {
                userId: user.id,
                displayName,
                level: 1,
                experience: 0,
                streak: 0,
                totalDebates: 0,
                wins: 0,
                averageScore: 0.0
            }
        });
        return { user, profile };
    });
    logger_1.logger.info(`New user registered: ${email}`);
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)({
        id: result.user.id,
        email: result.user.email,
        username: result.user.username
    });
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = result.user;
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: userWithoutPassword,
            profile: result.profile,
            tokens
        }
    });
}));
// Login user
router.post('/login', (0, auth_1.authRateLimit)(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
(0, validation_1.validate)({ body: validation_1.authSchemas.login }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user with profile
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
        include: {
            profile: true
        }
    });
    if (!user) {
        throw new errorHandler_1.CustomError('Invalid email or password');
    }
    // Check password
    const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw new errorHandler_1.CustomError('Invalid email or password');
    }
    logger_1.logger.info(`User logged in: ${email}`);
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)({
        id: user.id,
        email: user.email,
        username: user.username
    });
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userWithoutPassword,
            tokens
        }
    });
}));
// Refresh tokens
router.post('/refresh', (0, auth_1.authRateLimit)(5, 60 * 1000), // 5 attempts per minute
(0, validation_1.validate)({ body: validation_1.authSchemas.refreshToken }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    try {
        const decoded = (0, auth_1.verifyToken)(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
        // Verify user still exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                profile: true
            }
        });
        if (!user) {
            throw new errorHandler_1.CustomError('User not found');
        }
        // Generate new tokens
        const tokens = (0, auth_1.generateTokens)({
            id: user.id,
            email: user.email,
            username: user.username
        });
        // Remove password hash from response
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: {
                user: userWithoutPassword,
                tokens
            }
        });
    }
    catch (tokenError) {
        throw new errorHandler_1.CustomError('Invalid or expired refresh token');
    }
}));
// Get current user
router.get('/me', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.CustomError('Authentication required');
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            profile: true,
            _count: {
                select: {
                    debates: true,
                    learningProgress: true,
                    achievements: true
                }
            }
        }
    });
    if (!user) {
        throw new errorHandler_1.CustomError('User not found');
    }
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({
        success: true,
        data: {
            user: userWithoutPassword
        }
    });
}));
// Update user profile
router.put('/profile', (0, validation_1.validate)({ body: validation_1.authSchemas.updateProfile }), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.CustomError('Authentication required');
    }
    const { displayName, bio, preferences } = req.body;
    const updatedProfile = await prisma_1.prisma.userProfile.update({
        where: { userId: req.user.id },
        data: {
            ...(displayName && { displayName }),
            ...(bio !== undefined && { bio }),
            ...(preferences && { preferences }),
            updatedAt: new Date()
        }
    });
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            profile: updatedProfile
        }
    });
}));
// Logout (client-side token invalidation)
router.post('/logout', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // In a real implementation, you might want to:
    // 1. Add the token to a blacklist in Redis
    // 2. Or maintain a list of active tokens per user
    res.json({
        success: true,
        message: 'Logout successful'
    });
}));
// Change password
router.put('/password', (0, auth_1.authRateLimit)(3, 60 * 60 * 1000), // 3 attempts per hour
(0, validation_1.validate)({
    body: {
        currentPassword: validation_1.authSchemas.login.extract('password'),
        newPassword: validation_1.authSchemas.password
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.CustomError('Authentication required');
    }
    const { currentPassword, newPassword } = req.body;
    // Get user with current password
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            passwordHash: true
        }
    });
    if (!user) {
        throw new errorHandler_1.CustomError('User not found');
    }
    // Verify current password
    const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
        throw new errorHandler_1.CustomError('Current password is incorrect');
    }
    // Hash new password
    const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
    // Update password
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: newPasswordHash,
            updatedAt: new Date()
        }
    });
    logger_1.logger.info(`Password changed for user: ${req.user.id}`);
    res.json({
        success: true,
        message: 'Password changed successfully'
    });
}));
// Delete account
router.delete('/account', (0, auth_1.authRateLimit)(1, 24 * 60 * 60 * 1000), // 1 attempt per 24 hours
(0, validation_1.validate)({
    body: {
        password: validation_1.authSchemas.login.extract('password'),
        confirmation: joi_1.default.string().valid('DELETE').required()
    }
}), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.CustomError('Authentication required');
    }
    const { password } = req.body;
    // Get user with current password
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            passwordHash: true,
            email: true
        }
    });
    if (!user) {
        throw new errorHandler_1.CustomError('User not found');
    }
    // Verify password
    const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw new errorHandler_1.CustomError('Invalid password');
    }
    // Delete user and all related data in a transaction
    await prisma_1.prisma.$transaction(async (tx) => {
        // Delete related records first (due to foreign key constraints)
        await tx.userAchievement.deleteMany({
            where: { userId: user.id }
        });
        await tx.learningProgress.deleteMany({
            where: { userId: user.id }
        });
        await tx.debateSession.deleteMany({
            where: { userId: user.id }
        });
        await tx.userProfile.delete({
            where: { userId: user.id }
        });
        // Finally delete the user
        await tx.user.delete({
            where: { id: user.id }
        });
    });
    logger_1.logger.warn(`User account deleted: ${user.email}`);
    res.json({
        success: true,
        message: 'Account deleted successfully'
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map