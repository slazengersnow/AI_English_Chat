#!/bin/bash
set -e

echo "Testing build process for Render compatibility..."

# Test vite availability
echo "Testing vite availability..."
npx vite --version

# Test esbuild availability
echo "Testing esbuild availability..."
npx esbuild --version

# Test full build process
echo "Testing full build process..."
npx vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build test completed successfully!"