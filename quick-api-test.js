#!/usr/bin/env node

/**
 * 迅速なAPI成功率と問題多様性テスト
 * 認証なしでテスト可能な簡潔版
 */

import fetch from 'node-fetch';

const categories = ['toeic', 'middle_school', 'high_school', 'basic_verbs', 'business_email', 'simulation'];
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

async function testCategory(category, testCount = 30) {
  console.log(`\n🧪 ${category.toUpperCase()} - Testing ${testCount} problems`);
  console.log('=' .repeat(50));
  
  const problems = [];
  const themes = new Set();
  const patterns = new Set();
  let successCount = 0;
  
  for (let i = 0; i < testCount; i++) {
    try {
      const problem = await makeRequest('/api/problem', {
        method: 'POST',
        body: JSON.stringify({ difficultyLevel: category })
      });
      
      successCount++;
      problems.push(problem.japaneseSentence);
      const sentence = problem.japaneseSentence;
      console.log(`  ${(i+1).toString().padStart(2, ' ')}: ${sentence}`);
      
      // Pattern analysis
      if (sentence.includes('この度')) patterns.add('この度');
      if (sentence.includes('つきまして')) patterns.add('つきまして'); 
      if (sentence.includes('私は')) patterns.add('私は');
      if (sentence.includes('持続可能')) patterns.add('持続可能');
      if (sentence.includes('科学技術')) patterns.add('科学技術');
      if (sentence.includes('買い物')) patterns.add('買い物');
      
      // Theme classification (simplified)
      if (sentence.includes('環境') || sentence.includes('持続可能')) themes.add('環境');
      if (sentence.includes('科学') || sentence.includes('技術')) themes.add('科学技術');
      if (sentence.includes('経済') || sentence.includes('金融')) themes.add('経済');
      if (sentence.includes('文化') || sentence.includes('芸術')) themes.add('文化');
      if (sentence.includes('教育') || sentence.includes('学習')) themes.add('教育');
      if (sentence.includes('医療') || sentence.includes('健康')) themes.add('医療');
      if (sentence.includes('スポーツ') || sentence.includes('運動')) themes.add('スポーツ');
      if (sentence.includes('食事') || sentence.includes('料理')) themes.add('食事');
      if (sentence.includes('買い物') || sentence.includes('ショッピング')) themes.add('ショッピング');
      if (sentence.includes('家族') || sentence.includes('友達')) themes.add('人間関係');
      if (sentence.includes('仕事') || sentence.includes('会議')) themes.add('ビジネス');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`  ❌ Problem ${i+1} failed: ${error.message}`);
    }
  }
  
  // Calculate metrics
  const uniqueProblems = new Set(problems);
  const duplicateCount = problems.length - uniqueProblems.size;
  const successRate = (successCount / testCount) * 100;
  const varietyScore = problems.length > 0 ? (uniqueProblems.size / problems.length) * 100 : 0;
  const themeCount = themes.size;
  const patternCount = patterns.size;
  
  console.log(`\n📊 ${category.toUpperCase()} Results:`);
  console.log(`  Success Rate: ${successRate.toFixed(1)}% (${successCount}/${testCount})`);
  console.log(`  Problems: ${problems.length}, Unique: ${uniqueProblems.size}, Duplicates: ${duplicateCount}`);
  console.log(`  Variety Score: ${varietyScore.toFixed(1)}%`);
  console.log(`  Themes: ${themeCount} (${Array.from(themes).join(', ')})`);
  console.log(`  Common Patterns: ${patternCount} (${Array.from(patterns).join(', ')})`);
  
  const overallScore = (successRate + varietyScore + (themeCount * 10)) / 3;
  console.log(`  Overall Score: ${overallScore.toFixed(1)}%`);
  
  if (successRate >= 95 && varietyScore >= 90 && themeCount >= 4) {
    console.log('  ✅ EXCELLENT - High success rate and diversity!');
  } else if (successRate >= 90 && varietyScore >= 80 && themeCount >= 3) {
    console.log('  👍 GOOD - Strong performance');
  } else {
    console.log('  ⚠️ NEEDS IMPROVEMENT');
  }
  
  return {
    category,
    successRate,
    varietyScore,
    themeCount,
    patternCount,
    overallScore,
    problems: problems.length,
    unique: uniqueProblems.size,
    duplicates: duplicateCount
  };
}

async function runQuickTest() {
  console.log('🚀 QUICK API SUCCESS & DIVERSITY TEST');
  console.log('Testing problem generation across all 6 categories\n');
  
  const results = {};
  let totalSuccess = 0;
  let totalVariety = 0;
  let totalThemes = 0;
  
  for (const category of categories) {
    const result = await testCategory(category, 30);
    results[category] = result;
    
    totalSuccess += result.successRate;
    totalVariety += result.varietyScore;
    totalThemes += result.themeCount;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🏆 FINAL SUMMARY');
  console.log('=' .repeat(60));
  
  const avgSuccess = totalSuccess / categories.length;
  const avgVariety = totalVariety / categories.length;
  const avgThemes = totalThemes / categories.length;
  
  console.log('📊 CATEGORY PERFORMANCE:');
  for (const [category, result] of Object.entries(results)) {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Success: ${result.successRate.toFixed(1)}% | Variety: ${result.varietyScore.toFixed(1)}% | Themes: ${result.themeCount}`);
    console.log(`  Status: ${result.successRate >= 90 && result.varietyScore >= 80 ? '✅ Excellent' : 
                        result.successRate >= 85 || result.varietyScore >= 70 ? '👍 Good' : '⚠️ Needs work'}`);
  }
  
  console.log(`\n🎯 OVERALL SYSTEM PERFORMANCE:`);
  console.log(`  Average Success Rate: ${avgSuccess.toFixed(1)}%`);
  console.log(`  Average Variety Score: ${avgVariety.toFixed(1)}%`);
  console.log(`  Average Theme Count: ${avgThemes.toFixed(1)}`);
  
  console.log('\n🏁 COMMERCIAL READINESS:');
  if (avgSuccess >= 95 && avgVariety >= 85) {
    console.log('🎉 READY FOR PRODUCTION - Excellent API reliability and diversity!');
    console.log('✅ Problem generation: Commercial grade');
    console.log('✅ Content diversity: Exceeds requirements');
  } else if (avgSuccess >= 90 && avgVariety >= 75) {
    console.log('👍 Near production ready - Minor optimizations possible');
  } else if (avgSuccess < 90) {
    console.log('⚠️ API reliability needs attention before production');
  } else {
    console.log('⚠️ Content diversity requires improvement for commercial use');
  }
  
  // Specific recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  const lowPerformingCategories = Object.entries(results)
    .filter(([_, result]) => result.successRate < 90 || result.varietyScore < 80)
    .map(([category, _]) => category);
  
  if (lowPerformingCategories.length > 0) {
    console.log(`  Focus improvement on: ${lowPerformingCategories.join(', ')}`);
  }
  
  const highPatternCategories = Object.entries(results)
    .filter(([_, result]) => result.patternCount >= 3)
    .map(([category, _]) => category);
  
  if (highPatternCategories.length > 0) {
    console.log(`  Reduce pattern repetition in: ${highPatternCategories.join(', ')}`);
  }
  
  return results;
}

runQuickTest().catch(error => {
  console.error('❌ Quick test failed:', error);
  process.exit(1);
});