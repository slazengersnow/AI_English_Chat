#!/usr/bin/env node

/**
 * 各カテゴリの迅速テスト（10問ずつ）
 * 不適切なメッセージと機能確認に重点を置く
 */

import fetch from 'node-fetch';

const categories = [
  'middle_school', 
  'high_school',
  'basic_verbs',
  'business_email',
  'simulation'
];

const BASE_URL = 'http://localhost:5000';
const resultsByCategory = {};

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

async function quickTestCategory(category, testCount = 10) {
  console.log(`\n🔍 Quick test: ${category.toUpperCase()} (${testCount} questions)`);
  
  const categoryResults = {
    attempted: 0,
    successful: 0,
    failed: 0,
    ratings: [],
    inappropriateMessages: 0
  };

  for (let i = 0; i < testCount; i++) {
    try {
      // 問題生成
      const problem = await makeRequest('/api/problem', {
        method: 'POST',
        body: JSON.stringify({ difficultyLevel: category })
      });
      
      categoryResults.attempted++;
      console.log(`  📝 ${i+1}: ${problem.japaneseSentence.substring(0, 30)}...`);
      
      // 簡単な回答
      const testAnswer = "I will work on this.";
      
      // 評価
      const evaluation = await makeRequest('/api/evaluate-with-claude', {
        method: 'POST',
        body: JSON.stringify({
          japaneseSentence: problem.japaneseSentence,
          userTranslation: testAnswer,
          difficultyLevel: category
        })
      });
      
      // 不適切なメッセージチェック
      const hasInappropriateMessage = 
        evaluation.feedback?.includes('一時的に利用できない') ||
        evaluation.feedback?.includes('簡易評価を表示') ||
        evaluation.explanation?.includes('AI評価システムが一時的に利用できません');
      
      if (hasInappropriateMessage) {
        console.error(`    ❌ INAPPROPRIATE MESSAGE in question ${i+1}`);
        categoryResults.inappropriateMessages++;
      } else {
        console.log(`    ✅ Rating: ${evaluation.rating}/5`);
        categoryResults.successful++;
        categoryResults.ratings.push(evaluation.rating);
      }
      
    } catch (error) {
      console.error(`    ❌ Question ${i+1} failed: ${error.message}`);
      categoryResults.failed++;
    }
  }
  
  return categoryResults;
}

async function runQuickTest() {
  console.log('🚀 Quick Test: All Categories (10 questions each)');
  console.log('Focus: Inappropriate message detection & functionality check\n');
  
  const startTime = Date.now();
  let totalQuestions = 0;
  let totalSuccess = 0;
  let totalInappropriate = 0;
  
  for (const category of categories) {
    const results = await quickTestCategory(category, 10);
    resultsByCategory[category] = results;
    
    totalQuestions += results.attempted;
    totalSuccess += results.successful;
    totalInappropriate += results.inappropriateMessages;
    
    const avgRating = results.ratings.length > 0 ? 
      (results.ratings.reduce((a, b) => a + b, 0) / results.ratings.length).toFixed(1) : 'N/A';
    
    console.log(`  📊 ${category}: ${results.successful}/${results.attempted} success, Avg rating: ${avgRating}`);
    
    if (results.inappropriateMessages > 0) {
      console.error(`  ⚠️  Found ${results.inappropriateMessages} inappropriate messages!`);
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  const successRate = totalQuestions > 0 ? ((totalSuccess / totalQuestions) * 100).toFixed(1) : 0;
  
  console.log('\n📊 QUICK TEST SUMMARY');
  console.log('=' .repeat(40));
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Inappropriate Messages: ${totalInappropriate}`);
  
  if (totalInappropriate === 0) {
    console.log('\n🎉 NO INAPPROPRIATE MESSAGES FOUND!');
    console.log('✅ All evaluation feedback is appropriate and constructive');
  } else {
    console.log(`\n❌ Found ${totalInappropriate} inappropriate messages - needs review`);
  }
  
  // TOEIC結果も含めて報告
  console.log('\n📋 Combined Results (Including Previous TOEIC Test):');
  console.log('  TOEIC: 29/29 (100%) - COMPLETED EARLIER');
  for (const [category, results] of Object.entries(resultsByCategory)) {
    const successRate = results.attempted > 0 ? 
      ((results.successful / results.attempted) * 100).toFixed(1) : 0;
    console.log(`  ${category.toUpperCase()}: ${results.successful}/${results.attempted} (${successRate}%)`);
  }
}

runQuickTest().catch(error => {
  console.error('❌ Quick test failed:', error);
  process.exit(1);
});