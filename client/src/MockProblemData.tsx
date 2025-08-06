// Mock data for offline problem practice
export const mockProblems = {
  toeic: [
    {
      japaneseSentence: "会議の議題を事前に共有してください。",
      modelAnswer: "Please share the meeting agenda in advance.",
      hints: ["share", "agenda", "in advance"],
      difficulty: "toeic"
    },
    {
      japaneseSentence: "来月の売上目標を達成する必要があります。",
      modelAnswer: "We need to achieve next month's sales target.",
      hints: ["achieve", "sales target", "next month"],
      difficulty: "toeic"
    },
    {
      japaneseSentence: "このプロジェクトの進捗を報告してください。",
      modelAnswer: "Please report the progress of this project.",
      hints: ["report", "progress", "project"],
      difficulty: "toeic"
    },
    {
      japaneseSentence: "予算の承認が必要です。",
      modelAnswer: "We need budget approval.",
      hints: ["budget", "approval", "need"],
      difficulty: "toeic"
    },
    {
      japaneseSentence: "締切を延長できますか？",
      modelAnswer: "Can we extend the deadline?",
      hints: ["extend", "deadline", "can"],
      difficulty: "toeic"
    },
    {
      japaneseSentence: "このデータを分析してください。",
      modelAnswer: "Please analyze this data.",
      hints: ["analyze", "data", "please"],
      difficulty: "toeic"
    }
  ],
  middle_school: [
    {
      japaneseSentence: "私は毎日学校に歩いて行きます。",
      modelAnswer: "I walk to school every day.",
      hints: ["walk", "every day", "school"],
      difficulty: "middle_school"
    },
    {
      japaneseSentence: "彼女は英語を勉強しています。",
      modelAnswer: "She is studying English.",
      hints: ["study", "English", "present continuous"],
      difficulty: "middle_school"
    }
  ],
  high_school: [
    {
      japaneseSentence: "環境問題について議論する必要があります。",
      modelAnswer: "We need to discuss environmental issues.",
      hints: ["discuss", "environmental", "issues"],
      difficulty: "high_school"
    }
  ],
  basic_verbs: [
    {
      japaneseSentence: "彼は毎朝コーヒーを飲みます。",
      modelAnswer: "He drinks coffee every morning.",
      hints: ["drinks", "coffee", "every morning"],
      difficulty: "basic_verbs"
    }
  ],
  business_email: [
    {
      japaneseSentence: "添付ファイルをご確認ください。",
      modelAnswer: "Please check the attached file.",
      hints: ["check", "attached", "file"],
      difficulty: "business_email"
    }
  ],
  simulation: [
    {
      japaneseSentence: "レストランで席を予約したいです。",
      modelAnswer: "I would like to reserve a table at the restaurant.",
      hints: ["reserve", "table", "restaurant"],
      difficulty: "simulation"
    }
  ]
};

export const getRandomProblem = (difficulty: string, usedProblems: Set<string> = new Set()) => {
  const problems = mockProblems[difficulty as keyof typeof mockProblems] || mockProblems.middle_school;
  const availableProblems = problems.filter((p: any) => !usedProblems.has(p.japaneseSentence));
  
  // If all problems used, reset and start over
  if (availableProblems.length === 0) {
    return problems[Math.floor(Math.random() * problems.length)];
  }
  
  return availableProblems[Math.floor(Math.random() * availableProblems.length)];
};

export const evaluateAnswer = (userAnswer: string, correctAnswer: string) => {
  if (!userAnswer || userAnswer.trim() === "") {
    return {
      rating: 1,
      feedback: "回答を入力してください。回答が空です。",
      similarPhrases: ["Please provide an answer", "Your response is empty", "Input required"]
    };
  }

  // More strict evaluation logic
  const userLower = userAnswer.toLowerCase().trim();
  const correctLower = correctAnswer.toLowerCase().trim();
  
  // Check for exact match
  if (userLower === correctLower) {
    return {
      rating: 5,
      feedback: "完璧です！正確な翻訳です。",
      similarPhrases: ["Excellent work!", "Perfect translation!", "Outstanding!"]
    };
  }
  
  // Check for key words and grammar structure
  const correctWords = correctLower.split(/\s+/);
  const userWords = userLower.split(/\s+/);
  const matchedWords = userWords.filter(word => correctWords.includes(word));
  
  const matchRatio = matchedWords.length / correctWords.length;
  const lengthDiff = Math.abs(userWords.length - correctWords.length);
  
  // Check for random/nonsense answers
  const isRandomAnswer = userAnswer.length < 3 || 
                         /^[a-z]{1,3}$/.test(userLower) || 
                         userLower.includes("test") ||
                         userLower.includes("aaa") ||
                         userLower.includes("abc") ||
                         userLower.includes("あ") ||
                         userLower.includes("てきとう");
  
  if (isRandomAnswer || matchRatio < 0.2) {
    return {
      rating: 1,
      feedback: "適切な英訳を入力してください。この回答は不適切です。",
      similarPhrases: ["Please provide a proper translation", "Invalid response", "Try a real English sentence"]
    };
  }
  
  if (matchRatio > 0.8 && lengthDiff <= 2) {
    return {
      rating: 4,
      feedback: "とても良い回答です！ほぼ正確な翻訳です。",
      similarPhrases: ["Very good translation!", "Almost perfect!", "Great job!"]
    };
  } else if (matchRatio > 0.5) {
    return {
      rating: 3,
      feedback: "良い努力です。いくつかの重要な単語が含まれています。",
      similarPhrases: ["Good effort!", "Some correct elements", "Keep improving!"]
    };
  } else {
    return {
      rating: 2,
      feedback: "もう一度挑戦してみましょう。正しい単語をより多く含めてください。",
      similarPhrases: ["Try again with more accuracy", "Include more correct words", "Practice more!"]
    };
  }
};