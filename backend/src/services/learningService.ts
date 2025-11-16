import { prisma } from '@/config/prisma';
import { logger } from '@/utils/logger';
import { ProgressStatus } from '@prisma/client';

export interface UpdateProgressData {
  moduleId: string;
  status?: ProgressStatus;
  completion?: number;
  timeSpent?: number;
  notes?: string;
}

export interface ModuleFilters {
  level?: number;
  category?: string;
  prerequisites?: string[];
}

export class LearningService {
  // Get learning modules with filters and pagination
  static async getModules(
    filters: ModuleFilters,
    userId?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const where: any = {
      isActive: true
    };

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    const skip = (page - 1) * limit;

    // Get modules and total count
    const [modules, total] = await Promise.all([
      prisma.learningModule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { level: 'asc' },
          { order: 'asc' },
          { completionCount: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          description: true,
          level: true,
          order: true,
          prerequisites: true,
          estimatedTime: true,
          category: true,
          tags: true,
          completionCount: true,
          averageRating: true,
          ratingCount: true
        }
      }),
      prisma.learningModule.count({ where })
    ]);

    // If user ID provided, get user's progress for these modules
    let userProgress: any[] = [];
    if (userId) {
      const moduleIds = modules.map(m => m.id);
      userProgress = await prisma.learningProgress.findMany({
        where: {
          userId,
          moduleId: { in: moduleIds }
        },
        select: {
          moduleId: true,
          status: true,
          completion: true,
          timeSpent: true,
          lastAccessed: true,
          completedAt: true
        }
      });
    }

    // Combine module data with user progress
    const modulesWithProgress = modules.map(module => {
      const progress = userProgress.find(p => p.moduleId === module.id);
      return {
        ...module,
        userProgress: progress || null,
        isLocked: this.isModuleLocked(module, userProgress, userId)
      };
    });

    return {
      modules: modulesWithProgress,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Get specific learning module by ID
  static async getModuleById(moduleId: string, userId?: string) {
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        level: true,
        order: true,
        prerequisites: true,
        estimatedTime: true,
        category: true,
        tags: true,
        averageRating: true,
        ratingCount: true,
        completionCount: true
      }
    });

    if (!module) {
      throw new Error('Learning module not found');
    }

    // Get user progress if user ID provided
    let userProgress = null;
    if (userId) {
      userProgress = await prisma.learningProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId
          }
        },
        select: {
          status: true,
          completion: true,
          timeSpent: true,
          lastAccessed: true,
          completedAt: true,
          notes: true
        }
      });
    }

    // Get all modules for prerequisite checking
    if (userId) {
      const allUserProgress = await prisma.learningProgress.findMany({
        where: { userId },
        select: {
          moduleId: true,
          status: true,
          completion: true
        }
      });

      return {
        ...module,
        userProgress,
        isLocked: this.isModuleLocked(module, allUserProgress, userId)
      };
    }

    return module;
  }

  // Check if module is locked for user
  private static isModuleLocked(
    module: any,
    userProgress: any[],
    userId?: string
  ): boolean {
    if (!userId) return false;

    // If no prerequisites, module is unlocked
    if (!module.prerequisites || module.prerequisites.length === 0) {
      return false;
    }

    // Check if all prerequisites are completed
    for (const prerequisiteId of module.prerequisites) {
      const prerequisiteProgress = userProgress.find(p => p.moduleId === prerequisiteId);
      if (!prerequisiteProgress || prerequisiteProgress.status !== 'completed') {
        return true;
      }
    }

    return false;
  }

  // Get user's learning path
  static async getLearningPath(userId: string) {
    // Get user profile to determine current level
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        level: true,
        experience: true
      }
    });

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Get all completed modules
    const completedModules = await prisma.learningProgress.findMany({
      where: {
        userId,
        status: 'completed'
      },
      select: {
        moduleId: true,
        completedAt: true
      },
      orderBy: { completedAt: 'asc' }
    });

    // Get recommended next modules
    const currentLevel = userProfile.level;
    const availableModules = await this.getModules(
      { level: currentLevel },
      userId,
      1,
      10
    );

    // Get modules from next level as well
    const nextLevelModules = await this.getModules(
      { level: currentLevel + 1 },
      userId,
      1,
      5
    );

    return {
      currentLevel: userProfile.level,
      experience: userProfile.experience,
      completedModules,
      recommendedModules: availableModules.modules.filter(m => !m.userProgress || m.userProgress.status !== 'completed'),
      upcomingModules: nextLevelModules.modules,
      totalCompleted: completedModules.length,
      estimatedTimeToNextLevel: this.calculateTimeToNextLevel(userProfile.level, userProfile.experience)
    };
  }

  // Update learning progress
  static async updateProgress(userId: string, data: UpdateProgressData) {
    // Verify module exists
    const module = await prisma.learningModule.findUnique({
      where: { id: data.moduleId, isActive: true }
    });

    if (!module) {
      throw new Error('Learning module not found');
    }

    // Check prerequisites before allowing progress
    const existingProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId: data.moduleId
        }
      },
      include: {
        module: {
          select: {
            prerequisites: true
          }
        }
      }
    });

    if (existingProgress) {
      // Update existing progress
      const updateData: any = {
        lastAccessed: new Date(),
        updatedAt: new Date()
      };

      if (data.status !== undefined) updateData.status = data.status;
      if (data.completion !== undefined) updateData.completion = data.completion;
      if (data.timeSpent !== undefined) {
        updateData.timeSpent = existingProgress.timeSpent + data.timeSpent;
      }
      if (data.notes !== undefined) updateData.notes = data.notes;

      // Mark as completed if status is completed and completionAt is not set
      if (data.status === 'completed' && !existingProgress.completedAt) {
        updateData.completedAt = new Date();
        updateData.completion = 1.0;
      }

      const updatedProgress = await prisma.learningProgress.update({
        where: {
          userId_moduleId: {
            userId,
            moduleId: data.moduleId
          }
        },
        data: updateData
      });

      // Update module completion count
      if (data.status === 'completed' && existingProgress.status !== 'completed') {
        await prisma.learningModule.update({
          where: { id: data.moduleId },
          data: {
            completionCount: { $increment: 1 },
            updatedAt: new Date()
          }
        });
      }

      logger.info(`Learning progress updated: ${data.moduleId} for user: ${userId}`);

      return updatedProgress;

    } else {
      // Create new progress record
      const newProgress = await prisma.learningProgress.create({
        data: {
          userId,
          moduleId: data.moduleId,
          status: data.status || 'in_progress',
          completion: data.completion || 0.0,
          timeSpent: data.timeSpent || 0,
          notes: data.notes,
          lastAccessed: new Date(),
          completedAt: data.status === 'completed' ? new Date() : undefined
        }
      });

      // Update module completion count if completed immediately
      if (data.status === 'completed') {
        await prisma.learningModule.update({
          where: { id: data.moduleId },
          data: {
            completionCount: { $increment: 1 },
            updatedAt: new Date()
          }
        });
      }

      logger.info(`New learning progress created: ${data.moduleId} for user: ${userId}`);

      return newProgress;
    }
  }

  // Get user's learning progress
  static async getUserProgress(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [progress, total] = await Promise.all([
      prisma.learningProgress.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { lastAccessed: 'desc' },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              level: true,
              category: true,
              estimatedTime: true,
              tags: true
            }
          }
        }
      }),
      prisma.learningProgress.count({ where: { userId } })
    ]);

    return {
      progress,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Get next recommended module for user
  static async getNextModule(userId: string) {
    const learningPath = await this.getLearningPath(userId);
    const recommendedModules = learningPath.recommendedModules;

    if (recommendedModules.length === 0) {
      // No recommended modules at current level, try next level
      const nextLevelModules = await this.getModules(
        { level: learningPath.currentLevel + 1 },
        userId,
        1,
        1
      );

      return nextLevelModules.modules[0] || null;
    }

    // Return the first unlocked, uncompleted module
    return recommendedModules.find(m => !m.isLocked && (!m.userProgress || m.userProgress.status !== 'completed')) || null;
  }

  // Calculate estimated time to next level
  private static calculateTimeToNextLevel(currentLevel: number, currentExperience: number): number {
    // Simple formula: 1000 XP per level, increasing by 20% each level
    const xpPerLevel = 1000 * Math.pow(1.2, currentLevel - 1);
    const xpNeeded = Math.ceil(xpPerLevel - currentExperience);

    return Math.max(0, xpNeeded);
  }

  // Get learning statistics
  static async getLearningStats(userId: string) {
    const stats = await prisma.learningProgress.aggregate({
      where: { userId },
      _count: {
        id: true
      },
      _avg: {
        completion: true,
        timeSpent: true
      },
      _sum: {
        timeSpent: true
      }
    });

    const completedStats = await prisma.learningProgress.aggregate({
      where: { userId, status: 'completed' },
      _count: {
        id: true
      },
      _avg: {
        timeSpent: true
      }
    });

    const levelStats = await prisma.learningProgress.groupBy({
      by: ['module'],
      where: { userId },
      _count: true,
      _avg: {
        completion: true
      }
    });

    // Get recent learning activity
    const recentActivity = await prisma.learningProgress.findMany({
      where: {
        userId,
        lastAccessed: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      select: {
        moduleId: true,
        status: true,
        completion: true,
        lastAccessed: true,
        module: {
          select: {
            title: true,
            level: true,
            category: true
          }
        }
      },
      orderBy: { lastAccessed: 'desc' },
      take: 10
    });

    return {
      totalModules: stats._count.id || 0,
      completedModules: completedStats._count.id || 0,
      averageCompletion: stats._avg.completion || 0,
      totalTimeSpent: stats._sum.timeSpent || 0, // in minutes
      averageTimePerModule: completedStats._avg.timeSpent || 0,
      completionRate: stats._count.id > 0 ? (completedStats._count.id / stats._count.id) * 100 : 0,
      levelPerformance: levelStats,
      recentActivity
    };
  }
}