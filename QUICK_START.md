# Quick Start Guide

## Running the Application

The app uses TypeScript and requires `tsx` to run properly (not `ts-node`).

### Start the Development Server
```bash
npx tsx server/index.ts
```

### What You'll See
- ✅ Server running at http://0.0.0.0:8080
- ⚠️ Warning about missing Stripe keys (normal for development)
- All API endpoints working correctly
- Frontend React app served and functional

### Accessing the App
- **Main App**: http://localhost:8080
- **API Test**: http://localhost:8080/api/chat

### Known Issues
- The current workflow configuration uses `ts-node` which doesn't work
- Use `tsx` directly until the workflow is updated

### Environment Setup
- Node.js 20.x (currently v20.19.3)
- All dependencies installed
- PostgreSQL database available
- Frontend built with React/TypeScript and Vite