#!/usr/bin/env node

// Wrapper script to run the TypeScript server with tsx
const { execSync } = require('child_process');

try {
  console.log('🚀 Starting development server with tsx...');
  execSync('npx tsx server/index.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}