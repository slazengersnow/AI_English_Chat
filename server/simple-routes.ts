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
import { eq, lte, desc, gte, and, sql } from "drizzle-orm";

const router = Router();

/* -------------------- データベースベース重複防止 -------------------- */

/**
 * ユーザーが最近回答した問題を取得（過去50000問）
 */
async function getRecentUserProblems(userId: string, difficultyLevel: string): Promise<string[]> {
  try {
    console.log(`🗄️ Database query: fetching recent problems for user ${userId} (difficulty: ${difficultyLevel})`);
    
    const recentSessions = await db
      .select({ japaneseSentence: trainingSessions.japaneseSentence })
      .from(trainingSessions)
      .where(and(
        eq(trainingSessions.userId, userId),
        eq(trainingSessions.difficultyLevel, difficultyLevel)
      ))
      .orderBy(desc(trainingSessions.createdAt))
      .limit(50000); // 過去50000問をチェック

    console.log(`📊 Database result: Found ${recentSessions.length} recent problems for user ${userId}`);
    
    const problems = recentSessions.map(session => session.japaneseSentence);
    if (problems.length > 0) {
      console.log(`🚫 Recent problems (first 3): ${problems.slice(0, 3).join(', ')}`);
    }
    
    return problems;
  } catch (error) {
    console.error("❌ Error fetching recent problems:", error);
    return [];
  }
}

/**
 * 重複のない問題を選択
 */
// セッション内重複防止のためのメモリキャッシュ
const sessionRecentProblems = new Map<string, Set<string>>();

async function getUnusedProblem(
  userId: string,
  difficultyLevel: string,
  problems: string[],
): Promise<string> {
  console.log(`🔍 Checking recent problems for user: ${userId} (difficulty: ${difficultyLevel})`);
  
  // データベースから過去の問題を取得
  const recentProblems = await getRecentUserProblems(userId, difficultyLevel);
  console.log(`📋 Database recent problems: ${recentProblems.length} (last 50000)`);
  
  // セッション内のキャッシュも確認
  const sessionKey = `${userId}_${difficultyLevel}`;
  if (!sessionRecentProblems.has(sessionKey)) {
    sessionRecentProblems.set(sessionKey, new Set());
  }
  
  const sessionProblems = sessionRecentProblems.get(sessionKey)!;
  console.log(`🧠 Session cache problems: ${sessionProblems.size} problems`);
  
  // データベース + セッションキャッシュの両方から除外
  const allRecentProblems = new Set([...recentProblems, ...sessionProblems]);
  const availableProblems = problems.filter(p => !allRecentProblems.has(p));
  console.log(`✅ Available problems: ${availableProblems.length}/${problems.length} (after DB + session filter)`);
  
  // 利用可能な問題がない場合は、セッションキャッシュをリセットして再試行
  let finalPool = availableProblems;
  if (availableProblems.length === 0) {
    console.log(`🔄 No unused problems - clearing session cache and retrying`);
    sessionProblems.clear();
    const fallbackAvailable = problems.filter(p => !new Set(recentProblems).has(p));
    finalPool = fallbackAvailable.length > 0 ? fallbackAvailable : problems;
    console.log(`🔄 After session reset: ${finalPool.length} problems available`);
  }
  
  // 完全にリセットする場合の最終手段
  if (finalPool.length === 0) {
    finalPool = problems;
    console.log(`🆘 Emergency reset - using full problem pool`);
  }
  
  const selectedIndex = Math.floor(Math.random() * finalPool.length);
  const selectedProblem = finalPool[selectedIndex];
  
  // セッションキャッシュに追加して重複を防止
  sessionProblems.add(selectedProblem);
  console.log(`🎯 Selected: "${selectedProblem}" (index: ${selectedIndex}, session cache now: ${sessionProblems.size})`);
  
  return selectedProblem;
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
    "お疲れさまです。",
    "新商品の販売戦略について相談したいです。",
    "来週の出張スケジュールをお送りします。",
    "システムメンテナンスのお知らせです。",
    "契約内容の変更点がございます。",
    "研修プログラムの参加者を募集中です。",
    "月末の売上報告をいたします。",
    "商品の配送が遅れる予定です。",
    "面接の候補日程を教えてください。",
    "顧客満足度調査の結果をご報告します。",
    "プロジェクトの進捗状況はいかがですか。",
    "予算の見直しが必要になりました。",
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
    // ✅ 改良されたユーザーID取得ロジック
    let userId = "default_user";
    let authenticationFailed = false;
    
    console.log(`🔍 Problem generation - Auth header present: ${!!req.headers.authorization}`);
    
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
        // トークンの妥当性チェック
        if (token.length < 10) {
          throw new Error('Token too short');
        }
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.VITE_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
          console.log(`⚠️ Supabase auth error:`, error.message);
          authenticationFailed = true;
        } else if (user) {
          userId = user.id;
          console.log(`✅ User authenticated successfully: ${user.email}`);
        } else {
          console.log(`⚠️ No user found in token`);
          authenticationFailed = true;
        }
      } catch (error) {
        console.log(`❌ Failed to get user from token:`, error);
        authenticationFailed = true;
      }
    } else {
      console.log(`⚠️ No Bearer token found`);
      authenticationFailed = true;
    }
    
    // 認証に失敗した場合のユーザーフィードバック
    if (authenticationFailed && userId === "default_user") {
      console.log(`⚠️ Using default user due to authentication failure`);
    } else {
      console.log(`🎯 Using authenticated user: ${userId}`);
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

    // ✅ Claude APIを使った動的問題生成（重複防止付き）
    const maxRetries = 5;
    let selectedSentence: string | null = null;
    let attempts = 0;
    
    // 最近の問題を取得して重複を防ぐ（データベース + セッションキャッシュ）
    const recentProblems = await getRecentUserProblems(userId, difficultyLevel);
    
    // セッションキャッシュも確認
    const sessionKey = `${userId}_${difficultyLevel}`;
    if (!sessionRecentProblems.has(sessionKey)) {
      sessionRecentProblems.set(sessionKey, new Set());
    }
    const sessionProblems = sessionRecentProblems.get(sessionKey)!;
    
    // データベース + セッション両方の問題を重複回避リストに含める
    const allRecentProblems = [...recentProblems, ...Array.from(sessionProblems)];
    console.log(`📋 User has ${recentProblems.length} DB problems + ${sessionProblems.size} session problems to avoid duplicates`);
    
    // 難易度別の詳細プロンプト
    const difficultyPrompts: Record<string, { description: string, constraints: string, examples: string }> = {
      toeic: {
        description: "TOEICレベルのビジネス英語",
        constraints: "15-25文字、ビジネス場面、丁寧語、専門用語使用可",
        examples: "会議資料を準備してください。 / 売上が20%増加しました。 / 新商品の企画を検討中です。"
      },
      "middle-school": {
        description: "中学1年生レベルの超基本英語",
        constraints: "8-15文字、絶対に1文のみ、現在形・現在進行形のみ、基本語彙500語以内、複合文・複文は絶対禁止",
        examples: "私は学生です。 / 今日は暑いです。 / 彼は走っています。 / 猫が寝ています。 / 雨が降ります。"
      },
      "high-school": {
        description: "高校英語レベル",
        constraints: "18-30文字、複合時制・関係代名詞・仮定法使用可、抽象的概念含む",
        examples: "環境問題について考える必要があります。 / 将来の夢を実現するために努力しています。"
      },
      "basic-verbs": {
        description: "基本動詞を使った超シンプルな文",
        constraints: "6-12文字、go/come/eat/see/read/play/watch/study等の基本動詞のみ",
        examples: "私は本を読みます。 / 彼女は音楽を聞きます。 / 友達と遊びます。"
      },
      "business-email": {
        description: "ビジネスメール用の丁寧な表現",
        constraints: "15-30文字、敬語・丁寧語必須、多様なビジネスシーン：挨拶・依頼・確認・報告・提案・案内・スケジュール・顧客対応・緊急事態・人事関連など",
        examples: "お疲れさまです。 / 新企画の提案をさせていただきます。 / システム障害が発生しています。 / 来月の研修についてお知らせします。 / 契約条件を見直したいです。"
      },
      simulation: {
        description: "実用的な日常会話",
        constraints: "10-20文字、場面設定明確、自然な話し言葉",
        examples: "駅までどのくらいかかりますか。 / この商品はいくらですか。"
      }
    };

    const promptConfig = difficultyPrompts[difficultyLevel] || difficultyPrompts["middle-school"];
    
    while (attempts < maxRetries && !selectedSentence) {
      attempts++;
      console.log(`🎲 Claude API attempt ${attempts}/${maxRetries} for difficulty: ${difficultyLevel}`);
      
      try {
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          throw new Error("Anthropic API key not configured");
        }

        const anthropic = new Anthropic({ apiKey: anthropicApiKey });
        
        const generatePrompt = `${promptConfig.description}の日本語文を1つ作成してください。

【厳守条件】
${promptConfig.constraints}

【参考例】
${promptConfig.examples}

【絶対守るべきルール】
- 文字数制限を厳密に守る
- 指定されたレベルを超えない語彙・文法のみ使用
- 1文のみ（複文・複合文禁止、特にmiddle-schoolは絶対1文）
- 自然で翻訳しやすい日本語

${allRecentProblems.length > 0 ? `【重複回避】以下の文は絶対に避け、全く異なる内容で作成：
${allRecentProblems.slice(0, 10).map(p => `- ${p}`).join('\n')}` : ''}

以下のJSON形式で返してください：
{
  "japaneseSentence": "作成した日本語文（1文のみ）",
  "modelAnswer": "自然な英訳",
  "hints": ["重要語彙1", "重要語彙2", "重要語彙3"]
}`;

        const message = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          temperature: 0.4, // より一貫性のあるレベル制御のため低めに設定
          messages: [{ role: "user", content: generatePrompt }]
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        console.log(`📝 Claude response (attempt ${attempts}):`, responseText);

        // JSONを抽出して解析
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const problemData = JSON.parse(jsonMatch[0]);
          const generatedSentence = problemData.japaneseSentence;
          
          // 重複チェック（データベース + セッションキャッシュ両方確認）
          if (generatedSentence && !allRecentProblems.includes(generatedSentence)) {
            selectedSentence = generatedSentence;
            console.log(`✅ Generated unique problem: "${selectedSentence}"`);
            
            // セッションキャッシュにも追加
            sessionProblems.add(selectedSentence);
            
            const response: ProblemResponse = {
              japaneseSentence: selectedSentence,
              hints: problemData.hints || [`問題 - ${difficultyLevel}`],
            };

            return res.json(response);
          } else {
            console.log(`⚠️ Generated sentence already exists, retrying... (attempt ${attempts})`);
          }
        } else {
          console.log(`❌ Invalid JSON response format (attempt ${attempts})`);
        }
      } catch (error) {
        console.error(`❌ Claude API error (attempt ${attempts}):`, error);
      }
    }
    
    // 最大リトライ回数に達した場合のフォールバック
    console.log(`⚠️ Max retries reached, using fallback problem`);
    const fallbackSentences = problemSets[difficultyLevel] || problemSets["middle-school"];
    const fallbackSentence = await getUnusedProblem(userId, difficultyLevel, fallbackSentences);

    const response: ProblemResponse = {
      japaneseSentence: fallbackSentence,
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

    // PRODUCTION-GRADE: Zero-failure Claude API implementation
    let attempts = 0;
    const maxAttempts = 5; // Increased for production reliability
    let lastError: any = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🚀 Production Claude API attempt ${attempts}/${maxAttempts}`);
      
      try {
        const anthropic = new Anthropic({ 
          apiKey: anthropicApiKey,
          timeout: 45000,    // Increased timeout for reliability
          maxRetries: 3      // Built-in SDK retry
        });
        
        const message = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        
        // SUCCESS: Extract and validate content immediately
        const content = message.content[0]?.type === "text" ? message.content[0].text : "";
        console.log(`✅ Claude API returned content: ${content.substring(0, 100)}...`);
        
        // ROBUST JSON PARSING: Multiple strategies
        let parsedResult: any = null;
        
        // Strategy 1: Direct parsing
        try {
          parsedResult = JSON.parse(content);
          console.log(`✅ Direct JSON parsing successful on attempt ${attempts}`);
        } catch (directError) {
          console.log(`⚠️ Direct JSON parsing failed, trying extraction`);
          
          // Strategy 2: Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            try {
              parsedResult = JSON.parse(jsonMatch[0]);
              console.log(`✅ JSON extraction successful on attempt ${attempts}`);
            } catch (extractError) {
              console.log(`❌ JSON extraction failed on attempt ${attempts}`);
              if (attempts < maxAttempts) {
                lastError = new Error(`JSON parsing failed: ${extractError.message}`);
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
                continue; // Try again
              }
            }
          } else {
            console.log(`❌ No JSON found in response on attempt ${attempts}`);
            if (attempts < maxAttempts) {
              lastError = new Error("No JSON content found in Claude response");
              await new Promise(resolve => setTimeout(resolve, attempts * 1000));
              continue; // Try again
            }
          }
        }
        
        // FINAL VALIDATION: Ensure we have valid result
        if (parsedResult && 
            parsedResult.correctTranslation && 
            parsedResult.feedback && 
            parsedResult.rating) {
          console.log(`🎉 Production Claude API success on attempt ${attempts}`);
          return {
            correctTranslation: parsedResult.correctTranslation,
            feedback: parsedResult.feedback,
            rating: Math.max(1, Math.min(5, parseInt(parsedResult.rating))),
            improvements: parsedResult.improvements || [],
            explanation: parsedResult.explanation || parsedResult.feedback,
            similarPhrases: parsedResult.similarPhrases || []
          };
        } else {
          console.log(`❌ Invalid response structure on attempt ${attempts}`);
          if (attempts < maxAttempts) {
            lastError = new Error("Invalid response structure from Claude");
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue; // Try again
          }
        }
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Claude API error on attempt ${attempts}:`, {
          message: error.message,
          status: error.status,
          type: error.type
        });
        
        // INTELLIGENT RETRY LOGIC based on error type
        if (error.status === 429) { // Rate limiting
          const waitTime = Math.pow(2, attempts) * 1000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (error.status === 500 || error.status === 502 || error.status === 503) {
          // Server errors - retry with longer delay
          console.log(`⏳ Server error, waiting ${attempts * 3000}ms`);
          await new Promise(resolve => setTimeout(resolve, attempts * 3000));
          continue;
        }
        
        if (attempts >= maxAttempts) {
          console.error(`🚨 Production Claude API failed after ${maxAttempts} attempts`);
          break;
        }
        
        // Standard retry delay
        await new Promise(resolve => setTimeout(resolve, attempts * 2000));
      }
    }
    
    // FALLBACK: After all attempts failed
    console.error(`🚨 PRODUCTION ALERT: Claude API completely failed after ${maxAttempts} attempts. Using enhanced fallback.`);
    console.error(`Last error:`, lastError?.message);
    
    // Use high-quality fallback system
    return generateEnhancedFallback(japaneseSentence, userTranslation, difficultyLevel);
  } catch (error) {
    console.error("❌ evaluateTranslation critical error:", error);
    // Final safety net
    return generateEnhancedFallback(japaneseSentence, userTranslation, difficultyLevel);
  }
}
          cleanContent = cleanContent.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          parsedResult = JSON.parse(cleanContent);
        } catch (cleanupError) {
