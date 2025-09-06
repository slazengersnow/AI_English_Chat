#!/usr/bin/env node

// 🎯 完全検証テスト: 全6カテゴリ各30問の包括テスト
// 問題生成から評価まで100%の精度チェック

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// 6つの難易度カテゴリ
const DIFFICULTY_LEVELS = [
  'toeic',
  'middle-school', 
  'high-school',
  'basic-verbs',
  'business-email',
  'simulation'
];

// 各カテゴリに応じた適切なテスト回答パターン
const APPROPRIATE_ANSWERS = {
  'toeic': [
    'I will attend the meeting tomorrow.',
    'The report must be submitted by Friday.',
    'We need to improve our customer service.',
    'Could you please send me the documents?',
    'I am responsible for this project.'
  ],
  'middle-school': [
    'I go to school every day.',
    'She likes playing tennis.',
    'We are studying English now.',
    'My brother is reading a book.',
    'They played soccer yesterday.'
  ],
  'high-school': [
    'Technology has changed our lives significantly.',
    'We should protect the environment for future generations.',
    'Education plays an important role in society.',
    'Many students are interested in science.',
    'Cultural exchange promotes international understanding.'
  ],
  'basic-verbs': [
    'I eat breakfast every morning.',
    'She runs in the park.',
    'They write letters to friends.',
    'He reads books at night.',
    'We watch movies on weekends.'
  ],
  'business-email': [
    'Thank you for your inquiry about our services.',
    'Please find the attached document for your review.',
    'We would like to schedule a meeting next week.',
    'I am writing to confirm our appointment.',
    'We appreciate your continued cooperation.'
  ],
  'simulation': [
    'Excuse me, where is the nearest station?',
    'Could you help me with this problem?',
    'I would like to make a reservation.',
    'How much does this item cost?',
    'What time does the store open?'
  ]
};

// テスト結果を格納する配列
let testResults = [];
let totalTests = 0;
let successfulTests = 0;

// 問題生成APIのテスト
async function testProblemGeneration(difficulty) {
  try {
    const response = await fetch(`${BASE_URL}/api/problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        difficultyLevel: difficulty
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 問題生成の品質チェック
    const isValidProblem = validateProblemGeneration(data, difficulty);
    
    return {
      success: isValidProblem.valid,
      data: data,
      validationDetails: isValidProblem.details,
      difficulty: difficulty
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      difficulty: difficulty
    };
  }
}

// 評価APIのテスト
async function testEvaluationSystem(japaneseSentence, userAnswer, difficulty) {
  try {
    const response = await fetch(`${BASE_URL}/api/evaluate-translation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        japaneseSentence: japaneseSentence,
        userTranslation: userAnswer,
        difficultyLevel: difficulty
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const evaluation = await response.json();
    
    // 評価の品質チェック
    const isValidEvaluation = validateEvaluationQuality(evaluation, japaneseSentence, userAnswer, difficulty);
    
    return {
      success: isValidEvaluation.valid,
      evaluation: evaluation,
      validationDetails: isValidEvaluation.details,
      difficulty: difficulty
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      difficulty: difficulty
    };
  }
}

// 問題生成の品質検証
function validateProblemGeneration(problemData, difficulty) {
  const issues = [];
  let valid = true;

  // 基本構造チェック
  if (!problemData.japaneseSentence) {
    issues.push('日本語文が存在しない');
    valid = false;
  }

  if (!problemData.hints || !Array.isArray(problemData.hints)) {
    issues.push('ヒントが存在しないまたは配列でない');
    valid = false;
  }

  // 日本語文の品質チェック
  if (problemData.japaneseSentence) {
    const japaneseSentence = problemData.japaneseSentence;
    
    // カテゴリ適合性チェック
    const categoryMatch = checkCategoryAppropriatenness(japaneseSentence, difficulty);
    if (!categoryMatch.appropriate) {
      issues.push(`カテゴリ不適合: ${categoryMatch.reason}`);
      valid = false;
    }

    // 日本語文の自然性チェック
    if (!isNaturalJapaneseSentence(japaneseSentence)) {
      issues.push('不自然な日本語文');
      valid = false;
    }

    // 長さチェック（適切な複雑さ）
    if (japaneseSentence.length < 8 || japaneseSentence.length > 50) {
      issues.push('日本語文の長さが不適切');
      valid = false;
    }
  }

  return {
    valid: valid,
    details: {
      issues: issues,
      problemData: problemData,
      difficulty: difficulty
    }
  };
}

// 評価システムの品質検証
function validateEvaluationQuality(evaluation, japaneseSentence, userAnswer, difficulty) {
  const issues = [];
  let valid = true;

  // 必須フィールドの存在チェック
  const requiredFields = ['correctTranslation', 'feedback', 'rating', 'improvements', 'explanation', 'similarPhrases'];
  for (const field of requiredFields) {
    if (!evaluation[field]) {
      issues.push(`必須フィールド '${field}' が存在しない`);
      valid = false;
    }
  }

  // 評価の適切性チェック
  if (evaluation.correctTranslation) {
    // 「適切な英訳:」プレフィックスの有無チェック（これは存在してはいけない）
    if (evaluation.correctTranslation.includes('適切な英訳:')) {
      issues.push('バイパスシステムのプレフィックスが検出された');
      valid = false;
    }

    // 模範回答と日本語文の整合性チェック
    if (!isRelevantTranslation(japaneseSentence, evaluation.correctTranslation)) {
      issues.push('模範回答が日本語文と整合しない');
      valid = false;
    }
  }

  // フィードバックの品質チェック
  if (evaluation.feedback && !evaluation.feedback.includes('良い') && !evaluation.feedback.includes('素晴らしい')) {
    // フィードバックが具体的で建設的かチェック
    if (evaluation.feedback.length < 20) {
      issues.push('フィードバックが短すぎる');
      valid = false;
    }
  }

  // 評価点の妥当性チェック
  if (evaluation.rating && (evaluation.rating < 1 || evaluation.rating > 5)) {
    issues.push('評価点が範囲外 (1-5)');
    valid = false;
  }

  // 類似フレーズの品質チェック
  if (evaluation.similarPhrases) {
    if (!Array.isArray(evaluation.similarPhrases) || evaluation.similarPhrases.length < 2) {
      issues.push('類似フレーズが不適切');
      valid = false;
    }
    
    // 類似フレーズが元の日本語文と関連しているかチェック
    const relevantPhrases = evaluation.similarPhrases.filter(phrase => 
      isRelevantToJapaneseSentence(japaneseSentence, phrase)
    );
    if (relevantPhrases.length === 0) {
      issues.push('類似フレーズが日本語文と無関係');
      valid = false;
    }
  }

  // 解説の品質チェック
  if (evaluation.explanation && evaluation.explanation.length < 30) {
    issues.push('解説が短すぎる');
    valid = false;
  }

  return {
    valid: valid,
    details: {
      issues: issues,
      evaluation: evaluation,
      japaneseSentence: japaneseSentence,
      userAnswer: userAnswer,
      difficulty: difficulty
    }
  };
}

// カテゴリ適合性チェック
function checkCategoryAppropriatenness(japaneseSentence, difficulty) {
  const sentence = japaneseSentence.toLowerCase();
  
  switch (difficulty) {
    case 'toeic':
      // TOEIC関連: ビジネス、会議、レポート等
      const toeicKeywords = ['会議', '報告', 'レポート', '会社', '業務', 'プロジェクト', '顧客', 'サービス', '売上'];
      if (toeicKeywords.some(keyword => japaneseSentence.includes(keyword))) {
        return { appropriate: true, reason: 'TOEIC関連キーワード含有' };
      }
      return { appropriate: false, reason: 'TOEIC関連キーワードなし' };

    case 'middle-school':
      // 中学レベル: 基本的な日常表現
      const middleKeywords = ['学校', '友達', '家族', '毎日', '好き', '行く', '食べる', '見る'];
      if (middleKeywords.some(keyword => japaneseSentence.includes(keyword)) && japaneseSentence.length < 25) {
        return { appropriate: true, reason: '中学レベル基本表現' };
      }
      return { appropriate: false, reason: '中学レベルに不適切' };

    case 'high-school':
      // 高校レベル: より複雑な表現、抽象概念
      const highKeywords = ['技術', '社会', '環境', '文化', '将来', '重要', '影響', '発展'];
      if (highKeywords.some(keyword => japaneseSentence.includes(keyword))) {
        return { appropriate: true, reason: '高校レベル複雑表現' };
      }
      return { appropriate: false, reason: '高校レベルに不適切' };

    case 'basic-verbs':
      // 基本動詞: 動作を表す基本的な動詞
      const verbKeywords = ['食べる', '飲む', '走る', '歩く', '読む', '書く', '見る', '聞く', '話す', '行く', '来る'];
      if (verbKeywords.some(keyword => japaneseSentence.includes(keyword))) {
        return { appropriate: true, reason: '基本動詞含有' };
      }
      return { appropriate: false, reason: '基本動詞なし' };

    case 'business-email':
      // ビジネスメール: 敬語、ビジネス表現
      const businessKeywords = ['お疲れ', 'ありがとう', 'お世話', '会議', '資料', '確認', '送付', '添付'];
      if (businessKeywords.some(keyword => japaneseSentence.includes(keyword))) {
        return { appropriate: true, reason: 'ビジネス表現含有' };
      }
      return { appropriate: false, reason: 'ビジネス表現なし' };

    case 'simulation':
      // シミュレーション: 実際の場面での会話
      const simKeywords = ['すみません', 'ください', 'どこ', '何時', 'いくら', '予約', '助けて'];
      if (simKeywords.some(keyword => japaneseSentence.includes(keyword))) {
        return { appropriate: true, reason: 'シミュレーション場面含有' };
      }
      return { appropriate: false, reason: 'シミュレーション場面なし' };

    default:
      return { appropriate: true, reason: 'デフォルト承認' };
  }
}

// 自然な日本語文かチェック
function isNaturalJapaneseSentence(sentence) {
  // 基本的な日本語パターンチェック
  const hasHiragana = /[\u3040-\u309F]/.test(sentence);
  const hasValidEnding = /[。です。ます。だ。る。た。]$/.test(sentence);
  const notTooManyRepeats = !/(.)\1{4,}/.test(sentence);
  
  return hasHiragana && hasValidEnding && notTooManyRepeats;
}

// 翻訳の関連性チェック
function isRelevantTranslation(japaneseSentence, englishTranslation) {
  // 基本的な関連性チェック（簡易版）
  const japaneseLength = japaneseSentence.length;
  const englishLength = englishTranslation.length;
  
  // 長さの比率チェック（おおよそ1:2から2:1の範囲）
  const ratio = englishLength / japaneseLength;
  if (ratio < 0.5 || ratio > 3) {
    return false;
  }
  
  // 明らかに無関係な内容をチェック
  if (englishTranslation.includes('Please translate') || englishTranslation.includes('This is a translation')) {
    return false;
  }
  
  return true;
}

// 類似フレーズの関連性チェック
function isRelevantToJapaneseSentence(japaneseSentence, englishPhrase) {
  // 簡易的な関連性チェック
  if (englishPhrase.includes('Keep learning') || englishPhrase.includes('Practice phrase')) {
    return false; // 汎用的すぎるフレーズ
  }
  
  if (englishPhrase.length < 5) {
    return false; // 短すぎるフレーズ
  }
  
  return true;
}

// メイン実行関数
async function runComprehensiveTest() {
  console.log('🎯 全6カテゴリ各30問包括テスト開始');
  console.log('=====================================');
  
  let categoryResults = {};
  
  for (const difficulty of DIFFICULTY_LEVELS) {
    console.log(`\n📝 ${difficulty}カテゴリテスト開始 (30問)`);
    
    let categorySuccessCount = 0;
    let categoryTestCount = 0;
    let categoryDetails = [];
    
    for (let i = 1; i <= 30; i++) {
      totalTests++;
      categoryTestCount++;
      
      console.log(`  テスト ${i}/30: ${difficulty}`);
      
      // Step 1: 問題生成テスト
      const problemResult = await testProblemGeneration(difficulty);
      
      if (!problemResult.success) {
        console.log(`    ❌ 問題生成失敗: ${problemResult.error}`);
        categoryDetails.push({
          testNumber: i,
          problemGeneration: false,
          evaluation: false,
          issues: [problemResult.error]
        });
        continue;
      }
      
      // Step 2: 評価システムテスト
      const testAnswers = APPROPRIATE_ANSWERS[difficulty];
      const randomAnswer = testAnswers[Math.floor(Math.random() * testAnswers.length)];
      
      const evaluationResult = await testEvaluationSystem(
        problemResult.data.japaneseSentence,
        randomAnswer,
        difficulty
      );
      
      if (!evaluationResult.success) {
        console.log(`    ❌ 評価システム失敗: ${evaluationResult.error}`);
        categoryDetails.push({
          testNumber: i,
          problemGeneration: true,
          evaluation: false,
          issues: [evaluationResult.error],
          japaneseSentence: problemResult.data.japaneseSentence
        });
        continue;
      }
      
      // 両方成功
      const allIssues = [
        ...problemResult.validationDetails.issues,
        ...evaluationResult.validationDetails.issues
      ];
      
      if (allIssues.length === 0) {
        successfulTests++;
        categorySuccessCount++;
        console.log(`    ✅ 完全成功`);
        categoryDetails.push({
          testNumber: i,
          problemGeneration: true,
          evaluation: true,
          issues: [],
          japaneseSentence: problemResult.data.japaneseSentence,
          evaluation: evaluationResult.evaluation
        });
      } else {
        console.log(`    ⚠️  品質問題: ${allIssues.length}件の問題`);
        categoryDetails.push({
          testNumber: i,
          problemGeneration: true,
          evaluation: true,
          issues: allIssues,
          japaneseSentence: problemResult.data.japaneseSentence
        });
      }
      
      // レート制限を避けるための短いDelay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const categorySuccessRate = (categorySuccessCount / categoryTestCount * 100).toFixed(2);
    console.log(`  ${difficulty}: ${categorySuccessCount}/${categoryTestCount} 成功 (${categorySuccessRate}%)`);
    
    categoryResults[difficulty] = {
      successCount: categorySuccessCount,
      totalCount: categoryTestCount,
      successRate: parseFloat(categorySuccessRate),
      details: categoryDetails
    };
  }
  
  // 最終結果
  console.log('\n🏆 最終テスト結果');
  console.log('==================');
  
  const overallSuccessRate = (successfulTests / totalTests * 100).toFixed(2);
  console.log(`全体成功率: ${successfulTests}/${totalTests} (${overallSuccessRate}%)`);
  
  console.log('\n📊 カテゴリ別成功率:');
  for (const [category, result] of Object.entries(categoryResults)) {
    console.log(`  ${category}: ${result.successRate}% (${result.successCount}/${result.totalCount})`);
  }
  
  // 詳細な問題分析
  console.log('\n🔍 検出された問題の詳細:');
  let totalIssues = 0;
  const issueTypes = {};
  
  for (const [category, result] of Object.entries(categoryResults)) {
    for (const test of result.details) {
      if (test.issues.length > 0) {
        totalIssues += test.issues.length;
        for (const issue of test.issues) {
          issueTypes[issue] = (issueTypes[issue] || 0) + 1;
        }
      }
    }
  }
  
  console.log(`総問題数: ${totalIssues}`);
  console.log('問題タイプ別発生回数:');
  for (const [issue, count] of Object.entries(issueTypes)) {
    console.log(`  "${issue}": ${count}回`);
  }
  
  // 品質判定
  console.log('\n🎯 品質判定:');
  if (overallSuccessRate >= 95) {
    console.log('✅ 優秀 (95%以上): 商用レベルの品質');
  } else if (overallSuccessRate >= 90) {
    console.log('🟡 良好 (90%以上): 実用レベルの品質');
  } else if (overallSuccessRate >= 80) {
    console.log('🟠 改善必要 (80%以上): 部分的な問題あり');
  } else {
    console.log('❌ 重大な問題 (80%未満): 大規模な修正が必要');
  }
  
  return {
    overallSuccessRate: parseFloat(overallSuccessRate),
    categoryResults: categoryResults,
    totalTests: totalTests,
    successfulTests: successfulTests,
    issueTypes: issueTypes
  };
}

// 実行
runComprehensiveTest()
  .then(results => {
    console.log('\n🔚 テスト完了');
    process.exit(results.overallSuccessRate >= 90 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
  });

export { runComprehensiveTest };