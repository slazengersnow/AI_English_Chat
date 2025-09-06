#!/usr/bin/env node

// 🎯 シンプルな検証テスト: 各カテゴリ5問ずつ（計30問）で迅速検証
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const DIFFICULTY_LEVELS = ['toeic', 'middle-school', 'high-school', 'basic-verbs', 'business-email', 'simulation'];

// テスト用の適切な回答
const TEST_ANSWERS = {
  'toeic': 'I will attend the meeting tomorrow.',
  'middle-school': 'I go to school every day.',
  'high-school': 'Technology has changed our lives.',
  'basic-verbs': 'I eat breakfast every morning.',
  'business-email': 'Thank you for your inquiry.',
  'simulation': 'Excuse me, where is the station?'
};

let successCount = 0;
let totalCount = 0;
let detectedIssues = [];

async function testSingleProblem(difficulty, testNumber) {
  console.log(`  テスト ${testNumber}: ${difficulty} カテゴリ`);
  totalCount++;

  try {
    // Step 1: 問題生成
    const problemResponse = await fetch(`${BASE_URL}/api/problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-' + Math.random()
      },
      body: JSON.stringify({ difficultyLevel: difficulty })
    });

    if (!problemResponse.ok) {
      throw new Error(`問題生成失敗: ${problemResponse.status}`);
    }

    const problemData = await problemResponse.json();
    
    // 問題の基本チェック
    if (!problemData.japaneseSentence) {
      throw new Error('日本語文が存在しない');
    }
    
    console.log(`    問題: "${problemData.japaneseSentence}"`);

    // Step 2: 評価テスト
    const evaluationResponse = await fetch(`${BASE_URL}/api/evaluate-with-claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-' + Math.random()
      },
      body: JSON.stringify({
        japaneseSentence: problemData.japaneseSentence,
        userTranslation: TEST_ANSWERS[difficulty],
        difficultyLevel: difficulty
      })
    });

    if (!evaluationResponse.ok) {
      throw new Error(`評価失敗: ${evaluationResponse.status}`);
    }

    const evaluation = await evaluationResponse.json();
    
    // 評価の品質チェック
    const issues = checkEvaluationQuality(evaluation, problemData.japaneseSentence, TEST_ANSWERS[difficulty]);
    
    if (issues.length === 0) {
      successCount++;
      console.log(`    ✅ 成功`);
      console.log(`    模範回答: "${evaluation.correctTranslation}"`);
      console.log(`    評価: ${evaluation.rating}/5`);
    } else {
      console.log(`    ⚠️  品質問題: ${issues.join(', ')}`);
      detectedIssues.push(...issues.map(issue => `${difficulty}: ${issue}`));
    }

  } catch (error) {
    console.log(`    ❌ エラー: ${error.message}`);
    detectedIssues.push(`${difficulty}: ${error.message}`);
  }

  // レート制限回避
  await new Promise(resolve => setTimeout(resolve, 200));
}

function checkEvaluationQuality(evaluation, japaneseSentence, userAnswer) {
  const issues = [];

  // 必須フィールドチェック
  if (!evaluation.correctTranslation) issues.push('模範回答なし');
  if (!evaluation.feedback) issues.push('フィードバックなし');
  if (!evaluation.rating) issues.push('評価点なし');
  if (!evaluation.improvements) issues.push('改善提案なし');
  if (!evaluation.explanation) issues.push('解説なし');
  if (!evaluation.similarPhrases) issues.push('類似フレーズなし');

  // バイパスプレフィックスチェック
  if (evaluation.correctTranslation && evaluation.correctTranslation.includes('適切な英訳:')) {
    issues.push('バイパス検出');
  }

  // 評価点の範囲チェック
  if (evaluation.rating && (evaluation.rating < 1 || evaluation.rating > 5)) {
    issues.push('評価点範囲外');
  }

  // 類似フレーズの品質チェック
  if (evaluation.similarPhrases) {
    if (!Array.isArray(evaluation.similarPhrases)) {
      issues.push('類似フレーズが配列でない');
    } else if (evaluation.similarPhrases.length < 2) {
      issues.push('類似フレーズ不足');
    } else if (evaluation.similarPhrases.some(phrase => phrase.includes('Keep learning') || phrase.includes('Practice phrase'))) {
      issues.push('汎用的類似フレーズ');
    }
  }

  // 模範回答の関連性チェック（簡易版）
  if (evaluation.correctTranslation && japaneseSentence) {
    if (evaluation.correctTranslation.includes('Please translate') || 
        evaluation.correctTranslation.includes('This is a translation') ||
        evaluation.correctTranslation.length < 5) {
      issues.push('不適切な模範回答');
    }
  }

  return issues;
}

async function runQuickTest() {
  console.log('🎯 迅速品質検証テスト開始');
  console.log('各カテゴリ5問ずつ（計30問）');
  console.log('=====================================');

  for (const difficulty of DIFFICULTY_LEVELS) {
    console.log(`\n📝 ${difficulty} カテゴリテスト (5問)`);
    
    for (let i = 1; i <= 5; i++) {
      await testSingleProblem(difficulty, i);
    }
  }

  // 結果報告
  console.log('\n🏆 テスト結果');
  console.log('==================');
  
  const successRate = (successCount / totalCount * 100).toFixed(2);
  console.log(`成功率: ${successCount}/${totalCount} (${successRate}%)`);
  
  if (detectedIssues.length > 0) {
    console.log('\n🔍 検出された問題:');
    detectedIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  // 品質判定
  console.log('\n🎯 品質判定:');
  if (successRate >= 95) {
    console.log('✅ 優秀 (95%以上): 商用レベル');
  } else if (successRate >= 90) {
    console.log('🟡 良好 (90%以上): 実用レベル');
  } else if (successRate >= 80) {
    console.log('🟠 改善必要 (80%以上): 問題あり');
  } else {
    console.log('❌ 重大な問題 (80%未満): 修正必要');
  }

  return { successRate: parseFloat(successRate), issues: detectedIssues.length };
}

runQuickTest()
  .then(result => {
    process.exit(result.successRate >= 90 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ テストエラー:', error);
    process.exit(1);
  });