#!/bin/bash
while true; do
  echo "$(date): サーバー起動中..."
  cd /home/runner/workspace
  tsx server/index.ts
  echo "$(date): サーバー停止、5秒後に再起動..."
  sleep 5
done