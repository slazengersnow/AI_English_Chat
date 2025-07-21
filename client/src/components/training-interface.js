import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, Bookmark, BookmarkCheck, User, Home, Shield, } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DIFFICULTY_LEVELS } from "@/lib/constants";
import { useLocation } from "wouter";
import { SpeechButton } from "@/components/speech-button";
import { useAuth } from "@/components/auth-provider";
export function TrainingInterface({ difficulty, onBack, onShowPayment, }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [currentProblem, setCurrentProblem] = useState("");
    const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false);
    const [problemNumber, setProblemNumber] = useState(1);
    const [hasInitializedProblemNumber, setHasInitializedProblemNumber] = useState(false);
    const [bookmarkedProblems, setBookmarkedProblems] = useState(new Set());
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const { isAdmin } = useAuth();
    // Get user subscription status
    const { data: userSubscription } = useQuery({
        queryKey: ["/api/user-subscription"],
    });
    // Load bookmarks from localStorage and initialize problem number
    useEffect(() => {
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
    const [currentSessionId, setCurrentSessionId] = useState(null);
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
                await apiRequest("POST", `/api/sessions/${currentSessionId}/bookmark`, {
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
    const getProblemMutation = useMutation({
        mutationFn: async () => {
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
    const evaluateTranslationMutation = useMutation({
        mutationFn: async (userTranslation) => {
            const response = await apiRequest("POST", "/api/translate", {
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
    // Check for repeat practice mode or review problem from sessionStorage or start with first problem
    useEffect(() => {
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
        return Array.from({ length: 5 }, (_, i) => (_jsx(Star, { className: `w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}` }, i)));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-2 sm:px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsxs("div", { className: "flex items-center space-x-2 flex-shrink-0", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "p-2 rounded-full hover:bg-gray-100", onClick: onBack, children: _jsx(ArrowLeft, { className: "w-5 h-5 text-gray-600" }) }), _jsx("div", { className: "w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center", children: _jsx(Sparkles, { className: "w-4 h-4 sm:w-5 sm:h-5 text-white" }) }), _jsxs("div", { className: "hidden sm:block", children: [_jsx("h3", { className: "font-semibold text-gray-900 text-sm", children: "AI\u77AC\u9593\u82F1\u4F5C\u6587\u30C1\u30E3\u30C3\u30C8" }), _jsx("p", { className: "text-xs text-gray-600", children: DIFFICULTY_LEVELS[difficulty].name })] })] }), _jsx("div", { className: "flex items-center", children: _jsxs("div", { className: "flex gap-2 flex-wrap items-center", children: [isAdmin && (_jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow", onClick: () => setLocation("/admin"), children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "\u7BA1\u7406\u8005"] })), _jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow", onClick: () => setLocation("/"), children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "\u30C8\u30C3\u30D7\u30DA\u30FC\u30B8"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow", onClick: () => setLocation("/my-page"), children: [_jsx(User, { className: "w-4 h-4 mr-2" }), "\u30DE\u30A4\u30DA\u30FC\u30B8"] })] }) })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-4", children: [messages.map((message, index) => (_jsxs("div", { className: "animate-fade-in", children: [message.type === "problem" && (_jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Sparkles, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("p", { className: "text-sm font-medium text-blue-600", children: ["\u554F\u984C", message.problemNumber, " - \u7FFB\u8A33\u3057\u3066\u304F\u3060\u3055\u3044"] }), _jsx(Button, { variant: "ghost", size: "sm", className: "p-1 h-auto", onClick: () => toggleBookmark(message.content), children: bookmarkedProblems.has(message.content) ? (_jsx(BookmarkCheck, { className: "w-4 h-4 text-blue-500" })) : (_jsx(Bookmark, { className: "w-4 h-4 text-gray-400" })) })] }), _jsx("p", { className: "text-base leading-relaxed text-gray-900", children: message.content })] })] })), message.type === "user" && (_jsx("div", { className: "flex justify-end", children: _jsx("div", { className: "bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-sm", children: _jsx("p", { className: "text-sm leading-relaxed", children: message.content }) }) })), message.type === "evaluation" && (_jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Star, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border", children: [message.rating && (_jsxs("div", { className: "flex items-center space-x-1 mb-2", children: [renderStars(message.rating), _jsxs("span", { className: "text-sm text-gray-600 ml-2", children: [message.rating, "/5\u70B9"] })] })), message.correctTranslation && (_jsxs("div", { className: "mb-4 p-4 bg-green-50 rounded-lg border border-green-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-sm font-medium text-green-700", children: "\u6A21\u7BC4\u89E3\u7B54" }), _jsx(SpeechButton, { text: message.correctTranslation, language: "en-US", className: "text-green-600 border-green-300 hover:bg-green-100" })] }), _jsx("p", { className: "text-lg font-medium text-green-900 leading-relaxed", children: message.correctTranslation })] })), message.explanation && (_jsxs("div", { className: "mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200", children: [_jsx("p", { className: "text-sm font-medium text-blue-700 mb-2", children: "\u89E3\u8AAC" }), _jsx("p", { className: "text-sm text-blue-800 leading-relaxed", children: message.explanation })] })), message.similarPhrases &&
                                                message.similarPhrases.length > 0 && (_jsxs("div", { className: "mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200", children: [_jsx("p", { className: "text-sm font-medium text-purple-700 mb-2", children: "\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA" }), _jsx("div", { className: "space-y-2", children: message.similarPhrases.map((phrase, idx) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-purple-800 flex-1", children: ["\u2022 ", phrase] }), _jsx(SpeechButton, { text: phrase, language: "en-US", className: "text-purple-600 border-purple-300 hover:bg-purple-100 ml-2" })] }, idx))) })] })), _jsx("p", { className: "text-sm leading-relaxed text-gray-700", children: message.feedback })] })] }))] }, index))), (getProblemMutation.isPending ||
                        evaluateTranslationMutation.isPending) && (_jsxs("div", { className: "flex items-start space-x-2 animate-fade-in", children: [_jsx("div", { className: "w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) }), _jsx("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-typing" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-typing", style: { animationDelay: "0.2s" } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-typing", style: { animationDelay: "0.4s" } })] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "bg-white border-t border-gray-200 px-4 py-3", children: _jsxs("div", { className: "flex items-end space-x-3", children: [_jsx("div", { className: "flex-1 relative", children: _jsx(Textarea, { ref: textareaRef, value: input, onChange: (e) => setInput(e.target.value), onKeyPress: handleKeyPress, placeholder: isWaitingForTranslation
                                    ? "英語で翻訳を入力..."
                                    : "問題を取得中...", disabled: !isWaitingForTranslation, className: "w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm max-h-32 border-0 disabled:opacity-50", rows: 1 }) }), _jsx(Button, { onClick: handleSubmit, disabled: !input.trim() ||
                                !isWaitingForTranslation ||
                                evaluateTranslationMutation.isPending, className: "w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-0", children: _jsx(Send, { className: "w-5 h-5 text-white" }) })] }) })] }));
}
