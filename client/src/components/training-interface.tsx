import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, Bookmark, BookmarkCheck, User, Home, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS, type DifficultyKey } from "@/lib/constants";
import type { TranslateResponse, ProblemResponse, UserSubscription } from "@shared/schema";
import { useLocation } from "wouter";
import { SpeechButton } from "@/components/speech-button";

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
  const [hasInitializedProblemNumber, setHasInitializedProblemNumber] = useState(false);
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get user subscription to check admin status
  const { data: userSubscription } = useQuery<UserSubscription>({
    queryKey: ["/api/user-subscription"],
  });

  // Load bookmarks from localStorage and initialize problem number
  useEffect(() => {
    const saved = localStorage.getItem(`bookmarks-${difficulty}`);
    if (saved) {
      setBookmarkedProblems(new Set(JSON.parse(saved)));
    }
    
    // Reset problem number when difficulty changes
    setProblemNumber(1);
    setHasInitializedProblemNumber(false);
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
      
      // Extract problem number from hints if provided
      let currentProblemNum = problemNumber;
      if (data.hints && data.hints.length > 0) {
        const problemHint = data.hints.find(hint => hint.startsWith('問題'));
        if (problemHint) {
          const match = problemHint.match(/問題(\d+)/);
          if (match) {
            currentProblemNum = parseInt(match[1]);
            setProblemNumber(currentProblemNum);
          }
        }
      }
      
      const problemMessage: TrainingMessage = {
        type: 'problem',
        content: data.japaneseSentence,
        timestamp: new Date().toISOString(),
        problemNumber: currentProblemNum,
        isBookmarked: bookmarkedProblems.has(data.japaneseSentence),
      };
      setMessages(prev => [...prev, problemMessage]);
      setIsWaitingForTranslation(true);
    },
    onError: (error: any) => {
      if (error.message?.includes('429') || error.message?.includes('最大出題数')) {
        // Daily limit reached
        const limitMessage: TrainingMessage = {
          type: 'evaluation',
          content: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, limitMessage]);
        setIsWaitingForTranslation(false);
      } else {
        console.error("Problem generation error:", error);
      }
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
        // Check if we're in repeat practice mode
        const isRepeatMode = sessionStorage.getItem('repeatPracticeMode');
        const repeatSessions = sessionStorage.getItem('repeatPracticeSessions');
        const repeatIndex = sessionStorage.getItem('repeatPracticeIndex');
        
        if (isRepeatMode && repeatSessions && repeatIndex !== null) {
          const sessions = JSON.parse(repeatSessions);
          const currentIndex = parseInt(repeatIndex);
          const nextIndex = currentIndex + 1;
          
          if (nextIndex < sessions.length) {
            const nextSession = sessions.filter(s => s.difficultyLevel === difficulty)[nextIndex];
            if (nextSession) {
              // Update index and show next repeat practice problem
              sessionStorage.setItem('repeatPracticeIndex', nextIndex.toString());
              setCurrentProblem(nextSession.japaneseSentence);
              setProblemNumber(nextIndex + 1);
              const problemMessage: TrainingMessage = {
                type: 'problem',
                content: nextSession.japaneseSentence,
                timestamp: new Date().toISOString(),
                problemNumber: nextIndex + 1,
              };
              setMessages(prev => [...prev, problemMessage]);
              setIsWaitingForTranslation(true);
              return;
            }
          } else {
            // All repeat practice problems completed
            sessionStorage.removeItem('repeatPracticeMode');
            sessionStorage.removeItem('repeatPracticeSessions');
            sessionStorage.removeItem('repeatPracticeIndex');
          }
        }
        
        // Regular mode - get new problem
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

  // Check for repeat practice mode or review problem from sessionStorage or start with first problem
  useEffect(() => {
    if (messages.length === 0) {
      // Check for repeat practice mode
      const isRepeatMode = sessionStorage.getItem('repeatPracticeMode');
      const repeatSessions = sessionStorage.getItem('repeatPracticeSessions');
      const repeatIndex = sessionStorage.getItem('repeatPracticeIndex');
      
      if (isRepeatMode && repeatSessions && repeatIndex !== null) {
        const sessions = JSON.parse(repeatSessions);
        const currentIndex = parseInt(repeatIndex);
        
        if (currentIndex < sessions.length) {
          const currentSession = sessions[currentIndex];
          if (currentSession.difficultyLevel === difficulty) {
            // Set up repeat practice problem
            setCurrentProblem(currentSession.japaneseSentence);
            setProblemNumber(currentIndex + 1);
            const problemMessage: TrainingMessage = {
              type: 'problem',
              content: currentSession.japaneseSentence,
              timestamp: new Date().toISOString(),
              problemNumber: currentIndex + 1,
            };
            setMessages([problemMessage]);
            setIsWaitingForTranslation(true);
            return;
          }
        } else {
          // All repeat practice problems completed, clear mode
          sessionStorage.removeItem('repeatPracticeMode');
          sessionStorage.removeItem('repeatPracticeSessions');
          sessionStorage.removeItem('repeatPracticeIndex');
        }
      }
      
      // Check for single review problem
      const reviewProblem = sessionStorage.getItem('reviewProblem');
      if (reviewProblem) {
        const problemData = JSON.parse(reviewProblem);
        if (problemData.difficultyLevel === difficulty) {
          // Set up review problem - start from problem 1 for review mode
          setCurrentProblem(problemData.japaneseSentence);
          setProblemNumber(1);
          const problemMessage: TrainingMessage = {
            type: 'problem',
            content: problemData.japaneseSentence,
            timestamp: new Date().toISOString(),
            problemNumber: 1,
          };
          setMessages([problemMessage]);
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
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h3 className="font-semibold text-gray-900 text-sm">AI英作文チャット</h3>
              <p className="text-xs text-gray-600">{DIFFICULTY_LEVELS[difficulty].name}</p>
            </div>
          </div>
          
          {/* Right section - buttons */}
          <div className="flex items-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs border-gray-300 hover:bg-gray-50 whitespace-nowrap"
                onClick={() => setLocation('/my-page')}
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">マイページ</span>
                <span className="sm:hidden ml-1">MY</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 border-gray-300 hover:bg-gray-50"
                onClick={() => setLocation('/')}
                title="トップページ"
              >
                <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              {userSubscription?.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-gray-300 hover:bg-gray-50 whitespace-nowrap col-span-2 sm:col-span-1"
                  onClick={() => setLocation('/admin')}
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">管理者</span>
                  <span className="sm:hidden ml-1">管理</span>
                </Button>
              )}
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
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-700">模範解答</p>
                        <SpeechButton 
                          text={message.correctTranslation}
                          language="en-US"
                          className="text-green-600 border-green-300 hover:bg-green-100"
                        />
                      </div>
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
                      <div className="space-y-2">
                        {message.similarPhrases.map((phrase, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <p className="text-sm text-purple-800 flex-1">
                              • {phrase}
                            </p>
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