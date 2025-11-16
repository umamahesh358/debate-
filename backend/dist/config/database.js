"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseHealth = exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("@/utils/logger");
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/debate_platform';
const mongooseOptions = {
    maxPoolSize: 10, // Maximum number of sockets in the connection pool
    serverSelectionTimeoutMS: 5000, // How long to try selecting a new connection before giving up
    socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timing out
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    retryWrites: true,
    w: 'majority'
};
const connectDatabase = async () => {
    try {
        const connection = await mongoose_1.default.connect(MONGODB_URI, mongooseOptions);
        logger_1.logger.info(`MongoDB connected: ${connection.connection.host}`);
        logger_1.logger.info(`Database: ${connection.connection.name}`);
        // Handle connection events
        mongoose_1.default.connection.on('connected', () => {
            logger_1.logger.info('MongoDB connection established');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB connection disconnected');
        });
        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing MongoDB connection:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Health check function
const checkDatabaseHealth = async () => {
    try {
        const state = mongoose_1.default.connection.readyState;
        return state === 1; // 1 means connected
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
//# sourceMappingURL=database.js.map