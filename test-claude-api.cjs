#!/usr/bin/env node

/**
 * Claude API 完全品質検証スクリプト
 * 全6カテゴリ × 20問 × 評価機能テスト
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';
const CATEGORIES = [
  'toeic',
  '中学英語', 
  '高校英語',
  '基本動詞',
  'ビジネスメール',
  'シミュレーション練習'
];

// テスト結果集計
const results = {
  totalTests: 0,
  totalSuccess: 0,
  totalErrors: 0,
  categoryResults: {},
  errors: []
};

// HTTP POSTリクエスト関数
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

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}, Body: ${body.substring(0, 200)}...`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}...`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// 問題生成テスト
async function testProblemGeneration(category, problemNumber) {
  try {
    const sessionId = `test_${category}_${problemNumber}_${Date.now()}`;
    const response = await makeRequest('/api/problem', {
      difficultyLevel: category,
      sessionId: sessionId
    });

    // 必須フィールド検証
    const required = ['japaneseSentence'];
    for (const field of required) {
      if (!response[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 日本語文の品質チェック
    if (response.japaneseSentence.length < 5) {
      throw new Error(`Japanese sentence too short: ${response.japaneseSentence}`);
    }

    return {
      success: true,
      data: response,
      category: category,
      problemNumber: problemNumber
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      category: category,
      problemNumber: problemNumber
    };
  }
}

// 評価機能テスト
async function testEvaluation(category, japaneseSentence, problemNumber) {
  try {
    const response = await makeRequest('/api/evaluate-with-claude', {
      userAnswer: "This is a test answer.",
      japaneseSentence: japaneseSentence,
      modelAnswer: "Please translate this sentence.",
      difficulty: category
    });

    // 必須フィールド検証
    const required = ['correctTranslation', 'feedback', 'rating', 'improvements', 'explanation', 'similarPhrases'];
    for (const field of required) {
      if (response[field] === undefined || response[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 評価データの品質チェック
    if (typeof response.rating !== 'number' || response.rating < 1 || response.rating > 5) {
      throw new Error(`Invalid rating: ${response.rating}`);
    }

    if (!Array.isArray(response.improvements) || !Array.isArray(response.similarPhrases)) {
      throw new Error(`improvements and similarPhrases must be arrays`);
    }

    if (response.feedback.length < 10 || response.explanation.length < 10) {
      throw new Error(`Feedback or explanation too short`);
    }

    if (response.similarPhrases.length < 2) {
      throw new Error(`Not enough similar phrases: ${response.similarPhrases.length}`);
    }

    return {
      success: true,
      data: response,
      category: category,
      problemNumber: problemNumber
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      category: category,
      problemNumber: problemNumber
    };
  }
}

// カテゴリ別完全テスト
async function testCategory(category, problemCount = 20) {
  console.log(`\n🔥 Testing ${category} category (${problemCount} problems)...`);
  
  results.categoryResults[category] = {
    problemGeneration: { success: 0, errors: 0 },
    evaluation: { success: 0, errors: 0 },
    issues: []
  };

  for (let i = 1; i <= problemCount; i++) {
    process.stdout.write(`  Problem ${i}/${problemCount}: `);

    // 問題生成テスト
    const problemResult = await testProblemGeneration(category, i);
    results.totalTests++;
    
    if (problemResult.success) {
      results.totalSuccess++;
      results.categoryResults[category].problemGeneration.success++;
      process.stdout.write('✅ Gen ');

      // 評価機能テスト
      const evalResult = await testEvaluation(category, problemResult.data.japaneseSentence, i);
      results.totalTests++;

      if (evalResult.success) {
        results.totalSuccess++;
        results.categoryResults[category].evaluation.success++;
        console.log('✅ Eval');
      } else {
        results.totalErrors++;
        results.categoryResults[category].evaluation.errors++;
        results.categoryResults[category].issues.push(`Problem ${i} evaluation: ${evalResult.error}`);
        results.errors.push(`${category} Problem ${i} evaluation: ${evalResult.error}`);
        console.log('❌ Eval');
      }
    } else {
      results.totalErrors++;
      results.categoryResults[category].problemGeneration.errors++;
      results.categoryResults[category].issues.push(`Problem ${i} generation: ${problemResult.error}`);
      results.errors.push(`${category} Problem ${i} generation: ${problemResult.error}`);
      console.log('❌ Gen (skipping eval)');
    }

    // 少し待機してAPI負荷を軽減
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// メイン実行
async function runFullTest() {
  console.log('🚀 Claude API Complete Quality Verification');
  console.log('=' .repeat(50));
  console.log(`Testing ${CATEGORIES.length} categories with 20 problems each`);
  console.log(`Total expected tests: ${CATEGORIES.length * 20 * 2} (generation + evaluation)`);

  const startTime = Date.now();

  // 最初にTOEICから開始（Task 2対応）
  await testCategory('toeic', 20);

  // その他のカテゴリもテスト
  for (const category of CATEGORIES.slice(1)) {
    await testCategory(category, 20);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // 最終結果レポート
  console.log('\n' + '=' .repeat(50));
  console.log('📊 FINAL QUALITY VERIFICATION REPORT');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Success: ${results.totalSuccess} (${(results.totalSuccess/results.totalTests*100).toFixed(1)}%)`);
  console.log(`Errors: ${results.totalErrors} (${(results.totalErrors/results.totalTests*100).toFixed(1)}%)`);
  console.log(`Duration: ${duration.toFixed(1)} seconds`);

  // カテゴリ別詳細
  console.log('\n📋 Category Details:');
  for (const [category, data] of Object.entries(results.categoryResults)) {
    const genSuccess = data.problemGeneration.success;
    const genErrors = data.problemGeneration.errors;
    const evalSuccess = data.evaluation.success;
    const evalErrors = data.evaluation.errors;
    
    console.log(`\n${category}:`);
    console.log(`  Problem Generation: ${genSuccess}✅ ${genErrors}❌`);
    console.log(`  Evaluation: ${evalSuccess}✅ ${evalErrors}❌`);
    
    if (data.issues.length > 0) {
      console.log(`  Issues: ${data.issues.length}`);
      data.issues.slice(0, 3).forEach(issue => console.log(`    - ${issue}`));
      if (data.issues.length > 3) {
        console.log(`    ... and ${data.issues.length - 3} more`);
      }
    }
  }

  // エラーサマリー
  if (results.errors.length > 0) {
    console.log('\n🚨 ERROR SUMMARY:');
    results.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
  }

  // 品質判定
  const successRate = (results.totalSuccess / results.totalTests) * 100;
  console.log('\n🎯 DEPLOYMENT READINESS:');
  if (successRate >= 99) {
    console.log('✅ EXCELLENT (99%+) - Ready for deployment');
  } else if (successRate >= 95) {
    console.log('🟡 GOOD (95-99%) - Minor issues, generally ready');
  } else if (successRate >= 90) {
    console.log('🟠 ACCEPTABLE (90-95%) - Some issues need attention');
  } else {
    console.log('❌ NOT READY (<90%) - Significant issues found');
  }

  return results;
}

// 実行開始
if (require.main === module) {
  runFullTest().catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runFullTest, testCategory, testProblemGeneration, testEvaluation };