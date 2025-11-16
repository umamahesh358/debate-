import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { connectDatabase } from '@/config/database';
import { initializePrisma } from '@/config/prisma';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';
import { validationMiddleware } from '@/middleware/validation';
import { socketHandlers } from '@/websocket/socketHandlers';

// Import routes
import authRoutes from '@/routes/auth';
import debateRoutes from '@/routes/debates';
import learningRoutes from '@/routes/learning';
import gamificationRoutes from '@/routes/gamification';
import uploadRoutes from '@/routes/uploads';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', authMiddleware, debateRoutes);
app.use('/api/learning', authMiddleware, learningRoutes);
app.use('/api/gamification', authMiddleware, gamificationRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Initialize socket handlers
  socketHandlers(io, socket);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed.');

    // Close database connections
    // This will be handled by the database config module

    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database connections
    await connectDatabase();
    await initializePrisma();

    // Start listening
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Socket.IO server ready for connections`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export { app, io };