import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Joi from 'joi';
import { AuthRequest } from '@/middleware/auth';
import { validate, uploadSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { prisma } from '@/config/prisma';
import { logger } from '@/utils/logger';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    const uploadPath = path.join(uploadDir, subDir);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Check file type
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video and image files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
    files: 5 // Max 5 files per request
  }
});

// Upload video file
router.post('/video',
  upload.single('video'),
  validate({ body: uploadSchemas.videoUpload }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { sessionId } = req.body;

    // Create video upload record
    const videoUpload = await prisma.videoUpload.create({
      data: {
        userId: req.user.id,
        sessionId: sessionId || null,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        format: req.file.mimetype,
        status: 'uploading',
        createdAt: new Date()
      }
    });

    logger.info(`Video uploaded: ${req.file.originalname} for user: ${req.user.id}`);

    // Start video processing (simulate for now)
    processVideoUpload(videoUpload.id);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        upload: videoUpload,
        url: `/uploads/videos/${req.file.filename}`
      }
    });
  })
);

// Get video upload
router.get('/video/:id',
  validate({ params: { id: Joi.string().required() } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    const videoUpload = await prisma.videoUpload.findFirst({
      where: {
        id,
        userId: req.user.id // User can only access their own uploads
      }
    });

    if (!videoUpload) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: videoUpload
    });
  })
);

// Get video file for streaming/download
router.get('/video/:id/stream',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    const videoUpload = await prisma.videoUpload.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!videoUpload) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(videoUpload.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Video file not found'
      });
    }

    // Set appropriate headers for video streaming
    const stat = fs.statSync(videoUpload.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': videoUpload.format
      });

      const videoStream = fs.createReadStream(videoUpload.filePath, { start, end });
      videoStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': videoUpload.format
      });

      fs.createReadStream(videoUpload.filePath).pipe(res);
    }
  })
);

// Delete video upload
router.delete('/video/:id',
  validate({ params: { id: Joi.string().required() } }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    const videoUpload = await prisma.videoUpload.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!videoUpload) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(videoUpload.filePath)) {
      fs.unlinkSync(videoUpload.filePath);
    }

    // Mark as deleted in database
    await prisma.videoUpload.update({
      where: { id },
      data: {
        status: 'deleted',
        updatedAt: new Date()
      }
    });

    logger.info(`Video deleted: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  })
);

// Upload user avatar
router.post('/avatar',
  upload.single('avatar'),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Validate it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Avatar must be an image file'
      });
    }

    // Update user profile with avatar URL
    const avatarUrl = `/uploads/images/${req.file.filename}`;

    await prisma.userProfile.update({
      where: { userId: req.user.id },
      data: {
        avatar: avatarUrl,
        updatedAt: new Date()
      }
    });

    logger.info(`Avatar updated for user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl
      }
    });
  })
);

// Get user's upload history
router.get('/history',
  validate({
    query: {
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20),
      type: Joi.string().valid('video', 'image').optional()
    }
  }),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { page = 1, limit = 20, type } = req.query;

    const where: any = { userId: req.user.id };
    if (type) {
      if (type === 'video') {
        where.format = { $regex: '^video/' };
      } else if (type === 'image') {
        where.format = { $regex: '^image/' };
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [uploads, total] = await Promise.all([
      prisma.videoUpload.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          originalName: true,
          fileName: true,
          fileSize: true,
          format: true,
          duration: true,
          status: true,
          createdAt: true,
          sessionId: true,
          analysisResults: true
        }
      }),
      prisma.videoUpload.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
          hasNext: parseInt(page as string) * parseInt(limit as string) < total,
          hasPrev: parseInt(page as string) > 1
        }
      }
    });
  })
);

// Simulate video processing
async function processVideoUpload(uploadId: string) {
  try {
    // Mark as processing
    await prisma.videoUpload.update({
      where: { id: uploadId },
      data: {
        status: 'processing',
        processingStarted: new Date()
      }
    });

    // Simulate processing delay
    setTimeout(async () => {
      // Mark as analyzing
      await prisma.videoUpload.update({
        where: { id: uploadId },
        data: {
          status: 'analyzing'
        }
      });

      // Simulate analysis duration
      setTimeout(async () => {
        // Mock analysis results
        const analysisResults = {
          duration: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
          resolution: {
            width: 1920,
            height: 1080
          },
          format: 'mp4',
          quality: 'high',
          analysis: {
            eyeContact: Math.random() * 100,
            posture: Math.random() * 100,
            gestures: Math.random() * 100,
            engagement: Math.random() * 100,
            speakingPace: Math.random() * 200 + 100, // 100-300 wpm
            confidence: Math.random() * 100
          }
        };

        // Mark as completed
        await prisma.videoUpload.update({
          where: { id: uploadId },
          data: {
            status: 'completed',
            processingCompleted: new Date(),
            duration: analysisResults.duration,
            resolution: analysisResults.resolution,
            analysisResults
          }
        });

        logger.info(`Video processing completed: ${uploadId}`);

      }, 10000); // 10 seconds of analysis
    }, 5000); // 5 seconds of processing

  } catch (error) {
    logger.error(`Video processing failed for ${uploadId}:`, error);

    // Mark as failed
    await prisma.videoUpload.update({
      where: { id: uploadId },
      data: {
        status: 'failed'
      }
    });
  }
}

export default router;