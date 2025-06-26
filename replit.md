# Instant English Composition Training App

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
- **Anthropic API**: API key via `ANTHROPIC_API_KEY` environment variable for Claude 3 Haiku
- **Stripe**: Secret key via `STRIPE_SECRET_KEY` environment variable
- **Payment**: Price ID via `STRIPE_PRICE_ID` environment variable
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

## Recent Changes

### June 26, 2025 - AI Provider Migration to Claude 3 Haiku
- Migrated from OpenAI GPT-4 to Anthropic Claude 3 Haiku for translation evaluation
- Updated API integration to use Anthropic's Messages API with claude-3-haiku-20240307 model
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