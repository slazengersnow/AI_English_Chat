import React, { useState, useRef, useEffect } from "react";

// Web Speech API utility function
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
};

type DifficultyLevel =
  | "toeic"
  | "middle_school"
  | "high_school"
  | "basic_verbs"
  | "business_email"
  | "simulation";

interface Problem {
  japaneseSentence: string;
  modelAnswer: string;
  hints: string[];
  difficulty: string;
}

interface ChatMessage {
  id: string;
  type:
    | "problem"
    | "user_answer"
    | "evaluation"
    | "overall_evaluation"
    | "model_answer"
    | "explanation"
    | "similar_phrases"
    | "next_button"
    | "system";
  content: string;
  rating?: number;
  phrases?: string[];
  detailedComment?: string;
  timestamp: Date;
}

interface EvaluationResult {
  rating: number;
  modelAnswer: string;
  explanation: string;
  similarPhrases: string[];
  overallEvaluation?: string;
  detailedComment?: string;
  correctTranslation?: string;  // API response field
  feedback?: string;            // API response field
}

export default function ChatStyleTraining({
  difficulty,
  onBackToMenu,
  onGoToMyPage,
  initialProblem,
  isBookmarkMode,
}: {
  difficulty: DifficultyLevel;
  onBackToMenu: () => void;
  onGoToMyPage: () => void;
  initialProblem?: { japaneseSentence: string; modelAnswer: string };
  isBookmarkMode?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [problemCount, setProblemCount] = useState(1);
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Set<string>>(
    new Set(),
  );
  const [availableBookmarks, setAvailableBookmarks] = useState<string[]>([]);
  const [usedBookmarks, setUsedBookmarks] = useState<Set<string>>(new Set());
  const [usedProblems, setUsedProblems] = useState<Set<string>>(new Set());
  const [isStarted, setIsStarted] = useState(false);

  // 二重実行防止用のRef
  const loadingProblemRef = useRef(false);
  const evaluatingRef = useRef(false);
  const submittingRef = useRef(false);
  const initializedRef = useRef(false);

  // messagesEndRef を無効化（自動スクロール防止）
  // const messagesEndRef = useRef<HTMLDivElement>(null);

  // 難易度をAPIキーに変換するヘルパー関数
  const getDifficultyKey = (difficulty: DifficultyLevel): string => {
    const difficultyMap: Record<DifficultyLevel, string> = {
      toeic: "toeic",
      middle_school: "middle-school",
      high_school: "high-school",
      basic_verbs: "basic-verbs",
      business_email: "business-email",
      simulation: "simulation",
    };
    return difficultyMap[difficulty] || "middle-school";
  };

  const difficultyKey = getDifficultyKey(difficulty);

  // 自動スクロール機能を完全に無効化
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // };

  const toggleBookmark = (bookmarkKey: string) => {
    setBookmarkedProblems((prev) => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(bookmarkKey)) {
        newBookmarks.delete(bookmarkKey);
      } else {
        newBookmarks.add(bookmarkKey);
      }

      // Save to localStorage for persistence
      localStorage.setItem(
        "englishTrainingBookmarks",
        JSON.stringify([...newBookmarks]),
      );
      return newBookmarks;
    });
  };

  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedBookmarks = localStorage.getItem("englishTrainingBookmarks");
    if (savedBookmarks) {
      try {
        const bookmarksArray = JSON.parse(savedBookmarks);
        setBookmarkedProblems(new Set(bookmarksArray));

        // If in bookmark mode, prepare available bookmarks for sequential solving
        if (isBookmarkMode) {
          const problems = bookmarksArray.map(
            (bookmark: string) => bookmark.split("_")[0],
          );
          setAvailableBookmarks(problems);
          // If starting with a specific problem, mark it as used
          if (initialProblem) {
            setUsedBookmarks(new Set([initialProblem.japaneseSentence]));
          }
        }
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
      }
    }

    // 初期問題の自動読み込み（React Strict Mode対応）
    if (initialProblem && !isStarted) {
      initializeWithInitialProblem();
    } else if (!initialProblem && !isStarted && !isBookmarkMode) {
      // 通常モードで初期問題がない場合は自動的に問題を生成
      console.log("No initial problem provided, generating first problem");
      loadNewProblemFromAPI();
    }
  }, []);

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center justify-start space-x-1 h-6">
        {/* Only show the number of stars equal to the rating */}
        {Array.from({ length: rating }, (_, index) => (
          <span
            key={index}
            className="text-lg text-yellow-400"
            style={{
              filter: "drop-shadow(0 1px 3px rgba(255,193,7,0.4))",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            ⭐
          </span>
        ))}
        <span className="text-sm text-gray-700 ml-2 font-medium">
          {rating}/5点
        </span>
      </div>
    );
  };

  // 自動スクロールを無効化（解説を読んでいる最中に邪魔されるため）
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // 初期問題の設定（二重実行防止）
  const initializeWithInitialProblem = () => {
    if (loadingProblemRef.current || isStarted) return;

    setIsStarted(true);
    setCurrentProblem({
      japaneseSentence: initialProblem!.japaneseSentence,
      modelAnswer: initialProblem!.modelAnswer,
      hints: [],
      difficulty: difficulty,
    });
    setAwaitingAnswer(true);

    const problemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "problem",
      content: initialProblem!.japaneseSentence,
      timestamp: new Date(),
    };
    setMessages([problemMessage]);
  };

  // 新しい問題の読み込み（二重実行防止付き）
  const loadNewProblem = async () => {
    if (loadingProblemRef.current) {
      console.log("Problem loading already in progress, skipping...");
      return;
    }

    if (isBookmarkMode) {
      // ブックマークモードの処理
      loadBookmarkProblem();
    } else {
      // 通常モードでAPIから問題を取得
      await loadNewProblemFromAPI();
    }
  };

  const loadBookmarkProblem = () => {
    const remainingBookmarks = availableBookmarks.filter(
      (bookmark) => !usedBookmarks.has(bookmark),
    );

    if (remainingBookmarks.length === 0) {
      // 完了メッセージを表示
      const completionMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "system",
        content: "ブックマークした問題をすべて完了しました！お疲れ様でした。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completionMessage]);
      return;
    }

    // 次のブックマーク問題を選択
    const nextBookmark = remainingBookmarks[0];
    setUsedBookmarks((prev) => new Set([...prev, nextBookmark]));

    setCurrentProblem({
      japaneseSentence: nextBookmark,
      modelAnswer: "Please translate this sentence.",
      hints: [],
      difficulty: difficulty,
    });
    setAwaitingAnswer(true);

    const problemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "problem",
      content: nextBookmark,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, problemMessage]);
    setProblemCount((prev) => prev + 1);
  };

  const loadNewProblemFromAPI = async () => {
    if (loadingProblemRef.current) {
      console.log("Problem loading already in progress, skipping...");
      return;
    }

    loadingProblemRef.current = true;
    setIsLoading(true);

    try {
      console.log("Fetching problem with difficulty:", difficulty);
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch("/api/problem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficultyLevel: difficultyKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const problemData = await response.json();
      console.log("Received problem data:", problemData);

      const problem: Problem = {
        japaneseSentence: problemData.japaneseSentence,
        modelAnswer:
          problemData.modelAnswer || "Please translate this sentence.",
        hints: problemData.hints || [],
        difficulty: difficulty,
      };

      setCurrentProblem(problem);
      setAwaitingAnswer(true);

      // Track used problems to avoid repetition
      setUsedProblems((prev) => new Set([...prev, problem.japaneseSentence]));

      const problemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "problem",
        content: problem.japaneseSentence,
        timestamp: new Date(),
      };

      // Add new problem to existing messages (don't clear history)
      setMessages((prev) => [...prev, problemMessage]);
      setProblemCount((prev) => prev + 1);
      setIsStarted(true);
    } catch (error) {
      console.error("Failed to fetch problem:", error);

      // Fallback problem for each difficulty level
      const fallbackProblems = {
        toeic: "四半期報告書の提出期限を確認してください。",
        middle_school: "昨日友達と映画を見に行きました。",
        high_school: "もし時間があれば、図書館で勉強したいと思います。",
        basic_verbs: "母は毎朝コーヒーを作ります。",
        business_email: "ご確認いただき、ありがとうございます。",
        simulation: "すみません、駅への道を教えてください。",
      };

      const fallbackProblem =
        fallbackProblems[difficulty] || fallbackProblems.middle_school;

      const problem: Problem = {
        japaneseSentence: fallbackProblem,
        modelAnswer: "Please translate this sentence.",
        hints: [],
        difficulty: difficulty,
      };

      setCurrentProblem(problem);
      setAwaitingAnswer(true);

      const problemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "problem",
        content: problem.japaneseSentence,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, problemMessage]);
      setProblemCount((prev) => prev + 1);
      setIsStarted(true);
    } finally {
      setIsLoading(false);
      loadingProblemRef.current = false;
    }
  };

  const evaluateAnswerWithClaude = async (
    userAnswer: string,
    japaneseSentence: string,
    modelAnswer: string,
  ): Promise<EvaluationResult> => {
    if (evaluatingRef.current) {
      throw new Error("Evaluation already in progress");
    }

    evaluatingRef.current = true;

    try {
      console.log("Calling Claude API with:", {
        userAnswer,
        japaneseSentence,
        modelAnswer,
        difficulty,
      });

      // Add timeout to prevent freezing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/evaluate-with-claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japaneseSentence,
          userTranslation: userAnswer,
          difficultyLevel: difficultyKey,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Claude API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Claude API error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const evaluation = await response.json();
      console.log("Claude API evaluation received:", evaluation);
      return evaluation;
    } catch (error) {
      console.error("Claude API failed with error:", error);
      
      // Handle timeout/abort specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn("Claude API request timed out, using fallback evaluation");
      } else {
        console.warn("Using enhanced fallback evaluation");
      }

      // Enhanced fallback with detailed analysis based on actual user input
      let rating = 3;
      let specificFeedback = "";

      const userAnswerLower = userAnswer?.toLowerCase().trim() || "";

      // Check for meaningless inputs
      if (!userAnswer || userAnswerLower.length < 3) {
        rating = 1;
        specificFeedback = "回答が空または短すぎます。完整な英文で回答してください。";
      } else if (
        ["test", "aaa", "bbb", "123", "hello", "ok", "yes", "no"].includes(
          userAnswerLower,
        )
      ) {
        rating = 1;
        specificFeedback =
          "適当な回答ではなく、日本語文を正確に英訳してください。";
      } else {
        // Analyze content for actual translation attempt
        rating = 3; // Default good rating for meaningful attempts
        const hasValidWords = /[a-zA-Z]{3,}/.test(userAnswer);
        const hasMultipleWords = userAnswer.split(/\s+/).length >= 3;
        const hasProperStructure =
          /^[A-Z]/.test(userAnswer) && /[.!?]$/.test(userAnswer);

        if (hasValidWords && hasMultipleWords) {
          // Compare similarity to model answer for better rating
          const modelWords = modelAnswer.toLowerCase().split(/\s+/);
          const userWords = userAnswer.toLowerCase().split(/\s+/);
          const matchingWords = userWords.filter((word) =>
            modelWords.includes(word),
          ).length;
          const similarity =
            matchingWords / Math.max(modelWords.length, userWords.length);

          // More lenient evaluation similar to original system
          if (similarity > 0.6 && hasProperStructure) {
            rating = 5;
            specificFeedback = "完璧に近い回答です！文法・語彙ともに適切です。";
          } else if (
            similarity > 0.4 ||
            (hasProperStructure && hasValidWords)
          ) {
            rating = 4;
            specificFeedback = "良い回答です。意味も適切に伝わります。";
          } else if (similarity > 0.25 || hasValidWords) {
            rating = 3;
            specificFeedback =
              "基本的な意味は伝わります。この調子で続けましょう。";
          } else {
            rating = 3; // Default to 3 instead of 2 for more encouragement
            specificFeedback =
              "良い回答です。継続して練習することで更に上達します。";
          }
        } else {
          rating = 2;
          specificFeedback =
            "英文として不完全です。完整な文で回答してください。";
        }
      }

      const overallEvaluations = [
        [
          "完璧な英訳です！",
          "ネイティブレベルの表現力が身についています。この調子で更なる向上を目指しましょう。",
        ],
        [
          "素晴らしい回答です！",
          "文法・語彙ともに適切で、相手に正確に意図が伝わる表現です。",
        ],
        [
          "良い回答です。",
          "意味は十分伝わりますが、より自然な表現を意識すると更に良くなります。",
        ],
        [
          "基本的な構造から見直しましょう。",
          "英語の文法ルールを確認して、正確な文章作りを心がけてください。",
        ],
        [
          "英訳の基礎から練習しましょう。",
          "日本語の意味を正確に理解し、英語の語順で組み立てる練習を重ねてください。",
        ],
      ];

      const overallEval = overallEvaluations[5 - rating] || [
        "回答を見直しましょう。",
        "基本的な英語表現から確認してみてください。",
      ];

      // Create detailed explanations with problem-specific variations (minimum 4 lines)
      const getDetailedExplanation = (
        userAnswer: string,
        japaneseSentence: string,
        modelAnswer: string,
        rating: number,
        specificFeedback: string,
      ) => {
        const explanationTemplates = [
          // Business/Professional contexts
          {
            keywords: [
              "会議",
              "議題",
              "プロジェクト",
              "チーム",
              "売上",
              "目標",
              "承認",
              "予算",
              "スケジュール",
              "報告",
            ],
            explanations: [
              `${specificFeedback}\n模範解答「${modelAnswer}」と比較すると、${rating >= 4 ? "ビジネス英語として適切な敬語表現が使われています。" : rating >= 3 ? "意味は伝わりますが、よりフォーマルな表現を心がけると良いでしょう。" : "ビジネスシーンでは相手への配慮を示す表現が重要です。"}\n${rating >= 3 ? "この表現は実際の職場でも使える実用的なフレーズです。" : "「Could you」や「Would you mind」などの丁寧な依頼表現を覚えましょう。"}\n継続的な練習により、国際的なビジネス環境で通用する英語力が身につきます。`,

              `${specificFeedback}\n文法的には${rating >= 4 ? "完璧で、ネイティブスピーカーにも自然に聞こえる表現です。" : rating >= 3 ? "基本構造は正しく、相手に意図が明確に伝わります。" : "基本的な文法ルールの確認が必要です。"}\n語彙選択の観点から見ると、${rating >= 4 ? "場面に適した専門用語が適切に使われています。" : rating >= 3 ? "より具体的で専門的な単語を使うと印象が良くなります。" : "日常会話レベルの基本単語から段階的に覚えていきましょう。"}\n${rating >= 2 ? "この調子で練習を続ければ、必ず上達します。" : "基本的な文型パターンの反復練習をおすすめします。"}`,

              `${specificFeedback}\n英語の自然さという点では、${rating >= 4 ? "ネイティブが実際に使う表現に非常に近く、素晴らしい語感をお持ちです。" : rating >= 3 ? "意味は通じますが、もう少し英語らしい語順や表現を意識してみましょう。" : "日本語的な発想から脱却し、英語独特の表現方法を身につけることが重要です。"}\nコミュニケーション効果を考えると、${rating >= 3 ? "このレベルなら実際のビジネス場面で十分通用します。" : "相手に誤解を与えないよう、より明確で簡潔な表現を心がけましょう。"}\n今後は類似表現のバリエーションを増やすことで、より柔軟な英語表現力が身につくでしょう。`,
            ],
          },
          // Academic/Educational contexts
          {
            keywords: [
              "分析",
              "データ",
              "研究",
              "学習",
              "理解",
              "説明",
              "資料",
              "情報",
              "知識",
            ],
            explanations: [
              `${specificFeedback}\n学術的な表現として見ると、${rating >= 4 ? "正確性と明確性を兼ね備えた優秀な英訳です。" : rating >= 3 ? "基本的な意味は伝わりますが、より学術的な語彙を使うと良いでしょう。" : "学術英語の基本構造から学び直すことをおすすめします。"}\n語彙の選択では、${rating >= 4 ? "専門性の高い適切な用語が使われており、読み手に正確な情報を伝えています。" : rating >= 3 ? "一般的な単語で意味は通じますが、専門用語を使うとより説得力が増します。" : "基本的な学術用語の習得から始めましょう。"}\n文章構造については${rating >= 2 ? "論理的な組み立てができており、さらなる向上が期待できます。" : "主語・述語・目的語の関係を明確にする練習が必要です。"}\n継続的な学習により、国際的な学術環境でも通用する英語力を身につけることができます。`,
            ],
          },
          // Daily conversation contexts
          {
            keywords: [
              "お疲れ",
              "ありがとう",
              "すみません",
              "お願い",
              "確認",
              "連絡",
              "時間",
              "場所",
            ],
            explanations: [
              `${specificFeedback}\n日常会話としては、${rating >= 4 ? "自然で親しみやすい表現が使われており、相手との良好な関係性を築けます。" : rating >= 3 ? "基本的なコミュニケーションは取れますが、もう少し自然な表現を心がけましょう。" : "日常的によく使われる基本フレーズの習得が必要です。"}\n感情表現の観点では、${rating >= 4 ? "相手への配慮や感謝の気持ちが適切に表現されています。" : rating >= 3 ? "気持ちは伝わりますが、より豊かな感情表現を身につけると良いでしょう。" : "基本的な感情を表す単語や表現から覚えていきましょう。"}\n実用性を考えると、${rating >= 3 ? "この表現は実際の場面でそのまま使える便利なフレーズです。" : "日常生活でよく使う基本的な表現パターンを覚えることから始めましょう。"}\n毎日の練習を通じて、より自然で流暢な英語コミュニケーション能力を向上させることができます。`,
            ],
          },
        ];

        // Find matching template based on keywords
        let selectedTemplate = explanationTemplates[2]; // Default to daily conversation
        for (const template of explanationTemplates) {
          if (
            template.keywords.some((keyword) =>
              japaneseSentence.includes(keyword),
            )
          ) {
            selectedTemplate = template;
            break;
          }
        }

        // Select random explanation from the matched template
        const randomIndex = Math.floor(
          Math.random() * selectedTemplate.explanations.length,
        );
        return selectedTemplate.explanations[randomIndex] || specificFeedback;
      };

      const detailedExplanation = getDetailedExplanation(
        userAnswer,
        japaneseSentence,
        modelAnswer,
        rating,
        specificFeedback,
      );

      const fallbackSimilarPhrases: Record<string, string[]> = {
        "明日は友達と遊びます。": [
          "I will hang out with my friends tomorrow.",
          "Tomorrow I'm going to spend time with my friends.",
        ],
        "私は毎日学校に行きます。": [
          "I go to school every day.",
          "I attend school daily.",
        ],
        "今日は雨が降っています。": [
          "It is raining today.",
          "It's a rainy day today.",
        ],
        "彼女は本を読むのが好きです。": [
          "She likes reading books.",
          "She enjoys reading books.",
        ],
        "私たちは昨日映画を見ました。": [
          "We watched a movie yesterday.",
          "We saw a film yesterday.",
        ],
      };

      // Generate appropriate model answer based on Japanese sentence
      const generateModelAnswer = (japaneseSentence: string): string => {
        const modelAnswers: Record<string, string> = {
          "明日は友達と遊びます。": "I will play with my friends tomorrow.",
          "私は毎日学校に行きます。": "I go to school every day.",
          "今日は雨が降っています。": "It is raining today.",
          "彼女は本を読むのが好きです。": "She likes reading books.",
          "私たちは昨日映画を見ました。": "We watched a movie yesterday.",
          "彼は毎朝走ります。": "He runs every morning.",
          "私は本を読みます。": "I read books.",
          "彼女は料理を作ります。": "She cooks meals.",
          "私たちは音楽を聞きます。": "We listen to music.",
          "子供たちは公園で遊びます。": "Children play in the park.",
        };
        return modelAnswers[japaneseSentence] || "Please translate this sentence accurately.";
      };

      return {
        rating,
        overallEvaluation: overallEval[0] || "良い回答です",
        detailedComment: overallEval[1] || "継続的な練習で更に向上できます",
        correctTranslation: generateModelAnswer(japaneseSentence),
        modelAnswer: generateModelAnswer(japaneseSentence),
        explanation: detailedExplanation,
        similarPhrases: fallbackSimilarPhrases[japaneseSentence] || [
          "Good effort! Keep practicing.",
          "Try using more natural English expressions.",
        ],
      };
    } finally {
      evaluatingRef.current = false;
    }
  };

  const submitAnswer = async () => {
    if (!userInput.trim() || !currentProblem || !awaitingAnswer) return;

    if (submittingRef.current) {
      console.log("Answer submission already in progress, skipping...");
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    setAwaitingAnswer(false);

    // Add user answer to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user_answer",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentUserInput = userInput;
    setUserInput("");

    try {
      // Get evaluation from Claude
      const evaluation = await evaluateAnswerWithClaude(
        currentUserInput,
        currentProblem.japaneseSentence,
        currentProblem.modelAnswer,
      );

      // Add evaluation messages in sequence with overall evaluation first
      setTimeout(() => {
        const ratingMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "evaluation",
          content: `${evaluation.rating}/5点`,
          rating: evaluation.rating,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, ratingMessage]);

        setTimeout(() => {
          // Use Claude's overallEvaluation if available, otherwise fallback to rating-based evaluation
          const overallEval =
            evaluation.overallEvaluation ||
            (evaluation.rating >= 4
              ? "素晴らしい！完璧な回答です。"
              : evaluation.rating >= 3
                ? "良い回答ですが、改善の余地があります。"
                : "もう少し自然な表現を心がけましょう。");

          const overallMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: "overall_evaluation",
            content: overallEval,
            detailedComment: evaluation.detailedComment,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, overallMessage]);

          setTimeout(() => {
            const modelAnswerMessage: ChatMessage = {
              id: (Date.now() + 3).toString(),
              type: "model_answer",
              content: evaluation.correctTranslation || evaluation.modelAnswer || currentProblem.modelAnswer,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, modelAnswerMessage]);

            setTimeout(() => {
              const explanationMessage: ChatMessage = {
                id: (Date.now() + 4).toString(),
                type: "explanation",
                content: evaluation.explanation || evaluation.feedback || "Good effort! Keep practicing to improve.",
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, explanationMessage]);

              setTimeout(() => {
                const phrasesMessage: ChatMessage = {
                  id: (Date.now() + 5).toString(),
                  type: "similar_phrases",
                  content: "類似フレーズ",
                  phrases: evaluation.similarPhrases || [],
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, phrasesMessage]);

                // 自動的に次の問題を生成
                setTimeout(() => {
                  loadNewProblem();
                }, 1000);
              }, 800);
            }, 800);
          }, 800);
        }, 800);
      }, 500);
    } catch (error) {
      console.error("Evaluation error:", error);
      setAwaitingAnswer(true); // Re-enable input on error
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
      evaluatingRef.current = false; // Critical: Reset evaluation flag
    }
  };

  const handleNextProblem = () => {
    if (loadingProblemRef.current) {
      console.log(
        "Problem loading already in progress, skipping next button...",
      );
      return;
    }
    loadNewProblem();
  };

  const handleStartTraining = () => {
    if (loadingProblemRef.current || isStarted) {
      console.log("Training already started or loading in progress...");
      return;
    }
    console.log("Starting training manually");
    loadNewProblemFromAPI();
  };

  const renderMessage = (message: ChatMessage) => {
    switch (message.type) {
      case "problem":
        const problemNumber =
          messages
            .filter((m) => m.type === "problem")
            .findIndex((m) => m.id === message.id) + 1;
        const bookmarkKey = `${message.content}_${problemNumber}`;
        const isBookmarked = bookmarkedProblems.has(bookmarkKey);
        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div
              className={`${isBookmarked ? "bg-yellow-400" : "bg-blue-400"} rounded-full w-12 h-8 flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer transition-colors hover:bg-yellow-500`}
              onClick={() => toggleBookmark(bookmarkKey)}
              title={isBookmarked ? "ブックマークを解除" : "ブックマークに追加"}
            >
              <span className="text-white text-sm">
                {isBookmarked ? "⭐" : "☆"}
              </span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 max-w-sm shadow-sm border">
              <div className="text-sm font-medium text-gray-800 mb-1">
                問題 {problemNumber} - 翻訳してください
              </div>
              <div className="text-gray-800">{message.content}</div>
            </div>
          </div>
        );

      case "user_answer":
        return (
          <div key={message.id} className="flex justify-end mb-6">
            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-sm md:mr-[72px]">
              {message.content}
            </div>
          </div>
        );

      case "evaluation":
        // Unified evaluation box - find all related messages
        const relatedMessages = messages.filter(
          (m) =>
            m.timestamp &&
            message.timestamp &&
            Math.abs(m.timestamp.getTime() - message.timestamp.getTime()) <
              5000 &&
            [
              "evaluation",
              "overall_evaluation",
              "model_answer",
              "explanation",
              "similar_phrases",
            ].includes(m.type),
        );

        const overallEval = relatedMessages.find(
          (m) => m.type === "overall_evaluation",
        );
        const modelAnswer = relatedMessages.find(
          (m) => m.type === "model_answer",
        );
        const explanation = relatedMessages.find(
          (m) => m.type === "explanation",
        );
        const similarPhrases = relatedMessages.find(
          (m) => m.type === "similar_phrases",
        );

        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div className="bg-green-500 rounded-full w-12 h-8 flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-white text-sm">⭐</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-4 max-w-lg shadow-sm border space-y-4">
              {/* Star Rating - Fixed Height */}
              <div className="rating-box flex items-center justify-start bg-transparent border border-gray-200 rounded-lg px-3 py-1 h-8">
                {renderStarRating(message.rating || 0)}
              </div>

              {/* Overall Evaluation */}
              {overallEval && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-800 mb-1">
                    全体評価
                  </div>
                  <div className="text-gray-800 font-medium mb-2">
                    {overallEval.content}
                  </div>
                  {overallEval.detailedComment && (
                    <div className="text-gray-700 text-sm">
                      {overallEval.detailedComment}
                    </div>
                  )}
                </div>
              )}

              {/* Model Answer */}
              {modelAnswer && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-green-800">
                      模範解答
                    </div>
                    <button
                      onClick={() => speakText(modelAnswer.content)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                      title="音声で聞く"
                    >
                      🎵 音声
                    </button>
                  </div>
                  <div className="text-gray-800 text-lg">
                    {modelAnswer.content}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {explanation && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    解説
                  </div>
                  <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                    {explanation.content}
                  </div>
                </div>
              )}

              {/* Similar Phrases */}
              {similarPhrases && similarPhrases.phrases && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-sm font-medium text-purple-800 mb-2">
                    類似フレーズ
                  </div>
                  <div className="space-y-1">
                    {similarPhrases.phrases.map((phrase, index) => (
                      <div key={index} className="flex items-center justify-between text-gray-800 text-base">
                        <span>• {phrase}</span>
                        <button
                          onClick={() => speakText(phrase)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium transition-colors shadow-sm hover:shadow-md ml-2 flex-shrink-0"
                          title="音声で聞く"
                        >
                          🎵
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "overall_evaluation":
      case "model_answer":
      case "explanation":
      case "similar_phrases":
        // These are now handled within the evaluation case - return null to avoid duplication
        return null;

      case "next_button":
        return (
          <div key={message.id} className="flex justify-center mb-6">
            <button
              onClick={handleNextProblem}
              disabled={loadingProblemRef.current}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm"
            >
              {loadingProblemRef.current ? "読み込み中..." : "次の問題"}
            </button>
          </div>
        );

      case "system":
        return (
          <div key={message.id} className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-lg px-4 py-3 text-center">
              <div className="text-blue-800 font-medium">{message.content}</div>
              {message.content.includes("完了しました") && (
                <button
                  onClick={onBackToMenu}
                  className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  メニューに戻る
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="text-gray-600 hover:text-gray-800"
          >
            ← メニューに戻る
          </button>
          <h1 className="font-medium text-gray-900">英作文トレーニング</h1>
          <button
            onClick={onGoToMyPage}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            👤 マイページ
          </button>
        </div>
      </div>

      {/* Start Training Button (if not started and no initial problem) */}
      {!isStarted && !initialProblem && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              英作文トレーニングを始めましょう
            </h2>
            <button
              onClick={handleStartTraining}
              disabled={loadingProblemRef.current}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm"
            >
              {loadingProblemRef.current
                ? "問題を読み込み中..."
                : "練習を開始する"}
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {(isStarted || initialProblem) && (
        <div className="flex-1 overflow-y-auto px-4 py-6 relative">
          {/* Scroll to Top Button - Fixed position in bottom right */}
          <button
            onClick={() => {
              // Get the current chat container that has the scrollable content
              const chatContainer = document.querySelector('.flex-1.overflow-y-auto');
              console.log('Scroll button clicked, found container:', chatContainer);
              if (chatContainer) {
                chatContainer.scrollTo({ top: 0, behavior: 'smooth' });
                console.log('Scrolled to top');
              } else {
                // Fallback: scroll the window
                window.scrollTo({ top: 0, behavior: 'smooth' });
                console.log('Scrolled window to top');
              }
            }}
            className="fixed bottom-24 right-6 z-50 bg-gray-300 hover:bg-gray-400 text-gray-600 p-1 rounded-full shadow-md transition-colors text-xs"
            title="上に戻る"
            style={{ position: 'fixed', bottom: '96px', right: '24px', zIndex: 50, width: '32px', height: '32px', fontSize: '12px' }}
          >
            ↑
          </button>
          
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => renderMessage(message))}
            {/* Remove loading message to fix flash issue */}
          </div>
        </div>
      )}

      {/* Input Area */}
      {awaitingAnswer && (isStarted || initialProblem) && (
        <div className="bg-white border-t px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !submittingRef.current && submitAnswer()
                }
                placeholder="英訳を入力してください..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || submittingRef.current}
              />
              <button
                onClick={submitAnswer}
                disabled={isLoading || !userInput.trim() || submittingRef.current}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
