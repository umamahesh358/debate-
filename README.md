# AI-Powered Debate Learning Platform

A comprehensive platform for learning and practicing debate skills with real-time AI feedback, voice coaching, and gamified challenges.

## Features

### 🎓 Learning Path
- **Structured Modules**: Progressive learning from basics to advanced techniques
- **Interactive Lessons**: Hands-on practice with immediate feedback
- **Real-time Assessment**: AI-powered evaluation of arguments and reasoning
- **PEEL Structure Training**: Master the Point-Evidence-Explanation-Link framework

### 🎤 Voice Practice
- **Real-time Speech Analysis**: Live transcription and feedback
- **AI Opponent**: Practice debates against intelligent AI responses
- **Voice Coaching**: Continuous feedback on delivery and content
- **Mobile-Optimized**: Touch-friendly interface for mobile practice

### 🏆 Gamification
- **XP System**: Earn experience points for completing activities
- **Achievements**: Unlock badges for milestones and challenges
- **Leaderboards**: Compete with other learners globally
- **Daily Challenges**: Keep engagement high with fresh content

### 🎯 Practice Modes
- **Topic Generator**: AI-generated debate motions across categories
- **Timed Sessions**: Practice with realistic debate time constraints
- **Note Preparation**: Structured preparation phase before debates
- **Performance Analytics**: Track improvement over time

### 👨‍🏫 Teacher Dashboard
- **Student Progress**: Monitor individual and class performance
- **Assignment Management**: Create and track debate assignments
- **Analytics**: Detailed insights into learning patterns
- **Curriculum Integration**: Align with educational standards

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI GPT-4, Whisper STT
- **Real-time**: WebSocket connections for live feedback
- **Mobile**: React Native for native mobile experience
- **Deployment**: Docker, Kubernetes, Google Cloud Platform

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-org/debate-learning-platform.git
cd debate-learning-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your configuration
\`\`\`

4. Set up the database:
\`\`\`bash
npm run db:migrate
npm run db:seed
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/debate_platform"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Authentication (optional)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── api/               # API routes
│   └── (pages)/           # Page components
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── services/      # Business logic
│   │   ├── websocket/     # WebSocket handlers
│   │   └── database/      # Database models
├── mobile/                # React Native app
├── components/ui/         # Reusable UI components
├── lib/                   # Utility functions
├── public/                # Static assets
└── k8s/                   # Kubernetes manifests
\`\`\`

## Key Components

### Learning Path System
- Progressive skill development
- Adaptive difficulty based on performance
- Comprehensive coverage of debate fundamentals

### Real-time Voice Analysis
- Speech-to-text with OpenAI Whisper
- Continuous feedback during practice
- Argument structure analysis
- Logical fallacy detection

### AI Debate Opponent
- Context-aware responses
- Realistic debate flow
- Adaptive difficulty
- Educational feedback

### Mobile Experience
- PWA capabilities
- Offline practice modes
- Touch-optimized interface
- Native app for iOS/Android

## Deployment

### Docker
\`\`\`bash
docker build -t debate-platform .
docker run -p 3000:3000 debate-platform
\`\`\`

### Kubernetes
\`\`\`bash
kubectl apply -f k8s/
\`\`\`

### Google Cloud Platform
\`\`\`bash
gcloud builds submit --tag gcr.io/PROJECT_ID/debate-platform
gcloud run deploy --image gcr.io/PROJECT_ID/debate-platform
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@debateplatform.com or join our Discord community.

## Roadmap

- [ ] Advanced AI models for more sophisticated feedback
- [ ] Video analysis capabilities
- [ ] Tournament management system
- [ ] Integration with educational platforms
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
\`\`\`

Now let me add the real-time practice interface with proper timer, AI opponent, and voice functionality:
