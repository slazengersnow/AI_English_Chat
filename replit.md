# AI瞬間英作文チャット (AI English Composition Chat)

## Overview

This is a mobile-first English composition training application that helps users practice translating Japanese sentences to English. The app provides instant feedback and corrections using AI, with a LINE-style chat interface optimized for smartphone usage. The project's vision is to offer a comprehensive, engaging, and effective platform for English learners to improve their composition skills, leveraging AI for personalized and immediate feedback, thereby catering to a broad market of language learners.

**MAIN PAGE**: The core of the application is the level selection page (CompleteTrainingUI.tsx) featuring 6 difficulty levels: TOEIC, 中学英語, 高校英語, 基本動詞, ビジネスメール, シミュレーション練習. This page uses background color #e7effe with admin/mypage buttons positioned at the absolute right edge of the screen. This is the central hub users return to after any debug/refresh scenarios.

## User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Mobile-optimized English learning app with instant feedback and comprehensive progress tracking.
**Learning Flow**: Problem → Answer → Evaluation/Explanation/Similar Phrases・Next Problem (continuous flow with 1 second interval).
**Critical Issue**: Agent-Preview synchronization problems preventing UI updates and console control. User reports persistent console display issues that Agent cannot directly resolve due to communication limitations.

## Identified Root Causes (Resolved)
- ✅ TypeScript compilation errors blocking app builds (fixed React imports)
- ✅ import.meta usage requiring ES2020+ module configuration
- ✅ Missing React imports causing UMD global references
- ✅ Agent-Preview sandbox restrictions preventing direct UI control
- ✅ Build process failures due to module resolution conflicts
- ✅ Critical: Frontend infinite loop in useEffect causing repeated API calls
- ✅ Replit host allowedHosts configuration (added specific domain to vite.config.ts)
- ✅ Port 5000 Express+Vite integration (server correctly serving on port 5000)
- ✅ Stripe secrets configuration (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET added)
- ✅ **SERVER STARTUP FIX (Aug 5, 2025)**: Fixed workflow configuration issue where npm run dev was calling vite instead of Express server
- ✅ **CHAT UI TRANSFORMATION (Aug 6, 2025)**: Replaced static evaluation UI with LINE-style chat interface for natural conversation flow
- ✅ **CLAUDE 3 HAIKU INTEGRATION (Aug 6, 2025)**: Implemented real-time AI evaluation with detailed explanations, grammar analysis, and alternative expressions
- ✅ **CHAT HISTORY PERSISTENCE (Aug 6, 2025)**: Fixed chat message clearing issue - all problems, answers, evaluations remain visible in continuous scroll
- ✅ **SEQUENTIAL PROBLEM NUMBERING (Aug 6, 2025)**: Implemented proper problem counter with dynamic numbering based on chat history

## Implemented Solutions
- Updated tsconfig.json module setting to "esnext"
- Added React imports to fix UMD references
- Created emergency demo access routes (/auto-demo, /force-demo)
- Implemented console minimization scripts and CSS injection
- Documented manual Console control via 🔧 wrench icon
- Fixed Google OAuth redirect URL to use dynamic current domain
- Created OAuth testing and debug page (/oauth-fix)
- Implemented multiple authentication fallback methods
- Created fresh Supabase client to bypass cached configuration
- Developed comprehensive final auth test page (/final-auth-test)
- Implemented Replit-specific OAuth configuration using REPLIT_DEV_DOMAIN
- Created Replit-optimized authentication page (/replit-auth-fix)
- Resolved Preview environment OAuth restrictions
- **COMPLETE RECONSTRUCTION (Aug 2, 2025)**: Deleted all problem-related files and rebuilt from zero
- Created new ProblemPractice component with explicit state machine using useReducer
- Implemented absolute initialization lock (initializationLock.current) to prevent double execution
- State transitions: loading → show_problem → waiting_user_input → evaluating → show_result → wait_for_next_button
- Eliminated all automatic problem generation - ONLY manual button clicks trigger new problems
- Removed auto-generation from simulation-practice.tsx to prevent cross-file interference
- Rebuilt chat-interface.tsx with minimal functionality to prevent side effects
- Empty dependency arrays [] and strict mounted checks to prevent infinite loops
- **REPLIT PREVIEW CONFIGURATION (Aug 5, 2025)**: Complete server integration
- Express+Vite middleware integration on port 5000
- Added specific Replit domain to vite.config.ts allowedHosts
- SUPABASE_ANON_KEY synchronized with Replit Secrets
- STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET configured
- Port 5000 → External Port 80 mapping for Replit preview URL
- Minimal test app serving correctly via https://...kirk.replit.dev
- **SERVER STARTUP RESOLUTION**: Workflow was running `vite` instead of Express server. Fixed by manually starting `tsx server/index.ts` which properly integrates Vite middleware and serves on port 5000
- **COMPLETE SERVER INTEGRATION (Aug 5, 2025)**: Created dedicated `run-server.mjs` with Express+Vite integration
- Express API routes (/api/problem, /api/evaluate) configured BEFORE Vite middleware to prevent 404 errors
- Server properly binds to 0.0.0.0:5000 with Replit port mapping (local 5000 → external 80)
- Confirmed working: https://slazengersnow.AIEnglishChat.replit.dev/ accessibility
- **LINE-STYLE CHAT INTERFACE (Aug 6, 2025)**: Complete UI transformation to messaging app experience
- Real-time chat bubbles with problem delivery, user responses, AI evaluation, and detailed explanations
- Sequential message delivery with timing animations mimicking natural conversation flow
- Chat scroll management with automatic scroll-to-bottom for new messages
- **CLAUDE 3 HAIKU API INTEGRATION (Aug 6, 2025)**: Advanced AI evaluation system
- 200-character detailed explanations covering grammar, expression improvements, and cultural context
- Dynamic rating system (1-5 stars) based on accuracy, naturalness, and appropriateness
- Alternative expression suggestions with contextual variations
- Fallback system ensuring continuous operation even if API fails

## System Architecture

### Module System Analysis (August 2, 2025)
- **Current State**: 139 files (99.3%) use ESM syntax, 1 file (0.7%) uses CommonJS
- **Configuration**: TypeScript `"module": "esnext"`, Vite ESM-first build
- **Recommendation**: Complete ESM standardization for consistency
- **Issue Resolved**: Module format inconsistency between source and build identified
- **ESM Migration**: Added `.js` extensions to 20 relative import paths for strict ESM compliance

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query for server state management and caching
- **Styling**: Tailwind CSS with mobile-first responsive design, Shadcn/UI components for design consistency.
- **UI/UX**: Complete LINE-style chat interface with real-time message delivery, bubble animations, and natural conversation flow. Difficulty level selection (TOEIC, Middle School, High School, Basic Verbs, Business Email, Simulation Practice). Sequential evaluation delivery: rating display → model answer → detailed explanation → similar phrases → next problem button. Auto-scroll chat management and responsive mobile-first design.

### Backend
- **Framework**: Express.js server with TypeScript
- **API Design**: RESTful API for translation and payment endpoints
- **Database**: PostgreSQL with Drizzle ORM for data persistence.
- **Key Features**:
    - **Translation Service**: AI-powered English translation and correction.
    - **Payment Service**: Subscription management.
    - **Session Management**: User progress tracking.
    - **Analytics Service**: Progress reports and difficulty statistics.
    - **Daily Problem Limit**: 100 questions with automatic midnight reset, server-side enforced.
    - **Simulation Practice**: Context-aware problem generation and evaluation based on custom scenarios.
    - **Review Functions**: Management of low-rated problems, rechallenge items, and bookmarks.
    - **Speech Synthesis**: Text-to-speech for model answers and similar phrases using Web Speech API (en-US, 0.8x speed).

### Database Schema
- **Training Sessions**: Stores user translations, ratings, bookmarks, and review counts.
- **User Goals**: Daily and monthly targets for problem solving.
- **Daily Progress**: Tracks completion and average ratings by date.
- **Custom Scenarios**: User-created simulation scenarios.

## External Dependencies

- **AI Translation & Evaluation**: Anthropic Claude 3 Haiku (`claude-3-haiku-20240307`) - Real-time translation evaluation with detailed explanations
- **Payment Gateway**: Stripe (for subscription management and checkout)
- **Authentication**: Supabase (for user authentication, including email/password and Google OAuth)
- **Deployment**: Railway (production deployment)

## Recent Changes (August 7, 2025)

**Main Page Design Finalization (August 7, 2025)**:
- Established CompleteTrainingUI.tsx as the central main page of the application
- Fixed background color to exact specification: #e7effe (light blue)
- Positioned admin/mypage buttons at absolute right edge using position absolute (top-4 right-4)
- Implemented 6 level selection cards with proper sizing and spacing matching user screenshots
- Added premium restriction messaging for simulation practice feature
- Created compact mobile-first design with reduced font sizes and spacing
- This page serves as the primary entry point and hub for all application functionality

## Previous Changes (August 6, 2025)

**Chat Interface Transformation**:
- Implemented complete LINE-style messaging interface replacing static forms
- Sequential message delivery with timing animations (500ms intervals)
- Real-time evaluation with Claude 3 Haiku producing 200-character explanations
- Alternative expression suggestions and contextual grammar analysis
- Mobile-optimized chat experience with auto-scroll and bubble design

**UI Improvements & Evaluation System Enhancement (August 6, 2025)**:
- Fixed star rating box height to consistent 2rem (h-8) with left-aligned layout
- Removed yellow background from star rating, changed to clean white background
- Implemented difficulty-specific Claude evaluation prompts for personalized feedback
- Enhanced fallback evaluation system with detailed answer analysis
- Added proper inappropriate answer detection (rejects "test", "aaa", etc. with 1-point scoring)
- Improved problem generation system with difficulty-appropriate vocabulary and expressions

**Admin Dashboard & Management System (August 6, 2025)**:
- Added admin and "My Page" buttons to main menu interface (matching user screenshot requirements)
- Implemented comprehensive AdminDashboard.tsx with 5 core sections:
  - Usage Statistics: Daily users, problems, category breakdowns, real-time connections
  - Problem Analysis: Category rankings, output statistics
  - Subscription Info: Active subscribers, trial users, monthly revenue (Stripe integration)
  - User Management: User list with search, subscription status, activity tracking
  - Admin Settings: System status monitoring, notification broadcasting
- Created MyPage.tsx with personal statistics, progress tracking, bookmarks, data export
- Integrated server-side admin routes with mock data endpoints for all dashboard functions
- Added UI components: Tabs, Progress bars, Badges for comprehensive management interface

**Technical Implementation**:
- Created `ChatStyleTraining.tsx` component with full chat state management
- Added `/api/evaluate-with-claude` endpoint with robust error handling
- Integrated ANTHROPIC_API_KEY for real-time AI evaluation
- Enhanced fallback system with individualized assessment logic
- Message types: problem, user_answer, evaluation, model_answer, explanation, similar_phrases, next_button
- Built admin-routes.ts with comprehensive API endpoints for usage analytics and user management
- Added page navigation system with menu/training/admin/mypage state management