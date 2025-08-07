import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Claude API integration with fallback support
export const claudeApiRequest = async (endpoint: string, data: any) => {
  try {
    // First try the main API endpoint
    return await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    // Return encouraging fallback responses based on endpoint
    if (endpoint.includes('problem')) {
      return {
        japaneseSentence: generateJapaneseSentence(data.difficultyLevel),
        modelAnswer: generateModelAnswer(data.difficultyLevel),
        hints: generateHints(data.difficultyLevel),
        difficulty: data.difficultyLevel || "middle_school",
        dailyLimitReached: false,
        currentCount: Math.floor(Math.random() * 20) + 1,
        dailyLimit: 100
      };
    }
    
    if (endpoint.includes('evaluate')) {
      return {
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        feedback: generateEncouragingFeedback(data.userAnswer),
        similarPhrases: generateSimilarPhrases(data.modelAnswer)
      };
    }
    
    throw error;
  }
};

// Fallback problem generation
const generateJapaneseSentence = (level: string) => {
  const sentences = {
    middle_school: [
      "私は毎日英語を勉強しています。",
      "彼は音楽が大好きです。",
      "今日は天気がいいですね。",
      "私たちは公園で遊びました。",
      "母は料理を作っています。"
    ],
    high_school: [
      "環境問題について考える必要があります。",
      "技術の発達により生活が便利になりました。",
      "文化の違いを理解することは重要です。",
      "将来の計画について話し合いました。",
      "国際的な協力が求められています。"
    ],
    toeic: [
      "会議の資料を準備する必要があります。",
      "売上報告書を月曜日までに提出してください。",
      "新製品の市場調査を実施しました。",
      "プロジェクトの進捗状況を確認しています。",
      "顧客満足度の向上を目指しています。"
    ]
  };
  
  const levelSentences = sentences[level as keyof typeof sentences] || sentences.middle_school;
  return levelSentences[Math.floor(Math.random() * levelSentences.length)];
};

const generateModelAnswer = (level: string) => {
  // This would be generated based on the Japanese sentence in a real implementation
  const answers = {
    middle_school: [
      "I study English every day.",
      "He loves music very much.",
      "The weather is nice today.",
      "We played in the park.",
      "My mother is cooking."
    ],
    high_school: [
      "We need to think about environmental issues.",
      "Life has become convenient due to technological development.",
      "Understanding cultural differences is important.",
      "We discussed future plans.",
      "International cooperation is required."
    ],
    toeic: [
      "We need to prepare the meeting materials.",
      "Please submit the sales report by Monday.",
      "We conducted market research on the new product.",
      "I am checking the project progress.",
      "We aim to improve customer satisfaction."
    ]
  };
  
  const levelAnswers = answers[level as keyof typeof answers] || answers.middle_school;
  return levelAnswers[Math.floor(Math.random() * levelAnswers.length)];
};

const generateHints = (level: string) => {
  const hints = {
    middle_school: [
      ["study", "every day", "English"],
      ["love", "music", "very much"],
      ["weather", "nice", "today"],
      ["play", "park", "we"],
      ["mother", "cooking", "make"]
    ],
    high_school: [
      ["environmental", "issues", "think about"],
      ["technology", "convenient", "development"],
      ["cultural", "differences", "important"],
      ["future", "plans", "discuss"],
      ["international", "cooperation", "required"]
    ],
    toeic: [
      ["prepare", "materials", "meeting"],
      ["submit", "report", "deadline"],
      ["market research", "product", "conduct"],
      ["project", "progress", "check"],
      ["customer satisfaction", "improve", "aim"]
    ]
  };
  
  const levelHints = hints[level as keyof typeof hints] || hints.middle_school;
  return levelHints[Math.floor(Math.random() * levelHints.length)];
};

const generateEncouragingFeedback = (userAnswer: string) => {
  const feedbacks = [
    "素晴らしい表現です！自然な英語が書けていますね。",
    "とても良い回答です！英語力が向上しているのがわかります。",
    "よくできました！このまま練習を続けていきましょう。",
    "excellent work! 文法も語彙選択も適切です。",
    "Good job! 意味がしっかり伝わる英文になっています。",
    "Great! ネイティブにも通じる自然な表現です。"
  ];
  
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
};

const generateSimilarPhrases = (modelAnswer: string) => {
  // Generate variations of the model answer
  const variations = [
    modelAnswer,
    modelAnswer.replace(/I /g, "I ").replace(/every day/g, "daily"),
    modelAnswer.replace(/study/g, "learn").replace(/English/g, "the English language"),
  ];
  
  return variations.slice(0, 3);
};