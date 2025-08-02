import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send, 
  Star, 
  Sparkles,
  User,
  Home,
  Shield
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PremiumGate } from "@/components/premium-gate";
import { SpeechButton } from "@/components/speech-button";
import { useAuth } from "@/components/auth-provider";

interface CustomScenario {
  id: number;
  title: string;
  description: string;
}

interface SimulationProblem {
  japaneseSentence: string;
  context: string;
}

interface SimulationMessage {
  type: 'problem' | 'user' | 'evaluation';
  content: string;
  rating?: number;
  feedback?: string;
  correctTranslation?: string;
  explanation?: string;
  similarPhrases?: string[];
  improvements?: string[];
  timestamp: string;
  problemNumber?: number;
  context?: string;
}

interface SimulationResponse {
  correctTranslation: string;
  feedback: string;
  rating: number;
  improvements: string[];
  explanation: string;
  similarPhrases: string[];
}

export default function SimulationPractice() {
  return (
    <PremiumGate feature="シミュレーション練習">
      <SimulationPracticeContent />
    </PremiumGate>
  );
}

function SimulationPracticeContent() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const scenarioId = parseInt(id || "1");
  
  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentProblem, setCurrentProblem] = useState<string>("");
  const [currentContext, setCurrentContext] = useState<string>("");
  const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false);
  const [problemNumber, setProblemNumber] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get user subscription status
  const { data: userSubscription } = useQuery({
    queryKey: ["/api/user-subscription"],
  });

  // Get scenario details
  const { data: scenario } = useQuery<CustomScenario>({
    queryKey: [`/api/custom-scenarios/${id}`],
    enabled: !!id,
  });

  // Get simulation problem
  const getSimulationProblemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/simulation-problem/${scenarioId}`);
      if (!response.ok) {
        // CRITICAL: Check for 429 status
        if (response.status === 429) {
          const errorData = await response.json();
          if (errorData.dailyLimitReached) {
            throw new Error('DAILY_LIMIT_REACHED');
          }
        }
        throw new Error('Failed to fetch problem');
      }
      return response.json();
    },
    onSuccess: (data: SimulationProblem) => {
      // CRITICAL: Check for daily limit in response
      if (data.dailyLimitReached) {
        console.log("🛑 Daily limit reached in simulation response");
        toast({
          title: "本日の学習完了",
          description: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。",
          variant: "destructive",
        });
        return;
      }

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
    },
    onError: (error) => {
      console.error("Problem generation error:", error);
      
      // CRITICAL: Check for daily limit error
      if (error.message === 'DAILY_LIMIT_REACHED') {
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
    },
    retry: false, // CRITICAL: No auto retry
  });

  const translateMutation = useMutation({
    mutationFn: async (translation: string): Promise<SimulationResponse> => {
      const response = await apiRequest("POST", "/api/translate", {
        japaneseSentence: currentProblem,
        userTranslation: translation,
        difficultyLevel: `simulation-${scenarioId}`,
      });
      return await response.json();
    },
    onSuccess: (data: SimulationResponse) => {
      const userMessage: SimulationMessage = {
        type: 'user',
        content: input,
        timestamp: new Date().toISOString(),
      };

      const evaluationMessage: SimulationMessage = {
        type: 'evaluation',
        content: data.feedback,
        rating: data.rating,
        correctTranslation: data.correctTranslation,
        explanation: data.explanation,
        similarPhrases: data.similarPhrases,
        improvements: data.improvements,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage, evaluationMessage]);
      setInput("");
      setIsWaitingForTranslation(false);
      
      // Removed auto-generation to prevent infinite loops
      // User must manually click "Next Problem" button
    },
    onError: (error) => {
      console.error("Translation error:", error);
      setIsWaitingForTranslation(false);
      toast({
        title: "エラー",
        description: "AI評価に失敗しました。しばらくしてからもう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (input.trim() && !isWaitingForTranslation) {
      setIsWaitingForTranslation(true);
      translateMutation.mutate(input.trim());
    }
  };

  const handleNextProblem = () => {
    setProblemNumber(prev => prev + 1);
    getSimulationProblemMutation.mutate();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for review problem from sessionStorage or start with first problem
  useEffect(() => {
    if (messages.length === 0) {
      const reviewProblem = sessionStorage.getItem('reviewProblem');
      if (reviewProblem) {
        try {
          const problemData = JSON.parse(reviewProblem);
          if (problemData.difficultyLevel === `simulation-${scenarioId}`) {
            // Set up review problem
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
            
            // Clear the review problem from sessionStorage
            sessionStorage.removeItem('reviewProblem');
            return;
          }
        } catch (error) {
          console.error('Error parsing review problem:', error);
          sessionStorage.removeItem('reviewProblem');
        }
      }
      // ONLY generate new problem if no review problem - NO AUTO GENERATION
      console.log("🎯 Manual simulation problem generation requested");
      getSimulationProblemMutation.mutate();
    }
  }, []); // EMPTY DEPENDENCY ARRAY - CRITICAL

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
          
          {/* Right section - buttons */}
          <div className="flex items-center">
            <div className="flex gap-2 flex-wrap items-center">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow"
                  onClick={() => setLocation('/admin')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  管理者
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow"
                onClick={() => setLocation('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                トップページ
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow"
                onClick={() => setLocation('/my-page')}
              >
                <User className="w-4 h-4 mr-2" />
                マイページ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="animate-fade-in">
            {message.type === 'problem' && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-600">
                      問題{message.problemNumber} - 翻訳してください
                    </p>
                  </div>
                  {message.context && (
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>シチュエーション:</strong> {message.context}
                    </p>
                  )}
                  <p className="text-base leading-relaxed text-gray-900">
                    {message.content}
                  </p>
                </div>
              </div>
            )}

            {message.type === 'user' && (
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-sm">
                  <p className="text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            )}

            {message.type === 'evaluation' && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1 space-y-4">
                  {/* Rating */}
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {renderStars(message.rating || 0)}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({message.rating}/5点)
                    </span>
                  </div>

                  {/* Model Answer */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-green-800">模範解答</h4>
                      {message.correctTranslation && (
                        <SpeechButton 
                          text={message.correctTranslation}
                          language="en-US"
                          className="text-green-600 border-green-300 hover:bg-green-100"
                        />
                      )}
                    </div>
                    <p className="text-base leading-relaxed text-gray-900 font-medium">
                      {message.correctTranslation}
                    </p>
                  </div>

                  {/* Explanation */}
                  {message.explanation && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-800 mb-2">解説</h4>
                      <p className="text-sm leading-relaxed text-gray-700">
                        {message.explanation}
                      </p>
                    </div>
                  )}

                  {/* Similar Phrases */}
                  {message.similarPhrases && message.similarPhrases.length > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-purple-800 mb-2">類似フレーズ</h4>
                      <div className="space-y-2">
                        {message.similarPhrases.map((phrase, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 flex-1">• {phrase}</span>
                            <SpeechButton 
                              text={phrase}
                              language="en-US"
                              className="text-purple-600 border-purple-300 hover:bg-purple-100 ml-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-generating next problem message */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 text-center">
                      次の問題を自動生成中...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isWaitingForTranslation && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
              <p className="text-sm text-gray-600">AIが評価しています...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder="英語で翻訳を入力してください..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            className="flex-1 resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            disabled={isWaitingForTranslation}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isWaitingForTranslation}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}