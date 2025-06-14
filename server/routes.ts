import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendMessageSchema, createConversationSchema, type ChatMessage } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const { theme } = createConversationSchema.parse(req.body);
      
      const conversation = await storage.createConversation({
        theme,
        messages: [],
        messageCount: 0,
      });

      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Send message and get AI response
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversationId, theme } = sendMessageSchema.parse(req.body);
      
      let conversation;
      
      // Create new conversation if none exists
      if (!conversationId || conversationId === null) {
        if (!theme) {
          return res.status(400).json({ message: "Theme is required for new conversations" });
        }
        conversation = await storage.createConversation({
          theme,
          messages: [],
          messageCount: 0,
        });
      } else {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      }

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...conversation.messages, userMessage];
      const newMessageCount = conversation.messageCount + 1;

      // Generate AI response
      let aiResponse: string;
      
      try {
        // Determine if we should show affiliate recommendations
        const shouldShowAffiliate = newMessageCount >= 6; // After 3 exchanges (6 messages total)
        
        const systemPrompt = getSystemPrompt(conversation.theme, shouldShowAffiliate);
        const conversationHistory = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        aiResponse = completion.choices[0].message?.content || "申し訳ございませんが、回答を生成できませんでした。";
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        aiResponse = "申し訳ございませんが、一時的にサービスに接続できません。しばらくしてからもう一度お試しください。";
      }

      // Add AI response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalMessageCount = newMessageCount + 1;

      // Update conversation
      const updatedConversation = await storage.updateConversation(
        conversation.id,
        finalMessages,
        finalMessageCount
      );

      res.json({
        conversation: updatedConversation,
        shouldShowAffiliate: finalMessageCount >= 6,
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getSystemPrompt(theme: string, shouldShowAffiliate: boolean): string {
  const themeContexts = {
    'self-understanding': '自己理解（強み・弱み、価値観の発見）',
    'skill-development': 'スキル開発（必要なスキルの習得方法）',
    'work-techniques': '仕事術（効率的な働き方のコツ）',
    'career-strategy': 'キャリア戦略（長期的なキャリアプランニング）',
    'personal-growth': 'パーソナル成長（個人的な成長と自己啓発）',
  };

  const themeContext = themeContexts[theme as keyof typeof themeContexts] || 'キャリア開発';

  let basePrompt = `あなたは経験豊富なキャリアコンサルタントです。${themeContext}について相談に来たクライアントと話しています。

以下の点を心がけて回答してください：
- 親しみやすく、共感的な口調で話す
- 具体的で実践的なアドバイスを提供する
- クライアントの状況を深く理解するための質問をする
- 日本のビジネス環境を考慮したアドバイスをする
- 1回の回答は150-200文字程度に収める
- 改行は適切に使用し、読みやすくする`;

  if (shouldShowAffiliate) {
    basePrompt += `

この会話が深まってきたので、より専門的なサポートを提供できるサービスを自然に紹介してください。特に以下のサービスが役立つ可能性があります：
- 転職を検討している場合：リクルートエージェント
- 英語スキルを向上させたい場合：スタディサプリENGLISH
これらのサービスについて、押し付けがましくない形で言及してください。`;
  }

  return basePrompt;
}
