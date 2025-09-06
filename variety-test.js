#!/usr/bin/env node

/**
 * 問題の多様性テスト - 各カテゴリで20問連続生成して多様性を確認
 */

import fetch from 'node-fetch';

const categories = [
  'basic_verbs',
  'middle_school',
  'high_school', 
  'toeic',
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

async function testVariety(category, testCount = 20) {
  console.log(`\n🔍 Testing variety: ${category.toUpperCase()} (${testCount} problems)`);
  
  const problems = [];
  const themes = new Set();
  const keywords = new Set();
  
  for (let i = 0; i < testCount; i++) {
    try {
      const problem = await makeRequest('/api/problem', {
        method: 'POST',
        body: JSON.stringify({ difficultyLevel: category })
      });
      
      problems.push(problem.japaneseSentence);
      console.log(`  ${(i+1).toString().padStart(2, ' ')}: ${problem.japaneseSentence}`);
      
      // キーワード抽出（簡易版）
      const sentence = problem.japaneseSentence;
      const commonWords = ['を', 'に', 'が', 'は', 'で', 'と', 'の', 'から', 'まで', 'へ', 'より', 'や', 'か', 'し', 'て', 'だ', 'です', 'ます', 'である', 'この度', 'につき', '申し上げ', 'ご', 'お'];
      
      // 5文字以上の意味のある単語を抽出
      const words = sentence.split(/[、。\s]/).filter(word => 
        word.length >= 3 && !commonWords.some(common => word.includes(common))
      );
      words.forEach(word => keywords.add(word));
      
      // テーマ分類（簡易版）
      if (sentence.includes('買い物') || sentence.includes('スーパー')) themes.add('買い物');
      if (sentence.includes('学校') || sentence.includes('勉強')) themes.add('学校');
      if (sentence.includes('仕事') || sentence.includes('会議') || sentence.includes('製品')) themes.add('仕事');
      if (sentence.includes('食べ') || sentence.includes('飲み') || sentence.includes('料理')) themes.add('食事');
      if (sentence.includes('行き') || sentence.includes('来') || sentence.includes('帰')) themes.add('移動');
      if (sentence.includes('読み') || sentence.includes('書き') || sentence.includes('見')) themes.add('学習');
      if (sentence.includes('友達') || sentence.includes('家族') || sentence.includes('人')) themes.add('人間関係');
      if (sentence.includes('時間') || sentence.includes('曜日') || sentence.includes('月')) themes.add('時間');
      if (sentence.includes('天気') || sentence.includes('雨') || sentence.includes('晴れ')) themes.add('天気');
      
    } catch (error) {
      console.error(`  ❌ Problem ${i+1} failed: ${error.message}`);
    }
    
    // 短い間隔で次のリクエスト
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 重複チェック
  const uniqueProblems = new Set(problems);
  const duplicateCount = problems.length - uniqueProblems.size;
  
  console.log(`\n📊 ${category.toUpperCase()} Variety Analysis:`);
  console.log(`  Problems generated: ${problems.length}`);
  console.log(`  Unique problems: ${uniqueProblems.size}`);
  console.log(`  Duplicates: ${duplicateCount}`);
  console.log(`  Themes identified: ${themes.size} (${Array.from(themes).join(', ')})`);
  console.log(`  Unique keywords: ${keywords.size}`);
  
  if (duplicateCount > 0) {
    console.log(`  ⚠️  Found ${duplicateCount} duplicate problems!`);
  }
  
  if (themes.size < 3) {
    console.log(`  ⚠️  Low theme diversity! Only ${themes.size} themes found.`);
  }
  
  return {
    total: problems.length,
    unique: uniqueProblems.size,
    duplicates: duplicateCount,
    themes: themes.size,
    keywords: keywords.size,
    problems: Array.from(uniqueProblems)
  };
}

async function runVarietyTest() {
  console.log('🚀 Problem Variety Test - 20 problems per category');
  console.log('Focus: Theme diversity, keyword variety, duplicate detection\n');
  
  const results = {};
  
  for (const category of categories) {
    const result = await testVariety(category, 20);
    results[category] = result;
  }
  
  console.log('\n📊 OVERALL VARIETY ANALYSIS');
  console.log('=' .repeat(50));
  
  for (const [category, result] of Object.entries(results)) {
    const varietyScore = result.unique / result.total * 100;
    const themeScore = Math.min(result.themes / 5 * 100, 100); // 5テーマで満点
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Uniqueness: ${varietyScore.toFixed(1)}% (${result.unique}/${result.total})`);
    console.log(`  Theme diversity: ${themeScore.toFixed(1)}% (${result.themes} themes)`);
    console.log(`  Keywords: ${result.keywords}`);
    
    if (result.duplicates > 2) {
      console.log(`  ❌ HIGH DUPLICATION: ${result.duplicates} duplicates found`);
    }
    
    if (result.themes < 3) {
      console.log(`  ❌ LOW THEME DIVERSITY: Only ${result.themes} themes`);
    }
    
    if (varietyScore < 85) {
      console.log(`  ❌ LOW VARIETY SCORE: ${varietyScore.toFixed(1)}%`);
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  const lowVarietyCategories = Object.entries(results).filter(([_, result]) => 
    result.unique / result.total < 0.85 || result.themes < 3
  );
  
  if (lowVarietyCategories.length > 0) {
    console.log('❌ Categories needing improvement:');
    lowVarietyCategories.forEach(([category, result]) => {
      console.log(`  - ${category.toUpperCase()}: ${(result.unique/result.total*100).toFixed(1)}% unique, ${result.themes} themes`);
    });
  } else {
    console.log('✅ All categories show good variety!');
  }
}

runVarietyTest().catch(error => {
  console.error('❌ Variety test failed:', error);
  process.exit(1);
});