#!/usr/bin/env node

// Development server launcher
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting development server...');

// Launch the Express server with tsx
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});