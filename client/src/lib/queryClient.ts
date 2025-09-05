import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        const [url] = queryKey as [string];
        return apiRequest(url, { signal });
      },
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      mutationFn: async ({ url, ...options }: any) => {
        return apiRequest(url, options);
      },
      onError: (error: any) => {
        if (error.name === 'AbortError') {
          console.log('Mutation aborted - this is expected during logout');
        }
      },
    },
  },
});

export async function apiRequest(url: string, options: RequestInit = {}) {
  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    // Get Supabase auth token with multiple fallback methods
    const { supabase } = await import('../lib/supabaseClient');
    let authToken = null;
    
    // Method 1: Get from current Supabase session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.access_token) {
        authToken = session.access_token;
        console.log(`🔐 Auth token from Supabase session for ${url}`);
      }
    } catch (sessionError) {
      console.log(`⚠️ Could not get session from Supabase for ${url}:`, sessionError);
    }
    
    // Method 2: Try to restore from localStorage if no session
    if (!authToken && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.access_token) {
            // Verify token is not expired
            const now = Math.floor(Date.now() / 1000);
            if (parsedSession.expires_at && now < parsedSession.expires_at) {
              authToken = parsedSession.access_token;
              console.log(`🔐 Auth token from localStorage backup for ${url}`);
              
              // Try to restore session to Supabase
              try {
                await supabase.auth.setSession({
                  access_token: parsedSession.access_token,
                  refresh_token: parsedSession.refresh_token
                });
                console.log(`🔄 Session restored to Supabase from localStorage for ${url}`);
              } catch (restoreError) {
                console.warn(`⚠️ Could not restore session to Supabase for ${url}:`, restoreError);
              }
            } else {
              console.log(`⚠️ Stored token is expired for ${url}, clearing...`);
              localStorage.removeItem('supabase.auth.token');
            }
          }
        }
      } catch (storageError) {
        console.warn(`⚠️ Could not read from localStorage for ${url}:`, storageError);
      }
    }
    
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add Authorization header if we have a token
    if (authToken) {
      authHeaders.Authorization = `Bearer ${authToken}`;
    }

    // Add authorization header if token is available
    if (authToken) {
      authHeaders["Authorization"] = `Bearer ${authToken}`;
      console.log(`🔐 Auth token added for ${url}`);
    } else {
      console.log(`⚠️ No auth token available for ${url}`);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    console.log(`📨 Response: ${response.status} ${response.statusText} for ${url}`);

    if (!response.ok) {
      // Handle 401 errors specifically
      if (response.status === 401) {
        console.log(`🔐 Unauthorized for ${url} - clearing stored session`);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('supabase.auth.token');
        }
      }
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ API Success: ${url}`, result);
    return result;
  } catch (error: any) {
    // Don't log AbortError as it's expected during logout
    if (error.name === 'AbortError') {
      console.log(`🚫 Request aborted for ${url} (expected during logout)`);
    } else {
      console.error(`❌ API Error: ${url}`, error);
    }
    throw error;
  }
}

// Claude API request function with robust timeout and retry handling
export async function claudeApiRequest(endpoint: string, data: any) {
  const maxRetries = 4; // 5 total attempts (0-4)
  const timeoutMs = 45000; // 45 seconds timeout for production reliability
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`Claude API request to ${endpoint} (attempt ${attempt + 1}/${maxRetries + 1}):`, data);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Claude API response from ${endpoint}:`, result);
      return result;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      const isLastAttempt = attempt === maxRetries;
      const isAbortError = error.name === 'AbortError';
      const isTimeoutError = isAbortError || error.message?.includes('timeout');
      const isRateLimited = error.message?.includes('429') || error.message?.includes('rate limit');
      const isServerError = error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503');
      
      if (!isLastAttempt && (isTimeoutError || isServerError || isRateLimited)) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const backoffMs = Math.pow(2, attempt) * 1000;
        const errorType = isRateLimited ? 'rate limit' : (isTimeoutError ? 'timeout' : 'server error');
        
        console.log(`Claude API ${errorType} on attempt ${attempt + 1}, retrying in ${backoffMs/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      console.error(`Claude API error for ${endpoint} (attempt ${attempt + 1}):`, error);
      
      // Intelligent fallback system for seamless learning experience
      if (endpoint.includes('/api/problem')) {
        console.log('Using fallback problem due to Claude API failure');
        return getFallbackProblem(data.difficultyLevel);
      } else if (endpoint.includes('/api/evaluate-with-claude')) {
        console.log('Using fallback evaluation due to Claude API failure');
        return getFallbackEvaluation(data);
      }
      
      throw error;
    }
  }
}

// High-quality fallback content for uninterrupted learning
function getFallbackProblem(difficulty: string) {
  const problemSets = {
    toeic: [
      {
        japaneseSentence: "来月の売上予測を作成します。",
        hints: ["sales forecast", "next month", "create"],
        modelAnswer: "I will create a sales forecast for next month.",
        difficulty: "toeic"
      },
      {
        japaneseSentence: "会議の議事録を確認してください。",
        hints: ["meeting minutes", "confirm", "please"],
        modelAnswer: "Please confirm the meeting minutes.",
        difficulty: "toeic"
      },
      {
        japaneseSentence: "新しいマーケティング戦略を検討しましょう。",
        hints: ["marketing strategy", "consider", "new"],
        modelAnswer: "Let's consider a new marketing strategy.",
        difficulty: "toeic"
      }
    ],
    'middle-school': [
      {
        japaneseSentence: "私は犬が好きです。",
        hints: ["I", "like", "dog"],
        modelAnswer: "I like dogs.",
        difficulty: "middle-school"
      },
      {
        japaneseSentence: "今日は晴れています。",
        hints: ["today", "sunny", "weather"],
        modelAnswer: "It is sunny today.",
        difficulty: "middle-school"
      },
      {
        japaneseSentence: "母は料理を作っています。",
        hints: ["mother", "cooking", "making"],
        modelAnswer: "My mother is cooking.",
        difficulty: "middle-school"
      }
    ],
    'high-school': [
      {
        japaneseSentence: "環境問題について考えるべきです。",
        hints: ["environmental issues", "think about", "should"],
        modelAnswer: "We should think about environmental issues.",
        difficulty: "high-school"
      },
      {
        japaneseSentence: "科学技術の発展が社会を変えています。",
        hints: ["technological advancement", "society", "changing"],
        modelAnswer: "Technological advancement is changing society.",
        difficulty: "high-school"
      },
      {
        japaneseSentence: "将来の目標を設定することが重要です。",
        hints: ["future goals", "setting", "important"],
        modelAnswer: "It is important to set future goals.",
        difficulty: "high-school"
      }
    ],
    'basic-verbs': [
      {
        japaneseSentence: "私は毎朝走ります。",
        hints: ["run", "every morning", "I"],
        modelAnswer: "I run every morning.",
        difficulty: "basic-verbs"
      },
      {
        japaneseSentence: "彼女は本を読んでいます。",
        hints: ["read", "book", "she"],
        modelAnswer: "She is reading a book.",
        difficulty: "basic-verbs"
      },
      {
        japaneseSentence: "私たちは宿題をしました。",
        hints: ["do", "homework", "we"],
        modelAnswer: "We did our homework.",
        difficulty: "basic-verbs"
      }
    ],
    'business-email': [
      {
        japaneseSentence: "ご質問がございましたらお知らせください。",
        hints: ["please let me know", "questions", "if you have"],
        modelAnswer: "Please let me know if you have any questions.",
        difficulty: "business-email"
      },
      {
        japaneseSentence: "お忙しい中恐れ入りますが、ご確認をお願いいたします。",
        hints: ["sorry to bother", "please confirm", "busy"],
        modelAnswer: "I'm sorry to bother you while you're busy, but please confirm this.",
        difficulty: "business-email"
      },
      {
        japaneseSentence: "資料をメールで送付いたします。",
        hints: ["send", "documents", "email"],
        modelAnswer: "I will send the documents by email.",
        difficulty: "business-email"
      }
    ],
    simulation: [
      {
        japaneseSentence: "レストランで注文をお願いします。",
        hints: ["restaurant", "order", "please"],
        modelAnswer: "I'd like to order at the restaurant, please.",
        difficulty: "simulation"
      },
      {
        japaneseSentence: "空港でチェックインしたいです。",
        hints: ["airport", "check in", "want to"],
        modelAnswer: "I want to check in at the airport.",
        difficulty: "simulation"
      },
      {
        japaneseSentence: "道に迷いました。助けてください。",
        hints: ["lost", "help", "please"],
        modelAnswer: "I'm lost. Please help me.",
        difficulty: "simulation"
      }
    ]
  };
  
  const problemSet = problemSets[difficulty as keyof typeof problemSets] || problemSets.toeic;
  const randomIndex = Math.floor(Math.random() * problemSet.length);
  return problemSet[randomIndex];
}

function getFallbackEvaluation(data: any) {
  const { userAnswer, japaneseSentence, difficulty } = data;
  
  // 回答の品質をシンプルに判定（長さ、基本語彙、構造で推定）
  const answerLength = userAnswer?.length || 0;
  const hasBasicStructure = /\w+/.test(userAnswer || '');
  const hasVerb = /(am|is|are|was|were|will|would|can|could|do|does|did|have|has|had)/.test(userAnswer || '');
  
  // 難易度別の期待される回答品質
  const qualityScore = Math.min(5, Math.max(1, 
    (answerLength > 5 ? 1 : 0) + 
    (hasBasicStructure ? 1 : 0) + 
    (hasVerb ? 1 : 0) + 
    (answerLength > 15 ? 1 : 0) + 
    (difficulty === 'toeic' && answerLength > 20 ? 1 : 0)
  ));
  
  // 難易度別の高品質フォールバック評価
  const evaluations = {
    toeic: {
      feedback: `TOEICレベルの翻訳として、${qualityScore >= 4 ? '優秀な' : qualityScore >= 3 ? '良好な' : '基本的な'}構造が確認できます。現在AI評価が一時的に利用できませんが、ビジネス英語のスキル向上に取り組む姿勢は素晴らしいです。`,
      improvements: [
        "ビジネス表現の精度をさらに向上させましょう",
        "専門用語の適切な使い分けを練習しましょう",
        "フォーマルな文体を意識してみましょう"
      ],
      explanation: `「${japaneseSentence}」のTOEICレベル英訳について、AI評価システムが一時的に利用できません。ビジネスコンテクストでの表現力向上を継続しましょう。`,
      similarPhrases: [
        "Professional communication skills",
        "Business English proficiency",
        "Workplace language mastery"
      ]
    },
    'middle-school': {
      feedback: `中学レベルの基本英語として、${qualityScore >= 3 ? '良い' : '基本的な'}構造が見られます。AI評価が復旧次第、より詳細なフィードバックをお届けします。基礎固めを継続しましょう。`,
      improvements: [
        "基本文法の確認を続けましょう",
        "日常語彙を増やしていきましょう",
        "シンプルな文構造を意識しましょう"
      ],
      explanation: `「${japaneseSentence}」の中学レベル英訳について、AI評価システムが一時的に利用できません。基礎力向上への取り組みを続けましょう。`,
      similarPhrases: [
        "Basic English foundation",
        "Elementary language skills",
        "Fundamental communication"
      ]
    },
    'high-school': {
      feedback: `高校レベルの英語として、${qualityScore >= 4 ? '応用力のある' : qualityScore >= 3 ? '標準的な' : '基本的な'}表現が確認できます。AI評価復旧後により詳細な分析をお届けします。`,
      improvements: [
        "複合文構造の練習を続けましょう",
        "応用文法の理解を深めましょう",
        "語彙の幅を広げていきましょう"
      ],
      explanation: `「${japaneseSentence}」の高校レベル英訳について、AI評価システムが一時的に利用できません。応用力向上を目指しましょう。`,
      similarPhrases: [
        "Advanced language skills",
        "Academic English proficiency",
        "Sophisticated expression"
      ]
    },
    'basic-verbs': {
      feedback: `基本動詞の使い方として、${qualityScore >= 3 ? '適切な' : '基本的な'}動詞選択が見られます。AI評価が利用可能になり次第、詳細な動詞usage分析をお届けします。`,
      improvements: [
        "動詞の時制変化を確認しましょう",
        "動詞と前置詞の組み合わせを学びましょう",
        "基本動詞の多様な意味を覚えましょう"
      ],
      explanation: `「${japaneseSentence}」の基本動詞練習について、AI評価システムが一時的に利用できません。動詞マスターを目指しましょう。`,
      similarPhrases: [
        "Essential verb usage",
        "Core action words",
        "Fundamental verb patterns"
      ]
    },
    'business-email': {
      feedback: `ビジネスメール表現として、${qualityScore >= 4 ? '丁寧で適切な' : qualityScore >= 3 ? '標準的な' : '基本的な'}構造が確認できます。AI評価復旧後、より詳細なビジネス文書分析をお届けします。`,
      improvements: [
        "ビジネスメール特有の敬語表現を練習しましょう",
        "フォーマルな文書構造を意識しましょう",
        "専門的な語彙を増やしていきましょう"
      ],
      explanation: `「${japaneseSentence}」のビジネスメール英訳について、AI評価システムが一時的に利用できません。プロフェッショナルな表現力を向上させましょう。`,
      similarPhrases: [
        "Professional email communication",
        "Business correspondence skills",
        "Corporate language proficiency"
      ]
    },
    simulation: {
      feedback: `シミュレーション練習として、${qualityScore >= 3 ? '実践的な' : '基本的な'}コミュニケーション表現が見られます。AI評価復旧後、より詳細な実用性分析をお届けします。`,
      improvements: [
        "実際の会話場面を意識しましょう",
        "自然な表現を心がけましょう",
        "相手への配慮を示す表現を学びましょう"
      ],
      explanation: `「${japaneseSentence}」のシミュレーション練習について、AI評価システムが一時的に利用できません。実践的なコミュニケーション力を向上させましょう。`,
      similarPhrases: [
        "Real-world communication",
        "Practical language use",
        "Situational expression"
      ]
    }
  };
  
  const evaluation = evaluations[difficulty as keyof typeof evaluations] || evaluations.toeic;
  
  return {
    rating: qualityScore,
    correctTranslation: `適切な英訳: ${userAnswer || '(回答なし)'}`,
    feedback: evaluation.feedback,
    improvements: evaluation.improvements,
    explanation: evaluation.explanation,
    similarPhrases: evaluation.similarPhrases,
    sessionId: Math.floor(Math.random() * 1000000) // Temporary session ID for tracking
  };
}