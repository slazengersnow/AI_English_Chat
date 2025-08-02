import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  Star, 
  Sparkles,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { useApiMutation } from "@/lib/queryClient";
import { SpeechButton } from "@/components/speech-button";

interface SimulationScenario {
  id: string;
  title: string;
  description: string;
}

interface SimulationProblem {
  japaneseSentence: string;
  context: string;
  dailyLimitReached?: boolean;
}

interface SimulationMessage {
  type: 'problem' | 'user_answer' | 'evaluation';
  content: string;
  timestamp: string;
  problemNumber?: number;
  context?: string;
  evaluation?: any;
  rating?: number;
}

export default function SimulationPractice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Extract scenario ID from URL path
  const scenarioId = window.location.pathname.split('/').pop();
  
  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentProblem, setCurrentProblem] = useState('');
  const [currentContext, setCurrentContext] = useState('');
  const [problemNumber, setProblemNumber] = useState(1);
  const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const hasLoadedInitialProblem = useRef(false);

  // Get scenario details
  const { data: scenario } = useQuery({
    queryKey: ['/api/simulation-scenarios', scenarioId],
    enabled: !!scenarioId,
  });

  // Get simulation problem mutation - NO RETRY
  const getSimulationProblem = useApiMutation<SimulationProblem, void>(
    async () => {
      const response = await fetch(`/api/simulation-problem/${scenarioId}`);
      
      if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.dailyLimitReached) {
          throw new Error('DAILY_LIMIT');
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch problem');
      }
      
      const data = await response.json();
      
      if (data.dailyLimitReached) {
        throw new Error('DAILY_LIMIT');
      }
      
      return data;
    }
  );

  // Translation mutation - NO RETRY
  const translateMutation = useApiMutation<any, string>(
    async (userTranslation: string) => {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          japaneseSentence: currentProblem,
          userTranslation,
          difficultyLevel: `simulation-${scenarioId}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      return await response.json();
    }
  );

  // Handle problem generation success
  useEffect(() => {
    if (getSimulationProblem.isSuccess && getSimulationProblem.data) {
      const data = getSimulationProblem.data;
      setCurrentProblem(data.japaneseSentence);
      setCurrentContext(data.context);
      
      const problemMessage: SimulationMessage = {
        type: 'problem',
        content: data.japaneseSentence,
        timestamp: new Date().toISOString(),
        problemNumber: problemNumber,
        context: data.context,
      };
      
      setMessages(prev => [...prev, problemMessage]);
    }
  }, [getSimulationProblem.isSuccess, getSimulationProblem.data, problemNumber]);

  // Handle problem generation error
  useEffect(() => {
    if (getSimulationProblem.isError) {
      const error = getSimulationProblem.error as Error;
      
      if (error.message === 'DAILY_LIMIT') {
        toast({
          title: "本日の学習完了",
          description: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "エラー",
        description: "問題の生成に失敗しました。しばらくしてからもう一度お試しください。",
        variant: "destructive",
      });
    }
  }, [getSimulationProblem.isError, getSimulationProblem.error, toast]);

  // Handle translation success
  useEffect(() => {
    if (translateMutation.isSuccess && translateMutation.data) {
      const evaluation = translateMutation.data;
      
      // Add user answer message
      const userMessage: SimulationMessage = {
        type: 'user_answer',
        content: input,
        timestamp: new Date().toISOString(),
      };
      
      // Add evaluation message
      const evaluationMessage: SimulationMessage = {
        type: 'evaluation',
        content: evaluation.correctTranslation,
        timestamp: new Date().toISOString(),
        evaluation: evaluation,
        rating: evaluation.rating,
      };
      
      setMessages(prev => [...prev, userMessage, evaluationMessage]);
      setInput('');
      setIsWaitingForTranslation(false);
    }
  }, [translateMutation.isSuccess, translateMutation.data, input]);

  // Handle translation error
  useEffect(() => {
    if (translateMutation.isError) {
      toast({
        title: "エラー",
        description: "翻訳の評価に失敗しました。しばらくしてからもう一度お試しください。",
        variant: "destructive",
      });
      setIsWaitingForTranslation(false);
    }
  }, [translateMutation.isError, toast]);

  // Load initial problem - ONLY ONCE
  useEffect(() => {
    if (hasLoadedInitialProblem.current || messages.length > 0) return;
    
    // Check for review problem from sessionStorage
    const reviewProblem = sessionStorage.getItem('reviewProblem');
    if (reviewProblem) {
      try {
        const problemData = JSON.parse(reviewProblem);
        if (problemData.difficultyLevel === `simulation-${scenarioId}`) {
          setCurrentProblem(problemData.japaneseSentence);
          const problemMessage: SimulationMessage = {
            type: 'problem',
            content: problemData.japaneseSentence,
            timestamp: new Date().toISOString(),
            problemNumber: 1,
            context: "復習問題"
          };
          setMessages([problemMessage]);
          setProblemNumber(1);
          sessionStorage.removeItem('reviewProblem');
          hasLoadedInitialProblem.current = true;
          return;
        }
      } catch (error) {
        console.error('Error parsing review problem:', error);
        sessionStorage.removeItem('reviewProblem');
      }
    }
    
    // Load new problem
    hasLoadedInitialProblem.current = true;
    getSimulationProblem.mutate();
  }, [scenarioId]); // Only depend on scenarioId

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (input.trim() && !isWaitingForTranslation) {
      setIsWaitingForTranslation(true);
      translateMutation.mutate(input.trim());
    }
  };

  const handleNextProblem = () => {
    setProblemNumber(prev => prev + 1);
    getSimulationProblem.mutate();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const isLoading = getSimulationProblem.isPending;
  const isEvaluating = translateMutation.isPending || isWaitingForTranslation;

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
              onClick={() => setLocation('/simulation')}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h3 className="font-semibold text-gray-900 text-sm">シミュレーション練習</h3>
              <p className="text-xs text-gray-600">{scenario?.title || "読み込み中..."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              {message.type === 'problem' && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg shadow-sm p-4 max-w-xs sm:max-w-md">
                    <div className="text-xs text-gray-500 mb-2">
                      問題 {message.problemNumber} {message.context && `• ${message.context}`}
                    </div>
                    <div className="text-gray-900 text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className="flex justify-end mt-2">
                      <SpeechButton text={message.content} size="sm" />
                    </div>
                  </div>
                </div>
              )}

              {message.type === 'user_answer' && (
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white rounded-lg p-4 max-w-xs sm:max-w-md">
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              )}

              {message.type === 'evaluation' && message.evaluation && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg shadow-sm p-4 max-w-xs sm:max-w-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {renderStars(message.rating!)}
                        <span className="text-sm font-semibold">{message.rating}/5</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsBookmarked(!isBookmarked)}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">模範回答</div>
                      <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                        <div className="flex items-center justify-between">
                          <div className="text-green-800 text-sm">{message.content}</div>
                          <SpeechButton text={message.content} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">フィードバック</div>
                      <div className="text-gray-700 text-sm">
                        {message.evaluation.feedback}
                      </div>
                    </div>

                    {message.evaluation.explanation && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">解説</div>
                        <div className="text-gray-700 text-sm">
                          {message.evaluation.explanation}
                        </div>
                      </div>
                    )}

                    {message.evaluation.similarPhrases?.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">類似フレーズ</div>
                        <div className="space-y-1">
                          {message.evaluation.similarPhrases.map((phrase: string, i: number) => (
                            <div key={i} className="bg-blue-50 p-2 rounded text-sm">
                              <div className="flex items-center justify-between">
                                <div className="text-blue-800">{phrase}</div>
                                <SpeechButton text={phrase} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      <Button 
                        onClick={handleNextProblem}
                        size="sm"
                        disabled={isLoading}
                      >
                        次の問題
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg shadow-sm p-4 max-w-xs sm:max-w-md">
                <div className="text-gray-500 text-sm">問題を生成中...</div>
              </div>
            </div>
          )}

          {isEvaluating && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg shadow-sm p-4 max-w-xs sm:max-w-md">
                <div className="text-gray-500 text-sm">翻訳を評価中...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="英語で翻訳してください..."
              className="flex-1 min-h-[44px] max-h-24 resize-none"
              disabled={isEvaluating || !currentProblem}
            />
            <Button 
              onClick={handleSubmit}
              disabled={!input.trim() || isEvaluating || !currentProblem}
              size="sm"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}