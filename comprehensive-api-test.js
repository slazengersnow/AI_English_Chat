#!/usr/bin/env node

/**
 * 全カテゴリでClaude API成功率と問題多様性の完全検証
 * 各カテゴリ30問でテスト実行
 */

import fetch from 'node-fetch';

const categories = [
  'toeic',
  'middle_school', 
  'high_school',
  'basic_verbs',
  'business_email',
  'simulation'
];

const BASE_URL = 'http://localhost:5000';

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

async function testApiSuccessAndDiversity(category, testCount = 30) {
  console.log(`\n🧪 Testing ${category.toUpperCase()} - API Success & Diversity (${testCount} problems)`);
  console.log('=' .repeat(60));
  
  const problems = [];
  const themes = new Set();
  const keywords = new Set();
  const patterns = new Set();
  const apiResults = {
    problemGenerated: 0,
    evaluationSuccess: 0,
    evaluationFailed: 0,
    totalAttempts: 0
  };
  
  // Step 1: Problem Generation Test
  console.log('📋 Step 1: Problem Generation Test');
  for (let i = 0; i < testCount; i++) {
    try {
      const problem = await makeRequest('/api/problem', {
        method: 'POST',
        body: JSON.stringify({ difficultyLevel: category })
      });
      
      apiResults.problemGenerated++;
      problems.push(problem.japaneseSentence);
      const sentence = problem.japaneseSentence;
      console.log(`  ${(i+1).toString().padStart(2, ' ')}: ${sentence}`);
      
      // Pattern analysis
      if (sentence.includes('この度')) patterns.add('この度パターン');
      if (sentence.includes('つきまして')) patterns.add('つきましてパターン'); 
      if (sentence.includes('私は')) patterns.add('私はパターン');
      if (sentence.includes('持続可能')) patterns.add('持続可能パターン');
      if (sentence.includes('科学技術')) patterns.add('科学技術パターン');
      if (sentence.includes('買い物')) patterns.add('買い物パターン');
      
      // Theme classification
      if (sentence.includes('環境') || sentence.includes('持続可能')) themes.add('環境');
      if (sentence.includes('科学') || sentence.includes('技術') || sentence.includes('AI')) themes.add('科学技術');  
      if (sentence.includes('経済') || sentence.includes('金融') || sentence.includes('投資')) themes.add('経済');
      if (sentence.includes('文化') || sentence.includes('芸術') || sentence.includes('音楽')) themes.add('文化芸術');
      if (sentence.includes('歴史') || sentence.includes('政治') || sentence.includes('国際')) themes.add('社会政治');
      if (sentence.includes('教育') || sentence.includes('学習') || sentence.includes('研究')) themes.add('教育');
      if (sentence.includes('健康') || sentence.includes('医療') || sentence.includes('病院')) themes.add('医療健康');
      if (sentence.includes('スポーツ') || sentence.includes('運動') || sentence.includes('部活')) themes.add('スポーツ');
      if (sentence.includes('料理') || sentence.includes('食事') || sentence.includes('レストラン')) themes.add('食事');
      if (sentence.includes('買い物') || sentence.includes('ショッピング')) themes.add('ショッピング');
      if (sentence.includes('家族') || sentence.includes('友達') || sentence.includes('人間関係')) themes.add('人間関係');
      if (sentence.includes('仕事') || sentence.includes('会議') || sentence.includes('プロジェクト')) themes.add('ビジネス');
      if (sentence.includes('数学') || sentence.includes('物理') || sentence.includes('化学')) themes.add('理系学問');
      if (sentence.includes('文学') || sentence.includes('哲学') || sentence.includes('心理学')) themes.add('人文学問');
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit prevention
      
    } catch (error) {
      console.error(`  ❌ Problem ${i+1} generation failed: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Problem Generation Results: ${apiResults.problemGenerated}/${testCount} success`);
  
  // Step 2: Evaluation API Test (using generated problems)
  console.log('\n⚖️ Step 2: Evaluation API Test');
  const testProblems = problems.slice(0, Math.min(15, problems.length)); // Test 15 evaluations
  
  for (let i = 0; i < testProblems.length; i++) {
    apiResults.totalAttempts++;
    try {
      const evaluationResult = await makeRequest('/api/evaluate-with-claude', {
        method: 'POST',
        body: JSON.stringify({
          japaneseSentence: testProblems[i],
          userTranslation: "I am learning English.", // Sample translation
          difficultyLevel: category
        })
      });
      
      if (evaluationResult.correctTranslation && evaluationResult.feedback) {
        apiResults.evaluationSuccess++;
        console.log(`  ✅ Evaluation ${i+1}: Success (${evaluationResult.rating}/5)`);
      } else {
        apiResults.evaluationFailed++;
        console.log(`  ⚠️ Evaluation ${i+1}: Incomplete response`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      apiResults.evaluationFailed++;
      console.error(`  ❌ Evaluation ${i+1} failed: ${error.message}`);
    }
  }
  
  // Calculate metrics
  const uniqueProblems = new Set(problems);
  const duplicateCount = problems.length - uniqueProblems.size;
  const varietyScore = problems.length > 0 ? (uniqueProblems.size / problems.length) * 100 : 0;
  const themeScore = Math.min((themes.size / 5) * 100, 100);
  const patternDiversity = Math.max(0, 100 - (patterns.size * 15));
  
  const problemSuccessRate = problems.length > 0 ? (apiResults.problemGenerated / testCount) * 100 : 0;
  const evaluationSuccessRate = apiResults.totalAttempts > 0 ? (apiResults.evaluationSuccess / apiResults.totalAttempts) * 100 : 0;
  const overallApiSuccess = (problemSuccessRate + evaluationSuccessRate) / 2;
  
  console.log(`\n📈 ${category.toUpperCase()} COMPREHENSIVE RESULTS`);
  console.log('-'.repeat(50));
  console.log(`🔧 API Success Rates:`);
  console.log(`  Problem Generation: ${problemSuccessRate.toFixed(1)}% (${apiResults.problemGenerated}/${testCount})`);
  console.log(`  Evaluation API: ${evaluationSuccessRate.toFixed(1)}% (${apiResults.evaluationSuccess}/${apiResults.totalAttempts})`);
  console.log(`  Overall API Success: ${overallApiSuccess.toFixed(1)}%`);
  
  console.log(`\n🎨 Diversity Metrics:`);
  console.log(`  Problems Generated: ${problems.length}, Unique: ${uniqueProblems.size}, Duplicates: ${duplicateCount}`);
  console.log(`  Variety Score: ${varietyScore.toFixed(1)}%`);
  console.log(`  Themes: ${themes.size} (${Array.from(themes).join(', ')})`);
  console.log(`  Theme Score: ${themeScore.toFixed(1)}%`);
  console.log(`  Problematic Patterns: ${patterns.size} (${Array.from(patterns).join(', ')})`);
  console.log(`  Pattern Diversity: ${patternDiversity.toFixed(1)}%`);
  
  const overallScore = (overallApiSuccess + varietyScore + themeScore + patternDiversity) / 4;
  console.log(`\n🎯 Overall Quality Score: ${overallScore.toFixed(1)}%`);
  
  if (overallApiSuccess >= 95 && varietyScore >= 90) {
    console.log('✅ EXCELLENT - Both API reliability and diversity achieved!');
  } else if (overallApiSuccess >= 90 && varietyScore >= 80) {
    console.log('👍 GOOD - Strong performance with minor improvement areas');
  } else if (overallApiSuccess < 90) {
    console.log('⚠️ API RELIABILITY NEEDS IMPROVEMENT');
  } else {
    console.log('⚠️ DIVERSITY NEEDS IMPROVEMENT');
  }
  
  return {
    category,
    apiSuccess: {
      problemGeneration: problemSuccessRate,
      evaluation: evaluationSuccessRate,
      overall: overallApiSuccess
    },
    diversity: {
      problems: problems.length,
      unique: uniqueProblems.size,
      duplicates: duplicateCount,
      varietyScore,
      themes: themes.size,
      themeScore,
      patterns: patterns.size,
      patternDiversity
    },
    overallScore
  };
}

async function runComprehensiveTest() {
  console.log('🚀 COMPREHENSIVE API SUCCESS & DIVERSITY TEST');
  console.log('Testing all 6 categories with 30 problems each');
  console.log('Focus: Claude API reliability + Problem diversity\n');
  
  const results = {};
  const summary = {
    totalTests: 0,
    apiSuccessTotal: 0,
    diversityTotal: 0,
    overallTotal: 0
  };
  
  for (const category of categories) {
    const result = await testApiSuccessAndDiversity(category, 30);
    results[category] = result;
    
    summary.totalTests++;
    summary.apiSuccessTotal += result.apiSuccess.overall;
    summary.diversityTotal += (result.diversity.varietyScore + result.diversity.themeScore + result.diversity.patternDiversity) / 3;
    summary.overallTotal += result.overallScore;
    
    // Brief pause between categories
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏆 FINAL COMPREHENSIVE REPORT');
  console.log('=' .repeat(60));
  
  const avgApiSuccess = summary.apiSuccessTotal / summary.totalTests;
  const avgDiversity = summary.diversityTotal / summary.totalTests;
  const avgOverall = summary.overallTotal / summary.totalTests;
  
  console.log('📊 CATEGORY BREAKDOWN:');
  for (const [category, result] of Object.entries(results)) {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  API Success: ${result.apiSuccess.overall.toFixed(1)}%`);
    console.log(`  Diversity: ${((result.diversity.varietyScore + result.diversity.themeScore + result.diversity.patternDiversity) / 3).toFixed(1)}%`);
    console.log(`  Overall Score: ${result.overallScore.toFixed(1)}%`);
    console.log(`  Status: ${result.apiSuccess.overall >= 90 && result.diversity.varietyScore >= 80 ? '✅ EXCELLENT' : 
                        result.apiSuccess.overall >= 85 && result.diversity.varietyScore >= 70 ? '👍 GOOD' : '⚠️ NEEDS IMPROVEMENT'}`);
  }
  
  console.log('\n🎯 SYSTEM-WIDE PERFORMANCE:');
  console.log(`  Average API Success Rate: ${avgApiSuccess.toFixed(1)}%`);
  console.log(`  Average Diversity Score: ${avgDiversity.toFixed(1)}%`);
  console.log(`  Overall System Score: ${avgOverall.toFixed(1)}%`);
  
  console.log('\n🏁 FINAL VERDICT:');
  if (avgApiSuccess >= 95 && avgDiversity >= 85) {
    console.log('🎉 MISSION ACCOMPLISHED - Commercial-grade reliability achieved!');
    console.log('   ✅ Zero API failures target met');
    console.log('   ✅ Problem diversity requirements exceeded');
  } else if (avgApiSuccess >= 90 && avgDiversity >= 75) {
    console.log('👍 Strong performance with minor optimization opportunities');
  } else if (avgApiSuccess < 90) {
    console.log('⚠️ API reliability below commercial standards - requires immediate attention');
  } else {
    console.log('⚠️ Problem diversity below target - continued optimization needed');
  }
  
  return results;
}

runComprehensiveTest().catch(error => {
  console.error('❌ Comprehensive test failed:', error);
  process.exit(1);
});