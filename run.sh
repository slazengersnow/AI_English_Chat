#!/bin/bash
echo "Starting AI English Chat Application..."
cd /home/runner/workspace

# Build client first
echo "Building client..."
npm run build:client

# Start server
echo "Starting server on port 5000..."
export PORT=5000
tsx server/index.ts