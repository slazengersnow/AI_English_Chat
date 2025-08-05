#!/usr/bin/env node

// Force server to run on port 5000 with proper configuration
process.env.HOST = "0.0.0.0";
process.env.PORT = "5000";
process.env.NODE_ENV = "development";

console.log("🚀 Starting Express+Vite server on port 5000...");

// Dynamic import to load the ESM server
import("./server/index.ts")
  .then(() => {
    console.log("✅ Server module loaded successfully");
  })
  .catch((error) => {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  });