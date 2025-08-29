# Fix EcoRewards System - Quick Migration Guide

## 🚨 Current Issues

Your database has these problems:
1. **`reward_redemptions.reward_id`** is `integer` but should be `uuid` (references `rewards.id`)
2. **Missing foreign key constraints** causing database errors
3. **Book-ride stuck at "booking..."** due to database constraint violations

## 🔧 Quick Fix

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**

### Step 2: Run the Fix Migration
Copy and paste the entire content of `migrations/20240101000006_fix_rewards_system.sql` into the SQL Editor and execute it.

**This will:**
- ✅ Fix the `reward_redemptions` table structure
- ✅ Add missing columns to `rewards` table
- ✅ Create `user_rewards` table for tracking user rewards
- ✅ Insert default rewards
- ✅ Set up proper foreign key constraints
- ✅ Enable RLS security policies

### Step 3: Verify the Fix
After running the migration, test:

1. **Admin Panel**: Go to `/dashboard/admin` and try creating a new reward
2. **EcoPoints Page**: Go to `/dashboard/ecopoints` and check if rewards display
3. **Book Ride**: Try booking a ride to see if it completes successfully

## 🎯 What This Fixes

- **Admin can create rewards** → They will appear in the rewards store
- **Book-ride no longer stuck** → Database constraints are properly set
- **Rewards display correctly** → Proper table structure and relationships
- **Each user gets each reward once** → Unique constraint on `(user_id, reward_id)`

## 🚨 If Migration Fails

If you get permission errors, you may need to:

1. **Check your service role key** in `.env.local`
2. **Run as admin user** in Supabase
3. **Drop and recreate tables manually** (see alternative approach below)

## 🔄 Alternative Manual Approach

If the migration fails, you can fix it step by step:

```sql
-- 1. Drop the problematic table
DROP TABLE IF EXISTS public.reward_redemptions CASCADE;

-- 2. Recreate with correct structure
CREATE TABLE public.reward_redemptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    points_spent integer NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id),
    CONSTRAINT reward_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT reward_redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE
);

-- 3. Add missing columns to rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS max_redemptions integer DEFAULT -1;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 4. Create user_rewards table
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    is_unlocked boolean DEFAULT false,
    unlocked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_rewards_pkey PRIMARY KEY (id),
    CONSTRAINT user_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE,
    UNIQUE(user_id, reward_id)
);

-- 5. Insert default rewards
INSERT INTO public.rewards (title, description, points, category, is_active) VALUES
    ('Free Coffee at CCD', 'Enjoy a free coffee at any CCD outlet', 200, 'Food & Beverage', true),
    ('₹50 Ride Discount', 'Get ₹50 off your next ride', 500, 'Transport', true),
    ('Plant a Tree Donation', 'We''ll plant a tree in your name', 1000, 'Environment', true),
    ('Premium Features Access', 'Unlock premium features for 1 month', 1500, 'Premium', true),
    ('Eco Shopping Voucher', '₹100 voucher for sustainable products', 800, 'Shopping', true),
    ('Community Badge', 'Special badge for your profile', 300, 'Recognition', true),
    ('Weekly Impact Report', 'Detailed weekly environmental impact report', 400, 'Insights', true),
    ('Priority Support', 'Get priority customer support for 1 month', 600, 'Support', true)
ON CONFLICT DO NOTHING;
```

## ✅ After Fix

1. **Test admin reward creation** - should work and display in rewards store
2. **Test book-ride** - should complete successfully without getting stuck
3. **Check ecopoints page** - rewards should display properly
4. **Verify database** - all tables should have proper constraints

## 🆘 Still Having Issues?

Check the browser console for specific error messages and ensure:
- All environment variables are set correctly
- You have admin access to your Supabase project
- The migration ran without errors

---

**Migration File**: `migrations/20240101000006_fix_rewards_system.sql`  
**Created**: January 2025  
**Purpose**: Fix existing rewards system database issues
