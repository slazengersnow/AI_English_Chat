"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingInterface = TrainingInterface;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const textarea_1 = require("@/components/ui/textarea");
const lucide_react_1 = require("lucide-react");
const react_query_1 = require("@tanstack/react-query");
const queryClient_1 = require("@/lib/queryClient");
const constants_1 = require("@/lib/constants");
const wouter_1 = require("wouter");
const speech_button_1 = require("@/components/speech-button");
const auth_provider_1 = require("@/components/auth-provider");
function TrainingInterface({ difficulty, onBack, onShowPayment, }) {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)("");
    const [currentProblem, setCurrentProblem] = (0, react_1.useState)("");
    const [isWaitingForTranslation, setIsWaitingForTranslation] = (0, react_1.useState)(false);
    const [problemNumber, setProblemNumber] = (0, react_1.useState)(1);
    const [hasInitializedProblemNumber, setHasInitializedProblemNumber] = (0, react_1.useState)(false);
    const [bookmarkedProblems, setBookmarkedProblems] = (0, react_1.useState)(new Set());
    const messagesEndRef = (0, react_1.useRef)(null);
    const textareaRef = (0, react_1.useRef)(null);
    const queryClient = (0, react_query_1.useQueryClient)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { isAdmin } = (0, auth_provider_1.useAuth)();
    // Get user subscription status
    const { data: userSubscription } = (0, react_query_1.useQuery)({
        queryKey: ["/api/user-subscription"],
    });
    // Load bookmarks from localStorage and initialize problem number
    (0, react_1.useEffect)(() => {
        const saved = localStorage.getItem(`bookmarks-${difficulty}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setBookmarkedProblems(new Set(Array.isArray(parsed) ? parsed : []));
            }
            catch (error) {
                console.error("Error parsing bookmarks:", error);
                setBookmarkedProblems(new Set());
            }
        }
        // Reset problem number when difficulty changes
        setProblemNumber(1);
        setHasInitializedProblemNumber(false);
    }, [difficulty]);
    // Store training session IDs to enable database bookmark updates
    const [currentSessionId, setCurrentSessionId] = (0, react_1.useState)(null);
    // Save bookmarks to localStorage
    const saveBookmarks = (bookmarks) => {
        try {
            localStorage.setItem(`bookmarks-${difficulty}`, JSON.stringify(Array.from(bookmarks)));
        }
        catch (error) {
            console.error("Error saving bookmarks:", error);
        }
    };
    // Toggle bookmark for a problem and update database if training session exists
    const toggleBookmark = async (problemText) => {
        const newBookmarks = new Set(bookmarkedProblems);
        const isBookmarked = !newBookmarks.has(problemText);
        if (newBookmarks.has(problemText)) {
            newBookmarks.delete(problemText);
        }
        else {
            newBookmarks.add(problemText);
        }
        setBookmarkedProblems(newBookmarks);
        saveBookmarks(newBookmarks);
        // Update database bookmark if we have a current session ID
        if (currentSessionId) {
            try {
                await (0, queryClient_1.apiRequest)("POST", `/api/sessions/${currentSessionId}/bookmark`, {
                    isBookmarked,
                });
                // Invalidate bookmarked sessions cache
                queryClient.invalidateQueries({
                    queryKey: ["/api/bookmarked-sessions"],
                });
            }
            catch (error) {
                console.error("Failed to update bookmark in database:", error);
            }
        }
    };
    // Get new problem
    const getProblemMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/problem", {
                difficultyLevel: difficulty,
            });
            return response.json();
        },
        onSuccess: (data) => {
            setCurrentProblem(data.japaneseSentence);
            // Extract problem number from hints if provided
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
            const problemMessage = {
                type: "problem",
                content: data.japaneseSentence,
                timestamp: new Date().toISOString(),
                problemNumber: currentProblemNum,
                isBookmarked: bookmarkedProblems.has(data.japaneseSentence),
            };
            setMessages((prev) => [...prev, problemMessage]);
            setIsWaitingForTranslation(true);
        },
        onError: (error) => {
            console.error("Problem generation error:", error);
            if (error.message?.includes("429") ||
                error.message?.includes("最大出題数")) {
                // Daily limit reached
                const limitMessage = {
                    type: "evaluation",
                    content: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。",
                    timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, limitMessage]);
                setIsWaitingForTranslation(false);
            }
        },
    });
    // Evaluate translation
    const evaluateTranslationMutation = (0, react_query_1.useMutation)({
        mutationFn: async (userTranslation) => {
            const response = await (0, queryClient_1.apiRequest)("POST", "/api/translate", {
                japaneseSentence: currentProblem,
                userTranslation,
                difficultyLevel: difficulty,
            });
            return response.json();
        },
        onSuccess: (data) => {
            const evaluationMessage = {
                type: "evaluation",
                content: data.feedback,
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
            // Store session ID if available for bookmark functionality
            if (data.sessionId) {
                setCurrentSessionId(data.sessionId);
            }
            // Auto-generate next problem after 3 seconds
            setTimeout(() => {
                // Check if we're in repeat practice mode
                const isRepeatMode = sessionStorage.getItem("repeatPracticeMode");
                const repeatSessions = sessionStorage.getItem("repeatPracticeSessions");
                const repeatIndex = sessionStorage.getItem("repeatPracticeIndex");
                if (isRepeatMode && repeatSessions && repeatIndex !== null) {
                    try {
                        const sessions = JSON.parse(repeatSessions);
                        const currentIndex = parseInt(repeatIndex);
                        const nextIndex = currentIndex + 1;
                        // Filter sessions by current difficulty
                        const filteredSessions = sessions.filter((s) => s.difficultyLevel === difficulty);
                        if (nextIndex < filteredSessions.length) {
                            const nextSession = filteredSessions[nextIndex];
                            if (nextSession) {
                                // Update index and show next repeat practice problem
                                sessionStorage.setItem("repeatPracticeIndex", nextIndex.toString());
                                setCurrentProblem(nextSession.japaneseSentence);
                                setProblemNumber(nextIndex + 1);
                                const problemMessage = {
                                    type: "problem",
                                    content: nextSession.japaneseSentence,
                                    timestamp: new Date().toISOString(),
                                    problemNumber: nextIndex + 1,
                                };
                                setMessages((prev) => [...prev, problemMessage]);
                                setIsWaitingForTranslation(true);
                                return;
                            }
                        }
                        else {
                            // All repeat practice problems completed
                            sessionStorage.removeItem("repeatPracticeMode");
                            sessionStorage.removeItem("repeatPracticeSessions");
                            sessionStorage.removeItem("repeatPracticeIndex");
                        }
                    }
                    catch (error) {
                        console.error("Error parsing repeat practice sessions:", error);
                        // Clear corrupted session storage
                        sessionStorage.removeItem("repeatPracticeMode");
                        sessionStorage.removeItem("repeatPracticeSessions");
                        sessionStorage.removeItem("repeatPracticeIndex");
                    }
                }
                // Regular mode - get new problem
                if (!hasInitializedProblemNumber) {
                    setHasInitializedProblemNumber(true);
                }
                setProblemNumber((prev) => prev + 1);
                getProblemMutation.mutate();
            }, 3000);
        },
        onError: (error) => {
            console.error("Translation evaluation error:", error);
            setIsWaitingForTranslation(false);
        },
    });
    const handleSubmit = () => {
        if (!input.trim() || !isWaitingForTranslation)
            return;
        const userMessage = {
            type: "user",
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        evaluateTranslationMutation.mutate(input.trim());
        setInput("");
    };
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };
    // Auto-resize textarea
    (0, react_1.useEffect)(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 128) + "px";
        }
    }, [input]);
    // Scroll to bottom when messages change
    (0, react_1.useEffect)(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    // Check for repeat practice mode or review problem from sessionStorage or start with first problem
    (0, react_1.useEffect)(() => {
        if (messages.length === 0) {
            // Check for repeat practice mode
            const isRepeatMode = sessionStorage.getItem("repeatPracticeMode");
            const repeatSessions = sessionStorage.getItem("repeatPracticeSessions");
            const repeatIndex = sessionStorage.getItem("repeatPracticeIndex");
            if (isRepeatMode && repeatSessions && repeatIndex !== null) {
                try {
                    const sessions = JSON.parse(repeatSessions);
                    const currentIndex = parseInt(repeatIndex);
                    if (currentIndex < sessions.length) {
                        const currentSession = sessions[currentIndex];
                        if (currentSession.difficultyLevel === difficulty) {
                            // Set up repeat practice problem
                            setCurrentProblem(currentSession.japaneseSentence);
                            setProblemNumber(currentIndex + 1);
                            const problemMessage = {
                                type: "problem",
                                content: currentSession.japaneseSentence,
                                timestamp: new Date().toISOString(),
                                problemNumber: currentIndex + 1,
                            };
                            setMessages([problemMessage]);
                            setIsWaitingForTranslation(true);
                            return;
                        }
                    }
                    else {
                        // All repeat practice problems completed, clear mode
                        sessionStorage.removeItem("repeatPracticeMode");
                        sessionStorage.removeItem("repeatPracticeSessions");
                        sessionStorage.removeItem("repeatPracticeIndex");
                    }
                }
                catch (error) {
                    console.error("Error parsing repeat practice sessions:", error);
                    // Clear corrupted session storage
                    sessionStorage.removeItem("repeatPracticeMode");
                    sessionStorage.removeItem("repeatPracticeSessions");
                    sessionStorage.removeItem("repeatPracticeIndex");
                }
            }
            // Check for single review problem
            const reviewProblem = sessionStorage.getItem("reviewProblem");
            if (reviewProblem) {
                try {
                    const problemData = JSON.parse(reviewProblem);
                    if (problemData.difficultyLevel === difficulty) {
                        // Set up review problem - start from problem 1 for review mode
                        setCurrentProblem(problemData.japaneseSentence);
                        setProblemNumber(1);
                        const problemMessage = {
                            type: "problem",
                            content: problemData.japaneseSentence,
                            timestamp: new Date().toISOString(),
                            problemNumber: 1,
                        };
                        setMessages([problemMessage]);
                        setIsWaitingForTranslation(true);
                        // Clear the review problem from sessionStorage
                        sessionStorage.removeItem("reviewProblem");
                        return;
                    }
                }
                catch (error) {
                    console.error("Error parsing review problem:", error);
                    sessionStorage.removeItem("reviewProblem");
                }
            }
            // No review problem or not for this difficulty, get new problem
            getProblemMutation.mutate();
        }
    }, [difficulty, getProblemMutation, messages.length]);
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (<lucide_react_1.Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}/>));
    };
    return (<div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left section */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button_1.Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-100" onClick={onBack}>
              <lucide_react_1.ArrowLeft className="w-5 h-5 text-gray-600"/>
            </button_1.Button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <lucide_react_1.Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>
            </div>
            <div className="hidden sm:block">
              <h3 className="font-semibold text-gray-900 text-sm">
                AI瞬間英作文チャット
              </h3>
              <p className="text-xs text-gray-600">
                {constants_1.DIFFICULTY_LEVELS[difficulty].name}
              </p>
            </div>
          </div>

          {/* Right section - buttons */}
          <div className="flex items-center">
            <div className="flex gap-2 flex-wrap items-center">
              {isAdmin && (<button_1.Button variant="outline" size="sm" className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow" onClick={() => setLocation("/admin")}>
                  <lucide_react_1.Shield className="w-4 h-4 mr-2"/>
                  管理者
                </button_1.Button>)}
              <button_1.Button variant="outline" size="sm" className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow" onClick={() => setLocation("/")}>
                <lucide_react_1.Home className="w-4 h-4 mr-2"/>
                トップページ
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" className="px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow" onClick={() => setLocation("/my-page")}>
                <lucide_react_1.User className="w-4 h-4 mr-2"/>
                マイページ
              </button_1.Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (<div key={index} className="animate-fade-in">
            {message.type === "problem" && (<div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <lucide_react_1.Sparkles className="w-4 h-4 text-white"/>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-600">
                      問題{message.problemNumber} - 翻訳してください
                    </p>
                    <button_1.Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => toggleBookmark(message.content)}>
                      {bookmarkedProblems.has(message.content) ? (<lucide_react_1.BookmarkCheck className="w-4 h-4 text-blue-500"/>) : (<lucide_react_1.Bookmark className="w-4 h-4 text-gray-400"/>)}
                    </button_1.Button>
                  </div>
                  <p className="text-base leading-relaxed text-gray-900">
                    {message.content}
                  </p>
                </div>
              </div>)}

            {message.type === "user" && (<div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-sm">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>)}

            {message.type === "evaluation" && (<div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <lucide_react_1.Star className="w-4 h-4 text-white"/>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
                  {/* Rating */}
                  {message.rating && (<div className="flex items-center space-x-1 mb-2">
                      {renderStars(message.rating)}
                      <span className="text-sm text-gray-600 ml-2">
                        {message.rating}/5点
                      </span>
                    </div>)}

                  {/* Correct Translation - Large Font */}
                  {message.correctTranslation && (<div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-700">
                          模範解答
                        </p>
                        <speech_button_1.SpeechButton text={message.correctTranslation} language="en-US" className="text-green-600 border-green-300 hover:bg-green-100"/>
                      </div>
                      <p className="text-lg font-medium text-green-900 leading-relaxed">
                        {message.correctTranslation}
                      </p>
                    </div>)}

                  {/* Explanation in Japanese */}
                  {message.explanation && (<div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-700 mb-2">
                        解説
                      </p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {message.explanation}
                      </p>
                    </div>)}

                  {/* Similar Phrases */}
                  {message.similarPhrases &&
                    message.similarPhrases.length > 0 && (<div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-700 mb-2">
                          類似フレーズ
                        </p>
                        <div className="space-y-2">
                          {message.similarPhrases.map((phrase, idx) => (<div key={idx} className="flex items-center justify-between">
                              <p className="text-sm text-purple-800 flex-1">
                                • {phrase}
                              </p>
                              <speech_button_1.SpeechButton text={phrase} language="en-US" className="text-purple-600 border-purple-300 hover:bg-purple-100 ml-2"/>
                            </div>))}
                        </div>
                      </div>)}

                  {/* Feedback */}
                  <p className="text-sm leading-relaxed text-gray-700">
                    {message.feedback}
                  </p>
                </div>
              </div>)}
          </div>))}

        {/* Loading Indicator */}
        {(getProblemMutation.isPending ||
            evaluateTranslationMutation.isPending) && (<div className="flex items-start space-x-2 animate-fade-in">
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>)}

        <div ref={messagesEndRef}/>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea_1.Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={isWaitingForTranslation
            ? "英語で翻訳を入力..."
            : "問題を取得中..."} disabled={!isWaitingForTranslation} className="w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm max-h-32 border-0 disabled:opacity-50" rows={1}/>
          </div>
          <button_1.Button onClick={handleSubmit} disabled={!input.trim() ||
            !isWaitingForTranslation ||
            evaluateTranslationMutation.isPending} className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-0">
            <lucide_react_1.Send className="w-5 h-5 text-white"/>
          </button_1.Button>
        </div>
      </div>
    </div>);
}
