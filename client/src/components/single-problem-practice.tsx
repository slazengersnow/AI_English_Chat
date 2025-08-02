import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import { SpeechButton } from "@/components/speech-button";

interface SingleProblemPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

type PracticeStep = "start" | "problem_shown" | "answer_input" | "result_shown";

interface ProblemData {
  japaneseSentence: string;
  hints?: string[];
}

interface EvaluationData {
  rating: number;
  feedback: string;
  correctTranslation: string;
  explanation?: string;
  similarPhrases?: string[];
  improvements?: string[];
  sessionId: number;
}

export function SingleProblemPractice({ difficulty, onBack }: SingleProblemPracticeProps) {
  const [step, setStep] = useState<PracticeStep>("start");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Problem state
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleGenerateProblem = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest("POST", "/api/problem", {
        difficultyLevel: difficulty,
      });
      const data: ProblemData = await response.json();
      
      setProblem(data);
      setStep("problem_shown");
    } catch (err: any) {
      console.error("Problem generation failed:", err);
      if (err.message?.includes("429") || err.message?.includes("最大出題数")) {
        setError("本日の最大出題数（100問）に達しました。明日また学習を再開できます。");
      } else {
        setError("問題の生成に失敗しました。しばらく待ってから再試行してください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!problem || !userAnswer.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await apiRequest("POST", "/api/translate", {
        japaneseSentence: problem.japaneseSentence,
        userTranslation: userAnswer.trim(),
        difficultyLevel: difficulty,
      });
      const data: EvaluationData = await response.json();
      
      setEvaluation(data);
      setStep("result_shown");
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      setError("評価に失敗しました。しばらく待ってから再試行してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!evaluation) return;
    
    try {
      await apiRequest("POST", `/api/sessions/${evaluation.sessionId}/bookmark`, {
        isBookmarked: !isBookmarked,
      });
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  const handleReset = () => {
    setStep("start");
    setProblem(null);
    setUserAnswer("");
    setEvaluation(null);
    setIsBookmarked(false);
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && step === "problem_shown") {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

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
          <div className="text-center">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              1問練習
            </span>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Start Step */}
          {step === "start" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {DIFFICULTY_LEVELS[difficulty]} - 1問練習
              </h2>
              <p className="text-gray-600 mb-6">
                1問だけ練習して、AIの詳しい評価を受けましょう
              </p>
              <Button
                onClick={handleGenerateProblem}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {isLoading ? "問題生成中..." : "問題を生成"}
              </Button>
            </div>
          )}

          {/* Problem Step */}
          {step === "problem_shown" && problem && (
            <>
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    問題
                  </span>
                  <SpeechButton
                    text={problem.japaneseSentence}
                    className="text-gray-400 hover:text-gray-600"
                  />
                </div>
                <div className="text-sm sm:text-base leading-relaxed text-gray-900">
                  {problem.japaneseSentence}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                <p className="text-xs font-medium text-blue-700 mb-2">
                  上記の日本語を英語に翻訳してください:
                </p>
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="英訳を入力してください..."
                  className="resize-none min-h-[80px] bg-white"
                />
              </div>
            </>
          )}

          {/* User Answer */}
          {step === "result_shown" && (
            <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 ml-auto max-w-[85%]">
              <div className="text-sm sm:text-base leading-relaxed">
                {userAnswer}
              </div>
            </div>
          )}

          {/* Evaluation Result */}
          {step === "result_shown" && evaluation && (
            <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
              <div className="space-y-3">
                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">評価:</span>
                  <div className="flex space-x-1">{renderStars(evaluation.rating)}</div>
                  <span className="text-xs text-gray-600">({evaluation.rating}/5)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 hover:bg-gray-200 ml-auto"
                    onClick={handleToggleBookmark}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>

                {/* Feedback */}
                {evaluation.feedback && (
                  <div className="text-sm text-gray-800">
                    {evaluation.feedback}
                  </div>
                )}

                {/* Correct Translation */}
                {evaluation.correctTranslation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-green-700 mb-1 block">
                          模範解答:
                        </span>
                        <p className="text-sm text-green-800">
                          {evaluation.correctTranslation}
                        </p>
                      </div>
                      <SpeechButton
                        text={evaluation.correctTranslation}
                        className="text-green-600 hover:text-green-700 ml-2"
                        lang="en-US"
                        rate={0.8}
                      />
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {evaluation.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-blue-700 mb-1 block">
                      解説:
                    </span>
                    <p className="text-sm text-blue-800">{evaluation.explanation}</p>
                  </div>
                )}

                {/* Similar Phrases */}
                {evaluation.similarPhrases && evaluation.similarPhrases.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-purple-700 mb-2 block">
                      類似表現:
                    </span>
                    <div className="space-y-1">
                      {evaluation.similarPhrases.map((phrase, idx) => (
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

                {/* Improvements */}
                {evaluation.improvements && evaluation.improvements.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-orange-700 mb-2 block">
                      改善点:
                    </span>
                    <div className="space-y-1">
                      {evaluation.improvements.map((improvement, idx) => (
                        <p key={idx} className="text-sm text-orange-800">
                          • {improvement}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="text-sm text-gray-600">
                  {step === "start" ? "問題を生成中..." : "評価中..."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input/Action Area */}
      <div className="bg-white border-t border-gray-200 px-2 sm:px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {step === "problem_shown" && (
            <div className="flex space-x-2">
              <div className="flex-1">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim() || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
                >
                  {isLoading ? "評価中..." : "回答を送信"}
                  <Send className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}
          
          {step === "result_shown" && (
            <Button
              onClick={handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
            >
              新しい問題に挑戦
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}