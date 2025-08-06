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

export const getRandomProblem = (difficulty: string) => {
  const problems = mockProblems[difficulty] || mockProblems.middle_school;
  return problems[Math.floor(Math.random() * problems.length)];
};

export const evaluateAnswer = (userAnswer: string, correctAnswer: string) => {
  if (!userAnswer || userAnswer.trim() === "") {
    return {
      rating: 1,
      feedback: "回答を入力してください。",
      similarPhrases: []
    };
  }
  
  const userLower = userAnswer.toLowerCase().trim();
  const correctLower = correctAnswer.toLowerCase().trim();
  
  let rating = 2;
  let feedback = "もう一度挑戦してみましょう。";
  
  // Simple scoring based on word matching
  const userWords = userLower.split(/\s+/);
  const correctWords = correctLower.split(/\s+/);
  const matchCount = userWords.filter(word => correctWords.includes(word)).length;
  const matchRatio = matchCount / correctWords.length;
  
  if (matchRatio >= 0.8) {
    rating = 5;
    feedback = "素晴らしい！完璧な回答です。";
  } else if (matchRatio >= 0.6) {
    rating = 4;
    feedback = "とても良い回答です。少し改善の余地があります。";
  } else if (matchRatio >= 0.4) {
    rating = 3;
    feedback = "良い回答です。もう少し正確性を高めましょう。";
  }
  
  return {
    rating,
    feedback,
    similarPhrases: [
      "Alternative expression 1",
      "Alternative expression 2",
      "Alternative expression 3"
    ]
  };
};