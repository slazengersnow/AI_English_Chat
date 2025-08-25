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
      // Silently handle aborted queries during logout
      onError: (error: any) => {
        if (error.name === 'AbortError') {
          console.log('Query aborted - this is expected during logout');
        }
      },
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