// Simple Express server for Replit port 5000
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static('dist/client'));

console.log('🚀 Starting simple server on port', PORT);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

// API endpoints
app.post('/api/problem', (req, res) => {
  console.log('🔥 Problem API called');
  res.json({
    japaneseSentence: "チームメンバーと連携を取ってください。",
    hints: ["問題1"],
    dailyLimitReached: false,
    currentCount: 1,
    dailyLimit: 100
  });
});

app.post('/api/evaluate', (req, res) => {
  console.log('🔥 Evaluate API called');
  res.json({
    rating: 4,
    modelAnswer: "Please coordinate with your team members.",
    feedback: "良い回答です。",
    similarPhrases: ["Please work with your team."]
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'client', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <html>
        <head><title>AI English Chat</title></head>
        <body>
          <h1>AI English Chat</h1>
          <p>Server running on port 5000</p>
          <button onclick="testAPI()">Test API</button>
          <div id="result"></div>
          <script>
            async function testAPI() {
              try {
                const response = await fetch('/api/problem', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({difficultyLevel: 'toeic'})
                });
                const data = await response.json();
                document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
              } catch (e) {
                document.getElementById('result').innerHTML = 'Error: ' + e.message;
              }
            }
          </script>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access via Replit URL`);
});