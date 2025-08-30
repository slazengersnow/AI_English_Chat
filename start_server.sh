#!/bin/bash
cd /home/runner/workspace
export PORT=5000
export HOST=0.0.0.0
export SERVE_CLIENT=true
exec tsx server/index.ts
