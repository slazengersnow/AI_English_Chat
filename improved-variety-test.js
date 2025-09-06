#!/usr/bin/env node

/**
 * 改良後の多様性テスト - 各カテゴリ15問で迅速検証
 */

import fetch from 'node-fetch';

const categories = [
  'high_school',  // 最も問題だったカテゴリから開始
  'toeic',        // TOEICも問題があった
  'business_email', // 改良対象
  'basic_verbs',  // 比較用
  'middle_school' // 比較用
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

async function testImprovedVariety(category, testCount = 15) {
  console.log(`\n🔍 Testing IMPROVED variety: ${category.toUpperCase()} (${testCount} problems)`);
  
  const problems = [];
  const themes = new Set();
  const keywords = new Set();
  const patterns = new Set();
  
  for (let i = 0; i < testCount; i++) {
    try {
      const problem = await makeRequest('/api/problem', {
        method: 'POST',
        body: JSON.stringify({ difficultyLevel: category })
      });
      
      problems.push(problem.japaneseSentence);
      const sentence = problem.japaneseSentence;
      console.log(`  ${(i+1).toString().padStart(2, ' ')}: ${sentence}`);
      
      // パターン分析
      if (sentence.includes('この度')) patterns.add('この度パターン');
      if (sentence.includes('つきまして')) patterns.add('つきましてパターン');
      if (sentence.includes('私は')) patterns.add('私はパターン');
      if (sentence.includes('持続可能')) patterns.add('持続可能パターン');
      if (sentence.includes('科学技術')) patterns.add('科学技術パターン');
      if (sentence.includes('買い物')) patterns.add('買い物パターン');
      
      // テーマ分類（詳細版）
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
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`  ❌ Problem ${i+1} failed: ${error.message}`);
    }
  }
  
  // 重複チェック
  const uniqueProblems = new Set(problems);
  const duplicateCount = problems.length - uniqueProblems.size;
  
  console.log(`\n📊 ${category.toUpperCase()} IMPROVED Results:`);
  console.log(`  Problems: ${problems.length}, Unique: ${uniqueProblems.size}, Duplicates: ${duplicateCount}`);
  console.log(`  Themes: ${themes.size} (${Array.from(themes).join(', ')})`);
  console.log(`  Problematic patterns: ${patterns.size} (${Array.from(patterns).join(', ')})`);
  
  // 改善度評価
  const varietyScore = (uniqueProblems.size / problems.length) * 100;
  const themeScore = Math.min((themes.size / 5) * 100, 100);
  const patternDiversity = Math.max(0, 100 - (patterns.size * 20)); // パターンが少ないほど良い
  
  console.log(`  📈 Scores: Variety ${varietyScore.toFixed(1)}%, Themes ${themeScore.toFixed(1)}%, Pattern Diversity ${patternDiversity.toFixed(1)}%`);
  
  if (varietyScore >= 90 && themes.size >= 4 && patterns.size <= 2) {
    console.log(`  ✅ EXCELLENT improvement!`);
  } else if (varietyScore >= 80 && themes.size >= 3) {
    console.log(`  👍 Good improvement`);
  } else {
    console.log(`  ⚠️  Needs more improvement`);
  }
  
  return {
    total: problems.length,
    unique: uniqueProblems.size,
    duplicates: duplicateCount,
    themes: themes.size,
    patterns: patterns.size,
    varietyScore,
    themeScore,
    patternDiversity
  };
}

async function runImprovedVarietyTest() {
  console.log('🚀 IMPROVED Variety Test - Post Enhancement Verification');
  console.log('Focus: Temperature 0.9, Enhanced prompts, Pattern diversity\n');
  
  const results = {};
  
  for (const category of categories) {
    const result = await testImprovedVariety(category, 15);
    results[category] = result;
  }
  
  console.log('\n📊 IMPROVEMENT SUMMARY');
  console.log('=' .repeat(50));
  
  let totalScore = 0;
  let categoryCount = 0;
  
  for (const [category, result] of Object.entries(results)) {
    const overallScore = (result.varietyScore + result.themeScore + result.patternDiversity) / 3;
    totalScore += overallScore;
    categoryCount++;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Overall Score: ${overallScore.toFixed(1)}%`);
    console.log(`  - Uniqueness: ${result.varietyScore.toFixed(1)}%`);
    console.log(`  - Theme Diversity: ${result.themeScore.toFixed(1)}% (${result.themes} themes)`);
    console.log(`  - Pattern Diversity: ${result.patternDiversity.toFixed(1)}%`);
    
    if (overallScore >= 85) {
      console.log(`  ✅ EXCELLENT - Problem diversity achieved`);
    } else if (overallScore >= 70) {
      console.log(`  👍 GOOD - Significant improvement`);
    } else {
      console.log(`  ⚠️  NEEDS MORE WORK`);
    }
  }
  
  const averageScore = totalScore / categoryCount;
  console.log(`\n🎯 OVERALL IMPROVEMENT SCORE: ${averageScore.toFixed(1)}%`);
  
  if (averageScore >= 85) {
    console.log('🎉 MISSION ACCOMPLISHED - Diversity issues resolved!');
  } else if (averageScore >= 70) {
    console.log('👍 Significant improvement achieved');
  } else {
    console.log('⚠️  Further optimization needed');
  }
}

runImprovedVarietyTest().catch(error => {
  console.error('❌ Improved variety test failed:', error);
  process.exit(1);
});