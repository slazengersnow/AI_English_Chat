#!/bin/bash
cd /home/runner/workspace
export PORT=5000

while true; do
  echo "$(date): サーバー起動中... (PORT=$PORT)"
  tsx server/index.ts
  EXIT_CODE=$?
  echo "$(date): サーバー停止 (exit code: $EXIT_CODE)、5秒後に再起動..."
  sleep 5
done