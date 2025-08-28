import { Router, type Express, Request, Response } from "express";

// リクエストにユーザー情報を追加するための型拡張
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import storage from "./storage.js";
import {
  problemRequestSchema,
  translateRequestSchema,
  type ProblemResponse,
  type TranslateResponse,
  trainingSessions,
  userSubscriptions,
} from "../shared/schema.js";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db.js";
import { eq, lte, desc, gte } from "drizzle-orm";

const router = Router();

/* -------------------- データベースベース重複防止 -------------------- */

/**
 * ユーザーが最近回答した問題を取得（過去800問）
 */
async function getRecentUserProblems(userId: string, difficultyLevel: string): Promise<string[]> {
  try {
    const recentSessions = await db
      .select({ japaneseSentence: trainingSessions.japaneseSentence })
      .from(trainingSessions)
      .where(eq(trainingSessions.userId, userId))
      .orderBy(desc(trainingSessions.createdAt))
      .limit(800); // 過去800問をチェック

    return recentSessions.map(session => session.japaneseSentence);
  } catch (error) {
    console.error("Error fetching recent problems:", error);
    return [];
  }
}

/**
 * 重複のない問題を選択
 */
async function getUnusedProblem(
  userId: string,
  difficultyLevel: string,
  problems: string[],
): Promise<string> {
  const recentProblems = await getRecentUserProblems(userId, difficultyLevel);
  const availableProblems = problems.filter(p => !recentProblems.includes(p));
  
  // 利用可能な問題がない場合は、全ての問題から選択
  const finalPool = availableProblems.length > 0 ? availableProblems : problems;
  
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/* -------------------- 入力の正規化ヘルパ -------------------- */
const DIFFICULTY_ALIASES: Record<string, string> = {
  // 受け取った値 → 正規化後キー
  toeic: "toeic",
  middle_school: "middle-school",
  "middle-school": "middle-school",
  high_school: "high-school",
  "high-school": "high-school",
  basic_verbs: "basic-verbs",
  "basic-verbs": "basic-verbs",
  business_email: "business-email",
  "business-email": "business-email",
  simulation: "simulation",
};

function normalizeDifficulty(input?: string): string | undefined {
  if (!input) return undefined;
  const lowered = input.toLowerCase();
  const replaced = lowered.replace(/_/g, "-");
  return (
    DIFFICULTY_ALIASES[lowered] || DIFFICULTY_ALIASES[replaced] || undefined
  );
}

function extractDifficultyLevel(body: any): string | undefined {
  // 両方の名前に対応（difficultyLevel / difficulty）
  return normalizeDifficulty(body?.difficultyLevel ?? body?.difficulty);
}

function extractUserTranslation(body: any): string | undefined {
  // 両方の名前に対応（userTranslation / userAnswer）
  return body?.userTranslation ?? body?.userAnswer ?? body?.answer;
}

/* -------------------- 出題セット -------------------- */
const problemSets: Record<string, string[]> = {
  toeic: [
    "会議の資料を準備しておいてください。",
    "売上が前年比20%増加しました。",
    "新しいプロジェクトの進捗はいかがですか。",
    "顧客からのフィードバックを検討する必要があります。",
    "来週までに報告書を提出してください。",
    "この商品の在庫を確認してください。",
    "明日の会議はオンラインで行います。",
    "予算の詳細について話し合いましょう。",
    "契約書の内容を確認する必要があります。",
    "来月の売上目標を設定しました。",
    "お客様からの問い合わせに対応してください。",
    "今四半期の業績は予想を上回りました。",
    "新しいマーケティング戦略を検討中です。",
    "品質管理の改善が必要です。",
    "チームメンバーとのミーティングを予定しています。",
    "プロジェクトの期限を延長する必要があります。",
    "市場調査の結果を分析してください。",
    "コスト削減の提案を検討しています。",
    "新しい技術の導入を検討しています。",
    "クライアントとの関係を改善したいと思います。"
  ],
  "middle-school": [
    "私は毎日学校に行きます。",
    "今日は雨が降っています。",
    "彼女は本を読むのが好きです。",
    "私たちは昨日映画を見ました。",
    "明日は友達と遊びます。",
    "私は英語を勉強しています。",
    "彼は野球が上手です。",
    "母は料理を作っています。",
    "私たちは公園で遊びました。",
    "彼女は音楽を聞いています。",
    "私は宿題をしました。",
    "今日は暖かい日です。",
    "私の兄は大学生です。",
    "私たちは夏休みが好きです。",
    "彼は自転車に乗ります。",
    "私は朝ごはんを食べます。",
    "彼女は絵を描くのが得意です。",
    "私たちは図書館で勉強します。",
    "今日は金曜日です。",
    "私は犬を飼っています。",
    "彼は毎朝ジョギングをします。",
    "私たちは家族と旅行します。",
    "彼女は数学が好きです。",
    "私は新しい友達を作りました。",
    "今日は風が強いです。"
  ],
  "high-school": [
    "環境問題について考える必要があります。",
    "技術の発展により生活が便利になりました。",
    "多様性を尊重することが大切です。",
    "グローバル化が進んでいます。",
    "持続可能な社会を目指しています。",
    "科学技術の進歩は私たちの生活を変えています。",
    "文化の違いを理解することが重要です。",
    "教育は社会の発展にとって不可欠です。",
    "人工知能が様々な分野で活用されています。",
    "気候変動の影響が深刻化しています。",
    "情報化社会では適切な判断力が求められます。",
    "国際協力が世界平和に重要な役割を果たします。",
    "再生可能エネルギーの開発が急務です。",
    "高齢化社会への対応が課題となっています。",
    "デジタル技術が教育現場で活用されています。",
    "経済格差の問題が深刻化しています。",
    "文学作品は人間の心を豊かにします。",
    "民主主義の価値を守ることが大切です。",
    "科学的思考を身につけることが重要です。",
    "異文化理解が今後ますます重要になります。"
  ],
  "basic-verbs": [
    "彼は毎朝走ります。",
    "私は本を読みます。",
    "彼女は料理を作ります。",
    "私たちは音楽を聞きます。",
    "子供たちは公園で遊びます。",
    "私は友達と話します。",
    "彼女は写真を撮ります。",
    "私たちは一緒に歌います。",
    "彼は車を運転します。",
    "私は手紙を書きます。",
    "彼女は花を植えます。",
    "私たちは映画を見ます。",
    "彼は魚を釣ります。",
    "私は服を洗います。",
    "彼女は犬と歩きます。",
    "私たちはパンを買います。",
    "彼は部屋を掃除します。",
    "私は水を飲みます。",
    "彼女は絵を描きます。",
    "私たちはゲームをします。"
  ],
  "business-email": [
    "会議の件でご連絡いたします。",
    "資料を添付いたします。",
    "ご確認のほど、よろしくお願いいたします。",
    "お忙しいところ恐れ入ります。",
    "ご返信をお待ちしております。",
    "ご質問がございましたらお気軽にお声かけください。",
    "今後ともよろしくお願いいたします。",
    "お疲れ様でございます。",
    "ご検討のほど、よろしくお願いいたします。",
    "詳細につきましてはご相談させていただきます。",
    "ご不明な点がございましたらお知らせください。",
    "お時間をいただき、ありがとうございます。",
    "改めてご連絡いたします。",
    "ご協力いただき、感謝しております。",
    "スケジュールを調整いたします。",
    "早急に対応いたします。",
    "ご迷惑をおかけして申し訳ございません。",
    "お手数をおかけいたします。",
    "ご理解のほど、よろしくお願いいたします。",
    "引き続きよろしくお願いいたします。"
  ],
  simulation: [
    "レストランで注文をお願いします。",
    "道に迷ったので道案内をお願いします。",
    "体調が悪いので病院に行きたいです。",
    "買い物で値段を聞きたいです。",
    "電車の時刻を確認したいです。",
    "ホテルの予約を取りたいです。",
    "空港への行き方を教えてください。",
    "Wi-Fiのパスワードを教えてください。",
    "荷物を預けたいのですが。",
    "チェックアウトの時間を知りたいです。",
    "タクシーを呼んでもらえませんか。",
    "両替をしたいのですが。",
    "観光地への行き方を教えてください。",
    "緊急事態です。助けてください。",
    "薬局はどこにありますか。",
    "この商品は税抜きの価格ですか。",
    "クレジットカードは使えますか。",
    "トイレはどこにありますか。",
    "メニューを英語で説明してください。",
    "予約の変更をしたいのですが。"
  ],
};

/* -------------------- マイページ関連 API -------------------- */





/* -------------------- 問題出題 -------------------- */
export const handleProblemGeneration = async (req: Request, res: Response) => {
  try {
    // ユーザーIDを取得（認証トークンから）
    let userId = "default_user";
    
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.VITE_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
        }
      } catch (error) {
        console.log("Failed to get user from token:", error);
      }
    }
    
    const canProceed = await storage.incrementDailyCount();
    if (!canProceed) {
      return res.status(429).json({
        message:
          "本日の最大出題数(100問)に達しました。明日また学習を再開できます。",
        dailyLimitReached: true,
      });
    }

    // ★ まずは正規化してから Zod 検証に渡す
    const normalized = {
      difficultyLevel: extractDifficultyLevel(req.body),
    };

    if (!normalized.difficultyLevel) {
      return res.status(400).json({
        message: "Invalid request data",
        hint: "difficulty / difficultyLevel のどちらかでレベルを指定してください（例: 'middle_school' または 'middle-school'）。",
      });
    }

    const parseResult = problemRequestSchema.safeParse(normalized);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid request data",
        details: parseResult.error.issues,
      });
    }

    const { difficultyLevel } = parseResult.data;

    const allSentences = problemSets[difficultyLevel] || problemSets["toeic"];
    const selectedSentence = await getUnusedProblem(userId, difficultyLevel, allSentences);

    const response: ProblemResponse = {
      japaneseSentence: selectedSentence,
      hints: [`問題 - ${difficultyLevel}`],
    };

    res.json(response);
  } catch (error) {
    console.error("Problem generation error:", error);
    res.status(500).json({
      message: "Problem generation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* -------------------- Claude 評価 -------------------- */
export const handleClaudeEvaluation = async (req: Request, res: Response) => {
  try {
    // ★ まずは正規化
    const normalized = {
      japaneseSentence: req.body?.japaneseSentence,
      userTranslation: extractUserTranslation(req.body),
      difficultyLevel: extractDifficultyLevel(req.body),
    };

    const result = translateRequestSchema.safeParse(normalized);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        error: result.error.issues,
      });
    }

    const { japaneseSentence, userTranslation } = result.data;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return res
        .status(500)
        .json({ message: "Anthropic API key not configured" });
    }

    const systemPrompt = `あなたは日本人の英語学習者向けの経験豊富な英語教師です。ユーザーの日本語から英語への翻訳を詳細に評価し、以下のJSON形式で返答してください。

重要:すべての説明とフィードバックは必ず日本語で書いてください。

{
  "correctTranslation": "正しい英訳(ネイティブが自然に使う表現)",
  "feedback": "具体的なフィードバック(良い点と改善点を日本語で詳しく)",
  "rating": 評価(1=要改善、5=完璧の数値),
  "improvements": ["改善提案1(日本語で)", "改善提案2(日本語で)"],
  "explanation": "文法・語彙・表現について詳細解説(必ず日本語で、具体的に)",
  "similarPhrases": ["類似フレーズ1", "類似フレーズ2"]
}

重要な評価ポイント:
1. 文法的正確性：時制、語順、前置詞の使い方
2. 語彙選択：単語の選択が適切か、より自然な表現があるか
3. 表現の自然さ：ネイティブが実際に使う表現かどうか
4. 文脈適合性：場面に適した表現レベル（丁寧語、カジュアル等）

説明要件:
- 文法・語彙・表現の観点から具体的に解説
- 「なぜこの表現が良いのか」「どの部分を改善すべきか」を明確に
- 学習者が次回同じような問題に応用できる具体的なアドバイス
- 中学生にも理解できる分かりやすい日本語
- JSON文字列内では改行文字や特殊文字は使わず、\\nを使用してください`;

    const userPrompt = `日本語文: ${japaneseSentence}
ユーザーの英訳: ${userTranslation}

上記の翻訳を評価してください。`;

    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const content =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      let parsedResult: any;

      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.log("JSON parse failed, attempting cleanup:", parseError);
        try {
          // Clean up content and try again
          let cleanContent = content.replace(/[\x00-\x1F\x7F]/g, '');
          cleanContent = cleanContent.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          parsedResult = JSON.parse(cleanContent);
        } catch (cleanupError) {
          // Try to extract JSON from content
          const jsonMatch = content?.match?.(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              let jsonContent = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, '');
              jsonContent = jsonContent.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
              parsedResult = JSON.parse(jsonContent);
            } catch (finalError) {
              console.error("All JSON parsing attempts failed:", finalError);
              parsedResult = {};
            }
          } else {
            parsedResult = {};
          }
        }
      }

      // Check if parsing failed or result is incomplete
      if (!parsedResult || Object.keys(parsedResult).length === 0 || 
          !parsedResult.correctTranslation || 
          parsedResult.correctTranslation === "Translation evaluation failed") {
        console.log("Using enhanced fallback due to invalid Claude response");
        const fallbackResponse = generateFallbackEvaluation(japaneseSentence, normalized.userTranslation || "", normalized.difficultyLevel || "middle-school");
        res.json(fallbackResponse);
        return;
      }

      const response: TranslateResponse = {
        correctTranslation: parsedResult.correctTranslation,
        feedback: parsedResult.feedback,
        rating: Math.max(1, Math.min(5, Number(parsedResult.rating) || 3)),
        improvements: Array.isArray(parsedResult.improvements)
          ? parsedResult.improvements
          : [],
        explanation: parsedResult.explanation,
        similarPhrases: Array.isArray(parsedResult.similarPhrases)
          ? parsedResult.similarPhrases
          : [],
      };

      // Save training session to database
      try {
        const sessionData = {
          difficultyLevel: normalized.difficultyLevel || "middle-school",
          japaneseSentence: japaneseSentence,
          userTranslation: normalized.userTranslation || "",
          correctTranslation: response.correctTranslation,
          feedback: response.feedback,
          rating: response.rating,
        };
        
        const insertResult = await db.insert(trainingSessions).values(sessionData).returning();
        response.sessionId = insertResult[0]?.id;
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue without sessionId if database save fails
      }

      res.json(response);
    } catch (error) {
      console.error("Claude API error:", error);
      // Fallback with database save
      const fallback: TranslateResponse = {
        correctTranslation: "Please coordinate with your team members.",
        feedback: `お疲れ様でした！「${normalized.userTranslation ?? ""}」という回答をいただきました。現在AI評価システムに一時的な問題が発生していますが、継続して学習を続けましょう。`,
        rating: 3,
        improvements: [
          "短く自然な表現を意識しましょう",
          "動詞と時制の一致を確認しましょう",
        ],
        explanation: "システム復旧中のため、詳細な評価ができません。",
        similarPhrases: [
          "Work closely with your teammates.",
          "Collaborate with your team.",
        ],
      };
      
      // Save fallback training session to database
      try {
        const sessionData = {
          difficultyLevel: normalized.difficultyLevel || "middle-school",
          japaneseSentence: japaneseSentence,
          userTranslation: normalized.userTranslation || "",
          correctTranslation: fallback.correctTranslation,
          feedback: fallback.feedback,
          rating: fallback.rating,
        };
        
        const insertResult = await db.insert(trainingSessions).values(sessionData).returning();
        fallback.sessionId = insertResult[0]?.id;
      } catch (dbError) {
        console.error('Database save error for fallback:', dbError);
      }
      
      res.json(fallback);
    }
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({
      message: "Evaluation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Enhanced fallback evaluation function
function generateFallbackEvaluation(japaneseSentence: string, userTranslation: string, difficultyLevel: string): TranslateResponse {
  const modelAnswers: Record<string, string> = {
    "私たちは昨日映画を見ました。": "We watched a movie yesterday.",
    "明日は友達と遊びます。": "I will play with my friends tomorrow.",
    "私は毎日学校に行きます。": "I go to school every day.",
    "今日は雨が降っています。": "It is raining today.",
    "彼女は本を読むのが好きです。": "She likes reading books.",
    "彼は毎朝走ります。": "He runs every morning.",
    "私は本を読みます。": "I read books.",
    "彼女は料理を作ります。": "She cooks meals.",
    "私たちは音楽を聞きます。": "We listen to music.",
    "子供たちは公園で遊びます。": "Children play in the park.",
    "私たちは夏休みが好きです。": "We like summer vacation.",
    "私は英語を勉強しています。": "I am studying English.",
    "私は朝ごはんを食べます。": "I have breakfast.",
    "私たちは公園で遊びました。": "We played in the park.",
    "私は宿題をしました。": "I did my homework.",
    "今日は暖かい日です。": "Today is a warm day.",
    "私の兄は大学生です。": "My brother is a university student.",
    "彼は自転車に乗ります。": "He rides a bicycle.",
    "彼女は絵を描くのが得意です。": "She is good at drawing pictures.",
    "私たちは図書館で勉強します。": "We study in the library.",
    "今日は金曜日です。": "Today is Friday.",
    "私は犬を飼っています。": "I have a dog.",
    "彼は毎朝ジョギングをします。": "He jogs every morning.",
    "私たちは家族と旅行します。": "We travel with our family.",
    "彼女は数学が好きです。": "She likes math.",
    "私は新しい友達を作りました。": "I made a new friend.",
    "今日は風が強いです。": "It is windy today.",
  };

  const similarPhrases: Record<string, string[]> = {
    "私たちは昨日映画を見ました。": [
      "We saw a film yesterday.",
      "Yesterday, we went to see a movie.",
    ],
    "明日は友達と遊びます。": [
      "I will hang out with my friends tomorrow.",
      "Tomorrow I'm going to spend time with my friends.",
    ],
    "彼女は本を読むのが好きです。": [
      "She enjoys reading books.",
      "Reading books is one of her hobbies.",
    ],
    "私たちは夏休みが好きです。": [
      "We love summer vacation.",
      "We enjoy summer break.",
      "Summer holidays are our favorite.",
    ],
    "私は英語を勉強しています。": [
      "I'm learning English.",
      "I study English.",
      "I'm working on my English.",
    ],
    "私は朝ごはんを食べます。": [
      "I eat breakfast.",
      "I have my morning meal.",
      "I take breakfast.",
    ],
    "私たちは公園で遊びました。": [
      "We had fun in the park.",
      "We played at the park.",
      "We enjoyed ourselves in the park.",
    ],
  };

  // Basic translation generator for unknown sentences
  function generateBasicTranslation(japaneseSentence: string): string {
    // Simple pattern matching for basic translation
    if (japaneseSentence.includes("好きです")) {
      return "I/We like...";
    } else if (japaneseSentence.includes("行きます")) {
      return "I/We go...";
    } else if (japaneseSentence.includes("します")) {
      return "I/We do...";
    } else if (japaneseSentence.includes("です")) {
      return "It is...";
    } else {
      return "Please provide a translation for this sentence.";
    }
  }

  const correctTranslation = modelAnswers[japaneseSentence] || generateBasicTranslation(japaneseSentence);
  
  // Simple evaluation based on user input quality
  let rating = 3;
  let feedback = "良い回答です。継続的な練習で更に向上できます。";
  let improvements = ["自然な英語表現を心がけましょう", "文法と語彙の確認をしましょう"];
  let explanation = "基本的な文構造は理解されています。より自然な表現を使うことで、さらに良い英訳になります。";

  if (!userTranslation || userTranslation.trim().length < 3) {
    rating = 1;
    feedback = "回答が短すぎます。完整な英文で回答してください。";
    improvements = ["完整な英文を作成しましょう", "主語と動詞を含めましょう"];
    explanation = "英訳では主語、動詞、目的語を含む完整な文を作ることが大切です。";
  } else if (userTranslation.toLowerCase().includes("movee") || userTranslation.toLowerCase().includes("bouk")) {
    rating = 2;
    feedback = "スペルミスがあります。正しい英単語を使いましょう。";
    improvements = ["単語のスペルを確認しましょう", "基本的な英単語を覚えましょう"];
    explanation = "英語の基本単語を正確に覚えることで、より良い英訳ができるようになります。";
  }

  return {
    correctTranslation,
    feedback,
    rating,
    improvements,
    explanation,
    similarPhrases: similarPhrases[japaneseSentence] || [
      "Good effort! Keep practicing.",
      "Try using more natural English expressions.",
    ],
  };
}

/* -------------------- 認証ミドルウェア -------------------- */
function requireAuth(req: Request, res: Response, next: any) {
  // For now, allow all requests since the client is handling authentication
  // In a production environment, you would verify the Supabase JWT token here
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('No auth token provided, proceeding with anonymous access');
  } else {
    console.log('Auth token provided:', authHeader.substring(0, 20) + '...');
  }
  next();
}

/* -------------------- ルーティング登録 -------------------- */
export function registerRoutes(app: Express): void {
  const router = Router();

  // Health check endpoint
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // MyPage API endpoints
  router.get("/user-subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      // 認証トークンからユーザー情報を取得
      const authHeader = req.headers.authorization;
      let userEmail = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userEmail = payload.email;
        } catch (e) {
          console.log('Token parsing failed:', e);
        }
      }
      
      // 管理者アカウントの場合は特別な設定を返す
      if (userEmail === 'slazengersnow@gmail.com') {
        console.log('🔑 Admin user detected, returning admin subscription');
        return res.json({
          id: 1,
          userId: userEmail,
          subscriptionType: "premium",
          subscriptionStatus: "active", 
          planName: "管理者プラン",
          validUntil: new Date('2099-12-31').toISOString(),
          isAdmin: true,
          plan: "premium",
          status: "active",
          dailyLimit: 999,
          remainingQuestions: 999,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // 一般ユーザー向けのデフォルト設定
      res.json({
        id: 2,
        userId: userEmail || "anonymous",
        subscriptionType: "standard",
        subscriptionStatus: "active",
        planName: "スタンダードプラン", 
        validUntil: new Date('2025-09-24').toISOString(),
        isAdmin: false,
        plan: "standard",
        status: "active",
        dailyLimit: 50,
        remainingQuestions: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  router.get("/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const mockProgress = [
        { date: '2025-08-20', problemsCompleted: 15, averageRating: 4.2 },
        { date: '2025-08-21', problemsCompleted: 12, averageRating: 4.0 },
        { date: '2025-08-22', problemsCompleted: 18, averageRating: 4.3 },
        { date: '2025-08-23', problemsCompleted: 20, averageRating: 4.5 },
        { date: '2025-08-24', problemsCompleted: 16, averageRating: 4.1 }
      ];
      res.json(mockProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  });

  router.get("/streak", requireAuth, async (req: Request, res: Response) => {
    try {
      res.json({
        currentStreak: 7,
        longestStreak: 15,
        lastPracticeDate: '2025-08-24'
      });
    } catch (error) {
      console.error('Error fetching streak:', error);
      res.status(500).json({ error: 'Failed to fetch streak' });
    }
  });

  router.get("/difficulty-stats", requireAuth, async (req: Request, res: Response) => {
    try {
      res.json([
        { difficulty: 'TOEIC', completed: 45, averageRating: 4.2 },
        { difficulty: '中学英語', completed: 32, averageRating: 4.5 },
        { difficulty: '高校英語', completed: 28, averageRating: 4.0 },
        { difficulty: '基本動詞', completed: 38, averageRating: 4.3 },
        { difficulty: 'ビジネスメール', completed: 25, averageRating: 3.9 },
        { difficulty: 'シミュレーション練習', completed: 18, averageRating: 4.1 }
      ]);
    } catch (error) {
      console.error('Error fetching difficulty stats:', error);
      res.status(500).json({ error: 'Failed to fetch difficulty stats' });
    }
  });

  router.get("/monthly-stats", requireAuth, async (req: Request, res: Response) => {
    try {
      res.json([
        { month: '2025-06', problemsCompleted: 245, averageRating: 4.1 },
        { month: '2025-07', problemsCompleted: 312, averageRating: 4.3 },
        { month: '2025-08', problemsCompleted: 186, averageRating: 4.2 }
      ]);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      res.status(500).json({ error: 'Failed to fetch monthly stats' });
    }
  });

  router.get("/review-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const mockSessions = [
        {
          id: 1,
          japaneseSentence: "会議の資料を準備しておいてください。",
          userTranslation: "Please prepare the meeting materials.",
          correctTranslation: "Please prepare the materials for the meeting.",
          rating: 4,
          feedback: "良い翻訳です。前置詞の使い方が適切です。",
          difficultyLevel: "toeic",
          createdAt: "2025-08-24T10:30:00Z"
        }
      ];
      res.json(mockSessions);
    } catch (error) {
      console.error('Error fetching review sessions:', error);
      res.status(500).json({ error: 'Failed to fetch review sessions' });
    }
  });

  router.get("/recent-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const mockSessions = [
        {
          id: 1,
          japaneseSentence: "売上が前年比20%増加しました。",
          userTranslation: "Sales increased 20% compared to last year.",
          correctTranslation: "Sales increased by 20% compared to the previous year.",
          rating: 4,
          difficultyLevel: "toeic",
          createdAt: "2025-08-24T15:20:00Z"
        }
      ];
      res.json(mockSessions);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      res.status(500).json({ error: 'Failed to fetch recent sessions' });
    }
  });

  router.get("/bookmarked-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const mockSessions = [
        {
          id: 1,
          japaneseSentence: "環境問題について考える必要があります。",
          userTranslation: "We need to think about environmental problems.",
          correctTranslation: "We need to consider environmental issues.",
          rating: 3,
          difficultyLevel: "high-school",
          isBookmarked: true,
          createdAt: "2025-08-23T14:15:00Z"
        }
      ];
      res.json(mockSessions);
    } catch (error) {
      console.error('Error fetching bookmarked sessions:', error);
      res.status(500).json({ error: 'Failed to fetch bookmarked sessions' });
    }
  });

  router.get("/custom-scenarios", requireAuth, async (req: Request, res: Response) => {
    try {
      const mockScenarios = [
        {
          id: 1,
          title: "海外旅行",
          description: "空港、ホテル、レストランでの会話",
          createdAt: "2025-08-20T09:00:00Z"
        },
        {
          id: 2,
          title: "ビジネス会議",
          description: "プレゼンテーション、議論、質疑応答",
          createdAt: "2025-08-22T11:30:00Z"
        }
      ];
      res.json(mockScenarios);
    } catch (error) {
      console.error('Error fetching custom scenarios:', error);
      res.status(500).json({ error: 'Failed to fetch custom scenarios' });
    }
  });

  router.get("/daily-count", requireAuth, async (req: Request, res: Response) => {
    try {
      // 認証トークンからユーザー情報を取得
      const authHeader = req.headers.authorization;
      let userEmail = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userEmail = payload.email;
        } catch (e) {
          console.log('Token parsing failed for daily-count:', e);
        }
      }
      
      // 管理者の場合は無制限
      if (userEmail === 'slazengersnow@gmail.com') {
        console.log('🔑 Admin user detected, returning unlimited daily count');
        return res.json({
          today: 0,
          limit: 999,
          remaining: 999,
          resetTime: "2099-12-31T23:59:59Z"
        });
      }
      
      // 一般ユーザー向け
      res.json({
        today: 23,
        limit: 50,
        remaining: 27,
        resetTime: "2025-08-25T00:00:00Z"
      });
    } catch (error) {
      console.error('Error fetching daily count:', error);
      res.status(500).json({ error: 'Failed to fetch daily count' });
    }
  });

  router.get("/subscription-details", requireAuth, async (req: Request, res: Response) => {
    try {
      // 認証トークンからユーザー情報を取得
      const authHeader = req.headers.authorization;
      let userEmail = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userEmail = payload.email;
        } catch (e) {
          console.log('Token parsing failed for subscription-details:', e);
        }
      }
      
      // 管理者の場合は特別なプラン情報
      if (userEmail === 'slazengersnow@gmail.com') {
        console.log('🔑 Admin user detected, returning admin plan details');
        return res.json({
          planName: "管理者プラン",
          price: "¥0",
          features: ["問題数無制限", "すべての難易度レベル", "詳細フィードバック", "管理者機能", "プレミアム機能"],
          status: "active",
          nextBillingDate: null
        });
      }
      
      // 一般ユーザー向け
      res.json({
        planName: "スタンダードプラン",
        price: "月額980円",
        features: ["1日50問まで", "すべての難易度レベル", "詳細フィードバック"],
        status: "active",
        nextBillingDate: "2025-09-24"
      });
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      res.status(500).json({ error: 'Failed to fetch subscription details' });
    }
  });

  router.post("/problem", handleProblemGeneration);
  router.post("/evaluate-with-claude", handleClaudeEvaluation);

  // Stripe決済エンドポイント
  router.post("/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { amount, planId } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ 
          error: 'Stripe設定が見つかりません' 
        });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20',
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // 金額（円単位）
        currency: 'jpy',
        metadata: {
          planId: planId || 'standard'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Stripe payment intent creation error:', error);
      res.status(500).json({ 
        error: 'Payment intent creation failed: ' + error.message 
      });
    }
  });
  
  // Review system endpoints (with authentication)
  router.get("/review-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const reviewProblems = await db
        .select()
        .from(trainingSessions)
        .where(lte(trainingSessions.rating, 2))
        .orderBy(desc(trainingSessions.createdAt))
        .limit(10);
      
      res.json(reviewProblems);
    } catch (error) {
      console.error('Error fetching review list:', error);
      res.status(500).json({ error: 'Failed to fetch review list' });
    }
  });

  router.get("/retry-list", requireAuth, async (req: Request, res: Response) => {
    try {
      const retryProblems = await db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.rating, 3))
        .orderBy(desc(trainingSessions.createdAt))
        .limit(10);
      
      res.json(retryProblems);
    } catch (error) {
      console.error('Error fetching retry list:', error);
      res.status(500).json({ error: 'Failed to fetch retry list' });
    }
  });

  // Progress report endpoint (with authentication)
  router.get("/progress-report", requireAuth, async (req: Request, res: Response) => {
    try {
      // Use Drizzle ORM queries for better type safety
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Get all sessions for calculations
      const allSessions = await db.select().from(trainingSessions);
      
      // Calculate statistics
      const totalSessions = allSessions.length;
      const avgRating = allSessions.length > 0 ? 
        allSessions.reduce((sum, s) => sum + s.rating, 0) / allSessions.length : 0;
      
      const todayCount = allSessions.filter(s => 
        s.createdAt && s.createdAt >= startOfToday).length;
      
      const monthlyCount = allSessions.filter(s => 
        s.createdAt && s.createdAt >= startOfMonth).length;
      
      // Calculate streak (consecutive days of practice)
      const uniqueDates = [...new Set(allSessions
        .filter(s => s.createdAt)
        .map(s => s.createdAt!.toDateString()))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      const todayString = today.toDateString();
      
      if (uniqueDates.includes(todayString) || uniqueDates.length === 0) {
        let currentDate = new Date(today);
        for (const dateStr of uniqueDates) {
          if (dateStr === currentDate.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Get user subscription info to determine daily limit
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, "default_user"))
        .limit(1);

      // Determine daily limit based on subscription
      let dailyLimit = 50; // Standard default
      if (subscription && subscription.subscriptionType === 'premium') {
        dailyLimit = 100;
      }

      const progressReport = {
        streak: streak,
        monthlyProblems: monthlyCount,
        averageRating: avgRating.toFixed(1),
        todayProblems: todayCount,
        dailyLimit: dailyLimit,
        totalProblems: totalSessions,
        membershipType: subscription?.subscriptionType || 'standard'
      };

      res.json(progressReport);
    } catch (error) {
      console.error('Error fetching progress report:', error);
      res.status(500).json({ error: 'Failed to fetch progress report' });
    }
  });

  // Weekly progress chart data endpoint (with authentication)
  router.get("/weekly-progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentSessions = await db
        .select()
        .from(trainingSessions)
        .where(gte(trainingSessions.createdAt, weekAgo))
        .orderBy(desc(trainingSessions.createdAt));
      
      // Group by date
      const dailyProgress: Record<string, any> = {};
      recentSessions.forEach(session => {
        if (session.createdAt) {
          const dateKey = session.createdAt.toDateString();
          if (!dailyProgress[dateKey]) {
            dailyProgress[dateKey] = {
              date: dateKey,
              count: 0,
              totalRating: 0,
              avgRating: 0
            };
          }
          dailyProgress[dateKey].count++;
          dailyProgress[dateKey].totalRating += session.rating;
          dailyProgress[dateKey].avgRating = dailyProgress[dateKey].totalRating / dailyProgress[dateKey].count;
        }
      });

      const chartData = Object.values(dailyProgress).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json(chartData);
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      res.status(500).json({ error: 'Failed to fetch weekly progress' });
    }
  });

  app.use("/api", router);
}
