# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies for build
FROM base AS deps
WORKDIR /app

# Copy package files
COPY backend/package*.json backend/
COPY debate-/package*.json debate-/

# Install backend dependencies
RUN cd backend && npm ci --only=production

# Install frontend dependencies
RUN cd debate- && npm ci --only=production

# Build stage
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/debate-/node_modules ./debate-/node_modules

# Copy source code
COPY backend/ ./backend/
COPY debate-/ ./debate-/

# Build backend
RUN cd backend && npm run build

# Build frontend
RUN cd debate- && npm run build

# Production stage
FROM node:18-alpine AS production

# Install production dependencies
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/backend/package*.json ./backend/

# Copy built frontend
COPY --from=builder /app/debate-/.next ./debate-/.next
COPY --from=builder /app/debate-/public ./debate-/public
COPY --from=deps /app/debate-/package*.json ./debate-/

# Create uploads directory
RUN mkdir -p ./uploads/videos ./uploads/images

# Set permissions
RUN chown -R node:node /app
RUN chmod -R 755 /app

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose ports
EXPOSE 3001

# Start the application
CMD ["dumb-init", "--", "node", "backend/dist/index.js"]