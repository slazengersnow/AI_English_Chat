import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Star, Sparkles, User, Home, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PremiumGate } from "@/components/premium-gate";
import { SpeechButton } from "@/components/speech-button";
import { useAuth } from "@/components/auth-provider";
export default function SimulationPractice() {
    return (_jsx(PremiumGate, { feature: "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2", children: _jsx(SimulationPracticeContent, {}) }));
}
function SimulationPracticeContent() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { isAdmin } = useAuth();
    const scenarioId = parseInt(id || "1");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [currentProblem, setCurrentProblem] = useState("");
    const [currentContext, setCurrentContext] = useState("");
    const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false);
    const [problemNumber, setProblemNumber] = useState(1);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    // Get user subscription status
    const { data: userSubscription } = useQuery({
        queryKey: ["/api/user-subscription"],
    });
    // Get scenario details
    const { data: scenario } = useQuery({
        queryKey: [`/api/custom-scenarios/${id}`],
        enabled: !!id,
    });
    // Get simulation problem
    const getSimulationProblemMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/simulation-problem/${scenarioId}`);
            if (!response.ok)
                throw new Error('Failed to fetch problem');
            return response.json();
        },
        onSuccess: (data) => {
            setCurrentProblem(data.japaneseSentence);
            setCurrentContext(data.context);
            const problemMessage = {
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
            toast({
                title: "エラー",
                description: "問題の生成に失敗しました。しばらくしてからもう一度お試しください。",
                variant: "destructive",
            });
        },
    });
    const translateMutation = useMutation({
        mutationFn: async (translation) => {
            const response = await apiRequest("POST", "/api/translate", {
                japaneseSentence: currentProblem,
                userTranslation: translation,
                difficultyLevel: `simulation-${scenarioId}`,
            });
            return await response.json();
        },
        onSuccess: (data) => {
            const userMessage = {
                type: 'user',
                content: input,
                timestamp: new Date().toISOString(),
            };
            const evaluationMessage = {
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
            // Auto-generate next problem after evaluation
            setTimeout(() => {
                setProblemNumber(prev => prev + 1);
                getSimulationProblemMutation.mutate();
                // Auto-focus textarea for next input after problem is generated
                setTimeout(() => {
                    textareaRef.current?.focus();
                }, 100);
            }, 1000);
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
    const handleKeyPress = (e) => {
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
                const problemData = JSON.parse(reviewProblem);
                if (problemData.difficultyLevel === `simulation-${scenarioId}`) {
                    // Set up review problem
                    setCurrentProblem(problemData.japaneseSentence);
                    const problemMessage = {
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
            }
            // No review problem or not for this simulation, get new problem
            getSimulationProblemMutation.mutate();
        }
    }, []);
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (_jsx(Star, { className: `w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}` }, i)));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col", children: [_jsx("div", { className: "bg-white border-b border-gray-200 px-2 sm:px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsxs("div", { className: "flex items-center space-x-2 flex-shrink-0", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "p-2 rounded-full hover:bg-gray-100", onClick: () => setLocation('/simulation'), children: _jsx(ArrowLeft, { className: "w-5 h-5 text-gray-600" }) }), _jsx("div", { className: "w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center", children: _jsx(Sparkles, { className: "w-4 h-4 sm:w-5 sm:h-5 text-white" }) }), _jsxs("div", { className: "hidden sm:block", children: [_jsx("h3", { className: "font-semibold text-gray-900 text-sm", children: "\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u7DF4\u7FD2" }), _jsx("p", { className: "text-xs text-gray-600", children: scenario?.title || "読み込み中..." })] })] }), _jsx("div", { className: "flex items-center", children: _jsxs("div", { className: "flex gap-2 flex-wrap items-center", children: [isAdmin && (_jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow", onClick: () => setLocation('/admin'), children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "\u7BA1\u7406\u8005"] })), _jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow", onClick: () => setLocation('/'), children: [_jsx(Home, { className: "w-4 h-4 mr-2" }), "\u30C8\u30C3\u30D7\u30DA\u30FC\u30B8"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "px-4 py-2 text-sm border-gray-300 hover:bg-gray-50 whitespace-nowrap flex items-center rounded shadow", onClick: () => setLocation('/my-page'), children: [_jsx(User, { className: "w-4 h-4 mr-2" }), "\u30DE\u30A4\u30DA\u30FC\u30B8"] })] }) })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-4", children: [messages.map((message, index) => (_jsxs("div", { className: "animate-fade-in", children: [message.type === 'problem' && (_jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Sparkles, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsxs("p", { className: "text-sm font-medium text-purple-600", children: ["\u554F\u984C", message.problemNumber, " - \u7FFB\u8A33\u3057\u3066\u304F\u3060\u3055\u3044"] }) }), message.context && (_jsxs("p", { className: "text-xs text-gray-600 mb-2", children: [_jsx("strong", { children: "\u30B7\u30C1\u30E5\u30A8\u30FC\u30B7\u30E7\u30F3:" }), " ", message.context] })), _jsx("p", { className: "text-base leading-relaxed text-gray-900", children: message.content })] })] })), message.type === 'user' && (_jsx("div", { className: "flex justify-end", children: _jsx("div", { className: "bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-sm", children: _jsx("p", { className: "text-sm leading-relaxed", children: message.content }) }) })), message.type === 'evaluation' && (_jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Star, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border flex-1 space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "flex space-x-1", children: renderStars(message.rating || 0) }), _jsxs("span", { className: "text-sm text-gray-600", children: ["(", message.rating, "/5\u70B9)"] })] }), _jsxs("div", { className: "bg-green-50 p-3 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-sm text-green-800", children: "\u6A21\u7BC4\u89E3\u7B54" }), message.correctTranslation && (_jsx(SpeechButton, { text: message.correctTranslation, language: "en-US", className: "text-green-600 border-green-300 hover:bg-green-100" }))] }), _jsx("p", { className: "text-base leading-relaxed text-gray-900 font-medium", children: message.correctTranslation })] }), message.explanation && (_jsxs("div", { className: "bg-blue-50 p-3 rounded-lg", children: [_jsx("h4", { className: "font-medium text-sm text-blue-800 mb-2", children: "\u89E3\u8AAC" }), _jsx("p", { className: "text-sm leading-relaxed text-gray-700", children: message.explanation })] })), message.similarPhrases && message.similarPhrases.length > 0 && (_jsxs("div", { className: "bg-purple-50 p-3 rounded-lg", children: [_jsx("h4", { className: "font-medium text-sm text-purple-800 mb-2", children: "\u985E\u4F3C\u30D5\u30EC\u30FC\u30BA" }), _jsx("div", { className: "space-y-2", children: message.similarPhrases.map((phrase, i) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-sm text-gray-700 flex-1", children: ["\u2022 ", phrase] }), _jsx(SpeechButton, { text: phrase, language: "en-US", className: "text-purple-600 border-purple-300 hover:bg-purple-100 ml-2" })] }, i))) })] })), _jsx("div", { className: "pt-2", children: _jsx("p", { className: "text-xs text-gray-500 text-center", children: "\u6B21\u306E\u554F\u984C\u3092\u81EA\u52D5\u751F\u6210\u4E2D..." }) })] })] }))] }, index))), isWaitingForTranslation && (_jsxs("div", { className: "flex items-start space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Star, { className: "w-4 h-4 text-white animate-pulse" }) }), _jsx("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border", children: _jsx("p", { className: "text-sm text-gray-600", children: "AI\u304C\u8A55\u4FA1\u3057\u3066\u3044\u307E\u3059..." }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "bg-white border-t border-gray-200 px-4 py-3", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Textarea, { ref: textareaRef, placeholder: "\u82F1\u8A9E\u3067\u7FFB\u8A33\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044...", value: input, onChange: (e) => setInput(e.target.value), onKeyPress: handleKeyPress, rows: 1, className: "flex-1 resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl", disabled: isWaitingForTranslation }), _jsx(Button, { onClick: handleSubmit, disabled: !input.trim() || isWaitingForTranslation, size: "sm", className: "bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 self-end", children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] }));
}
