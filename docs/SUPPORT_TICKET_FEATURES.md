# Support Ticket Features

## Overview
This document describes the new support ticket features implemented in the application.

## Features

### 1. User Ticket Viewing
Users can now view their own support tickets in the support section.

**Location**: `/dashboard/support` → "My Tickets" tab

**Features**:
- View all tickets submitted by the user's email
- See ticket status, creation date, and last update
- View detailed ticket information including messages
- Real-time updates when new tickets are submitted

**API Endpoint**: `GET /api/support/user-tickets?email={user_email}`

### 2. Auto-Deletion of Resolved Tickets
Resolved tickets are automatically deleted after 4 hours to keep the database clean.

**Implementation**:
- Database function: `delete_old_resolved_tickets()`
- Trigger: `trigger_resolved_ticket_cleanup` (updates timestamp when status changes to resolved)
- API endpoint: `POST /api/admin/cleanup-resolved-tickets`
- Cron job script: `scripts/cleanup-resolved-tickets.js`

**Database Migration**: `migrations/20240101000003_auto_delete_resolved_tickets.sql`

## Setup Instructions

### 1. Database Migration
Run the migration to add auto-deletion functionality:

```sql
-- This is handled by the migration file
-- Creates functions, triggers, and indexes for ticket cleanup
```

### 2. Cron Job Setup
Set up a cron job to run the cleanup script every hour:

```bash
# Add to crontab (crontab -e)
0 * * * * cd /path/to/your/app && npm run cleanup-tickets
```

Or use the provided script directly:

```bash
# Manual execution
npm run cleanup-tickets

# Direct script execution
node scripts/cleanup-resolved-tickets.js
```

### 3. Environment Variables
Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=your_app_url
```

## API Endpoints

### User Tickets
- **GET** `/api/support/user-tickets?email={email}`
  - Returns all tickets for a specific email
  - No authentication required (uses service role)

### Cleanup
- **POST** `/api/admin/cleanup-resolved-tickets`
  - Deletes resolved tickets older than 4 hours
  - Returns count of deleted tickets

- **GET** `/api/admin/cleanup-resolved-tickets`
  - Lists resolved tickets older than 4 hours (without deleting)
  - Useful for testing and monitoring

## User Interface

### Support Page Layout
The support page now has two tabs:

1. **FAQ & Contact** (existing functionality)
   - FAQ section
   - Contact form (pre-filled with user data)
   - EcoBot chat assistant
   - Support status and contact info

2. **My Tickets** (new functionality)
   - List of user's tickets
   - Ticket details view
   - Status badges and timestamps

### Contact Form Improvements
- Auto-fills user name and email when logged in
- Refreshes ticket list after successful submission
- Better error handling and success messages

## Technical Details

### Database Schema
The `support_tickets` table includes:
- `id`: Primary key
- `name`, `email`, `subject`, `message`: Ticket details
- `status`: 'new', 'in_progress', 'resolved', 'closed'
- `created_at`, `updated_at`: Timestamps
- `messages`: JSONB array of conversation messages

### Auto-Deletion Logic
1. When a ticket status changes to 'resolved', the `updated_at` timestamp is updated
2. The cleanup function deletes tickets where:
   - `status = 'resolved'`
   - `updated_at < NOW() - INTERVAL '4 hours'`

### Performance Optimizations
- Index on `(status, updated_at)` for efficient cleanup queries
- Service role client for bypassing RLS policies
- Batch deletion for better performance

## Monitoring and Maintenance

### Check Cleanup Status
```bash
# Check how many tickets would be deleted
curl "https://your-app.com/api/admin/cleanup-resolved-tickets"

# Run cleanup manually
curl -X POST "https://your-app.com/api/admin/cleanup-resolved-tickets"
```

### Logs
The cleanup script logs:
- Timestamp of execution
- Number of tickets deleted
- Success/failure status
- Error messages if any

### Manual Cleanup
If needed, you can manually clean up tickets:

```sql
-- Check old resolved tickets
SELECT id, subject, updated_at 
FROM support_tickets 
WHERE status = 'resolved' 
  AND updated_at < NOW() - INTERVAL '4 hours';

-- Delete old resolved tickets
DELETE FROM support_tickets 
WHERE status = 'resolved' 
  AND updated_at < NOW() - INTERVAL '4 hours';
```

## Troubleshooting

### Common Issues

1. **Cleanup not running**
   - Check cron job is properly configured
   - Verify environment variables are set
   - Check application logs for errors

2. **Tickets not showing for user**
   - Verify user email matches ticket email
   - Check API endpoint is accessible
   - Ensure service role key has proper permissions

3. **Auto-deletion not working**
   - Verify database migration was applied
   - Check trigger function exists
   - Ensure cleanup script has proper permissions

### Debug Commands
```bash
# Test cleanup endpoint
curl -X GET "https://your-app.com/api/admin/cleanup-resolved-tickets"

# Test user tickets endpoint
curl "https://your-app.com/api/support/user-tickets?email=user@example.com"

# Run cleanup manually
npm run cleanup-tickets
```
