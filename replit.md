# AI Career Development Support App

## Overview

This is a LINE-style chat interface application that provides AI-powered career development support. Users select career-related themes and engage in dynamic conversations with an AI assistant powered by OpenAI's GPT-4. The application features a responsive mobile-first design and includes affiliate recommendation functionality after meaningful conversations.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the client-side application
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with custom CSS variables for theming
- **Shadcn/UI** components for consistent design system

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with `/api/chat` and `/api/conversations` endpoints
- **OpenAI GPT-4** integration for intelligent conversation generation
- **Memory-based storage** (MemStorage class) for conversation persistence
- **Middleware** for request logging and error handling

### UI/UX Design
- **Mobile-first responsive design** optimized for chat interfaces
- **LINE-inspired styling** with green accent colors and bubble layouts
- **Theme-based conversation starters** with icon-based selection
- **Progressive disclosure** with affiliate modal recommendations

## Key Components

### Frontend Components
- **ThemeSelection**: Landing page with career theme cards
- **ChatInterface**: Main conversation interface with message bubbles
- **AffiliateModal**: Recommendation modal for external services
- **Custom UI Components**: Extensive library of reusable components from Shadcn/UI

### Backend Components
- **Storage Layer**: Abstract `IStorage` interface with in-memory implementation
- **Route Handlers**: Express routes for conversation management and chat processing
- **OpenAI Integration**: Intelligent conversation generation and response handling
- **Message Processing**: Structured chat message handling with timestamps

### Database Schema (Prepared for PostgreSQL)
- **Conversations Table**: Stores conversation metadata, messages as JSONB, and message counts
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Schema Validation**: Zod-based validation for API requests and responses

## Data Flow

1. **Theme Selection**: User selects a career development theme (self-understanding, skill development, etc.)
2. **Conversation Initialization**: System creates new conversation with selected theme
3. **Message Exchange**: 
   - User sends message via chat interface
   - Frontend sends request to `/api/chat` endpoint
   - Backend processes message and generates AI response using OpenAI
   - Response returned with updated conversation state
4. **Progressive Enhancement**: After sufficient interaction, affiliate recommendations are triggered
5. **State Management**: TanStack Query manages server state and optimistic updates

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity (prepared for future use)
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **openai**: Official OpenAI API client for GPT-4 integration
- **express**: Web framework for API server
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI and Styling
- **@radix-ui**: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant styling
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **drizzle-kit**: Database migration and schema management

## Deployment Strategy

### Development Environment
- **Replit-optimized**: Configured for Replit's cloud development environment
- **Hot Module Replacement**: Vite-powered development with instant updates
- **Port Configuration**: Express server on port 5000 with external port 80

### Production Build
- **Client Build**: Vite builds static assets to `dist/public`
- **Server Build**: esbuild bundles server code to `dist/index.js`
- **Static File Serving**: Express serves built client assets in production

### Environment Configuration
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **OpenAI**: API key via `OPENAI_API_KEY` environment variable
- **Autoscale Deployment**: Configured for automatic scaling based on traffic

### Migration Strategy
- **Database Schema**: Drizzle migrations in `./migrations` directory
- **Schema Push**: `npm run db:push` for development schema updates
- **Production Migrations**: Automated via Drizzle Kit

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```