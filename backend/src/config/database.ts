import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/debate_platform';

const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10, // Maximum number of sockets in the connection pool
  serverSelectionTimeoutMS: 5000, // How long to try selecting a new connection before giving up
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timing out
  maxPoolSize: 10, // Maximum number of sockets in the connection pool
  bufferCommands: false, // Disable mongoose buffering
  retryWrites: true,
  w: 'majority'
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(MONGODB_URI, mongooseOptions);

    logger.info(`MongoDB connected: ${connection.connection.host}`);
    logger.info(`Database: ${connection.connection.name}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const state = mongoose.connection.readyState;
    return state === 1; // 1 means connected
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};