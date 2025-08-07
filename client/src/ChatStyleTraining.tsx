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

  const toggleBookmark = (bookmarkKey: string) => {
    setBookmarkedProblems(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(bookmarkKey)) {
        newBookmarks.delete(bookmarkKey);
      } else {
        newBookmarks.add(bookmarkKey);
      }
      
      // Save to localStorage for persistence
      localStorage.setItem('englishTrainingBookmarks', JSON.stringify([...newBookmarks]));
      return newBookmarks;
    });
  };

  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('englishTrainingBookmarks');
    if (savedBookmarks) {
      try {
        const bookmarksArray = JSON.parse(savedBookmarks);
        setBookmarkedProblems(new Set(bookmarksArray));
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
  }, []);

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center justify-start space-x-1 h-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            style={{ 
              filter: star <= rating ? 'drop-shadow(0 1px 3px rgba(255,193,7,0.4))' : 'none',
              textShadow: star <= rating ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            ⭐
          </span>
        ))}
        <span className="text-sm text-gray-700 ml-2 font-medium">{rating}/5点</span>
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
        ["完璧な英訳です！", "ネイティブレベルの表現力が身についています。この調子で更なる向上を目指しましょう。"],
        ["素晴らしい回答です！", "文法・語彙ともに適切で、相手に正確に意図が伝わる表現です。"],
        ["良い回答です。", "意味は十分伝わりますが、より自然な表現を意識すると更に良くなります。"],
        ["基本的な構造から見直しましょう。", "英語の文法ルールを確認して、正確な文章作りを心がけてください。"],
        ["英訳の基礎から練習しましょう。", "日本語の意味を正確に理解し、英語の語順で組み立てる練習を重ねてください。"]
      ];
      
      const overallEval = overallEvaluations[5 - rating] || ["回答を見直しましょう。", "基本的な英語表現から確認してみてください。"];

      // Create detailed explanations with problem-specific variations (minimum 4 lines)
      const getDetailedExplanation = (userAnswer: string, japaneseSentence: string, modelAnswer: string, rating: number, specificFeedback: string) => {
        const explanationTemplates = [
          // Business/Professional contexts
          {
            keywords: ["会議", "議題", "プロジェクト", "チーム", "売上", "目標", "承認", "予算", "スケジュール", "報告"],
            explanations: [
              `${specificFeedback}\n模範解答「${modelAnswer}」と比較すると、${rating >= 4 ? 'ビジネス英語として適切な敬語表現が使われています。' : rating >= 3 ? '意味は伝わりますが、よりフォーマルな表現を心がけると良いでしょう。' : 'ビジネスシーンでは相手への配慮を示す表現が重要です。'}\n${rating >= 3 ? 'この表現は実際の職場でも使える実用的なフレーズです。' : '「Could you」や「Would you mind」などの丁寧な依頼表現を覚えましょう。'}\n継続的な練習により、国際的なビジネス環境で通用する英語力が身につきます。`,
              
              `${specificFeedback}\n文法的には${rating >= 4 ? '完璧で、ネイティブスピーカーにも自然に聞こえる表現です。' : rating >= 3 ? '基本構造は正しく、相手に意図が明確に伝わります。' : '基本的な文法ルールの確認が必要です。'}\n語彙選択の観点から見ると、${rating >= 4 ? '場面に適した専門用語が適切に使われています。' : rating >= 3 ? 'より具体的で専門的な単語を使うと印象が良くなります。' : '日常会話レベルの基本単語から段階的に覚えていきましょう。'}\n${rating >= 2 ? 'この調子で練習を続ければ、必ず上達します。' : '基本的な文型パターンの反復練習をおすすめします。'}`,
              
              `${specificFeedback}\n英語の自然さという点では、${rating >= 4 ? 'ネイティブが実際に使う表現に非常に近く、素晴らしい語感をお持ちです。' : rating >= 3 ? '意味は通じますが、もう少し英語らしい語順や表現を意識してみましょう。' : '日本語的な発想から脱却し、英語独特の表現方法を身につけることが重要です。'}\nコミュニケーション効果を考えると、${rating >= 3 ? 'このレベルなら実際のビジネス場面で十分通用します。' : '相手に誤解を与えないよう、より明確で簡潔な表現を心がけましょう。'}\n今後は類似表現のバリエーションを増やすことで、より柔軟な英語表現力が身につくでしょう。`
            ]
          },
          // Academic/Educational contexts
          {
            keywords: ["分析", "データ", "研究", "学習", "理解", "説明", "資料", "情報", "知識"],
            explanations: [
              `${specificFeedback}\n学術的な表現として見ると、${rating >= 4 ? '正確性と明確性を兼ね備えた優秀な英訳です。' : rating >= 3 ? '基本的な意味は伝わりますが、より学術的な語彙を使うと良いでしょう。' : '学術英語の基本構造から学び直すことをおすすめします。'}\n語彙の選択では、${rating >= 4 ? '専門性の高い適切な用語が使われており、読み手に正確な情報を伝えています。' : rating >= 3 ? '一般的な単語で意味は通じますが、専門用語を使うとより説得力が増します。' : '基本的な学術用語の習得から始めましょう。'}\n文章構造については${rating >= 2 ? '論理的な組み立てができており、さらなる向上が期待できます。' : '主語・述語・目的語の関係を明確にする練習が必要です。'}\n継続的な学習により、国際的な学術環境でも通用する英語力を身につけることができます。`
            ]
          },
          // Daily conversation contexts
          {
            keywords: ["お疲れ", "ありがとう", "すみません", "お願い", "確認", "連絡", "時間", "場所"],
            explanations: [
              `${specificFeedback}\n日常会話としては、${rating >= 4 ? '自然で親しみやすい表現が使われており、相手との良好な関係性を築けます。' : rating >= 3 ? '基本的なコミュニケーションは取れますが、もう少し自然な表現を心がけましょう。' : '日常的によく使われる基本フレーズの習得が必要です。'}\n感情表現の観点では、${rating >= 4 ? '相手への配慮や感謝の気持ちが適切に表現されています。' : rating >= 3 ? '気持ちは伝わりますが、より豊かな感情表現を身につけると良いでしょう。' : '基本的な感情を表す単語や表現から覚えていきましょう。'}\n実用性を考えると、${rating >= 3 ? 'この表現は実際の場面でそのまま使える便利なフレーズです。' : '日常生活でよく使う基本的な表現パターンを覚えることから始めましょう。'}\n毎日の練習を通じて、より自然で流暢な英語コミュニケーション能力を向上させることができます。`
            ]
          }
        ];

        // Find matching template based on keywords
        let selectedTemplate = explanationTemplates[2]; // Default to daily conversation
        for (const template of explanationTemplates) {
          if (template.keywords.some(keyword => japaneseSentence.includes(keyword))) {
            selectedTemplate = template;
            break;
          }
        }

        // Select random explanation from the matched template
        const randomIndex = Math.floor(Math.random() * selectedTemplate.explanations.length);
        return selectedTemplate.explanations[randomIndex];
      };

      const detailedExplanation = getDetailedExplanation(userAnswer, japaneseSentence, modelAnswer, rating, specificFeedback);

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
        overallEvaluation: overallEval[0],
        detailedComment: overallEval[1],
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
            detailedComment: evaluation.detailedComment,
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
        const problemNumber = messages.filter(m => m.type === "problem").findIndex(m => m.id === message.id) + 1;
        const bookmarkKey = `${message.content}_${problemNumber}`;
        const isBookmarked = bookmarkedProblems.has(bookmarkKey);
        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div 
              className={`${isBookmarked ? 'bg-yellow-400' : 'bg-blue-400'} rounded-full w-12 h-8 flex items-center justify-center mr-3 flex-shrink-0 cursor-pointer transition-colors hover:bg-yellow-500`}
              onClick={() => toggleBookmark(bookmarkKey)}
              title={isBookmarked ? "ブックマークを解除" : "ブックマークに追加"}
            >
              <span className="text-white text-sm">
                {isBookmarked ? '⭐' : '☆'}
              </span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 max-w-sm shadow-sm border">
              <div className="text-sm font-medium text-gray-800 mb-1">問題 {problemNumber} - 翻訳してください</div>
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
              <div className="rating-box flex items-center justify-start bg-transparent border border-gray-200 rounded-lg px-3 py-1 h-8">
                {renderStarRating(message.rating || 0)}
              </div>
              
              {/* Overall Evaluation */}
              {overallEval && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-800 mb-1">全体評価</div>
                  <div className="text-gray-800 font-medium mb-2">{overallEval.content}</div>
                  {overallEval.detailedComment && (
                    <div className="text-gray-700 text-sm">{overallEval.detailedComment}</div>
                  )}
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
                      <div key={index} className="text-gray-800 text-base">• {phrase}</div>
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