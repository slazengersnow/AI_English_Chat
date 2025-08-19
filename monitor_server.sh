#!/bin/bash

LOG_FILE="server.log"
HEALTH_URL="http://localhost:5000/health"
EXTERNAL_URL="https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev/"

echo "=== Server Monitor Started at $(date) ==="

while true; do
    echo "[$(date)] Checking server status..."
    
    # Check if server process is running
    if pgrep -f "tsx server/index.ts" > /dev/null; then
        echo "  ✓ Server process is running"
        
        # Check health endpoint
        if curl -s --max-time 5 $HEALTH_URL > /dev/null; then
            echo "  ✓ Health check passed"
        else
            echo "  ✗ Health check failed"
        fi
    else
        echo "  ✗ Server process not found"
        echo "  → Attempting to restart start_server.sh..."
        pkill -f start_server.sh 2>/dev/null
        nohup ./start_server.sh > server.log 2>&1 &
    fi
    
    echo "  → Server log (last 5 lines):"
    tail -5 $LOG_FILE 2>/dev/null | sed 's/^/    /'
    
    echo "  → External URL: $EXTERNAL_URL"
    echo ""
    
    sleep 30
done