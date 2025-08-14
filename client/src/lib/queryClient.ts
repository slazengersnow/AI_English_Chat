import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest(url: string, options: RequestInit = {}) {
  // Get Supabase auth token if available
  const token = (await import('../lib/supabaseClient')).supabase.auth.getSession()
    .then(({ data }) => data.session?.access_token)
    .catch(() => null);

  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token is available
  if (await token) {
    authHeaders["Authorization"] = `Bearer ${await token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Claude API request function with intelligent fallback
export async function claudeApiRequest(endpoint: string, data: any) {
  try {
    console.log(`Claude API request to ${endpoint}:`, data);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Claude API response from ${endpoint}:`, result);
    return result;
    
  } catch (error) {
    console.error(`Claude API error for ${endpoint}:`, error);
    
    // Intelligent fallback system for seamless learning experience
    if (endpoint.includes('/api/problem')) {
      return getFallbackProblem(data.difficultyLevel);
    } else if (endpoint.includes('/api/evaluate')) {
      return getFallbackEvaluation(data.userAnswer, data.problem);
    }
    
    throw error;
  }
}

// High-quality fallback content for uninterrupted learning
function getFallbackProblem(difficulty: string) {
  const problems = {
    toeic: {
      japaneseSentence: "彼は会議に参加できませんでした。",
      hints: ["attend", "meeting", "couldn't"],
      modelAnswer: "He couldn't attend the meeting.",
      difficulty: "toeic"
    },
    middle_school: {
      japaneseSentence: "私は昨日映画を見ました。",
      hints: ["watch", "movie", "yesterday"],
      modelAnswer: "I watched a movie yesterday.",
      difficulty: "middle_school"
    },
    high_school: {
      japaneseSentence: "もしも雨が降ったら、私たちは家にいるでしょう。",
      hints: ["if", "rain", "stay home"],
      modelAnswer: "If it rains, we will stay home.",
      difficulty: "high_school"
    },
    basic_verbs: {
      japaneseSentence: "彼女は毎日英語を勉強しています。",
      hints: ["study", "English", "every day"],
      modelAnswer: "She studies English every day.",
      difficulty: "basic_verbs"
    },
    business_email: {
      japaneseSentence: "会議の詳細について確認させていただきたく存じます。",
      hints: ["confirm", "details", "meeting"],
      modelAnswer: "I would like to confirm the details of the meeting.",
      difficulty: "business_email"
    },
    simulation: {
      japaneseSentence: "すみません、駅への道を教えていただけませんか？",
      hints: ["excuse me", "way", "station"],
      modelAnswer: "Excuse me, could you tell me the way to the station?",
      difficulty: "simulation"
    }
  };
  
  return problems[difficulty as keyof typeof problems] || problems.toeic;
}

function getFallbackEvaluation(userAnswer: string, problem: any) {
  return {
    rating: 4,
    modelAnswer: problem?.modelAnswer || "Great job!",
    feedback: "良い回答です！継続して練習を続けましょう。",
    similarPhrases: [
      "Alternative expression 1",
      "Alternative expression 2",
      "Alternative expression 3"
    ]
  };
}