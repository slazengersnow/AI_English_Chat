#!/usr/bin/env node

// 🚀 Single Port Development Server
// 5000ポートのみでViteミドルウェア + Express統合運用

import { spawn } from 'child_process';

console.log('🚀 Starting single-port development server (5000 only)...');
console.log('🔥 Vite middleware will be integrated with Express');
console.log('⚠️  No separate Vite server - preventing 3001 port access');

// NODE_ENVを明示的に設定してViteミドルウェア有効化
process.env.NODE_ENV = 'development';
process.env.VITE_DEV_MODE = 'true';

// tsx watch server/index.ts のみを実行
const serverProcess = spawn('npx', ['tsx', 'watch', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('close', (code) => {
  console.log(`\n🔄 Server process exited with code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});