#!/usr/bin/env node

/**
 * API接続デバッグスクリプト
 */

const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`🔍 Making request to ${path}`);
    console.log(`📤 Data:`, data);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`📨 Status: ${res.statusCode}`);
        console.log(`📨 Body: ${body.substring(0, 500)}...`);
        
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function debugAPI() {
  console.log('🔍 Debugging API Connection...\n');

  try {
    // Test 1: Simple problem generation
    console.log('=== Test 1: Problem Generation ===');
    const problemResult = await makeRequest('/api/problem', {
      difficultyLevel: 'toeic',
      sessionId: 'debug_test_123'
    });
    console.log('✅ Problem generation successful');
    console.log('📄 Result:', problemResult);

    // Test 2: Evaluation
    console.log('\n=== Test 2: Evaluation ===');
    const evalResult = await makeRequest('/api/evaluate-with-claude', {
      userAnswer: "I study English every day.",
      japaneseSentence: "私は毎日英語を勉強します。",
      modelAnswer: "Please translate this sentence.",
      difficulty: "中学英語"
    });
    console.log('✅ Evaluation successful');
    console.log('📄 Result:', evalResult);

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    
    // Additional debugging
    console.log('\n=== Additional Debug Info ===');
    console.log('Process ENV PORT:', process.env.PORT);
    console.log('Current working directory:', process.cwd());
    
    // Check if server is running
    const { exec } = require('child_process');
    exec('ps aux | grep "tsx\\|node.*server" | grep -v grep', (error, stdout, stderr) => {
      if (stdout) {
        console.log('🔍 Running processes:');
        console.log(stdout);
      } else {
        console.log('❌ No server processes found');
      }
    });
  }
}

debugAPI();