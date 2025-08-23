import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Volume2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";

interface ChatPracticeProps {
  difficulty: DifficultyKey;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'rating' | 'explanation' | 'similar';
  content: string;
  rating?: number;
  phrases?: string[];
  timestamp: Date;
}

export function ChatPractice({ difficulty, onBack }: ChatPracticeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [problemCount, setProblemCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isExecutingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start first problem
  useEffect(() => {
    if (!isExecutingRef.current) {
      startNewProblem();
    }
  }, []);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addMessagesSequentially = async (newMessages: Omit<ChatMessage, 'id' | 'timestamp'>[]) => {
    for (let i = 0; i < newMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      addMessage(newMessages[i]);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyLevel: difficulty }),
      });

      if (response.status === 429) {
        throw new Error("DAILY_LIMIT_REACHED");
      }

      if (!response.ok) {
        throw new Error("問題の生成に失敗しました");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentProblem(data);
      setProblemCount(prev => prev + 1);
      
      // Add problem message
      addMessage({
        type: 'system',
        content: data.japaneseSentence
      });
    },
    onError: (error: any) => {
      addMessage({
        type: 'system',
        content: error.message === "DAILY_LIMIT_REACHED" 
          ? "本日の最大出題数に達しました。明日またお試しください。"
          : "問題の生成でエラーが発生しました。"
      });
    }
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japaneseSentence: currentProblem.japaneseSentence,
          userTranslation: userInput,
          difficultyLevel: difficulty,
        }),
      });

      if (!response.ok) throw new Error("評価に失敗しました");
      return await response.json();
    },
    onSuccess: async (data) => {
      // Sequential message delivery like LINE
      const evaluationMessages = [
        {
          type: 'rating' as const,
          content: '評価結果',
          rating: data.rating
        },
        {
          type: 'explanation' as const,
          content: data.modelAnswer
        },
        {
          type: 'assistant' as const,
          content: data.feedback
        }
      ];

      if (data.similarPhrases && data.similarPhrases.length > 0) {
        evaluationMessages.push({
          type: 'similar' as const,
          content: '類似フレーズ',
          phrases: data.similarPhrases
        });
      }

      await addMessagesSequentially(evaluationMessages);
      
      // Add next problem button after 1 second
      setTimeout(() => {
        addMessage({
          type: 'system',
          content: 'NEXT_BUTTON'
        });
      }, 1000);
    },
    onError: () => {
      addMessage({
        type: 'system',
        content: "評価でエラーが発生しました。"
      });
    }
  });

  const startNewProblem = () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsLoading(true);
    generateMutation.mutate();
    setTimeout(() => {
      setIsLoading(false);
      isExecutingRef.current = false;
    }, 1000);
  };

  const handleSubmit = () => {
    if (!userInput.trim() || !currentProblem) return;
    
    // Add user message
    addMessage({
      type: 'user',
      content: userInput
    });

    // Start evaluation
    setIsLoading(true);
    evaluateMutation.mutate();
    setUserInput("");
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleNextProblem = () => {
    setCurrentProblem(null);
    startNewProblem();
  };

  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const difficultyName = DIFFICULTY_LEVELS[difficulty]?.name || difficulty;

  return (
    <div className="flex flex-col h-full bg-[#e7effe]">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">{difficultyName}</h1>
          {problemCount > 0 && (
            <p className="text-sm text-gray-500">問題 #{problemCount}</p>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="w-full">
            {message.type === 'system' && message.content === 'NEXT_BUTTON' ? (
              <div className="flex justify-center">
                <Button
                  onClick={handleNextProblem}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full"
                >
                  次の問題へ
                </Button>
              </div>
            ) : message.type === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl px-4 py-3 max-w-[80%] break-words">
                  {message.content}
                </div>
              </div>
            ) : message.type === 'rating' ? (
              <div className="flex justify-start">
                <div className="bg-white rounded-r-2xl rounded-tl-2xl px-4 py-3 max-w-[80%] border">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">評価結果</h3>
                    <div className="flex justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= (message.rating || 0) ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">良好な翻訳です</p>
                  </div>
                </div>
              </div>
            ) : message.type === 'explanation' ? (
              <div className="flex justify-start">
                <div className="bg-white rounded-r-2xl rounded-tl-2xl px-4 py-3 max-w-[80%] border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">解説</h4>
                    <Button
                      size="sm"
                      onClick={() => playSound(message.content)}
                      className="bg-green-500 hover:bg-green-600 text-white h-6 w-6 p-0"
                    >
                      🎵
                    </Button>
                  </div>
                  <div className="bg-green-50 rounded p-3 border-l-4 border-green-400">
                    <p className="text-sm font-medium text-green-800">模範解答</p>
                    <p className="text-green-700 font-medium">{message.content}</p>
                  </div>
                </div>
              </div>
            ) : message.type === 'similar' ? (
              <div className="flex justify-start">
                <div className="bg-white rounded-r-2xl rounded-tl-2xl px-4 py-3 max-w-[80%] border">
                  <p className="text-sm text-gray-600 mb-2 font-medium">類似フレーズ</p>
                  <div className="space-y-2">
                    {message.phrases?.map((phrase, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                        <span className="text-sm text-gray-700">• {phrase}</span>
                        <Button
                          size="sm"
                          onClick={() => playSound(phrase)}
                          className="bg-purple-500 hover:bg-purple-600 text-white h-6 w-6 p-0"
                        >
                          🎵
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white rounded-r-2xl rounded-tl-2xl px-4 py-3 max-w-[80%] border">
                  {message.type === 'system' ? (
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-2">日本語</h3>
                      <p className="text-lg text-blue-900 font-medium">{message.content}</p>
                    </div>
                  ) : (
                    <p className="text-gray-700">{message.content}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-r-2xl rounded-tl-2xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full" style={{animationDelay: '0.1s'}}></div>
                <div className="animate-bounce h-2 w-2 bg-gray-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentProblem && (
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="英語で翻訳を入力..."
              className="flex-1 min-h-[50px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="bg-green-500 hover:bg-green-600 text-white px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}