#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies (including devDependencies for build tools)
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"