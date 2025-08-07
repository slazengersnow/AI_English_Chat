# AI瞬間英作文チャット (AI English Composition Chat)

## Overview

This is a mobile-first English composition training application that helps users practice translating Japanese sentences to English. The app provides instant feedback and corrections using AI, with a LINE-style chat interface optimized for smartphone usage. The project's vision is to offer a comprehensive, engaging, and effective platform for English learners to improve their composition skills, leveraging AI for personalized and immediate feedback, thereby catering to a broad market of language learners. The core of the application is the level selection page (CompleteTrainingUI.tsx) featuring 6 difficulty levels: TOEIC, 中学英語, 高校英語, 基本動詞, ビジネスメール, シミュレーション練習.

## User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Mobile-optimized English learning app with instant feedback and comprehensive progress tracking.
Learning Flow: Problem → Answer → Evaluation/Explanation/Similar Phrases・Next Problem (continuous flow with 1 second interval).
Critical Issue Resolved: Fixed Vite middleware intercepting API routes by creating working-api-server.ts with proper route precedence. All Claude API endpoints now functional. Use working-api-server.ts instead of server/index.ts for correct API integration.

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
- **Payment Gateway**: Stripe
- **Authentication**: Supabase (email/password and Google OAuth)
- **Deployment**: Railway (production deployment)