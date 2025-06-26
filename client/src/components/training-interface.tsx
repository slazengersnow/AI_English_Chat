import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, Bookmark, BookmarkCheck, User, Home } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import type { TranslateResponse, ProblemResponse } from "@shared/schema";
import { useLocation } from "wouter";

interface TrainingInterfaceProps {
  difficulty: DifficultyKey;
  onBack: () => void;
  onShowPayment: () => void;
}

interface TrainingMessage {
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
  isBookmarked?: boolean;
}

export function TrainingInterface({ difficulty, onBack, onShowPayment }: TrainingInterfaceProps) {
  const [messages, setMessages] = useState<TrainingMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentProblem, setCurrentProblem] = useState<string>("");
  const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false);
  const [problemNumber, setProblemNumber] = useState(1);
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`bookmarks-${difficulty}`);
    if (saved) {
      setBookmarkedProblems(new Set(JSON.parse(saved)));
    }
  }, [difficulty]);

  // Store training session IDs to enable database bookmark updates
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Save bookmarks to localStorage
  const saveBookmarks = (bookmarks: Set<string>) => {
    localStorage.setItem(`bookmarks-${difficulty}`, JSON.stringify(Array.from(bookmarks)));
  };

  // Toggle bookmark for a problem and update database if training session exists
  const toggleBookmark = async (problemText: string) => {
    const newBookmarks = new Set(bookmarkedProblems);
    const isBookmarked = !newBookmarks.has(problemText);
    
    if (newBookmarks.has(problemText)) {
      newBookmarks.delete(problemText);
    } else {
      newBookmarks.add(problemText);
    }
    
    setBookmarkedProblems(newBookmarks);
    saveBookmarks(newBookmarks);

    // Update database bookmark if we have a current session ID
    if (currentSessionId) {
      try {
        await apiRequest("POST", `/api/sessions/${currentSessionId}/bookmark`, {
          isBookmarked
        });
        // Invalidate bookmarked sessions cache
        queryClient.invalidateQueries({ queryKey: ["/api/bookmarked-sessions"] });
      } catch (error) {
        console.error("Failed to update bookmark in database:", error);
      }
    }
  };

  // Get new problem
  const getProblemMutation = useMutation({
    mutationFn: async (): Promise<ProblemResponse> => {
      const response = await apiRequest("POST", "/api/problem", {
        difficultyLevel: difficulty,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentProblem(data.japaneseSentence);
      const problemMessage: TrainingMessage = {
        type: 'problem',
        content: data.japaneseSentence,
        timestamp: new Date().toISOString(),
        problemNumber: problemNumber,
        isBookmarked: bookmarkedProblems.has(data.japaneseSentence),
      };
      setMessages(prev => [...prev, problemMessage]);
      setIsWaitingForTranslation(true);
      setProblemNumber(prev => prev + 1);
    },
  });

  // Evaluate translation
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
      const evaluationMessage: TrainingMessage = {
        type: 'evaluation',
        content: data.feedback,
        rating: data.rating,
        feedback: data.feedback,
        correctTranslation: data.correctTranslation,
        explanation: data.explanation,
        similarPhrases: data.similarPhrases,
        improvements: data.improvements,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, evaluationMessage]);
      setIsWaitingForTranslation(false);
      
      // Store session ID if available for bookmark functionality
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
      }
      
      // Auto-generate next problem after 3 seconds
      setTimeout(() => {
        getProblemMutation.mutate();
      }, 3000);
    },
  });

  const handleSubmit = () => {
    if (!input.trim() || !isWaitingForTranslation) return;

    const userMessage: TrainingMessage = {
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    evaluateTranslationMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for review problem from sessionStorage or start with first problem
  useEffect(() => {
    if (messages.length === 0) {
      const reviewProblem = sessionStorage.getItem('reviewProblem');
      if (reviewProblem) {
        const problemData = JSON.parse(reviewProblem);
        if (problemData.difficultyLevel === difficulty) {
          // Set up review problem
          setCurrentProblem(problemData.japaneseSentence);
          const problemMessage: TrainingMessage = {
            type: 'problem',
            content: problemData.japaneseSentence,
            timestamp: new Date().toISOString(),
            problemNumber: problemNumber,
          };
          setMessages([problemMessage]);
          // Don't reset problem number, let it continue from current value
          setIsWaitingForTranslation(true);
          
          // Clear the review problem from sessionStorage
          sessionStorage.removeItem('reviewProblem');
          return;
        }
      }
      // No review problem or not for this difficulty, get new problem
      getProblemMutation.mutate();
    }
  }, []);

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
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="sm"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">英作文トレーニング</h3>
          <p className="text-xs text-gray-600">{DIFFICULTY_LEVELS[difficulty].name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => setLocation('/')}
        >
          <Home className="w-5 h-5 text-gray-600" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setLocation('/my-page')}
        >
          <User className="w-4 h-4 mr-1" />
          マイページ
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="animate-fade-in">
            {message.type === 'problem' && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-600">
                      問題{message.problemNumber} - 翻訳してください
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={() => toggleBookmark(message.content)}
                    >
                      {bookmarkedProblems.has(message.content) ? (
                        <BookmarkCheck className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
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
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-2">
                    {renderStars(message.rating || 0)}
                    <span className="text-sm text-gray-600 ml-2">
                      {message.rating}/5点
                    </span>
                  </div>
                  
                  {/* Correct Translation - Large Font */}
                  {message.correctTranslation && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-2">模範解答</p>
                      <p className="text-lg font-medium text-green-900 leading-relaxed">
                        {message.correctTranslation}
                      </p>
                    </div>
                  )}

                  {/* Explanation in Japanese */}
                  {message.explanation && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-700 mb-2">解説</p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {message.explanation}
                      </p>
                    </div>
                  )}

                  {/* Similar Phrases */}
                  {message.similarPhrases && message.similarPhrases.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 mb-2">類似フレーズ</p>
                      <div className="space-y-1">
                        {message.similarPhrases.map((phrase, idx) => (
                          <p key={idx} className="text-sm text-purple-800">
                            • {phrase}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Feedback */}
                  <p className="text-sm leading-relaxed text-gray-700">
                    {message.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {(getProblemMutation.isPending || evaluateTranslationMutation.isPending) && (
          <div className="flex items-start space-x-2 animate-fade-in">
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isWaitingForTranslation ? "英語で翻訳を入力..." : "問題を取得中..."}
              disabled={!isWaitingForTranslation}
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm max-h-32 border-0 disabled:opacity-50"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || !isWaitingForTranslation || evaluateTranslationMutation.isPending}
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-0"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}