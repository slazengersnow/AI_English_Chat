#!/bin/bash
echo "Starting persistent server at $(date)"
cd /home/runner/workspace

while true; do
  echo "$(date): Starting server..."
  tsx server/index.ts &
  SERVER_PID=$!
  
  # Wait for server to crash or be terminated
  wait $SERVER_PID
  
  echo "$(date): Server stopped with exit code $?. Restarting in 3 seconds..."
  sleep 3
done