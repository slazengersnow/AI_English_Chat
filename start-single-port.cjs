#!/usr/bin/env node

// 🚀 CommonJS Single Port Development Server
// ESM/npx問題を回避してtsx確実起動

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CommonJS single-port development server (5000 only)...');
console.log('🔥 Vite middleware will be integrated with Express');
console.log('⚠️  No separate Vite server - preventing 3001 port access');

// NODE_ENVを明示的に設定してViteミドルウェア有効化
process.env.NODE_ENV = 'development';
process.env.VITE_DEV_MODE = 'true';
process.env.PORT = '5000';

// tsx register を確実に読み込み
let tsxRegister;
try {
  tsxRegister = require.resolve('tsx/dist/register.cjs');
} catch {
  try {
    tsxRegister = require.resolve('tsx/register');
  } catch {
    console.error('❌ tsx not found, trying direct node execution...');
    tsxRegister = null;
  }
}

// server/index.ts を確実実行
const args = tsxRegister ? ['-r', tsxRegister, 'server/index.ts'] : ['server/index.js'];
const serverProcess = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: process.cwd()
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