# Debate Learning Platform

A production-quality, full-stack debate learning and practice platform built with the MERN stack (MongoDB, Express, React, Node.js) featuring AI-powered analysis, real-time coaching, gamification, and offline support.

## 🚀 Features

### Core Features
- **Debate Practice**: Live debate sessions with AI opponents
- **Video Analysis**: Real-time webcam analysis with presentation feedback (video never goes black during analysis)
- **Voice Interaction**: Speech recognition and text-to-speech
- **Dynamic Topics**: Randomized debate topics with refresh & prefetch
- **AI Analysis**: GPT-4 powered argument analysis and feedback
- **Real-time Coaching**: WebSocket-based live coaching via AI

### Learning System
- **Level-based Learning**: Progressive learning paths from beginner to advanced
- **Interactive Lessons**: Multimedia lessons with exercises
- **Progress Tracking**: Completion tracking with prerequisites
- **Adaptive Recommendations**: Personalized learning paths

### Gamification
- **Points System**: Automatic point awarding for activities
- **Achievements**: Unlockable achievements with different tiers
- **Leaderboards**: Daily, weekly, monthly, and overall leaderboards
- **Streak Tracking**: Consecutive activity streaks with milestones

### Technical Features
- **Offline Mode**: Full offline functionality with sync on reconnection
- **Real-time Updates**: Socket.IO for live updates
- **Optimistic UI**: Instant UI updates with conflict resolution
- **Responsive Design**: Mobile-optimized interface
- **Video Upload**: Secure file upload with processing queue

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand with persistence
- **Real-time**: Socket.IO client
- **Offline**: IndexedDB with sync queue

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose + Prisma ORM
- **Real-time**: Socket.IO server
- **Authentication**: JWT with refresh tokens
- **File Storage**: Multer with Sharp processing
- **AI Integration**: OpenAI GPT-4 API
- **Caching**: Redis for performance
- **Logging**: Winston structured logging

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: MongoDB with replica set support
- **Cache**: Redis with clustering
- **Monitoring**: Health checks and metrics
- **Security**: CORS, Helmet, rate limiting, input validation

## 📁 Project Structure

```
debate-/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/          # Database and service configurations
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   └── websocket/       # Socket.IO handlers
│   ├── prisma/              # Database schema and migrations
│   └── tests/               # Backend test suite
├── app/                       # Next.js frontend application
│   ├── app/                  # App Router pages and API routes
│   ├── components/            # React components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # Frontend services (API, offline, etc.)
│   ├── store/                # Zustand state management
│   └── utils/                # Frontend utilities
├── public/                   # Static assets
├── uploads/                  # User uploaded files
├── Dockerfile                # Multi-stage container build
├── docker-compose.yml         # Development environment
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB 5.0+
- Redis 6.0+ (optional, for caching)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd debate-
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../debate-
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your configuration
   # Required: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
   # See .env.example for all available options
   ```

4. **Set up database**
   ```bash
   # Start MongoDB (or use MongoDB Atlas)
   mongod

   # Start Redis (optional)
   redis-server
   ```

5. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   cd ../debate-
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - Health check: http://localhost:3001/health

### Docker Development

1. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Services available at**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - MongoDB: localhost:27017
   - Redis: localhost:6379

3. **Stop services**:
   ```bash
   docker-compose down
   ```

## 🏗 Production Deployment

### Building for Production

1. **Build Docker images**
   ```bash
   docker build -t debate-platform .
   ```

2. **Environment setup**
   - Create production `.env` file
   - Set `NODE_ENV=production`
   - Configure production database URLs
   - Set secure JWT secrets
   - Configure OpenAI API keys

3. **Database migrations**
   ```bash
   docker run --rm debate-platform npx prisma migrate deploy
   ```

### Deployment Options

#### Option 1: Docker Compose (Recommended)
```bash
# Production docker-compose.yml
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

#### Option 3: Cloud Services
- **AWS**: ECS, RDS, ElastiCache
- **Google Cloud**: GKE, Cloud SQL, Memorystore
- **Azure**: Container Instances, Cosmos DB, Redis Cache

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### Frontend Tests
```bash
cd debate-
npm test                    # Run component tests
npm run test:e2e          # Run end-to-end tests
```

### API Testing
```bash
# Start backend in test mode
cd backend
npm run test:server

# Run API tests
npm run test:api
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user

### Debate Endpoints
- `GET /api/debates/topics` - Get debate topics
- `POST /api/debates/sessions` - Create debate session
- `GET /api/debates/sessions/:id` - Get debate session
- `PUT /api/debates/sessions/:id` - Update debate session
- `POST /api/debates/sessions/:id/feedback` - Generate AI feedback

### Learning Endpoints
- `GET /api/learning/modules` - Get learning modules
- `GET /api/learning/path` - Get learning path
- `POST /api/learning/progress` - Update learning progress
- `POST /api/learning/complete` - Complete module

### Gamification Endpoints
- `GET /api/gamification/profile` - Get user profile
- `GET /api/gamification/leaderboard` - Get leaderboards
- `POST /api/gamification/points` - Award points
- `GET /api/gamification/achievements` - Get achievements

### WebSocket Events
- `debate-message` - Real-time debate messages
- `voice-started` - Voice recording started
- `voice-ended` - Voice recording ended
- `score-updated` - Score updates
- `feedback-generated` - AI feedback generated
- `achievement-unlocked` - Achievement unlocked

## 🔧 Configuration

### Environment Variables

#### Required
- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - JWT access token secret
- `OPENAI_API_KEY` - OpenAI API key

#### Optional
- `REDIS_URL` - Redis connection string (for caching)
- `OPENAI_ORG_ID` - OpenAI organization ID
- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `LOG_LEVEL` - Logging level (info/debug/error)

### Database Configuration

#### MongoDB Collections
- `users` - User accounts and profiles
- `debateTopics` - Debate topics and metadata
- `debateSessions` - Debate session data
- `learningModules` - Educational content
- `learningProgress` - User learning progress
- `achievements` - Gamification achievements
- `userAchievements` - User achievement records
- `gamificationEvents` - Point events and activities

## 🔐 Security

### Authentication
- JWT access tokens (15-minute expiry)
- JWT refresh tokens (7-day expiry)
- Password hashing with bcrypt (12 rounds)
- Rate limiting on authentication endpoints

### API Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- File upload security (type validation, size limits)
- Request rate limiting

### Data Protection
- Environment variable encryption
- Secure file storage with access controls
- Regular security updates
- GDPR compliance considerations

## 📈 Monitoring

### Application Metrics
- Response time tracking
- Error rate monitoring
- User activity analytics
- Database performance metrics
- WebSocket connection monitoring

### Health Checks
- `/health` endpoint with service status
- Database connectivity check
- External service health monitoring
- Automatic health reporting

### Logging
- Structured JSON logging with Winston
- Different log levels (error, warn, info, debug)
- Request/response logging
- Security event logging

## 🚀 Performance

### Optimizations
- Database indexing on frequently queried fields
- Redis caching for expensive operations
- API response compression
- Image optimization and lazy loading
- Code splitting for large applications
- Connection pooling for database

### Metrics
- API response times < 200ms (target)
- WebSocket latency < 50ms (target)
- Video processing < 30 seconds (target)
- Page load times < 3 seconds (target)

## 🔧 Development

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration for code consistency
- Prettier for code formatting
- Pre-commit hooks for quality checks
- Automated testing on PRs

### Debugging
- Source maps for production debugging
- Detailed error logging in development
- Database query logging in development
- Hot reload for frontend development

## 🌍 Browser Support

### Modern Browsers (Recommended)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Core Features Support
- WebSocket connections
- WebRTC for video/audio
- IndexedDB for offline storage
- Service Workers for caching
- Modern JavaScript features

## 📝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Create Pull Request

### Code Style
- Follow existing code patterns
- Use TypeScript interfaces
- Add JSDoc comments for public APIs
- Write meaningful commit messages
- Keep components focused and reusable

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"

# Check database logs
docker logs debate-mongodb
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Kill processes on ports
sudo kill -9 <PID>
```

#### Memory Issues
```bash
# Monitor memory usage
docker stats

# Increase Node.js memory limit
node --max-old-space-size=4096
```

#### Build Issues
```bash
# Clear build cache
rm -rf .next/
rm -rf node_modules/

# Rebuild
npm install
npm run build
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Database query logging
DEBUG=prisma:* npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [Wiki](../../wiki) for documentation
- Review [FAQ](../../docs/FAQ.md) for common questions

---

## 🎯 Getting Started Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables (`.env`)
- [ ] Start MongoDB service
- [ ] Run database migrations (`npx prisma migrate dev`)
- [ ] Start development servers (`npm run dev`)
- [ ] Access application at http://localhost:3000
- [ ] Create user account
- [ ] Complete first debate session
- [ ] Explore learning modules
- [ ] Check gamification features

Welcome to the Debate Learning Platform! 🎉