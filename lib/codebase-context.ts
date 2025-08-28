/**
 * Codebase Context Generator for EcoBot
 * Provides comprehensive information about the EcoRide project structure and features
 */

export interface CodebaseContext {
  projectOverview: string
  techStack: string
  features: string
  fileStructure: string
  apiEndpoints: string
  databaseSchema: string
  components: string
  pages: string
  adminFeatures: string
  supportSystem: string
}

export function generateCodebaseContext(): CodebaseContext {
  return {
    projectOverview: `
EcoRide is a comprehensive sustainable ride-sharing dashboard application built with Next.js 15 and Supabase.

Key Features:
- Sustainable transportation booking (EV shuttles, e-bikes, ride-sharing)
- EcoPoints reward system for green choices
- CO₂ impact tracking and visualization
- Community features with posts and comments
- Support ticket system with auto-cleanup
- Admin dashboard for user management
- Real-time ride tracking and notifications
- Wallet and payment management
- User profiles with badges and achievements

The app promotes eco-friendly transportation choices and gamifies sustainable behavior through points and impact tracking.
    `,

    techStack: `
Frontend:
- Next.js 15 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui component library
- Lucide React for icons
- React Hook Form for forms
- Zod for validation

Backend & Database:
- Supabase (PostgreSQL) for database
- Supabase Auth for authentication
- Supabase Storage for file uploads
- Row Level Security (RLS) policies
- Database functions and triggers

APIs & Services:
- Next.js API Routes
- Gemini AI for EcoBot assistant
- Real-time subscriptions
- Cron jobs for cleanup tasks

Deployment:
- Vercel (frontend)
- Supabase (backend)
- Environment-based configuration
    `,

    features: `
Core Features:

1. Authentication & Profiles:
   - Email/password and social login
   - User profiles with roles (rider, driver, admin)
   - Avatar uploads and personal information
   - User preferences and settings

2. Ride Booking System:
   - Multiple transport modes (EV shuttle, e-bike, ride-sharing, walking)
   - Real-time location services
   - Route optimization and CO₂ calculation
   - Ride scheduling and history
   - Live tracking and notifications

3. EcoPoints & Rewards:
   - Points earned for sustainable choices
   - Reward redemption system
   - Badge achievements
   - Impact tracking and statistics

4. Community Features:
   - Social posts with images
   - Comments and likes
   - Community challenges
   - User interactions and engagement

5. Support System:
   - FAQ section with searchable content
   - Support ticket creation and management
   - Real-time chat with EcoBot AI assistant
   - Admin ticket management
   - Auto-cleanup of resolved tickets

6. Admin Dashboard:
   - User management and role assignment
   - Support ticket oversight
   - System statistics and analytics
   - Data purge and maintenance tools

7. Wallet & Payments:
   - Payment method management
   - Transaction history
   - Reward redemption
   - EcoPoints balance tracking

8. Impact Tracking:
   - CO₂ savings visualization
   - Environmental impact metrics
   - Progress tracking and goals
   - Historical data analysis
    `,

    fileStructure: `
Project Structure:

/app/ - Next.js App Router pages
  /api/ - API routes
    /admin/ - Admin-specific endpoints
      /cleanup-resolved-tickets/ - Ticket cleanup
      /debug-storage/ - Storage debugging
      /purge-all/ - Data purge functionality
      /support-tickets/ - Ticket management
      /user/ - User management
    /ecobot/ - AI assistant endpoint
    /support/ - Support ticket creation
    /test-env/ - Environment testing
  /dashboard/ - Main dashboard pages
    /admin/ - Admin dashboard
    /book-ride/ - Ride booking interface
    /community/ - Community features
    /ecopoints/ - Points and rewards
    /impact/ - Impact tracking
    /my-rides/ - Ride history
    /profile/ - User profile
    /support/ - Support center
    /wallet/ - Payment management
  /login/ - Authentication pages
  /signup/ - User registration

/components/ - React components
  /ui/ - Shadcn/ui components
  - AdminSupportTickets.tsx - Admin ticket management
  - AuthModal.tsx - Authentication modal
  - AuthProvider.tsx - Auth context provider
  - DashboardSidebar.tsx - Navigation sidebar
  - EcoBot.tsx - AI assistant component
  - SupportMain.tsx - Support page component
  - Various feature-specific components

/lib/ - Utility libraries
  - supabase.ts - Supabase client configuration
  - utils.ts - General utilities
  - codebase-context.ts - Codebase information

/hooks/ - Custom React hooks
  - use-mobile.ts - Mobile detection
  - use-toast.ts - Toast notifications
  - use-user-validation.ts - User validation

/migrations/ - Database migrations
  - Support ticket table creation
  - RLS policies and functions
  - Auto-cleanup functionality

/scripts/ - Utility scripts
  - cleanup-resolved-tickets.js - Cron job script

/public/ - Static assets
  - Images and icons
  - Placeholder content
    `,

    apiEndpoints: `
API Endpoints:

Authentication:
- POST /api/auth/login - User login
- POST /api/auth/signup - User registration
- POST /api/auth/logout - User logout

Support System:
- POST /api/support - Create support ticket
- GET /api/support/user-tickets - Get user's tickets
- GET /api/admin/support-tickets - Get all tickets (admin)
- POST /api/admin/support-tickets/[id]/message - Add message to ticket
- POST /api/admin/cleanup-resolved-tickets - Cleanup old tickets

Admin Functions:
- POST /api/admin/purge-all - Purge all data
- GET /api/admin/debug-storage - Debug storage issues
- GET /api/admin/user/[id] - Get user details

AI Assistant:
- POST /api/ecobot - EcoBot AI responses

Ride Management:
- POST /api/rides - Create new ride
- GET /api/rides - Get user rides
- PUT /api/rides/[id] - Update ride status

Community:
- POST /api/posts - Create community post
- GET /api/posts - Get community posts
- POST /api/comments - Add comment

EcoPoints:
- GET /api/ecopoints - Get user points
- POST /api/ecopoints/earn - Earn points
- POST /api/ecopoints/redeem - Redeem rewards
    `,

    databaseSchema: `
Database Tables:

1. profiles
   - id (uuid, primary key)
   - name, email, role (rider/driver/admin)
   - eco_points, badges, phone
   - avatar_url, home_address
   - banned status, timestamps

2. support_tickets
   - id (bigint, primary key)
   - name, email, subject, message
   - status (new/in_progress/resolved/closed)
   - messages (jsonb array)
   - timestamps

3. rides
   - id (uuid, primary key)
   - user_id, pickup/dropoff addresses
   - coordinates, distance, duration
   - price, co2_saved_kg, mode
   - timestamps

4. community_posts
   - id (uuid, primary key)
   - user_id, user_name, content
   - type, likes, comments_count
   - image_url, liked_by array
   - timestamps

5. comments
   - id (uuid, primary key)
   - post_id, user_id, user_name
   - content, avatar_url
   - timestamps

6. impact_logs
   - id (uuid, primary key)
   - user_id, co2_saved_kg
   - points_earned, distance_km
   - mode, timestamps

7. rewards
   - id (uuid, primary key)
   - title, description, points
   - category, timestamps

8. reward_redemptions
   - id (uuid, primary key)
   - user_id, reward_id, title
   - points_spent, timestamps

9. user_preferences
   - id (uuid, primary key)
   - user_id (unique)
   - preferred_transport, notifications
   - marketing preferences
   - timestamps

Key Features:
- Row Level Security (RLS) policies
- Auto-cleanup triggers for resolved tickets
- JSONB for flexible data storage
- Foreign key relationships
- Indexes for performance
    `,

    components: `
Key Components:

1. Authentication:
   - AuthProvider.tsx - Context provider for user state
   - AuthModal.tsx - Login/signup modal
   - AuthTopBar.tsx - Top navigation with auth

2. Dashboard:
   - DashboardSidebar.tsx - Navigation sidebar
   - DashboardMain.tsx - Main dashboard layout
   - Various feature-specific main components

3. Support System:
   - SupportMain.tsx - Support page with tabs
   - AdminSupportTickets.tsx - Admin ticket management
   - EcoBot.tsx - AI assistant component

4. UI Components (Shadcn/ui):
   - Button, Input, Textarea, Card
   - Dialog, Modal, Tabs, Badge
   - Form components with validation
   - Toast notifications
   - Responsive design components

5. Feature Components:
   - BookRideMain.tsx - Ride booking interface
   - CommunityMain.tsx - Community features
   - EcoPointsMain.tsx - Points and rewards
   - ImpactMain.tsx - Impact tracking
   - WalletMain.tsx - Payment management
   - ProfileMain.tsx - User profile

6. Admin Components:
   - AdminMain.tsx - Admin dashboard
   - User management components
   - System monitoring tools

Component Patterns:
- Client-side components with "use client"
- Server-side rendering where appropriate
- Responsive design with Tailwind CSS
- Form validation with React Hook Form
- State management with React hooks
- Error boundaries and loading states
    `,

    pages: `
Page Structure:

1. Authentication Pages:
   - /login - User login
   - /signup - User registration
   - /banned - Banned user page

2. Dashboard Pages:
   - /dashboard - Main dashboard overview
   - /dashboard/book-ride - Ride booking
   - /dashboard/my-rides - Ride history
   - /dashboard/ecopoints - Points and rewards
   - /dashboard/impact - Impact tracking
   - /dashboard/community - Community features
   - /dashboard/support - Support center
   - /dashboard/wallet - Payment management
   - /dashboard/profile - User profile

3. Admin Pages:
   - /dashboard/admin - Admin dashboard
   - User management
   - Support ticket oversight
   - System analytics

4. API Pages:
   - Various API endpoints for data operations
   - Authentication and authorization
   - File uploads and storage

Page Features:
- Responsive design for all screen sizes
- Loading states and error handling
- Authentication guards where needed
- Real-time updates and notifications
- SEO optimization
- Accessibility compliance
    `,

    adminFeatures: `
Admin Dashboard Features:

1. User Management:
   - View all users with search and filters
   - Assign roles (rider, driver, admin)
   - Ban/unban users
   - View user details and activity
   - Reset user passwords

2. Support Ticket Management:
   - View all support tickets
   - Filter by status, date, user
   - Respond to tickets with messages
   - Change ticket status
   - Auto-cleanup of resolved tickets

3. System Analytics:
   - User registration statistics
   - Ride booking analytics
   - EcoPoints distribution
   - Support ticket metrics
   - System performance monitoring

4. Data Management:
   - Purge all data (nuclear option)
   - Debug storage issues
   - Export user data
   - Backup and restore functionality

5. Content Management:
   - Manage community posts
   - Moderate comments
   - Update FAQ content
   - Manage rewards and badges

6. System Maintenance:
   - Cleanup old data
   - Monitor system health
   - Update configurations
   - Performance optimization

Admin Access:
- Role-based access control
- Secure API endpoints
- Audit logging
- Emergency procedures
    `,

    supportSystem: `
Support System Features:

1. User Support:
   - FAQ section with searchable content
   - Contact form for ticket creation
   - Real-time chat with EcoBot AI
   - Ticket tracking and updates
   - Message history and responses

2. Ticket Management:
   - Automatic ticket creation
   - Status tracking (new, in_progress, resolved, closed)
   - Message threading
   - File attachments support
   - Priority levels

3. Admin Support Tools:
   - View all tickets with filters
   - Respond to tickets
   - Change ticket status
   - Assign tickets to agents
   - Bulk operations

4. Auto-Cleanup System:
   - Resolved tickets deleted after 4 hours
   - Database triggers for status changes
   - Cron job automation
   - Manual cleanup options

5. EcoBot AI Assistant:
   - 24/7 automated support
   - Codebase-aware responses
   - Context-aware conversations
   - Fallback to human support

6. Support Analytics:
   - Ticket volume tracking
   - Response time metrics
   - User satisfaction scores
   - Common issue identification

Integration:
- Email notifications
- Real-time updates
- Mobile-responsive design
- Accessibility features
    `
  }
}

export function getCodebaseContextString(): string {
  const context = generateCodebaseContext()
  return `
# EcoRide Codebase Context

## Project Overview
${context.projectOverview}

## Technology Stack
${context.techStack}

## Features
${context.features}

## File Structure
${context.fileStructure}

## API Endpoints
${context.apiEndpoints}

## Database Schema
${context.databaseSchema}

## Components
${context.components}

## Pages
${context.pages}

## Admin Features
${context.adminFeatures}

## Support System
${context.supportSystem}

## Development Guidelines
- Use TypeScript for type safety
- Follow Next.js 15 App Router patterns
- Implement responsive design with Tailwind CSS
- Use Shadcn/ui components for consistency
- Implement proper error handling and loading states
- Follow Supabase best practices for security
- Use RLS policies for data protection
- Implement proper authentication and authorization
- Follow accessibility guidelines
- Write clean, maintainable code with proper documentation
  `.trim()
}
