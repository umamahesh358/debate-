import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

// Singleton pattern for Prisma Client
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ] : [
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Event listeners for logging
prisma.$on('query', (e: any) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

prisma.$on('info', (e: any) => {
  logger.info('Prisma Info:', e);
});

prisma.$on('warn', (e: any) => {
  logger.warn('Prisma Warning:', e);
});

export const initializePrisma = async (): Promise<void> => {
  try {
    // Test the connection
    await prisma.$connect();
    logger.info('Prisma client initialized successfully');

    // Run any necessary migrations or setup
    if (process.env.NODE_ENV === 'development') {
      logger.info('Database connected and ready for development');
    }
  } catch (error) {
    logger.error('Failed to initialize Prisma client:', error);
    throw error;
  }
};

export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
  } catch (error) {
    logger.error('Error disconnecting Prisma client:', error);
  }
};

// Health check function
export const checkPrismaHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Prisma health check failed:', error);
    return false;
  }
};

export { prisma };
export default prisma;