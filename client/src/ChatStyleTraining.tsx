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
  type: "problem" | "user_answer" | "evaluation" | "model_answer" | "explanation" | "similar_phrases" | "next_button";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load first problem
    loadNewProblem();
  }, []);

  const loadNewProblem = () => {
    const problem = getRandomProblem(difficulty);
    setCurrentProblem(problem);
    setAwaitingAnswer(true);
    
    const problemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "problem",
      content: problem.japaneseSentence,
      timestamp: new Date()
    };
    
    setMessages([...messages, problemMessage]);
  };

  const evaluateAnswerWithClaude = async (userAnswer: string, japaneseSentence: string, modelAnswer: string): Promise<EvaluationResult> => {
    try {
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

      if (!response.ok) {
        throw new Error('API request failed');
      }

      return await response.json();
    } catch (error) {
      // Fallback to mock evaluation if API fails
      console.warn('Claude API failed, using fallback evaluation');
      return {
        rating: userAnswer.length > 10 ? 4 : 3,
        modelAnswer,
        explanation: "文法的には正しいですが、より自然な表現を心がけましょう。",
        similarPhrases: [
          "Alternative expression 1",
          "Alternative expression 2", 
          "Alternative expression 3"
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

      // Add evaluation messages in sequence
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
          const modelAnswerMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: "model_answer",
            content: evaluation.modelAnswer,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, modelAnswerMessage]);

          setTimeout(() => {
            const explanationMessage: ChatMessage = {
              id: (Date.now() + 3).toString(),
              type: "explanation",
              content: evaluation.explanation,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, explanationMessage]);

            setTimeout(() => {
              const phrasesMessage: ChatMessage = {
                id: (Date.now() + 4).toString(),
                type: "similar_phrases",
                content: "類似フレーズ",
                phrases: evaluation.similarPhrases,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, phrasesMessage]);

              setTimeout(() => {
                const nextButtonMessage: ChatMessage = {
                  id: (Date.now() + 5).toString(),
                  type: "next_button",
                  content: "次の問題",
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, nextButtonMessage]);
              }, 500);
            }, 500);
          }, 500);
        }, 500);
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
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 max-w-xs shadow-sm border">
              <div className="text-sm font-medium text-gray-800 mb-1">問題 - 翻訳してください</div>
              <div className="text-gray-800">{message.content}</div>
            </div>
          </div>
        );

      case "user_answer":
        return (
          <div className="flex justify-end mb-4">
            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
              {message.content}
            </div>
          </div>
        );

      case "evaluation":
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-green-100 rounded-full p-3 mr-3">
              <div className="w-6 h-6 text-green-600">⭐</div>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 max-w-xs shadow-sm border">
              <div className="flex items-center">
                <div className="text-lg font-bold text-blue-600 mr-2">{message.content}</div>
                <div className="text-yellow-400">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < (message.rating || 0) ? "text-yellow-400" : "text-gray-300"}>⭐</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "model_answer":
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-green-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-sm shadow-sm border border-green-200">
              <div className="text-sm font-medium text-green-800 mb-1">模範解答</div>
              <div className="text-gray-800">{message.content}</div>
            </div>
          </div>
        );

      case "explanation":
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-blue-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-sm shadow-sm border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-1">解説</div>
              <div className="text-gray-800 whitespace-pre-line">{message.content}</div>
            </div>
          </div>
        );

      case "similar_phrases":
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-purple-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-sm shadow-sm border border-purple-200">
              <div className="text-sm font-medium text-purple-800 mb-2">類似フレーズ</div>
              <div className="space-y-1">
                {message.phrases?.map((phrase, index) => (
                  <div key={index} className="text-gray-700">• {phrase}</div>
                ))}
              </div>
            </div>
          </div>
        );

      case "next_button":
        return (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleNextProblem}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-full transition-colors"
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message) => renderMessage(message))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">評価中...</span>
              </div>
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