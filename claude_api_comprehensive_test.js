#!/usr/bin/env node

/**
 * 🔥 COMPREHENSIVE CLAUDE API TESTING SYSTEM
 * Tests all 6 difficulty levels with dozens of problems to ensure zero failures
 */

const testCases = {
  "middle_school": [
    { japanese: "私は今朝ご飯を食べています。", user: "I eat breakfast in the morning." },
    { japanese: "私は毎日学校に行きます。", user: "I go to school every day." },
    { japanese: "私は毎日、学校の帰りに公園で遊びます。", user: "I play in the park on my way home from school every day." },
    { japanese: "今日は雨が降っています。", user: "It is raining today." },
    { japanese: "私は本を読みます。", user: "I read books." },
    { japanese: "彼女は音楽を聞きます。", user: "She listens to music." },
    { japanese: "私たちは映画を見ました。", user: "We watched a movie." },
    { japanese: "猫が寝ています。", user: "The cat is sleeping." },
    { japanese: "私は犬を飼っています。", user: "I have a dog." },
    { japanese: "今日は金曜日です。", user: "Today is Friday." },
    { japanese: "私の兄は大学生です。", user: "My brother is a university student." },
    { japanese: "彼は自転車に乗ります。", user: "He rides a bicycle." },
    { japanese: "私たちは図書館で勉強します。", user: "We study in the library." },
    { japanese: "今日は暖かい日です。", user: "Today is a warm day." },
    { japanese: "私は宿題をしました。", user: "I did my homework." }
  ],
  "high_school": [
    { japanese: "環境問題について真剣に考える必要があります。", user: "We need to think seriously about environmental issues." },
    { japanese: "将来の夢を実現するために毎日努力しています。", user: "I work hard every day to achieve my future dreams." },
    { japanese: "科学技術の発展が社会に与える影響は計り知れません。", user: "The impact of scientific development on society is immeasurable." },
    { japanese: "もし時間があれば、海外旅行に行きたいです。", user: "If I have time, I would like to travel abroad." },
    { japanese: "この本は私が今まで読んだ中で最も興味深いものです。", user: "This book is the most interesting one I have ever read." },
    { japanese: "彼が成功したのは、努力を続けたからです。", user: "He succeeded because he continued to work hard." },
    { japanese: "新しい技術によって、私たちの生活は大きく変わりました。", user: "Our lives have changed greatly due to new technology." },
    { japanese: "多くの人々が平和を望んでいます。", user: "Many people wish for peace." },
    { japanese: "教育の質を向上させることが重要です。", user: "It is important to improve the quality of education." },
    { japanese: "このプロジェクトを完了するには、チームワークが必要です。", user: "Teamwork is necessary to complete this project." }
  ],
  "toeic": [
    { japanese: "この度の人事評価面談の準備を進めております。", user: "I proceed with interview." },
    { japanese: "来月の海外出張の日程を確認いたします。", user: "I would like to check." },
    { japanese: "この度の製品開発会議の議事録を作成させていただきます。", user: "I will make minutes." },
    { japanese: "会議資料を準備してください。", user: "Please prepare the meeting materials." },
    { japanese: "売上が前年比20%増加しました。", user: "Sales increased by 20% compared to last year." },
    { japanese: "新商品の企画を検討中です。", user: "We are considering a plan for a new product." },
    { japanese: "顧客満足度調査を実施します。", user: "We will conduct a customer satisfaction survey." },
    { japanese: "契約条件を見直す必要があります。", user: "We need to review the contract conditions." },
    { japanese: "プロジェクトの進捗状況をご報告します。", user: "I will report the progress of the project." },
    { japanese: "来週の定例会議は延期させていただきます。", user: "We will postpone next week's regular meeting." }
  ],
  "basic_verbs": [
    { japanese: "私は本を読みます。", user: "I read books." },
    { japanese: "彼女は音楽を聞きます。", user: "She listens to music." },
    { japanese: "友達と遊びます。", user: "I play with friends." },
    { japanese: "テレビを見ます。", user: "I watch TV." },
    { japanese: "公園に行きます。", user: "I go to the park." },
    { japanese: "手紙を書きます。", user: "I write a letter." },
    { japanese: "写真を撮ります。", user: "I take pictures." },
    { japanese: "料理を作ります。", user: "I cook meals." },
    { japanese: "買い物に行きます。", user: "I go shopping." },
    { japanese: "映画を見ます。", user: "I watch movies." }
  ],
  "business_email": [
    { japanese: "お疲れさまです。", user: "Thank you for your hard work." },
    { japanese: "新しいプロジェクトについてご相談があります。", user: "I have a consultation about a new project." },
    { japanese: "来月の出張予定をお知らせします。", user: "I will inform you of next month's business trip schedule." },
    { japanese: "システムにトラブルが発生しております。", user: "There is trouble with the system." },
    { japanese: "契約書の内容を再度確認させてください。", user: "Please let me confirm the contract contents again." },
    { japanese: "研修の参加者を募集しています。", user: "We are recruiting training participants." },
    { japanese: "売上実績をご報告いたします。", user: "I will report the sales results." },
    { japanese: "商品の納期が遅れる可能性があります。", user: "There is a possibility that product delivery will be delayed." },
    { japanese: "面接の日程はいかがでしょうか。", user: "How about the interview schedule?" },
    { japanese: "お客様からクレームをいただいています。", user: "We have received complaints from customers." }
  ],
  "simulation": [
    { japanese: "駅までの道を教えてください。", user: "Please tell me the way to the station." },
    { japanese: "この商品の値段はいくらですか。", user: "How much is this product?" },
    { japanese: "予約をキャンセルしたいのですが。", user: "I would like to cancel my reservation." },
    { japanese: "今日の天気はどうですか。", user: "How is the weather today?" },
    { japanese: "電話番号を教えてもらえますか。", user: "Could you tell me your phone number?" },
    { japanese: "メニューを見せてください。", user: "Please show me the menu." },
    { japanese: "空港までタクシーでお願いします。", user: "Please take me to the airport by taxi." },
    { japanese: "部屋を掃除してください。", user: "Please clean the room." },
    { japanese: "荷物を預けたいのですが。", user: "I would like to check my luggage." },
    { japanese: "チェックアウトは何時ですか。", user: "What time is checkout?" }
  ]
};

async function testClaudeAPI(japaneseSentence, userTranslation, difficultyLevel) {
  try {
    const response = await fetch('http://localhost:5000/api/evaluate-with-claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify({
        japaneseSentence,
        userTranslation,
        difficultyLevel
      })
    });

    const result = await response.json();
    
    // Check for fallback indicators
    const isFallback = result.correctTranslation?.includes('適切な英訳:') || 
                      result.feedback?.includes('AIが一時的に利用できないため') ||
                      result.feedback?.includes('簡易評価を表示しています');
    
    return {
      success: !isFallback,
      isFallback,
      rating: result.rating,
      status: response.status,
      result
    };
  } catch (error) {
    return {
      success: false,
      isFallback: false,
      error: error.message,
      status: 'ERROR'
    };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 COMPREHENSIVE CLAUDE API TESTING SYSTEM');
  console.log('=' .repeat(60));
  
  let totalTests = 0;
  let successfulTests = 0;
  let fallbackTests = 0;
  let errorTests = 0;
  
  const categoryResults = {};
  
  for (const [category, testData] of Object.entries(testCases)) {
    console.log(`\n📚 Testing ${category.toUpperCase()} (${testData.length} tests)`);
    console.log('-'.repeat(50));
    
    categoryResults[category] = {
      total: testData.length,
      successful: 0,
      fallback: 0,
      errors: 0,
      details: []
    };
    
    for (let i = 0; i < testData.length; i++) {
      const test = testData[i];
      totalTests++;
      
      process.stdout.write(`Test ${i + 1}/${testData.length}: "${test.japanese.substring(0, 30)}..." `);
      
      const result = await testClaudeAPI(test.japanese, test.user, category);
      
      if (result.success) {
        successfulTests++;
        categoryResults[category].successful++;
        console.log('✅ SUCCESS');
      } else if (result.isFallback) {
        fallbackTests++;
        categoryResults[category].fallback++;
        console.log('⚠️ FALLBACK');
      } else {
        errorTests++;
        categoryResults[category].errors++;
        console.log('❌ ERROR');
      }
      
      categoryResults[category].details.push({
        sentence: test.japanese,
        success: result.success,
        isFallback: result.isFallback,
        rating: result.rating,
        status: result.status
      });
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('🎯 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n📊 OVERALL STATISTICS:`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`⚠️ Fallback: ${fallbackTests} (${((fallbackTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`❌ Errors: ${errorTests} (${((errorTests/totalTests)*100).toFixed(1)}%)`);
  
  console.log(`\n📚 CATEGORY BREAKDOWN:`);
  for (const [category, stats] of Object.entries(categoryResults)) {
    const successRate = ((stats.successful/stats.total)*100).toFixed(1);
    console.log(`${category.toUpperCase()}: ${stats.successful}/${stats.total} (${successRate}% success)`);
  }
  
  // Detailed analysis of problematic cases
  console.log(`\n🔍 PROBLEMATIC CASES ANALYSIS:`);
  for (const [category, stats] of Object.entries(categoryResults)) {
    const problematicCases = stats.details.filter(d => !d.success);
    if (problematicCases.length > 0) {
      console.log(`\n${category.toUpperCase()} - ${problematicCases.length} issues:`);
      problematicCases.forEach((case_, index) => {
        console.log(`  ${index + 1}. "${case_.sentence.substring(0, 40)}..." - ${case_.isFallback ? 'FALLBACK' : 'ERROR'}`);
      });
    }
  }
  
  // Commercial readiness assessment
  const successRate = (successfulTests/totalTests)*100;
  console.log(`\n🚀 COMMERCIAL READINESS ASSESSMENT:`);
  if (successRate >= 95) {
    console.log(`✅ READY FOR COMMERCIAL DEPLOYMENT (${successRate.toFixed(1)}% success rate)`);
  } else if (successRate >= 90) {
    console.log(`⚠️ NEEDS MINOR IMPROVEMENTS (${successRate.toFixed(1)}% success rate)`);
  } else {
    console.log(`❌ REQUIRES MAJOR FIXES (${successRate.toFixed(1)}% success rate)`);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);