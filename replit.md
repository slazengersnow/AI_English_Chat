# AI瞬間英作文チャット (AI English Composition Chat)

## Overview

This is a mobile-first English composition training application that helps users practice translating Japanese sentences to English. The app provides instant feedback and corrections using AI, with a LINE-style chat interface optimized for smartphone usage. The project's vision is to offer a comprehensive, engaging, and effective platform for English learners to improve their composition skills, leveraging AI for personalized and immediate feedback, thereby catering to a broad market of language learners.

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
- **CRITICAL REBUILD (Aug 2, 2025)**: Completely rebuilt training interface from zero
- Replaced complex TrainingInterface with SimpleProblemPractice using useReducer
- Implemented strict 1-problem-only architecture with manual step control
- Eliminated all useEffect-based automatic problem generation across ALL files
- Fixed infinite loop by removing mutation chains and auto-triggers in simulation-practice.tsx
- Created clean state machine with useReducer: initial → loading_problem → showing_problem → evaluating → showing_result
- Removed auto-generation from simulation practice to prevent cross-file interference

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query for server state management and caching
- **Styling**: Tailwind CSS with mobile-first responsive design, Shadcn/UI components for design consistency.
- **UI/UX**: LINE-inspired chat interface with message bubbles, bottom input area, difficulty level selection (TOEIC, Middle School, High School, Basic Verbs, Business Email), star rating system for translation quality, enhanced training interface with problem numbering, bookmarks, and detailed feedback. Comprehensive user dashboard (MyPage) with progress tracking and scenario creation.

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

- **AI Translation**: Anthropic Claude 3 Haiku (`claude-3-haiku-20240307`)
- **Payment Gateway**: Stripe (for subscription management and checkout)
- **Authentication**: Supabase (for user authentication, including email/password and Google OAuth)
- **Deployment**: Railway (production deployment)