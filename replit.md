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
- **Claude Haiku API** integration for English translation and correction
- **Stripe** integration for subscription management
- **Memory-based storage** for session data

### UI/UX Design
- **Mobile-first responsive design** optimized for smartphones
- **LINE-inspired chat interface** with message bubbles
- **Bottom input area** for easy thumb typing
- **Difficulty level selection** (Middle School, High School, TOEIC, Basic Verbs)
- **Star rating system** for translation quality

## Key Components

### Frontend Components
- **DifficultySelection**: Landing page with difficulty level cards
- **ChatInterface**: Main translation training interface
- **PaymentModal**: Stripe checkout integration
- **ResultDisplay**: Translation feedback with star ratings

### Backend Components
- **Translation Service**: Claude Haiku API integration
- **Payment Service**: Stripe subscription management
- **Session Management**: User progress tracking

## Data Flow

1. **Difficulty Selection**: User selects vocabulary level
2. **Problem Generation**: System provides Japanese sentence for translation
3. **Translation Input**: User types English translation
4. **AI Evaluation**: Claude Haiku evaluates and corrects translation
5. **Feedback Display**: Star rating and model answer shown
6. **Progress Tracking**: Results saved for user improvement

## Environment Configuration
- **Claude API**: API key via `CLAUDE_API_KEY` environment variable
- **Stripe**: Secret key via `STRIPE_SECRET_KEY` environment variable
- **Payment**: Price ID via `STRIPE_PRICE_ID` environment variable

## Changelog

```
Changelog:
- June 19, 2025. Initial project setup for instant English composition training app
- Mobile-first design with LINE-style chat interface
- Claude Haiku API integration for translation evaluation
- Stripe subscription system with 7-day trial
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Project focus: Mobile-optimized English learning app with instant feedback.
```