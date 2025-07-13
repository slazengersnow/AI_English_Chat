#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies (including devDependencies for build tools)
echo "Installing dependencies..."
npm ci

# Build the application using npx for guaranteed vite access
echo "Building application..."
npx vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"