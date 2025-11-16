"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.checkPrismaHealth = exports.disconnectPrisma = exports.initializePrisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const prisma = globalThis.__prisma || new client_1.PrismaClient({
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
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma;
}
// Event listeners for logging
prisma.$on('query', (e) => {
    logger_1.logger.debug('Query: ' + e.query);
    logger_1.logger.debug('Params: ' + e.params);
    logger_1.logger.debug('Duration: ' + e.duration + 'ms');
});
prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma Error:', e);
});
prisma.$on('info', (e) => {
    logger_1.logger.info('Prisma Info:', e);
});
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Prisma Warning:', e);
});
const initializePrisma = async () => {
    try {
        // Test the connection
        await prisma.$connect();
        logger_1.logger.info('Prisma client initialized successfully');
        // Run any necessary migrations or setup
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.info('Database connected and ready for development');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Prisma client:', error);
        throw error;
    }
};
exports.initializePrisma = initializePrisma;
const disconnectPrisma = async () => {
    try {
        await prisma.$disconnect();
        logger_1.logger.info('Prisma client disconnected');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting Prisma client:', error);
    }
};
exports.disconnectPrisma = disconnectPrisma;
// Health check function
const checkPrismaHealth = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.logger.error('Prisma health check failed:', error);
        return false;
    }
};
exports.checkPrismaHealth = checkPrismaHealth;
exports.default = prisma;
//# sourceMappingURL=prisma.js.map