import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { THEMES } from "@/lib/constants";
export function ChatInterface({ theme, onBack, onShowAffiliate, }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const queryClient = useQueryClient();
    const sendMessageMutation = useMutation({
        mutationFn: async (message) => {
            const response = await apiRequest("POST", "/api/chat", {
                message,
                conversationId,
                theme: conversationId ? undefined : theme,
            });
            return response.json();
        },
        onSuccess: (data) => {
            setMessages(data.conversation.messages);
            setConversationId(Number(data.conversation.id));
            if (data.shouldShowAffiliate) {
                setTimeout(() => onShowAffiliate(), 2000);
            }
        },
        onError: (error) => {
            console.error("Chat message failed:", error);
            // エラーハンドリングを追加可能
        },
    });
    const handleSubmit = () => {
        const message = input.trim();
        if (!message || sendMessageMutation.isPending)
            return;
        setInput("");
        sendMessageMutation.mutate(message);
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
    }, [messages, sendMessageMutation.isPending]);
    // Initialize with welcome message
    useEffect(() => {
        if (!isInitialized) {
            const welcomeMessage = {
                role: "assistant",
                content: `こんにちは！AIキャリアコンサルタントです。\nあなたのキャリア開発をサポートさせていただきます。\n\nまずは簡単な質問からお聞かせください。現在のお仕事について、どのような点で悩みや課題を感じていますか？`,
                timestamp: new Date().toISOString(),
            };
            setMessages([welcomeMessage]);
            setIsInitialized(true);
        }
    }, [isInitialized]);
    // Focus textarea on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            textareaRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-bg-gray flex flex-col", children: [_jsxs("div", { className: "bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "p-2 -ml-2 rounded-full hover:bg-gray-100", onClick: onBack, children: _jsx(ArrowLeft, { className: "w-5 h-5 text-gray-600" }) }), _jsx("div", { className: "w-10 h-10 bg-line-green rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "AI\u30AD\u30E3\u30EA\u30A2\u30B3\u30F3\u30B5\u30EB\u30BF\u30F3\u30C8" }), _jsx("p", { className: "text-xs text-secondary-text", children: THEMES[theme].name })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-4", children: [messages.map((message, index) => (_jsxs("div", { className: `flex items-start space-x-2 animate-fade-in ${message.role === "user" ? "justify-end" : ""}`, children: [message.role === "assistant" && (_jsx("div", { className: "w-8 h-8 bg-line-green rounded-full flex items-center justify-center flex-shrink-0", children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }) })), _jsx("div", { className: `rounded-2xl px-4 py-3 max-w-[85%] shadow-sm ${message.role === "user"
                                    ? "bg-user-bubble text-white rounded-tr-md"
                                    : "bg-white text-gray-900 rounded-tl-md"}`, children: _jsx("p", { className: "text-sm leading-relaxed whitespace-pre-line", children: message.content }) })] }, `${message.timestamp || Date.now()}-${index}`))), sendMessageMutation.isPending && (_jsxs("div", { className: "flex items-start space-x-2 animate-fade-in", children: [_jsx("div", { className: "w-8 h-8 bg-line-green rounded-full flex items-center justify-center flex-shrink-0", children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }) }), _jsx("div", { className: "bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-secondary-text rounded-full animate-typing" }), _jsx("div", { className: "w-2 h-2 bg-secondary-text rounded-full animate-typing", style: { animationDelay: "0.2s" } }), _jsx("div", { className: "w-2 h-2 bg-secondary-text rounded-full animate-typing", style: { animationDelay: "0.4s" } })] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "bg-white border-t border-gray-200 px-4 py-3", children: _jsxs("div", { className: "flex items-end space-x-3", children: [_jsx("div", { className: "flex-1 relative", children: _jsx(Textarea, { ref: textareaRef, value: input, onChange: (e) => setInput(e.target.value), onKeyPress: handleKeyPress, placeholder: "\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u5165\u529B...", className: "w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-line-green focus:bg-white transition-all duration-200 text-sm max-h-32 border-0", rows: 1 }) }), _jsx(Button, { onClick: handleSubmit, disabled: !input.trim() || sendMessageMutation.isPending, className: "w-10 h-10 bg-line-green rounded-full flex items-center justify-center hover:bg-line-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-0", children: _jsx(Send, { className: "w-5 h-5 text-white" }) })] }) })] }));
}
