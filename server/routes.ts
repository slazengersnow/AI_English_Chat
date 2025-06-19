import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  translateRequestSchema, 
  problemRequestSchema, 
  createCheckoutSessionSchema,
  type TranslateResponse,
  type ProblemResponse,
  type CheckoutSessionResponse
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate Japanese problem for translation
  app.post("/api/problem", async (req, res) => {
    try {
      const { difficultyLevel } = problemRequestSchema.parse(req.body);
      
      // Problem sentences by difficulty level
      const problemSets = {
        'toeic': [
          '会議の資料を準備しておいてください。',
          '売上が前年比20%増加しました。',
          '新しいプロジェクトの進捗はいかがですか。',
          '顧客からのフィードバックを検討する必要があります。',
          '来週までに報告書を提出してください。'
        ],
        'middle-school': [
          '私は毎日学校に行きます。',
          '今日は雨が降っています。',
          '彼女は本を読むのが好きです。',
          '私たちは昨日映画を見ました。',
          '明日友達と会う予定です。'
        ],
        'high-school': [
          '環境問題について考えることは重要です。',
          '技術の進歩により、私たちの生活は便利になりました。',
          '彼は将来医者になりたいと言っています。',
          'この本を読み終えたら、感想を教えてください。',
          'もし時間があれば、一緒に旅行に行きませんか。'
        ],
        'basic-verbs': [
          '彼は毎朝コーヒーを作ります。',
          '子供たちが公園で遊んでいます。',
          '母は料理を作っています。',
          '私は友達に手紙を書きました。',
          '電車が駅に到着しました。'
        ],
        'business-email': [
          'お忙しい中、お時間をいただきありがとうございます。',
          '添付ファイルをご確認いただけますでしょうか。',
          '来週の会議の件でご連絡いたします。',
          'ご質問がございましたらお気軽にお声かけください。',
          'お返事をお待ちしております。'
        ]
      };

      const sentences = problemSets[difficultyLevel];
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
      
      const response: ProblemResponse = {
        japaneseSentence: randomSentence,
        hints: []
      };

      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Evaluate user translation using Claude Haiku
  app.post("/api/translate", async (req, res) => {
    try {
      const { japaneseSentence, userTranslation, difficultyLevel } = translateRequestSchema.parse(req.body);
      
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const prompt = `あなたは英語教師です。以下の日本語文の英訳を評価してください。

難易度レベル: ${difficultyLevel}
日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

以下の形式でJSONで回答してください：
{
  "correctTranslation": "正しい英訳",
  "feedback": "具体的なフィードバック（良い点と改善点）",
  "rating": 1から5の評価（1=要改善、5=完璧）,
  "improvements": ["改善提案1", "改善提案2"]
}`;

      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "user", content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const content = openaiData.choices[0].message.content;
        
        const parsedResult = JSON.parse(content);
        
        const response: TranslateResponse = {
          correctTranslation: parsedResult.correctTranslation,
          feedback: parsedResult.feedback,
          rating: Math.max(1, Math.min(5, parsedResult.rating)),
          improvements: parsedResult.improvements || []
        };

        // Save training session
        await storage.addTrainingSession({
          difficultyLevel: difficultyLevel as any,
          japaneseSentence,
          userTranslation,
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
          createdAt: new Date().toISOString()
        });

        res.json(response);
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        res.status(500).json({ message: "AI評価に失敗しました。しばらくしてからもう一度お試しください。" });
      }
    } catch (error) {
      console.error("Translation error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Create Stripe checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, successUrl, cancelUrl } = createCheckoutSessionSchema.parse(req.body);
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const stripe = require("stripe")(stripeSecretKey);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${req.get('origin')}/success`,
        cancel_url: cancelUrl || `${req.get('origin')}/cancel`,
        trial_period_days: 7
      });

      const response: CheckoutSessionResponse = {
        url: session.url,
        sessionId: session.id
      };

      res.json(response);
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: "決済セッションの作成に失敗しました" });
    }
  });

  // Get training history
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getTrainingSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "履歴の取得に失敗しました" });
    }
  });

  // Get sessions by difficulty
  app.get("/api/sessions/:difficulty", async (req, res) => {
    try {
      const { difficulty } = req.params;
      const sessions = await storage.getSessionsByDifficulty(difficulty);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "履歴の取得に失敗しました" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}