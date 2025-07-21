import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { THEMES, type ThemeKey } from "@/lib/constants";

// 改善された型定義
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string | number;
  messages: ChatMessage[];
  theme?: ThemeKey;
  createdAt?: string;
  updatedAt?: string;
}

interface ChatInterfaceProps {
  theme: ThemeKey;
  onBack: () => void;
  onShowAffiliate: () => void;
}

interface ChatResponse {
  conversation: Conversation;
  shouldShowAffiliate: boolean;
}

export function ChatInterface({
  theme,
  onBack,
  onShowAffiliate,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
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
    if (!message || sendMessageMutation.isPending) return;

    setInput("");
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      const welcomeMessage: ChatMessage = {
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

  return (
    <div className="min-h-screen bg-bg-gray flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="w-10 h-10 bg-line-green rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            AIキャリアコンサルタント
          </h3>
          <p className="text-xs text-secondary-text">{THEMES[theme].name}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp || Date.now()}-${index}`}
            className={`flex items-start space-x-2 animate-fade-in ${
              message.role === "user" ? "justify-end" : ""
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 bg-line-green rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-3 max-w-[85%] shadow-sm ${
                message.role === "user"
                  ? "bg-user-bubble text-white rounded-tr-md"
                  : "bg-white text-gray-900 rounded-tl-md"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {sendMessageMutation.isPending && (
          <div className="flex items-start space-x-2 animate-fade-in">
            <div className="w-8 h-8 bg-line-green rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-secondary-text rounded-full animate-typing"></div>
                <div
                  className="w-2 h-2 bg-secondary-text rounded-full animate-typing"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-secondary-text rounded-full animate-typing"
                  style={{ animationDelay: "0.4s" }}
                ></div>
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
              placeholder="メッセージを入力..."
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-line-green focus:bg-white transition-all duration-200 text-sm max-h-32 border-0"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="w-10 h-10 bg-line-green rounded-full flex items-center justify-center hover:bg-line-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-0"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
