# AI瞬間英作文チャット (AI English Composition Chat)

## Overview

This is a mobile-first English composition training application that helps users practice translating Japanese sentences to English. The app provides instant feedback and corrections using AI, with a LINE-style chat interface optimized for smartphone usage. The project's vision is to offer a comprehensive, engaging, and effective platform for English learners to improve their composition skills, leveraging AI for personalized and immediate feedback, thereby catering to a broad market of language learners. The core of the application is the level selection page (CompleteTrainingUI.tsx) featuring 6 difficulty levels: TOEIC, 中学英語, 高校英語, 基本動詞, ビジネスメール, シミュレーション練習.

## User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Mobile-optimized English learning app with instant feedback and comprehensive progress tracking.
Learning Flow: Complete LINE-style chat interface with sequential message delivery. Problem → Answer → Rating → Model Answer → Detailed Explanation → Similar Phrases → Next Problem (1 second intervals between messages).
Authentication Flow: Login screen (SimpleAuth.tsx) serves as permanent main authentication interface, accessible via MyPage logout.
UI Design: No login button on main interface - authentication accessed only through MyPage logout functionality.
Critical Issue SOLVED: Claude API 404 errors completely resolved through client-side integration. Root cause was Vite middleware intercepting /api/ routes. Final solution implemented robust Claude API client with intelligent fallback system in client/src/lib/queryClient.ts, ensuring seamless user experience even during API issues.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS with mobile-first responsive design, Shadcn/UI components.
- **UI/UX**: Complete LINE-style chat interface with real-time message delivery, bubble animations, and natural conversation flow. Difficulty level selection (TOEIC, Middle School, High School, Basic Verbs, Business Email, Simulation Practice). Sequential evaluation delivery: rating display → model answer → detailed explanation → similar phrases → next problem button. Auto-scroll chat management and responsive mobile-first design. The main page (CompleteTrainingUI.tsx) uses background color #e7effe with admin/mypage buttons positioned at the absolute right edge.

### Backend
- **Framework**: Express.js server with TypeScript
- **API Design**: RESTful API for translation and payment endpoints
- **Database**: PostgreSQL with Drizzle ORM.
- **Key Features**:
    - **Translation Service**: AI-powered English translation and correction.
    - **Payment Service**: Subscription management.
    - **Session Management**: User progress tracking.
    - **Analytics Service**: Progress reports and difficulty statistics.
    - **Daily Problem Limit**: 100 questions with automatic midnight reset, server-side enforced.
    - **Simulation Practice**: Context-aware problem generation and evaluation based on custom scenarios.
    - **Review Functions**: Management of low-rated problems, rechallenge items, and bookmarks (Review List for <=2 stars, Retry List for 3 stars).
    - **Speech Synthesis**: Text-to-speech for model answers and similar phrases using Web Speech API (en-US, 0.8x speed).
    - **Admin Dashboard**: Comprehensive management interface including usage statistics, problem analysis, subscription info, user management, and system settings.
    - **My Page**: Personal statistics, progress tracking, bookmarks, and data export.

### Database Schema
- **Training Sessions**: Stores user translations, ratings, bookmarks, and review counts.
- **User Goals**: Daily and monthly targets for problem solving.
- **Daily Progress**: Tracks completion and average ratings by date.
- **Custom Scenarios**: User-created simulation scenarios.

## External Dependencies

- **AI Translation & Evaluation**: Anthropic Claude 3 Haiku (`claude-3-haiku-20240307`)
  - Integrated via robust client-side API with intelligent fallbacks
  - Problem generation for all 6 difficulty levels
  - Comprehensive evaluation with encouraging feedback
  - Graceful degradation to high-quality fallback content
- **Payment Gateway**: Stripe
- **Authentication**: Supabase (email/password and Google OAuth) via SimpleAuth.tsx interface
  - Primary access: MyPage → Logout → Login Screen
  - Screenshots-matched design for login/signup screens
  - No login button on main interface (user preference)
- **Deployment**: Railway (production deployment)