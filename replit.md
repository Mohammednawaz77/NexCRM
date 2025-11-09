# NexCRM - Next-Gen Management System

## Overview

NexCRM is a modern Customer Relationship Management platform built for B2B sales teams. The system provides lead management, activity tracking, analytics, and user management capabilities with real-time collaboration features.

The application follows a full-stack TypeScript architecture with React on the frontend and Express on the backend, connected to a PostgreSQL database through Drizzle ORM. The UI is built with shadcn/ui components and follows a system-based design approach inspired by Linear, Notion, and HubSpot.

## Recent Changes

**November 8, 2025 - Rebranding and Modernization**
- Rebranded application from "CRM System" to "NexCRM" across all touchpoints
- Updated color scheme to modern teal/cyan theme (195 95% 55%) for contemporary appearance
- Created comprehensive deployment guide for separate Vercel (frontend) and Render (backend) deployment
- Verified all functionality with end-to-end testing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- React Hook Form with Zod for form validation and type safety

**State Management**
- TanStack Query (React Query) for server state management
- Context API for authentication state
- WebSocket connection for real-time updates

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS with custom design tokens for consistent styling
- "New York" style variant with neutral base color
- Custom CSS variables for theming (light mode configuration present)
- Inter font family for professional B2B appearance

**Design Philosophy**
- System-based approach prioritizing information density and workflow efficiency
- Consistent spacing using Tailwind primitives (2, 4, 6, 8, 12)
- Fixed left sidebar navigation (16rem width)
- Data tables optimized for scanning and quick task completion

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP/HTTPS protocol with WebSocket support for real-time features
- Session-based authentication using Passport.js with Local Strategy
- Password hashing using Node.js scrypt algorithm

**API Design**
- RESTful API endpoints under `/api` prefix
- Role-based access control (admin, manager, sales_executive)
- Protected routes requiring authentication
- Request/response logging middleware for API calls

**Authentication & Authorization**
- Local authentication strategy (username/password)
- Session management with connect-pg-simple for PostgreSQL session store
- Role-based middleware for endpoint protection
- Secure password storage with salt and hash separation

### Data Storage

**Database**
- PostgreSQL via Neon serverless with WebSocket support
- Drizzle ORM for type-safe database queries
- Schema-first approach with automatic TypeScript type generation

**Data Models**
- **Users**: Core authentication and user profile data with role assignments
- **Leads**: Company/contact information with status tracking and ownership
- **Activities**: Time-stamped interactions linked to leads and users

**Relationships**
- Users own multiple leads (one-to-many)
- Users create multiple activities (one-to-many)
- Leads have multiple activities (one-to-many with cascade delete)
- Activities reference both leads and users

**Session Storage**
- PostgreSQL-backed session store for horizontal scalability
- 7-day session expiration
- Secure cookies in production environment

### Real-time Communication

**WebSocket Implementation**
- Native WebSocket server integrated with HTTP server
- Protocol switching based on environment (ws:// or wss://)
- Event-driven architecture for live updates
- Broadcast system for lead and activity changes
- Automatic query invalidation on relevant data changes

**Event Types**
- lead_created: New lead additions
- lead_updated: Lead modifications
- lead_deleted: Lead removals
- activity_created: New activity logging

### External Dependencies

**Database & Infrastructure**
- Neon Serverless PostgreSQL: Managed PostgreSQL with WebSocket support
- Environment variable required: `DATABASE_URL`

**UI Component Libraries**
- Radix UI: Headless accessible UI primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip)
- Recharts: Data visualization for analytics dashboards
- cmdk: Command palette component
- Embla Carousel: Carousel functionality
- React Day Picker: Calendar/date selection
- Vaul: Drawer component

**Form & Validation**
- React Hook Form: Form state management
- Zod: Runtime schema validation
- @hookform/resolvers: Integration between React Hook Form and Zod
- Drizzle Zod: Automatic Zod schema generation from Drizzle schemas

**Development Tools**
- Replit plugins: Runtime error overlay, cartographer (dev mode), dev banner (dev mode)
- TSX: TypeScript execution for development server
- ESBuild: Production bundling for server code
- Drizzle Kit: Database migrations and schema management

**Styling & Design**
- Tailwind CSS: Utility-first CSS framework
- class-variance-authority: Component variant management
- clsx & tailwind-merge: Conditional className utilities
- Google Fonts: Inter font family

**Date Utilities**
- date-fns: Modern date manipulation and formatting

**Session Management**
- express-session: Session middleware
- connect-pg-simple: PostgreSQL session store adapter
- Passport.js: Authentication middleware with Local Strategy

**Security**
- Built-in Node.js crypto module for password hashing (scrypt)
- Timing-safe password comparison to prevent timing attacks
- HTTPS enforcement in production
- Secure session cookies with httpOnly flag