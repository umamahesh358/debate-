import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { prisma } from '@/config/prisma';
import { generateTokens, verifyToken, AuthRequest, authRateLimit } from '@/middleware/auth';
import { validate, authSchemas } from '@/middleware/validation';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const router = express.Router();

// Register new user
router.post('/register',
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validate({ body: authSchemas.register }),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      throw new CustomError(`${field} already exists`) as CustomError;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
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

    logger.info(`New user registered: ${email}`);

    // Generate tokens
    const tokens = generateTokens({
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
  })
);

// Login user
router.post('/login',
  authRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  validate({ body: authSchemas.login }),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });

    if (!user) {
      throw new CustomError('Invalid email or password') as CustomError;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new CustomError('Invalid email or password') as CustomError;
    }

    logger.info(`User logged in: ${email}`);

    // Generate tokens
    const tokens = generateTokens({
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
  })
);

// Refresh tokens
router.post('/refresh',
  authRateLimit(5, 60 * 1000), // 5 attempts per minute
  validate({ body: authSchemas.refreshToken }),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { refreshToken } = req.body;

    try {
      const decoded = verifyToken(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
      );

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true
        }
      });

      if (!user) {
        throw new CustomError('User not found') as CustomError;
      }

      // Generate new tokens
      const tokens = generateTokens({
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
    } catch (tokenError: any) {
      throw new CustomError('Invalid or expired refresh token') as CustomError;
    }
  })
);

// Get current user
router.get('/me',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      throw new CustomError('Authentication required') as CustomError;
    }

    const user = await prisma.user.findUnique({
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
      throw new CustomError('User not found') as CustomError;
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  })
);

// Update user profile
router.put('/profile',
  validate({ body: authSchemas.updateProfile }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      throw new CustomError('Authentication required') as CustomError;
    }

    const { displayName, bio, preferences } = req.body;

    const updatedProfile = await prisma.userProfile.update({
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
  })
);

// Logout (client-side token invalidation)
router.post('/logout',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    // In a real implementation, you might want to:
    // 1. Add the token to a blacklist in Redis
    // 2. Or maintain a list of active tokens per user

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

// Change password
router.put('/password',
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  validate({
    body: {
      currentPassword: authSchemas.login.extract('password'),
      newPassword: authSchemas.password
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      throw new CustomError('Authentication required') as CustomError;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        passwordHash: true
      }
    });

    if (!user) {
      throw new CustomError('User not found') as CustomError;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new CustomError('Current password is incorrect') as CustomError;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    logger.info(`Password changed for user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

// Delete account
router.delete('/account',
  authRateLimit(1, 24 * 60 * 60 * 1000), // 1 attempt per 24 hours
  validate({
    body: {
      password: authSchemas.login.extract('password'),
      confirmation: Joi.string().valid('DELETE').required()
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      throw new CustomError('Authentication required') as CustomError;
    }

    const { password } = req.body;

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        passwordHash: true,
        email: true
      }
    });

    if (!user) {
      throw new CustomError('User not found') as CustomError;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new CustomError('Invalid password') as CustomError;
    }

    // Delete user and all related data in a transaction
    await prisma.$transaction(async (tx) => {
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

    logger.warn(`User account deleted: ${user.email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  })
);

export default router;