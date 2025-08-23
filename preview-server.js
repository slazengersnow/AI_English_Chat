const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from dist/client
app.use(express.static(path.join(__dirname, 'dist/client')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(), 
    port: PORT,
    server: 'preview'
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/client', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 Preview server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 External preview: https://ce5ab24c-fe4b-418b-a02c-8bd8a6ed6e1d-00-1cp40i68ggx3z.kirk.replit.dev:${PORT}/`);
});