#!/usr/bin/env node
// 統合開発サーバー起動スクリプト
// フロントエンド（Vite）とバックエンド（Express）を統合して起動

import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting integrated frontend + backend server...');

// tsx server/index.ts を実行（Express + Vite統合）
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

serverProcess.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`🏁 Server exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down integrated server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating integrated server...');
  serverProcess.kill('SIGTERM');
});