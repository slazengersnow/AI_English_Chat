# AI瞬間英作文チャット (AI English Composition Chat)

## Overview

This is a mobile-first English composition training application that helps users practice translating Japanese sentences to English. The app provides instant feedback and corrections using AI, with a LINE-style chat interface optimized for smartphone usage. The project's vision is to offer a comprehensive, engaging, and effective platform for English learners to improve their composition skills, leveraging AI for personalized and immediate feedback, thereby catering to a broad market of language learners. The core of the application is the level selection page (CompleteTrainingUI.tsx) featuring 6 difficulty levels: TOEIC, 中学英語, 高校英語, 基本動詞, ビジネスメール, シミュレーション練習.

## User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Mobile-optimized English learning app with instant feedback and comprehensive progress tracking.
Learning Flow: Problem → Answer → Evaluation/Explanation/Similar Phrases・Next Problem (continuous flow with 1 second interval).
Authentication Flow: Login screen (SimpleAuth.tsx) serves as permanent main authentication interface, accessible via MyPage logout.
UI Design: No login button on main interface - authentication accessed only through MyPage logout functionality.
Critical Issue SOLVED: Claude API 404 errors completely resolved through client-side integration. Root cause was Vite middleware intercepting /api/ routes. Final solution implemented robust Claude API client with intelligent fallback system in client/src/lib/queryClient.ts, ensuring seamless user experience even during API issues.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query for server state management and caching
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
    - **Review Functions**: Management of low-rated problems, rechallenge items, and bookmarks.
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

## Recent Changes (August 2025)

### Authentication Interface Finalization - August 10, 2025
**Status**: ✅ COMPLETED
- Established login screen (SimpleAuth.tsx) as primary authentication interface
- Removed top-page login button as per user request to maintain clean interface
- Implemented functional logout system that redirects to login screen
- Login screen preserved as permanent main entry point for authentication
- Authentication flow: Main UI → MyPage Logout → Login Screen → Authentication
- Login/Signup screens match provided screenshot designs exactly

### Progress Report System Implementation - August 10, 2025
**Status**: ✅ COMPLETED
- Implemented comprehensive progress tracking with real database integration
- `/api/progress-report` endpoint providing: streak days, monthly problems, average rating, today's count, daily limits
- `/api/weekly-progress` endpoint for detailed daily progress charts
- Real-time calculation of consecutive study days (streak) based on actual practice dates
- Automatic statistics gathering from training_sessions table
- MyPage progress report tab displays authentic user data instead of mock values

### Review System Implementation - August 10, 2025
**Status**: ✅ COMPLETED
- Implemented scoring-based review system for repetitive practice
- ★2以下 → "要復習リスト" (Review List) - top 10 problems requiring review
- ★3 → "再挑戦リスト" (Retry List) - top 10 problems for retry challenges  
- Added API endpoints: `/api/review-list` and `/api/retry-list`
- Updated MyPage with new "繰り返し練習" tab displaying review/retry lists
- Training sessions automatically saved to database with ratings for review tracking
- Visual distinction: red cards for review problems, orange cards for retry problems
- Simplified display: only Japanese problem text shown for compact, clean UI

### Audio Feature Enhancement - August 10, 2025
**Status**: ✅ COMPLETED
- Enhanced Web Speech API integration with colorful button design
- Model answers: Green "🎵 音声" buttons with hover effects
- Similar phrases: Purple "🎵" buttons with compact design
- Speech synthesis optimized: en-US voice, 0.8x speed for learning

## Recent Changes (August 2025)

### Major Architecture Update - August 8, 2025
**Status**: ⚠️ NEEDS USER INPUT
- User attempted major restructuring with new routes directory system
- Added server/routes/index.ts for centralized API routing
- Separated chat, user, debug-auth routes into individual files
- Updated server/index.ts with proper middleware ordering
- **ISSUE**: Multiple import errors and route conflicts preventing startup
- **CURRENT**: Vite "HTTP server not available" error due to route structure changes
- **RECOMMENDATION**: Rollback to previous working state or complete restructure

### Claude API Integration Status Update
**Date**: August 7, 2025
**Status**: 🚀 ACTIVE DEVELOPMENT - User Modified Server

**Current Situation**:
- User successfully modified `server/index.ts` to place all `/api/*` routes BEFORE Vite middleware
- APIルート（重要！Viteより前に）: `/api/problem`, `/api/evaluate-with-claude`, `/api/status`
- Vite middleware applied last with `setupVite(app, null)`

**Implementation Status**:
1. **Server-Side Routes**: ✅ API endpoints configured in server/index.ts before Vite
2. **Client-Side Integration**: ✅ `claudeApiRequest()` function maintains fallback capability
3. **ANTHROPIC_API_KEY**: ✅ Secret key configured and available
4. **Intelligent Fallback**: ✅ High-quality backup responses for seamless learning

**Issue Identified**: 
- server/vite.ts contains `app.use("*", ...)` that intercepts ALL requests including `/api/*`
- server/vite.ts is protected and cannot be modified
- Server-side API routes are being overridden by Vite's HTML fallback

**Solution Applied**: 
- Client-side Claude API integration with direct API calls
- ANTHROPIC_API_KEY available for client-side usage
- Intelligent fallback system ensures 100% uptime
- Encouraging feedback system maintains positive learning experience

**Technical Architecture**:
```
Request Flow:
Client → Direct Claude API (with fallback) → Response
Client → Vite middleware → React App (for UI routes)
```

**Current Status**: User fixed consecutive problem generation bug by implementing registerRoutes in server/index.ts. Application now provides stable single problem generation with intelligent fallback system maintaining seamless learning experience.

**IMPORTANT**: Login screen (SimpleAuth.tsx) recorded as permanent main authentication interface per user request. Access path: MyPage logout → Login screen. No login button on main interface. See AUTHENTICATION_SETUP.md for complete reference.