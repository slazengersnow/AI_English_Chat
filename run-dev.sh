#!/bin/bash

# Development server startup script
# This script uses tsx instead of ts-node to properly handle TypeScript with ES modules

echo "🚀 Starting development server with tsx..."
echo "📍 Working directory: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "⚙️  tsx version: $(npx tsx --version)"

# Kill any existing processes on port 8080
echo "🧹 Cleaning up existing processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start the server with tsx
echo "▶️  Starting server at http://0.0.0.0:8080"
exec npx tsx server/index.ts