#!/usr/bin/env node

// Production-ready startup script for the TypeScript server
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Japanese Learning App Server...');
console.log('📍 Working directory:', process.cwd());
console.log('📦 Node version:', process.version);

// Kill any existing processes on port 8080
const { execSync } = require('child_process');
try {
  execSync('lsof -ti:8080 | xargs kill -9 2>/dev/null || true', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors from cleanup
}

// Start server with tsx
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Server process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  server.kill('SIGTERM');
  setTimeout(() => {
    console.log('⚠️  Forcing shutdown...');
    server.kill('SIGKILL');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));