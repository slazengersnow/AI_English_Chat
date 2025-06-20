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
- **OpenAI GPT-4** integration for English translation and correction
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
4. **AI Evaluation**: OpenAI GPT-4 evaluates and corrects translation
5. **Feedback Display**: Star rating and model answer shown
6. **Progress Tracking**: Results saved to database for user improvement

## Environment Configuration
- **OpenAI API**: API key via `OPENAI_API_KEY` environment variable
- **Stripe**: Secret key via `STRIPE_SECRET_KEY` environment variable
- **Payment**: Price ID via `STRIPE_PRICE_ID` environment variable
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

## Recent Changes

### December 20, 2025 - My Page Feature Implementation
- Added comprehensive My Page with three main sections:
  1. **Progress Report**: User goal setting, streak tracking, progress charts, difficulty-level analytics
  2. **Review Functions**: Lists for low-rated problems (★2 below), rechallenge items (★3), bookmark management
  3. **Simulation Creation**: Custom scenario builder for personalized training contexts
- Migrated from memory storage to PostgreSQL database with Drizzle ORM
- Added navigation from home page to My Page
- Implemented real-time progress tracking and analytics

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