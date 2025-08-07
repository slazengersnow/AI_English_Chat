#!/usr/bin/env node

// Development server that runs both Express API and Vite frontend
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development servers...');

// Start Express API server on port 3001
const apiServer = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { ...process.env, PORT: '3001' }
});

// Start Vite frontend server on port 5000 (with proxy to API)
const frontendServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  apiServer.kill('SIGTERM');
  frontendServer.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  apiServer.kill('SIGTERM');
  frontendServer.kill('SIGTERM');
  process.exit(0);
});

apiServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ API server exited with code ${code}`);
  }
});

frontendServer.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Frontend server exited with code ${code}`);
  }
});