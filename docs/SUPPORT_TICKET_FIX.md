# Support Ticket Admin Access Fix

## Problem
Support tickets were not visible to admin users in the admin dashboard. This was caused by Row Level Security (RLS) policies that were too restrictive.

## Root Cause
The original RLS policy only allowed access when `auth.role() = 'service_role'`, but the admin API endpoints were using the authenticated user's session, not the service role.

## Solution
1. **Updated RLS Policies**: Created new policies that allow admin users to access support tickets based on their role in the `profiles` table.

2. **Fixed API Endpoints**: Updated all admin API endpoints to properly authenticate admin users and use the correct Supabase client.

## Changes Made

### 1. Database Migration (`migrations/20240101000002_fix_admin_access.sql`)
- Dropped the restrictive RLS policy
- Created new policies that check for admin role in the profiles table
- Added policies for SELECT, UPDATE, and INSERT operations

### 2. API Endpoints Updated
- `app/api/admin/support-tickets/route.ts`: Added proper admin authentication
- `app/api/admin/support-tickets/[id]/route.ts`: Added admin authentication to GET and PATCH methods
- `app/api/admin/support-tickets/[id]/message/route.ts`: Updated to use proper authentication

### 3. Test Scripts
- `scripts/test-admin-access.ts`: Comprehensive test to verify admin access
- `scripts/test-ticket-message.ts`: Test for message functionality

## How to Apply the Fix

1. **Run the Database Migration**:
   ```sql
   -- Execute the migration file in your Supabase SQL editor
   -- or run it via the Supabase CLI
   ```

2. **Deploy the Updated API Endpoints**:
   - The API endpoints have been updated to use proper authentication
   - No additional configuration needed

3. **Test the Fix**:
   ```bash
   # Run the test script to verify admin access
   npx tsx scripts/test-admin-access.ts
   ```

## Verification
After applying the fix, admin users should be able to:
- ✅ View all support tickets in the admin dashboard
- ✅ View individual ticket details
- ✅ Update ticket status
- ✅ Add messages to tickets
- ✅ Search and filter tickets

## Security Notes
- The fix maintains security by checking admin role in the profiles table
- RLS policies ensure only authenticated admin users can access tickets
- All API endpoints verify admin authentication before allowing access

## Troubleshooting
If admin users still can't see tickets:

1. **Check User Role**: Ensure the user has `role = 'admin'` in the profiles table
2. **Verify Authentication**: Check that the user is properly authenticated
3. **Check RLS Policies**: Verify the new policies are applied in Supabase
4. **Test with Service Role**: Use the test script to verify database access

## Related Files
- `components/admin-support-tickets.tsx`: Admin UI component
- `app/dashboard/admin/page.tsx`: Admin dashboard page
- `app/api/support/route.ts`: Public support ticket creation
- `lib/database.types.ts`: TypeScript database types
