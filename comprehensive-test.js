#!/usr/bin/env node

/**
 * 全カテゴリ50問総合テスト
 * 各カテゴリで問題を生成→回答→評価をテストし、失敗時は即停止
 */

const categories = [
  'toeic',
  'middle_school', 
  'high_school',
  'basic_verbs',
  'business_email',
  'simulation'
];

const testAnswers = {
  toeic: [
    "We are discussing the new product planning.",
    "I will introduce a quality assurance system.",
    "We are planning expansion into overseas markets."
  ],
  middle_school: [
    "I go to school every day.",
    "I play in the park.",
    "She cooks meals."
  ],
  high_school: [
    "I work hard every day to realize my future dreams.",
    "Our lives have become convenient thanks to technological development."
  ],
  basic_verbs: [
    "I listen to music.",
    "I take pictures.",
    "I go shopping."
  ],
  business_email: [
    "The delivery of goods may be delayed.",
    "I will send the meeting minutes."
  ],
  simulation: [
    "Where is the station?",
    "I would like to send this luggage."
  ]
};

const BASE_URL = 'http://localhost:5000';

let totalQuestions = 0;
let successfulEvaluations = 0;
let failedEvaluations = 0;
const resultsByCategory = {};

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Request failed: ${endpoint}`, error.message);
    throw error;
  }
}

async function testCategory(category, testCount = 50) {
  console.log(`\n🔍 Testing category: ${category.toUpperCase()} (${testCount} questions)`);
  
  const answers = testAnswers[category] || testAnswers.middle_school;
  const categoryResults = {
    attempted: 0,
    successful: 0,
    failed: 0,
    problems: [],
    evaluations: []
  };

  for (let i = 0; i < testCount; i++) {
    try {
      // 問題生成 (POST リクエスト)
      const problem = await makeRequest('/api/problem', {
        method: 'POST',
        body: JSON.stringify({
          difficultyLevel: category
        })
      });
      console.log(`  📝 Problem ${i+1}: ${problem.japaneseSentence}`);
      
      categoryResults.attempted++;
      categoryResults.problems.push(problem.japaneseSentence);
      
      // ランダムな回答選択
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      
      // 評価リクエスト
      const evaluation = await makeRequest('/api/evaluate-with-claude', {
        method: 'POST',
        body: JSON.stringify({
          japaneseSentence: problem.japaneseSentence,
          userTranslation: randomAnswer,
          difficultyLevel: category
        })
      });
      
      // 評価内容チェック
      const hasInappropriateMessage = 
        evaluation.feedback?.includes('一時的に利用できない') ||
        evaluation.feedback?.includes('簡易評価を表示') ||
        evaluation.explanation?.includes('AI評価システムが一時的に利用できません');
      
      if (hasInappropriateMessage) {
        console.error(`❌ INAPPROPRIATE MESSAGE DETECTED in ${category} question ${i+1}:`);
        console.error(`   Feedback: ${evaluation.feedback}`);
        console.error(`   Explanation: ${evaluation.explanation}`);
        
        categoryResults.failed++;
        failedEvaluations++;
        
        // 即停止
        console.error(`\n🛑 TEST STOPPED: Inappropriate message found. Fix required.`);
        return categoryResults;
      }
      
      console.log(`  ✅ Evaluation ${i+1}: Rating ${evaluation.rating}/5`);
      categoryResults.successful++;
      categoryResults.evaluations.push(evaluation);
      successfulEvaluations++;
      
    } catch (error) {
      console.error(`  ❌ Question ${i+1} failed:`, error.message);
      categoryResults.failed++;
      failedEvaluations++;
      
      // 即停止
      console.error(`\n🛑 TEST STOPPED: API error encountered. Fix required.`);
      return categoryResults;
    }
    
    totalQuestions++;
    
    // 進捗表示
    if ((i + 1) % 10 === 0) {
      console.log(`    Progress: ${i + 1}/${testCount} questions completed`);
    }
  }
  
  return categoryResults;
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive 50-Question Test for All Categories');
  console.log('⚠️  Test will STOP IMMEDIATELY if any inappropriate messages are found\n');
  
  const startTime = Date.now();
  
  for (const category of categories) {
    const results = await testCategory(category, 50);
    resultsByCategory[category] = results;
    
    // 失敗があった場合は即停止
    if (results.failed > 0) {
      console.error(`\n🚨 TEST SUITE STOPPED due to failures in ${category}`);
      break;
    }
    
    console.log(`✅ ${category}: ${results.successful}/${results.attempted} successful`);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`Total Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Total Questions Attempted: ${totalQuestions}`);
  console.log(`Successful Evaluations: ${successfulEvaluations}`);
  console.log(`Failed Evaluations: ${failedEvaluations}`);
  console.log(`Overall Success Rate: ${totalQuestions > 0 ? ((successfulEvaluations / totalQuestions) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 Results by Category:');
  for (const [category, results] of Object.entries(resultsByCategory)) {
    const successRate = results.attempted > 0 ? 
      ((results.successful / results.attempted) * 100).toFixed(1) : 0;
    console.log(`  ${category.toUpperCase()}: ${results.successful}/${results.attempted} (${successRate}%)`);
  }
  
  if (failedEvaluations === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 100% Success Rate Achieved!');
  } else {
    console.log('\n❌ Some tests failed. Review errors above.');
    process.exit(1);
  }
}

// Node.js環境でfetchを使用するための設定
import fetch from 'node-fetch';

runComprehensiveTest().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});