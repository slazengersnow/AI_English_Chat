import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  Star,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  User,
  Home,
  Settings,
  Shield,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import type {
  TranslateResponse,
  ProblemResponse,
  UserSubscription,
} from "@shared/schema";
import { useLocation } from "wouter";
import { SpeechButton } from "@/components/speech-button";
import { useAuth } from "@/components/auth-provider";

type SessionType = {
  id: number;
  japaneseSentence: string;
  userTranslation: string;
  correctTranslation: string;
  rating: number;
  difficultyLevel: string;
  createdAt: string;
  isBookmarked?: boolean;
  feedback?: string;
  explanation?: string;
  similarPhrases?: string[];
  improvements?: string[];
};

interface TrainingInterfaceProps {
  difficulty: DifficultyKey;
  onBack: () => void;
  onShowPayment: () => void;
}

interface TrainingMessage {
  type: "problem" | "user" | "evaluation";
  content: string;
  rating?: number;
  feedback?: string;
  correctTranslation?: string;
  explanation?: string;
  similarPhrases?: string[];
  improvements?: string[];
  timestamp: string;
  problemNumber?: number;
  isBookmarked?: boolean;
}

export function TrainingInterface({
  difficulty,
  onBack,
  onShowPayment,
}: TrainingInterfaceProps) {
  const [messages, setMessages] = useState<TrainingMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentProblem, setCurrentProblem] = useState<string>("");
  const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [problemNumber, setProblemNumber] = useState(1);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  // 単一の初期化状態管理
  const [initializationKey, setInitializationKey] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeStep, setActiveStep] = useState<"waiting" | "answer" | "evaluation">("waiting");
  
  // useRefを使った初回実行制御
  const hasSetStepRef = useRef(false);
  const currentDifficultyRef = useRef(difficulty);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Bookmark management
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Set<string>>(new Set());

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedProblems");
    if (saved) {
      setBookmarkedProblems(new Set(JSON.parse(saved)));
    }
  }, []);

  const saveBookmarks = (bookmarks: Set<string>) => {
    localStorage.setItem("bookmarkedProblems", JSON.stringify([...bookmarks]));
  };

  // Get user subscription
  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  // Problem generation mutation
  const getProblemMutation = useMutation({
    mutationFn: async (): Promise<ProblemResponse> => {
      console.log("🔄 API request for new problem");
      const response = await apiRequest("POST", "/api/problem", {
        difficultyLevel: difficulty,
      });
      const data = await response.json();
      console.log("✅ Problem generated successfully");
      return data;
    },
    retry: false,
    onMutate: () => {
      setIsInitializing(true);
    },
    onSuccess: (data) => {
      console.log("🎯 Problem success handler");
      setCurrentProblem(data.japaneseSentence);

      let currentProblemNum = problemNumber;
      if (data.hints && data.hints.length > 0) {
        const problemHint = data.hints.find((hint) => hint.startsWith("問題"));
        if (problemHint) {
          const match = problemHint.match(/問題(\d+)/);
          if (match) {
            currentProblemNum = parseInt(match[1]);
            setProblemNumber(currentProblemNum);
          }
        }
      }

      const problemMessage: TrainingMessage = {
        type: "problem",
        content: data.japaneseSentence,
        timestamp: new Date().toISOString(),
        problemNumber: currentProblemNum,
        isBookmarked: bookmarkedProblems.has(data.japaneseSentence),
      };
      
      setMessages((prev) => [...prev, problemMessage]);
      setIsWaitingForTranslation(true);
      setShowNextButton(false);
      setIsInitializing(false);
      // 新しい問題でrefをリセット
      hasSetStepRef.current = false;
    },
    onError: (error: any) => {
      console.error("❌ Problem generation error:", error);
      setIsInitializing(false);
      
      if (
        error.message?.includes("429") ||
        error.message?.includes("最大出題数")
      ) {
        const limitMessage: TrainingMessage = {
          type: "evaluation",
          content: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, limitMessage]);
        setIsWaitingForTranslation(false);
      } else {
        const errorMessage: TrainingMessage = {
          type: "evaluation",
          content: "問題の生成に失敗しました。しばらく待ってから再試行してください。",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsWaitingForTranslation(false);
      }
    },
  });

  // Translation evaluation mutation
  const evaluateTranslationMutation = useMutation({
    mutationFn: async (userTranslation: string): Promise<TranslateResponse> => {
      const response = await apiRequest("POST", "/api/translate", {
        japaneseSentence: currentProblem,
        userTranslation,
        difficultyLevel: difficulty,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      const evaluationMessage: TrainingMessage = {
        type: "evaluation",
        content: data.feedback || "",
        rating: data.rating,
        feedback: data.feedback,
        correctTranslation: data.correctTranslation,
        explanation: data.explanation,
        similarPhrases: data.similarPhrases,
        improvements: data.improvements,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, evaluationMessage]);
      setIsWaitingForTranslation(false);
      setShowNextButton(true);
      // 評価完了時はevaluationステップに設定
      setActiveStep('evaluation');
    },
    onError: (error) => {
      console.error("Translation evaluation error:", error);
      setIsWaitingForTranslation(false);
    },
  });

  // 難易度変更時の初期化 - initializationKeyでトリガー
  useEffect(() => {
    console.log("🔄 Initializing for difficulty:", difficulty, "key:", initializationKey);
    
    // 初期化中は処理をスキップ
    if (isInitializing || getProblemMutation.isPending) {
      console.log("⚠️ Already initializing, skipping");
      return;
    }

    // 状態をリセット
    setMessages([]);
    setShowNextButton(false);
    setIsWaitingForTranslation(false);
    setCurrentProblem("");
    setProblemNumber(1);
    setCurrentSessionId(null);
    // 初期化時にrefもリセット
    hasSetStepRef.current = false;
    setActiveStep("waiting");

    // 特殊ケースをチェック
    const isRepeatMode = sessionStorage.getItem("repeatPracticeMode");
    const repeatSessions = sessionStorage.getItem("repeatPracticeSessions");
    const repeatIndex = sessionStorage.getItem("repeatPracticeIndex");

    if (isRepeatMode && repeatSessions && repeatIndex !== null) {
      try {
        const sessions: SessionType[] = JSON.parse(repeatSessions);
        const currentIndex = parseInt(repeatIndex);

        if (currentIndex < sessions.length) {
          const currentSession = sessions[currentIndex];
          if (currentSession.difficultyLevel === difficulty) {
            setCurrentProblem(currentSession.japaneseSentence);
            setProblemNumber(currentIndex + 1);
            const problemMessage: TrainingMessage = {
              type: "problem",
              content: currentSession.japaneseSentence,
              timestamp: new Date().toISOString(),
              problemNumber: currentIndex + 1,
            };
            setMessages([problemMessage]);
            setIsWaitingForTranslation(true);
            setShowNextButton(false);
            return;
          }
        } else {
          sessionStorage.removeItem("repeatPracticeMode");
          sessionStorage.removeItem("repeatPracticeSessions");
          sessionStorage.removeItem("repeatPracticeIndex");
        }
      } catch (error) {
        console.error("Error parsing repeat practice sessions:", error);
        sessionStorage.removeItem("repeatPracticeMode");
        sessionStorage.removeItem("repeatPracticeSessions");
        sessionStorage.removeItem("repeatPracticeIndex");
      }
    }

    // レビュー問題をチェック
    const reviewProblem = sessionStorage.getItem("reviewProblem");
    if (reviewProblem) {
      try {
        const problemData = JSON.parse(reviewProblem);
        if (problemData.difficultyLevel === difficulty) {
          setCurrentProblem(problemData.japaneseSentence);
          setProblemNumber(1);
          const problemMessage: TrainingMessage = {
            type: "problem",
            content: problemData.japaneseSentence,
            timestamp: new Date().toISOString(),
            problemNumber: 1,
          };
          setMessages([problemMessage]);
          setIsWaitingForTranslation(true);
          setShowNextButton(false);
          sessionStorage.removeItem("reviewProblem");
          return;
        }
      } catch (error) {
        console.error("Error parsing review problem:", error);
        sessionStorage.removeItem("reviewProblem");
      }
    }

    // 通常の問題生成
    console.log("📥 Requesting new problem");
    getProblemMutation.mutate();
  }, [difficulty, initializationKey]); // initializationKeyのみに依存

  // 難易度変更時にinitializationKeyを更新
  useEffect(() => {
    setInitializationKey(prev => prev + 1);
  }, [difficulty]);

  const handleSubmit = () => {
    if (!input.trim() || !isWaitingForTranslation) return;

    const userMessage: TrainingMessage = {
      type: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    evaluateTranslationMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNextProblem = () => {
    console.log("⏭️ Next problem requested");
    setShowNextButton(false);
    
    // リピート練習モードをチェック
    const isRepeatMode = sessionStorage.getItem("repeatPracticeMode");
    const repeatSessions = sessionStorage.getItem("repeatPracticeSessions");
    const repeatIndex = sessionStorage.getItem("repeatPracticeIndex");

    if (isRepeatMode && repeatSessions && repeatIndex !== null) {
      try {
        const sessions: SessionType[] = JSON.parse(repeatSessions);
        const currentIndex = parseInt(repeatIndex);
        const nextIndex = currentIndex + 1;

        const filteredSessions = sessions.filter(
          (s: SessionType) => s.difficultyLevel === difficulty,
        );

        if (nextIndex < filteredSessions.length) {
          const nextSession = filteredSessions[nextIndex];
          if (nextSession) {
            sessionStorage.setItem("repeatPracticeIndex", nextIndex.toString());
            setCurrentProblem(nextSession.japaneseSentence);
            setProblemNumber(nextIndex + 1);
            const problemMessage: TrainingMessage = {
              type: "problem",
              content: nextSession.japaneseSentence,
              timestamp: new Date().toISOString(),
              problemNumber: nextIndex + 1,
            };
            setMessages((prev) => [...prev, problemMessage]);
            setIsWaitingForTranslation(true);
            return;
          }
        } else {
          sessionStorage.removeItem("repeatPracticeMode");
          sessionStorage.removeItem("repeatPracticeSessions");
          sessionStorage.removeItem("repeatPracticeIndex");
        }
      } catch (error) {
        console.error("Error parsing repeat practice sessions:", error);
        sessionStorage.removeItem("repeatPracticeMode");
        sessionStorage.removeItem("repeatPracticeSessions");
        sessionStorage.removeItem("repeatPracticeIndex");
      }
    }

    // 通常モード - 新しい問題を取得
    setProblemNumber((prev) => prev + 1);
    
    if (!isInitializing && !getProblemMutation.isPending) {
      console.log("📥 Getting next problem");
      getProblemMutation.mutate();
    }
  };

  const toggleBookmark = async (problemText: string) => {
    const isBookmarked = bookmarkedProblems.has(problemText);
    const newBookmarks = new Set(bookmarkedProblems);

    if (newBookmarks.has(problemText)) {
      newBookmarks.delete(problemText);
    } else {
      newBookmarks.add(problemText);
    }

    setBookmarkedProblems(newBookmarks);
    saveBookmarks(newBookmarks);

    if (currentSessionId) {
      try {
        await apiRequest("POST", `/api/sessions/${currentSessionId}/bookmark`, {
          isBookmarked,
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/bookmarked-sessions"],
        });
      } catch (error) {
        console.error("Failed to update bookmark in database:", error);
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 128) + "px";
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // useRefを使った無限ループ修正: activeStepの初期設定を一度だけ実行
  useEffect(() => {
    if (
      currentProblem &&
      isWaitingForTranslation &&
      !hasSetStepRef.current
    ) {
      console.log("🎯 Setting activeStep to 'answer' for the first time (useRef)");
      setActiveStep('answer');
      hasSetStepRef.current = true;
    }
  }, [currentProblem, isWaitingForTranslation]);

  // 難易度変更時はrefをリセット
  useEffect(() => {
    if (currentDifficultyRef.current !== difficulty) {
      console.log("🔄 Difficulty changed, resetting hasSetStepRef");
      hasSetStepRef.current = false;
      currentDifficultyRef.current = difficulty;
      setActiveStep("waiting");
    }
  }, [difficulty]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left section */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm sm:text-base">
                {DIFFICULTY_LEVELS[difficulty]}
              </span>
            </div>
          </div>

          {/* Center section */}
          <div className="flex-1 text-center">
            {messages.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                問題 {problemNumber}
              </span>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setLocation("/admin")}
            >
              <Shield className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setLocation("/mypage")}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setLocation("/")}
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : message.type === "problem"
                    ? "bg-white border border-gray-200 shadow-sm"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.type === "problem" && (
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        問題 {message.problemNumber}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <SpeechButton
                        text={message.content}
                        className="text-gray-400 hover:text-gray-600"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 hover:bg-gray-100"
                        onClick={() => toggleBookmark(message.content)}
                      >
                        {bookmarkedProblems.has(message.content) ? (
                          <BookmarkCheck className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Bookmark className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-sm sm:text-base leading-relaxed">
                  {message.content}
                </div>

                {message.type === "evaluation" && (
                  <div className="mt-3 space-y-3">
                    {message.rating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-600">
                          評価:
                        </span>
                        <div className="flex space-x-1">
                          {renderStars(message.rating)}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({message.rating}/5)
                        </span>
                      </div>
                    )}

                    {message.correctTranslation && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-xs font-medium text-green-700 mb-1 block">
                              模範解答:
                            </span>
                            <p className="text-sm text-green-800">
                              {message.correctTranslation}
                            </p>
                          </div>
                          <SpeechButton
                            text={message.correctTranslation}
                            className="text-green-600 hover:text-green-700 ml-2"
                            lang="en-US"
                            rate={0.8}
                          />
                        </div>
                      </div>
                    )}

                    {message.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <span className="text-xs font-medium text-blue-700 mb-1 block">
                          解説:
                        </span>
                        <p className="text-sm text-blue-800">
                          {message.explanation}
                        </p>
                      </div>
                    )}

                    {message.similarPhrases && message.similarPhrases.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <span className="text-xs font-medium text-purple-700 mb-2 block">
                          類似表現:
                        </span>
                        <div className="space-y-1">
                          {message.similarPhrases.map((phrase, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <p className="text-sm text-purple-800">{phrase}</p>
                              <SpeechButton
                                text={phrase}
                                className="text-purple-600 hover:text-purple-700 ml-2"
                                lang="en-US"
                                rate={0.8}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.improvements && message.improvements.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <span className="text-xs font-medium text-orange-700 mb-2 block">
                          改善点:
                        </span>
                        <div className="space-y-1">
                          {message.improvements.map((improvement, idx) => (
                            <p key={idx} className="text-sm text-orange-800">
                              • {improvement}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isInitializing && (
            <div className="flex justify-center">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="text-sm text-gray-600">問題を生成中...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-2 sm:px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {showNextButton ? (
            <Button
              onClick={handleNextProblem}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
              disabled={isInitializing || getProblemMutation.isPending}
            >
              次の問題へ (1秒後)
            </Button>
          ) : (
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isWaitingForTranslation
                      ? "英訳を入力してください..."
                      : "問題の読み込み中..."
                  }
                  disabled={!isWaitingForTranslation}
                  className="resize-none pr-12 min-h-[44px] max-h-32"
                  rows={1}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || !isWaitingForTranslation}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-advance to next problem */}
      {showNextButton && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/75 text-white px-3 py-1 rounded-full text-sm">
            1秒後に次の問題へ進みます
          </div>
        </div>
      )}

      {showNextButton && (
        <div>
          {setTimeout(() => {
            if (showNextButton) {
              handleNextProblem();
            }
          }, 1000)}
        </div>
      )}
    </div>
  );
}