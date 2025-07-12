#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building application..."
npm run build

# Run database migrations if needed
echo "Running database migrations..."
npm run db:push

echo "Build completed successfully!"