# Use Node.js 20 LTS (Alpine is OK for smaller image size)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (TypeScript + Vite)
RUN npm run build

# Expose port for Fly.io
EXPOSE 8080

# Health check (Fly.io expects HTTP 200 OK)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the server (e.g. Express app)
CMD ["node", "dist/server/index.js"]
