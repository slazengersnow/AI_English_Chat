# AI瞬間英作文チャット (AI English Composition Chat)

## Overview

This is a mobile-first English composition training application that helps users practice translating Japanese sentences to English. The app provides instant feedback and corrections using AI, with a LINE-style chat interface optimized for smartphone usage.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the client-side application
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with mobile-first responsive design
- **Shadcn/UI** components for consistent design system

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with translation and payment endpoints
- **Anthropic Claude 3 Haiku** integration for English translation and correction
- **Stripe** integration for subscription management
- **PostgreSQL database** with Drizzle ORM for data persistence

### Database Schema
- **Training Sessions**: Stores user translations, ratings, bookmarks, and review counts
- **User Goals**: Daily and monthly targets for problem solving
- **Daily Progress**: Tracks completion and average ratings by date
- **Custom Scenarios**: User-created simulation scenarios

### UI/UX Design
- **Mobile-first responsive design** optimized for smartphones
- **LINE-inspired chat interface** with message bubbles
- **Bottom input area** for easy thumb typing
- **Difficulty level selection** (TOEIC, Middle School, High School, Basic Verbs, Business Email)
- **Star rating system** for translation quality

## Key Components

### Frontend Components
- **DifficultySelection**: Landing page with difficulty level cards
- **TrainingInterface**: Enhanced translation training with problem numbering, bookmarks, and detailed feedback
- **MyPage**: Comprehensive user dashboard with progress tracking and scenario creation
- **PaymentModal**: Stripe checkout integration
- **ResultDisplay**: Translation feedback with star ratings, large-font model answers, Japanese explanations, and similar phrases

### Backend Components
- **Translation Service**: OpenAI GPT-4 API integration
- **Payment Service**: Stripe subscription management
- **Session Management**: User progress tracking with database persistence
- **Analytics Service**: Progress reports and difficulty statistics

## Data Flow

1. **Difficulty Selection**: User selects vocabulary level
2. **Problem Generation**: System provides Japanese sentence for translation
3. **Translation Input**: User types English translation
4. **AI Evaluation**: Anthropic Claude 3 Haiku evaluates and corrects translation
5. **Feedback Display**: Star rating and model answer shown
6. **Progress Tracking**: Results saved to database for user improvement

## Environment Configuration
- **OpenAI API**: API key via `OPENAI_API_KEY` environment variable for GPT-4o
- **Stripe**: Secret key via `STRIPE_SECRET_KEY` environment variable
- **Payment**: Price ID via `STRIPE_PRICE_ID` environment variable
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

## Recent Changes

### June 29, 2025 - トライアル機能完全実装
- **トライアルユーザーのプレミアム機能アクセス**: トライアル期間中はプレミアム機能フル利用可能
  - useSubscriptionフックでtrialingユーザーもcanAccessPremiumFeatures=trueに設定
  - SubscriptionGuardでtrialingステータスユーザーの完全アクセス許可
  - 7日間無料トライアル期間の残り日数表示機能（マイページ）
- **bizmowa.comアカウント設定**: 新規ユーザー状態で7日間トライアル開始
  - 既存データ完全クリア（トレーニングセッション・カスタムシナリオ・進捗）
  - trialStartフィールドでトライアル開始日記録
  - validUntilフィールドで7日後の期限設定
- **トップページUI最適化**: プレミアム機能案内を「最短で英語力アップ」メッセージに変更
  - ネイティブ水準の添削フィードバック案内
  - 専用進捗レポート機能紹介
  - 中学生〜TOEIC対策レベル対応説明
  - 「今すぐ本登録する」CTA設置
- **プラン表示修正**: トライアルユーザーをプレミアムプランとして正しく表示
  - マイページでのアイコン・タイトル・バッジをプレミアム仕様に変更
  - subscription?.subscriptionStatus === 'trialing'条件を各表示ロジックに追加
- **プラン比較改善**: サブスクリプション選択ページに料金情報と基本練習機能説明を追加
  - 各プランの先頭に月額・年会費を明記
  - 全プランに「基本練習機能（全レベル対応）」を追加
- **不要UI削除**: ホームページ上部の意味不明なプレミアム機能バナーを完全削除
- **アプリ名統一**: 全箇所でAI英作文チャット→AI瞬間英作文チャットに名称変更
- **料金体系更新**: プラン比較ページの料金を新価格に変更
  - スタンダード: 月額980円、年会費9,800円
  - プレミアム: 月額1,300円、年会費13,000円
- **マイページプラン比較表改善**: 月額料金と年会費の項目を基本練習機能の前に追加
  - 料金情報を表の最上部に配置し、機能比較の前に明確に表示
  - 各プランの料金を一目で比較できるよう改善

### June 29, 2025 - Supabase認証システム実装
- **認証システム移行**: Replit認証からSupabase認証へ完全移行
  - メールアドレス+パスワード新規登録機能（メール認証付き）
  - Google OAuth ソーシャルログイン対応
  - ログアウト機能をマイページのアカウントタブに統合
  - 管理者アカウント事前登録（slazengersnow@gmail.com）
- **認証フロー**: 初回はメール認証、2回目以降はGoogle/パスワードログイン可能
  - 新規登録時の利用規約・プライバシーポリシー同意チェック
  - パスワード要件：8文字以上、英字と数字両方含む
  - メール認証完了ページ（/confirm）での認証状態確認
- **認証コンテキスト**: AuthProviderとuseAuthフックで全アプリに認証状態提供
  - isAuthenticated状態に基づくルート保護
  - 管理者判定ロジック（email === 'slazengersnow@gmail.com'）
  - ログアウト時のセッション破棄とトップページリダイレクト
- **利用規約・プライバシーポリシー**: 完全な法的文書ページを実装
  - /terms ルートで利用規約表示（10条構成、日本法準拠）
  - /privacy ルートでプライバシーポリシー表示（個人情報保護法対応）
  - サインアップページからのリンク修正（target="_blank"で新タブ表示）
  - 戻るボタン付きでサインアップページに戻る動線を確保
- **アプリ名変更**: AI英作文チャットからAI瞬間英作文チャットに名称統一
  - 利用規約・プライバシーポリシー内のサービス名を更新
  - ログイン・サインアップ・認証確認ページのタイトル変更
  - Training Interfaceヘッダーの表示名更新
  - ドキュメント内のアプリ名を全て統一変更

### June 28, 2025 - ヘッダーナビゲーション最適化
- **ボタン重複問題の解決**: homeページの固定ナビゲーションとTrainingInterfaceヘッダーのボタン重複を修正
  - TrainingInterface表示時にhomeページの固定ナビゲーション（右上）を非表示に変更
  - 「マイページ」ボタンが2つ表示される問題を解決
- **ボタン配置順序の統一**: 全ページで「マイページ」「トップページ」「管理者」の順序に統一
  - TrainingInterfaceとSimulationPracticeのヘッダーボタン順序を修正
  - flex-wrapで画面幅に応じた自動折り返し対応
  - px-4 py-2のスタイル統一でボタンデザインを整理
- **レイアウト安定性の向上**: gap-2でボタン間隔を統一し、画面サイズ変更時の崩れを防止

### June 28, 2025 - 音声出力機能実装
- **SpeechSynthesis音声読み上げ機能**: AIの模範解答を英語で読み上げる機能を追加
  - 新しいSpeechButtonコンポーネントでWeb Speech API統合
  - 模範解答部分に再生ボタンを配置し、英語音声(en-US)で読み上げ
  - 類似フレーズの各項目にも個別の音声読み上げボタンを追加
  - 学習向けに音声速度を0.8倍に調整し、理解しやすい発音速度を実現
  - TrainingInterfaceとSimulationPracticeの両方で音声機能利用可能
- **ユーザー登録・支払い・利用制限動線**: 完全なユーザー認証フローを実装
  - サインアップページで利用規約・プライバシーポリシー同意チェック実装
  - サインアップ後の自動プラン選択ページ遷移機能
  - Stripe Checkout連携による決済処理とサブスクリプション管理
  - SubscriptionGuardによる「active」「trialing」ユーザーのみアクセス制限
  - 非アクティブユーザーの適切なリダイレクト処理

### June 27, 2025 - Stripe Price ID Configuration
- Configured specific Stripe Price IDs for AI瞬間英作文チャット subscription plans:
  - Standard Monthly: prod_SZgeMcEAMDMlDe (¥1,980/月)
  - Standard Yearly: prod_SZglW626p1IFsh (¥19,800/年)
  - Premium Monthly: prod_SZgm74ZfQCQMSP (¥3,980/月)
  - Premium Yearly: prod_SZgnjreCBit2Bj (¥39,800/年)
  - Premium Upgrade: prod_SZhAV32kC3oSlf (¥2,000/月差額)
- Added `/api/subscription-plans` endpoint to serve plan details with features and pricing
- Enhanced PaymentModal with multi-plan selection interface and visual plan comparison
- Implemented environment variable fallbacks for flexible Price ID configuration
- Added plan validation in checkout session creation for security

### June 26, 2025 - AI Provider: Reverted to OpenAI GPT-4
- Attempted migration to Anthropic Claude 3 Haiku but reverted due to insufficient API credits
- Currently using OpenAI GPT-4o for translation evaluation with JSON response format
- Maintained existing Japanese feedback format and evaluation criteria
- Preserved translation quality assessment with 1-5 star rating system
- Kept structured response format: correctTranslation, feedback, rating, improvements, explanation, similarPhrases

### June 26, 2025 - Daily Problem Limit Implementation
- Added daily problem limit of 100 questions with automatic midnight reset
- Enhanced database schema with `dailyCount` field in daily progress table
- Implemented server-side limit enforcement on `/api/problem` endpoint
- Added appropriate Japanese error message when limit reached: "本日の最大出題数（100問）に達しました。明日また学習を再開できます。"
- Added daily count display to My Page showing current usage (X/100) with progress bar
- Created `/api/daily-count` endpoint to track remaining questions
- Added `/api/reset-daily-count` endpoint for admin/testing purposes

### December 20, 2025 - My Page Feature Implementation
- Added comprehensive My Page with three main sections:
  1. **Progress Report**: User goal setting, streak tracking, progress charts, difficulty-level analytics
  2. **Review Functions**: Lists for low-rated problems (★2 below), rechallenge items (★3), bookmark management
  3. **Simulation Creation**: Custom scenario builder for personalized training contexts
- Migrated from memory storage to PostgreSQL database with Drizzle ORM
- Added navigation from home page to My Page
- Implemented real-time progress tracking and analytics

### December 20, 2025 - Simulation Practice Feature Implementation
- Added simulation practice functionality with complete workflow:
  1. **Simulation Selection Page**: Displays user-created custom scenarios
  2. **Simulation Practice Interface**: Context-aware problem generation and evaluation
  3. **Integration with Difficulty Selection**: Added simulation option to main level selection screen
- Custom scenarios generate contextual Japanese problems using OpenAI
- Simulation results are stored separately from regular difficulty levels (prefixed with "simulation-")
- Removed simulation navigation from header to consolidate access through difficulty selection

### June 26, 2025 - App Title Update and Premium Restrictions
- **App Title Change**: Updated application title to "AI瞬間英作文チャット" (AI English Composition Chat)
  - Modified training interface header to display new title
  - Updated main documentation to reflect new branding
  - Emphasizes AI-powered chat-based learning approach
- **Review Function Premium Restriction**: Made repeat practice a premium-only feature
  - Standard users see disabled button with premium upgrade message
  - Premium users retain full access to repeat practice functionality
  - Added informative messaging about premium benefits for business simulation practice
  - Maintains existing bookmark and low-rating review access for all users

### June 26, 2025 - Navigation Enhancement and Subscription Management
- **Enhanced Header Navigation**: Added prominent Home button to training interface
  - Home button positioned to the left of My Page button for quick access to main page
  - Consistent styling with clear borders and hover effects
  - User requested feature for improved navigation flow during training sessions
- **Admin Subscription Management**: Added user subscription management functionality
  - Admins can change user subscription types between Standard and Premium
  - Standard/Premium toggle buttons in user management interface
  - API endpoint `/api/admin/users/:userId/subscription` for subscription updates
  - Real-time cache invalidation for immediate UI updates

### June 21, 2025 - UI Consistency and Auto-Generation Updates
- **UI Standardization**: Converted simulation practice to match TOEIC training chat interface
  - Unified font sizes, colors, and layout between all practice modes
  - Replaced card-based UI with chat-style message bubbles
  - Consistent styling for Japanese problems, user answers, and model responses
- **Enhanced Navigation**: Added universal navigation buttons to all practice screens
  - Home button and My Page button available in all difficulty levels
  - Consistent header layout across TOEIC and simulation practice
- **Auto-Generation Feature**: Simulation practice now automatically generates next problem
  - Eliminates manual "next problem" button clicking
  - Seamless continuous practice experience with 1-second delay after evaluation
  - Auto-focus on input field for immediate next answer entry
- **Schema Fixes**: Updated API schemas to support simulation difficulty levels (simulation-X format)

## Changelog

```
Changelog:
- June 19, 2025. Initial project setup for instant English composition training app
- Mobile-first design with LINE-style chat interface
- OpenAI GPT-4 API integration for translation evaluation (switched from Claude)
- Reordered difficulty levels: TOEIC, Middle School, High School, Basic Verbs, Business Email
- Added Business Email difficulty level with mail icon
- Enhanced training interface with:
  • Problem numbering (問題1, 問題2, etc.)
  • Bookmark functionality using localStorage
  • Large-font model answers for better readability
  • Japanese explanations for grammar and vocabulary
  • Similar phrase suggestions (2 examples per problem)
- Stripe subscription system with 7-day trial
- Comprehensive feedback system with star ratings
- December 20, 2025: Added My Page with progress reports, review functions, and custom scenario creation
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Project focus: Mobile-optimized English learning app with instant feedback and comprehensive progress tracking.
```