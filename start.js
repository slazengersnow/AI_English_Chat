#!/usr/bin/env node
// Wrapper script to use tsx instead of ts-node
const { spawn } = require('child_process');

const child = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code);
});