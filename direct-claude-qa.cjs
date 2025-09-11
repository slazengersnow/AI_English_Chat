#!/usr/bin/env node

/**
 * Direct Claude API Quality Verification Harness
 * Bypasses Express server - Direct @anthropic-ai/sdk testing
 * 
 * Tests all 6 categories × 20 problems + evaluation functions
 * Provides 100% completion verification for deployment
 */

const Anthropic = require('@anthropic-ai/sdk');
const { z } = require('zod');

console.log('🚀 Direct Claude API Quality Verification Harness');
console.log('📊 Testing 6 categories × 20 problems + evaluation');
console.log('=' .repeat(60));

// Categories from replit.md
const CATEGORIES = [
  'toeic',
  '中学英語', 
  '高校英語',
  '基本動詞',
  'ビジネスメール',
  'シミュレーション練習'
];

// Zod schemas for validation
const ProblemGenerationSchema = z.object({
  japaneseSentence: z.string().min(5, 'Japanese sentence too short'),
  hints: z.array(z.string()).min(2, 'Must have at least 2 hints')
});

const EvaluationSchema = z.object({
  correctTranslation: z.string().min(1, 'correctTranslation required'),
  feedback: z.string().min(10, 'Feedback too short'),
  rating: z.number().int().min(1).max(5),
  improvements: z.array(z.string()),
  explanation: z.string().min(10, 'Explanation too short'),
  similarPhrases: z.array(z.string()).min(2, 'Must have at least 2 similar phrases')
});

// Results tracking
const results = {
  totalTests: 0,
  totalSuccess: 0,
  totalErrors: 0,
  categoryResults: {},
  errors: [],
  startTime: Date.now()
};

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
  process.exit(1);
}

// Problem generation prompts (mirroring simple-routes.ts logic)
const PROBLEM_GENERATION_PROMPTS = {
  'toeic': `Create a Japanese business sentence suitable for TOEIC level translation practice. 
Focus on: business communications, formal expressions, workplace vocabulary.
Return ONLY a JSON object: {"japaneseSentence": "日本語文", "hints": ["hint1", "hint2", "hint3"]}`,

  '中学英語': `Create a Japanese sentence suitable for middle school English translation practice.
Focus on: basic daily life, simple present/past tense, fundamental vocabulary.
Return ONLY a JSON object: {"japaneseSentence": "日本語文", "hints": ["hint1", "hint2", "hint3"]}`,

  '高校英語': `Create a Japanese sentence suitable for high school English translation practice.
Focus on: academic topics, complex grammar, intermediate vocabulary.
Return ONLY a JSON object: {"japaneseSentence": "日本語文", "hints": ["hint1", "hint2", "hint3"]}`,

  '基本動詞': `Create a Japanese sentence focusing on basic English verbs translation practice.
Focus on: common verbs (get, make, take, have, do, go, come, see), phrasal verbs.
Return ONLY a JSON object: {"japaneseSentence": "日本語文", "hints": ["hint1", "hint2", "hint3"]}`,

  'ビジネスメール': `Create a Japanese business email sentence for English translation practice.
Focus on: formal business communications, email expressions, professional tone.
Return ONLY a JSON object: {"japaneseSentence": "日本語文", "hints": ["hint1", "hint2", "hint3"]}`,

  'シミュレーション練習': `Create a Japanese sentence for real-life situation English translation practice.
Focus on: practical conversations, daily situations, natural expressions.
Return ONLY a JSON object: {"japaneseSentence": "日本語文", "hints": ["hint1", "hint2", "hint3"]}`
};

// Evaluation prompt (mirroring simple-routes.ts logic)
const EVALUATION_PROMPT = `You are an English learning assistant. Evaluate the user's translation and provide detailed feedback.

User's translation: "{userAnswer}"
Original Japanese: "{japaneseSentence}"
Difficulty level: {difficulty}

Provide feedback as JSON:
{
  "correctTranslation": "Most accurate English translation",
  "feedback": "Detailed Japanese feedback (encouraging tone)",
  "rating": <1-5 integer based on accuracy>,
  "improvements": ["improvement point 1", "improvement point 2"],
  "explanation": "Detailed explanation of grammar/vocabulary points in Japanese",
  "similarPhrases": ["similar phrase 1", "similar phrase 2", "similar phrase 3"]
}`;

// Claude API call with enhanced JSON prompting and robust error handling
async function callClaude(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt + '\n\nCRITICAL: You must respond with ONLY valid JSON. No explanations, no markdown, no code fences - just pure JSON that can be parsed directly. Start your response with { and end with }.'
        }]
      });
      
      return message.content[0].text;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Claude API failed after ${maxRetries} attempts: ${error.message}`);
      }
      // Exponential backoff with jitter
      const delay = (1000 * Math.pow(2, attempt - 1)) + (Math.random() * 1000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Robust JSON parser with multiple strategies
function parseJSONResponse(response) {
  // Strategy 1: Direct JSON parse
  try {
    return JSON.parse(response.trim());
  } catch (e1) {
    // Strategy 2: Extract JSON from code fences
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (e2) {
        // Continue to strategy 3
      }
    }
    
    // Strategy 3: Find JSON object with braces
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e3) {
        // Continue to strategy 4
      }
    }
    
    // Strategy 4: Remove common prefixes and try again
    const cleanResponse = response
      .replace(/^.*?(?=\{)/s, '') // Remove everything before first {
      .replace(/\}.*$/s, '}');    // Remove everything after last }
    
    try {
      return JSON.parse(cleanResponse);
    } catch (e4) {
      throw new Error(`JSON parse failed with all strategies. Response: ${response.substring(0, 200)}...`);
    }
  }
}

// Problem generation test with Zod validation
async function testProblemGeneration(category, problemNumber) {
  try {
    const prompt = PROBLEM_GENERATION_PROMPTS[category];
    if (!prompt) {
      throw new Error(`No prompt found for category: ${category}`);
    }

    const response = await callClaude(prompt);
    
    // Parse JSON response with robust parser (fallback)
    const problemData = parseJSONResponse(response);
    
    // Validate with Zod schema
    const validatedData = ProblemGenerationSchema.parse(problemData);

    return {
      success: true,
      data: validatedData,
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

// Evaluation test with Zod validation
async function testEvaluation(category, japaneseSentence, problemNumber) {
  try {
    const testAnswer = "This is a test answer.";
    const prompt = EVALUATION_PROMPT
      .replace('{userAnswer}', testAnswer)
      .replace('{japaneseSentence}', japaneseSentence)
      .replace('{difficulty}', category);

    const response = await callClaude(prompt);
    
    // Parse JSON response with robust parser (fallback)
    const evalData = parseJSONResponse(response);
    
    // Validate with Zod schema
    const validatedData = EvaluationSchema.parse(evalData);

    return {
      success: true,
      data: validatedData,
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

// Category testing
async function testCategory(category, problemCount = 20) {
  console.log(`\n🔥 Testing ${category} category (${problemCount} problems)...`);
  
  results.categoryResults[category] = {
    problemGeneration: { success: 0, errors: 0 },
    evaluation: { success: 0, errors: 0 },
    issues: []
  };

  for (let i = 1; i <= problemCount; i++) {
    process.stdout.write(`  Problem ${i}/${problemCount}: `);

    // Problem generation test
    const problemResult = await testProblemGeneration(category, i);
    results.totalTests++;
    
    if (problemResult.success) {
      results.totalSuccess++;
      results.categoryResults[category].problemGeneration.success++;
      process.stdout.write('✅ Gen ');

      // Evaluation test
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

    // Rate limiting with progressive backoff
    await new Promise(resolve => setTimeout(resolve, 1000 + (Math.random() * 500)));
  }
}

// Single Category Test Runner (for timeout-safe execution)
async function runSingleCategoryTest(categoryName, problemCount = 20) {
  if (!CATEGORIES.includes(categoryName)) {
    console.error(`❌ Invalid category: ${categoryName}`);
    console.log(`Available categories: ${CATEGORIES.join(', ')}`);
    process.exit(1);
  }

  console.log(`🚀 Single Category Test: ${categoryName}`);
  console.log(`📊 Testing ${problemCount} problems + evaluation`);
  console.log('=' .repeat(60));
  console.log(`🔑 ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Found' : 'Missing'}`);
  console.log(`📅 Start time: ${new Date().toISOString()}\n`);

  // Reset results for single category
  const singleResults = {
    totalTests: 0,
    totalSuccess: 0,
    totalErrors: 0,
    categoryResults: {},
    errors: [],
    startTime: Date.now()
  };

  try {
    // Test single category with enhanced logging
    await testSingleCategory(categoryName, problemCount, singleResults);

    const endTime = Date.now();
    const duration = (endTime - singleResults.startTime) / 1000;
    const successRate = (singleResults.totalSuccess / singleResults.totalTests) * 100;

    // Results report
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 ${categoryName.toUpperCase()} CATEGORY TEST RESULTS`);
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${singleResults.totalTests}`);
    console.log(`Success: ${singleResults.totalSuccess} (${successRate.toFixed(1)}%)`);
    console.log(`Errors: ${singleResults.totalErrors} (${(singleResults.totalErrors/singleResults.totalTests*100).toFixed(1)}%)`);
    console.log(`Duration: ${duration.toFixed(1)} seconds`);

    const data = singleResults.categoryResults[categoryName];
    if (data) {
      const genSuccess = data.problemGeneration.success;
      const genErrors = data.problemGeneration.errors;
      const evalSuccess = data.evaluation.success;
      const evalErrors = data.evaluation.errors;
      
      console.log(`\n📋 ${categoryName} Details:`);
      console.log(`  Problem Generation: ${genSuccess}✅ ${genErrors}❌ (${(genSuccess/(genSuccess+genErrors)*100).toFixed(1)}%)`);
      console.log(`  Evaluation: ${evalSuccess}✅ ${evalErrors}❌ (${(evalSuccess/(evalSuccess+evalErrors)*100).toFixed(1)}%)`);
      
      if (data.issues.length > 0) {
        console.log(`\n🚨 Issues Found (${data.issues.length}):`);
        data.issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
      }
    }

    // Deployment readiness assessment
    console.log('\n🎯 CATEGORY READINESS ASSESSMENT:');
    if (successRate >= 99) {
      console.log('✅ EXCELLENT (99%+) - Category ready for deployment');
    } else if (successRate >= 95) {
      console.log('🟡 GOOD (95-99%) - Minor issues, generally ready');
    } else if (successRate >= 90) {
      console.log('🟠 ACCEPTABLE (90-95%) - Some issues need attention');
    } else {
      console.log('❌ NOT READY (<90%) - Significant issues found');
    }

    console.log(`\n📊 Final Score: ${successRate.toFixed(1)}% (${singleResults.totalSuccess}/${singleResults.totalTests})`);
    console.log(`🎉 ${categoryName} Category Test Complete!`);

    return singleResults;
  } catch (error) {
    console.error('\n💥 Single category test failed:', error);
    process.exit(1);
  }
}

// Enhanced single category testing
async function testSingleCategory(category, problemCount, resultsObj) {
  console.log(`\n🔥 Testing ${category} category (${problemCount} problems)...`);
  
  resultsObj.categoryResults[category] = {
    problemGeneration: { success: 0, errors: 0 },
    evaluation: { success: 0, errors: 0 },
    issues: []
  };

  for (let i = 1; i <= problemCount; i++) {
    process.stdout.write(`  Problem ${i}/${problemCount}: `);

    // Problem generation test
    const problemResult = await testProblemGeneration(category, i);
    resultsObj.totalTests++;
    
    if (problemResult.success) {
      resultsObj.totalSuccess++;
      resultsObj.categoryResults[category].problemGeneration.success++;
      process.stdout.write('✅ Gen ');

      // Evaluation test
      const evalResult = await testEvaluation(category, problemResult.data.japaneseSentence, i);
      resultsObj.totalTests++;

      if (evalResult.success) {
        resultsObj.totalSuccess++;
        resultsObj.categoryResults[category].evaluation.success++;
        console.log('✅ Eval');
      } else {
        resultsObj.totalErrors++;
        resultsObj.categoryResults[category].evaluation.errors++;
        resultsObj.categoryResults[category].issues.push(`Problem ${i} evaluation: ${evalResult.error}`);
        resultsObj.errors.push(`${category} Problem ${i} evaluation: ${evalResult.error}`);
        console.log('❌ Eval');
      }
    } else {
      resultsObj.totalErrors++;
      resultsObj.categoryResults[category].problemGeneration.errors++;
      resultsObj.categoryResults[category].issues.push(`Problem ${i} generation: ${problemResult.error}`);
      resultsObj.errors.push(`${category} Problem ${i} generation: ${problemResult.error}`);
      console.log('❌ Gen (skipping eval)');
    }

    // Rate limiting with adaptive backoff
    await new Promise(resolve => setTimeout(resolve, 800 + (Math.random() * 400)));
  }
}

// Main execution (all categories)
async function runQualityVerification() {
  console.log(`🔑 ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'Found' : 'Missing'}`);
  console.log(`📅 Start time: ${new Date().toISOString()}\n`);

  try {
    // Test all categories
    for (const category of CATEGORIES) {
      await testCategory(category, 20);
    }

    const endTime = Date.now();
    const duration = (endTime - results.startTime) / 1000;

    // Final results report
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL CLAUDE API QUALITY VERIFICATION REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Success: ${results.totalSuccess} (${(results.totalSuccess/results.totalTests*100).toFixed(1)}%)`);
    console.log(`Errors: ${results.totalErrors} (${(results.totalErrors/results.totalTests*100).toFixed(1)}%)`);
    console.log(`Duration: ${duration.toFixed(1)} seconds`);

    // Category details
    console.log('\n📋 Category Performance:');
    for (const [category, data] of Object.entries(results.categoryResults)) {
      const genSuccess = data.problemGeneration.success;
      const genErrors = data.problemGeneration.errors;
      const evalSuccess = data.evaluation.success;
      const evalErrors = data.evaluation.errors;
      const successRate = ((genSuccess + evalSuccess) / ((genSuccess + genErrors) + (evalSuccess + evalErrors)) * 100).toFixed(1);
      
      console.log(`\n${category}:`);
      console.log(`  Problem Generation: ${genSuccess}✅ ${genErrors}❌`);
      console.log(`  Evaluation: ${evalSuccess}✅ ${evalErrors}❌`);
      console.log(`  Success Rate: ${successRate}%`);
      
      if (data.issues.length > 0) {
        console.log(`  Issues: ${data.issues.length}`);
        data.issues.slice(0, 2).forEach(issue => console.log(`    - ${issue}`));
        if (data.issues.length > 2) {
          console.log(`    ... and ${data.issues.length - 2} more`);
        }
      }
    }

    // Error summary
    if (results.errors.length > 0) {
      console.log('\n🚨 ERROR SUMMARY:');
      results.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more errors`);
      }
    }

    // Deployment readiness assessment
    const successRate = (results.totalSuccess / results.totalTests) * 100;
    console.log('\n🎯 DEPLOYMENT READINESS ASSESSMENT:');
    if (successRate >= 99) {
      console.log('✅ EXCELLENT (99%+) - Ready for deployment');
      console.log('   All categories performing optimally');
    } else if (successRate >= 95) {
      console.log('🟡 GOOD (95-99%) - Minor issues, generally ready');
      console.log('   Consider reviewing specific category issues');
    } else if (successRate >= 90) {
      console.log('🟠 ACCEPTABLE (90-95%) - Some issues need attention');
      console.log('   Review and fix major category issues before deployment');
    } else {
      console.log('❌ NOT READY (<90%) - Significant issues found');
      console.log('   Major fixes required before deployment');
    }

    console.log(`\n📊 Final Score: ${successRate.toFixed(1)}% (${results.totalSuccess}/${results.totalTests})`);
    console.log('🎉 Direct Claude API Quality Verification Complete!');

    return results;
  } catch (error) {
    console.error('\n💥 Quality verification failed:', error);
    process.exit(1);
  }
}

// Execute verification with command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Single category mode
    const categoryName = args[0];
    const problemCount = parseInt(args[1]) || 20;
    
    runSingleCategoryTest(categoryName, problemCount).catch(error => {
      console.error('\n💥 Single category test failed:', error);
      process.exit(1);
    });
  } else {
    // Full verification mode
    runQualityVerification().catch(error => {
      console.error('\n💥 Execution failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { runQualityVerification, runSingleCategoryTest };