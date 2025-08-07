import React, { useState, useRef, useEffect } from "react";
import { getRandomProblem } from "./MockProblemData";

type DifficultyLevel = "toeic" | "middle_school" | "high_school" | "basic_verbs" | "business_email" | "simulation";

interface Problem {
  japaneseSentence: string;
  modelAnswer: string;
  hints: string[];
  difficulty: string;
}

interface ChatMessage {
  id: string;
  type: "problem" | "user_answer" | "evaluation" | "overall_evaluation" | "model_answer" | "explanation" | "similar_phrases" | "next_button";
  content: string;
  rating?: number;
  phrases?: string[];
  timestamp: Date;
}

interface EvaluationResult {
  rating: number;
  modelAnswer: string;
  explanation: string;
  similarPhrases: string[];
  overallEvaluation?: string;
}

export default function ChatStyleTraining({ difficulty, onBackToMenu }: { 
  difficulty: DifficultyLevel;
  onBackToMenu: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [problemCount, setProblemCount] = useState(1);
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Set<string>>(new Set());
  const [usedProblems, setUsedProblems] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleBookmark = (problemId: string) => {
    setBookmarkedProblems(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(problemId)) {
        newBookmarks.delete(problemId);
      } else {
        newBookmarks.add(problemId);
      }
      return newBookmarks;
    });
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center justify-start space-x-1 h-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
        <span className="text-xs text-gray-600 ml-2">{rating}/5点</span>
      </div>
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load first problem
    const problem = getRandomProblem(difficulty, usedProblems);
    if (problem) {
      setCurrentProblem(problem);
      setAwaitingAnswer(true);
      
      // Track first problem
      setUsedProblems(prev => new Set([...prev, problem.japaneseSentence]));
      
      const problemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "problem",
        content: problem.japaneseSentence,
        timestamp: new Date()
      };
      
      // Initial problem setup
      setMessages([problemMessage]);
    }
  }, []);

  const loadNewProblem = () => {
    const problem = getRandomProblem(difficulty, usedProblems);
    if (problem) {
      setCurrentProblem(problem);
      setAwaitingAnswer(true);
      
      // Track used problems to avoid repetition
      setUsedProblems(prev => new Set([...prev, problem.japaneseSentence]));
      
      const problemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "problem",
        content: problem.japaneseSentence,
        timestamp: new Date()
      };
      
      // Add new problem to existing messages (don't clear history)
      setMessages(prev => [...prev, problemMessage]);
      setProblemCount(prev => prev + 1);
    }
  };

  const evaluateAnswerWithClaude = async (userAnswer: string, japaneseSentence: string, modelAnswer: string): Promise<EvaluationResult> => {
    try {
      console.log('Calling Claude API with:', { userAnswer, japaneseSentence, modelAnswer, difficulty });
      
      const response = await fetch('/api/evaluate-with-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer,
          japaneseSentence,
          modelAnswer,
          difficulty
        })
      });

      console.log('Claude API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const evaluation = await response.json();
      console.log('Claude API evaluation received:', evaluation);
      return evaluation;
    } catch (error) {
      console.error('Claude API failed with error:', error);
      console.warn('Using enhanced fallback evaluation');
      
      // Enhanced fallback with detailed analysis based on actual user input
      let rating = 1;
      let specificFeedback = "";
      
      const userAnswerLower = userAnswer?.toLowerCase().trim() || "";
      
      // Check for meaningless inputs
      if (!userAnswer || userAnswerLower.length < 3) {
        rating = 1;
        specificFeedback = "回答が空または短すぎます。";
      } else if (['test', 'aaa', 'bbb', '123', 'hello', 'ok', 'yes', 'no'].includes(userAnswerLower)) {
        rating = 1;
        specificFeedback = "適当な回答ではなく、日本語文を正確に英訳してください。";
      } else {
        // Analyze content for actual translation attempt
        const hasValidWords = /[a-zA-Z]{3,}/.test(userAnswer);
        const hasMultipleWords = userAnswer.split(/\s+/).length >= 3;
        const hasProperStructure = /^[A-Z]/.test(userAnswer) && /[.!?]$/.test(userAnswer);
        
        if (hasValidWords && hasMultipleWords) {
          // Compare similarity to model answer for better rating
          const modelWords = modelAnswer.toLowerCase().split(/\s+/);
          const userWords = userAnswer.toLowerCase().split(/\s+/);
          const matchingWords = userWords.filter(word => modelWords.includes(word)).length;
          const similarity = matchingWords / Math.max(modelWords.length, userWords.length);
          
          if (similarity > 0.7 && hasProperStructure) {
            rating = 5;
            specificFeedback = "完璧に近い回答です！文法・語彙ともに適切です。";
          } else if (similarity > 0.5 || hasProperStructure) {
            rating = 4;
            specificFeedback = "良い回答です。意味も適切に伝わります。";
          } else if (similarity > 0.3) {
            rating = 3;
            specificFeedback = "基本的な意味は伝わりますが、より自然な表現を心がけましょう。";
          } else {
            rating = 2;
            specificFeedback = "翻訳としては不十分です。模範解答を参考に改善してください。";
          }
        } else {
          rating = 2;
          specificFeedback = "英文として不完全です。完整な文で回答してください。";
        }
      }
      
      const overallEvaluations = [
        "完璧です！",
        "素晴らしい回答です！",
        "良い回答ですが、改善の余地があります。",
        "基本的な構造から見直しましょう。",
        "適切な英訳を心がけてください。"
      ];
      
      const overallEval = overallEvaluations[5 - rating] || "回答を見直しましょう。";

      // Create individualized explanation
      const detailedExplanation = `あなたの回答「${userAnswer}」について分析します。${specificFeedback} 模範解答「${modelAnswer}」と比較すると、${rating >= 3 ? '意味は伝わりますが、より自然な表現を使うことで' : '基本的な文法構造を整えることで'}英語らしい表現になります。${rating === 1 ? '日本語の意味を正確に理解し、英語の語順で組み立ててください。' : '今後は語彙選択と文法的な正確性に注意して練習を続けてください。'}`;

      const fallbackSimilarPhrases: Record<string, string[]> = {
        "このデータを分析してください。": [
          "Could you analyze this data?",
          "Would you please examine this data?"
        ],
        "予算の承認が必要です。": [
          "Budget approval is required.",
          "We require budget authorization."
        ],
        "会議の議題を事前に共有してください。": [
          "Could you please share the meeting agenda beforehand?",
          "Would you mind sharing the agenda in advance?"
        ]
      };
      
      return {
        rating,
        overallEvaluation: overallEval,
        modelAnswer,
        explanation: detailedExplanation,
        similarPhrases: fallbackSimilarPhrases[japaneseSentence] || [
          "Please consider using more natural phrasing.",
          "Try expressing this idea differently."
        ]
      };
    }
  };

  const submitAnswer = async () => {
    if (!userInput.trim() || !currentProblem || !awaitingAnswer) return;

    setIsLoading(true);
    setAwaitingAnswer(false);

    // Add user answer to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user_answer",
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput("");

    try {
      // Get evaluation from Claude
      const evaluation = await evaluateAnswerWithClaude(
        userInput,
        currentProblem.japaneseSentence,
        currentProblem.modelAnswer
      );

      // Add evaluation messages in sequence with overall evaluation first
      setTimeout(() => {
        const ratingMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "evaluation",
          content: `${evaluation.rating}/5点`,
          rating: evaluation.rating,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, ratingMessage]);

        setTimeout(() => {
          // Use Claude's overallEvaluation if available, otherwise fallback to rating-based evaluation
          const overallEval = evaluation.overallEvaluation || 
                            (evaluation.rating >= 4 ? "素晴らしい！完璧な回答です。" : 
                             evaluation.rating >= 3 ? "良い回答ですが、改善の余地があります。" : 
                             "もう少し自然な表現を心がけましょう。");
          
          const overallMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: "overall_evaluation",
            content: overallEval,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, overallMessage]);

          setTimeout(() => {
            const modelAnswerMessage: ChatMessage = {
              id: (Date.now() + 3).toString(),
              type: "model_answer",
              content: evaluation.modelAnswer,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, modelAnswerMessage]);

            setTimeout(() => {
              const explanationMessage: ChatMessage = {
                id: (Date.now() + 4).toString(),
                type: "explanation",
                content: evaluation.explanation,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, explanationMessage]);

              setTimeout(() => {
                const phrasesMessage: ChatMessage = {
                  id: (Date.now() + 5).toString(),
                  type: "similar_phrases",
                  content: "類似フレーズ",
                  phrases: evaluation.similarPhrases,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, phrasesMessage]);

                // Auto-generate next problem after 3 seconds to allow reading
                setTimeout(() => {
                  loadNewProblem();
                }, 3000);
              }, 800);
            }, 800);
          }, 800);
        }, 800);
      }, 500);

    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextProblem = () => {
    loadNewProblem();
  };

  const renderMessage = (message: ChatMessage) => {
    switch (message.type) {
      case "problem":
        const isBookmarked = bookmarkedProblems.has(message.id);
        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div 
              className={`${isBookmarked ? 'bg-blue-500' : 'bg-blue-400'} rounded-full w-12 h-8 flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer transition-colors hover:bg-blue-600`}
              onClick={() => toggleBookmark(message.id)}
            >
              <span className="text-white text-sm">
                {isBookmarked ? '⭐' : '☆'}
              </span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 max-w-sm shadow-sm border">
              <div className="text-sm font-medium text-gray-800 mb-1">問題 {messages.filter(m => m.type === "problem").findIndex(m => m.id === message.id) + 1} - 翻訳してください</div>
              <div className="text-gray-800">{message.content}</div>
            </div>
          </div>
        );

      case "user_answer":
        return (
          <div key={message.id} className="flex justify-end mb-6">
            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-sm">
              {message.content}
            </div>
          </div>
        );

      case "evaluation":
        // Unified evaluation box - find all related messages
        const relatedMessages = messages.filter(m => 
          m.timestamp && message.timestamp && 
          Math.abs(m.timestamp.getTime() - message.timestamp.getTime()) < 5000 &&
          ["evaluation", "overall_evaluation", "model_answer", "explanation", "similar_phrases"].includes(m.type)
        );
        
        const overallEval = relatedMessages.find(m => m.type === "overall_evaluation");
        const modelAnswer = relatedMessages.find(m => m.type === "model_answer");
        const explanation = relatedMessages.find(m => m.type === "explanation");
        const similarPhrases = relatedMessages.find(m => m.type === "similar_phrases");
        
        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div className="bg-green-500 rounded-full w-12 h-8 flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-white text-sm">⭐</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-4 max-w-lg shadow-sm border space-y-4">
              {/* Star Rating - Fixed Height */}
              <div className="rating-box flex items-center justify-start bg-white border border-gray-200 rounded-lg px-3 py-1 h-8">
                {renderStarRating(message.rating || 0)}
              </div>
              
              {/* Overall Evaluation */}
              {overallEval && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-800 mb-1">全体評価</div>
                  <div className="text-gray-800">{overallEval.content}</div>
                </div>
              )}
              
              {/* Model Answer */}
              {modelAnswer && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-1">模範解答</div>
                  <div className="text-gray-800 font-bold">{modelAnswer.content}</div>
                </div>
              )}
              
              {/* Explanation */}
              {explanation && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm font-medium text-blue-800 mb-1">解説</div>
                  <div className="text-gray-800 whitespace-pre-line leading-relaxed">{explanation.content}</div>
                </div>
              )}
              
              {/* Similar Phrases */}
              {similarPhrases && similarPhrases.phrases && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-sm font-medium text-purple-800 mb-2">類似フレーズ</div>
                  <div className="space-y-1">
                    {similarPhrases.phrases.map((phrase, index) => (
                      <div key={index} className="text-gray-800 text-sm">• {phrase}</div>
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
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm"
            >
              次の問題
            </button>
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
          <button className="text-gray-600">
            👤 マイページ
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.map((message) => renderMessage(message))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-green-500 rounded-full w-12 h-8 flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-white text-sm">⭐</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">評価中...</span>
              </div>
            </div>
          </div>
        )}
        {awaitingAnswer && !isLoading && (
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
              英訳を入力してください...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {awaitingAnswer && (
        <div className="bg-white border-t px-4 py-3">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
              placeholder="英訳を入力してください..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={submitAnswer}
              disabled={isLoading || !userInput.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}