# Support Ticket System

## Overview
This document describes the support ticket system implementation, including database schema, API endpoints, and frontend components.

## Database Schema

### `support_tickets` table
- `id` (bigint) - Primary key
- `user_id` (uuid) - References `auth.users.id`
- `name` (text) - User's name
- `email` (text) - User's email
- `subject` (text) - Ticket subject
- `message` (text) - Initial message
- `status` (text) - One of: 'new', 'in_progress', 'resolved', 'closed'
- `messages` (jsonb) - Array of message objects
- `created_at` (timestamp) - When ticket was created
- `updated_at` (timestamp) - When ticket was last updated

### Message Object Format
```typescript
{
  id: string;           // Unique ID for the message
  sender_type: string;  // 'user' or 'admin'
  sender_id?: string;   // Optional user ID
  message: string;      // The message content
  created_at: string;   // ISO timestamp
}
```

## API Endpoints

### `POST /api/support`
Submit a new support ticket.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Help needed",
  "message": "I need help with..."
}
```

### `GET /api/admin/support-tickets`
List all support tickets (admin only).

**Query Parameters:**
- `status` - Filter by status (optional)
- `search` - Search in subject/message (optional)

### `GET /api/admin/support-tickets/[id]`
Get a single ticket with its messages (admin only).

### `PATCH /api/admin/support-tickets/[id]`
Update a ticket's status (admin only).

**Request Body:**
```json
{
  "status": "in_progress"
}
```

### `POST /api/admin/support-tickets/[id]/message`
Add a message to a ticket (admin only).

**Request Body:**
```json
{
  "message": "We're looking into this...",
  "senderId": "admin-user-id"
}
```

## Frontend Components

### `SupportMain`
Main support page component with contact form and help resources.

### `AdminSupportTickets`
Admin interface for managing support tickets:
- View all tickets with filtering and search
- Update ticket status
- View and respond to messages
- See ticket details and user information

## Security
- All admin endpoints require admin privileges
- Users can only access their own tickets
- Row-level security (RLS) policies enforce access control
- Sensitive operations use server-side API routes with service role key

## Future Improvements
- Email notifications for new messages
- File attachments in messages
- Ticket categories and priorities
- User dashboard to view their tickets
- Real-time updates using Supabase Realtime
