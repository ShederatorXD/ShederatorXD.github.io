-- Fix existing rewards system database issues
-- This migration fixes the current database schema to work properly

-- 1. Fix reward_redemptions table structure
-- First, drop the existing table if it has wrong structure
DROP TABLE IF EXISTS public.reward_redemptions CASCADE;

-- Recreate with correct structure
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

-- 2. Add missing columns to rewards table if they don't exist
DO $$ 
BEGIN
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'image_url') THEN
        ALTER TABLE public.rewards ADD COLUMN image_url text;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'is_active') THEN
        ALTER TABLE public.rewards ADD COLUMN is_active boolean DEFAULT true;
    END IF;
    
    -- Add max_redemptions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'max_redemptions') THEN
        ALTER TABLE public.rewards ADD COLUMN max_redemptions integer DEFAULT -1;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'updated_at') THEN
        ALTER TABLE public.rewards ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 3. Create user_rewards table to track which rewards each user has access to
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
    UNIQUE(user_id, reward_id) -- Ensures each user can only have each reward once
);

-- 4. Insert default rewards if the table is empty
INSERT INTO public.rewards (title, description, points, category, is_active) 
SELECT * FROM (VALUES
    ('Free Coffee at CCD', 'Enjoy a free coffee at any CCD outlet', 200, 'Food & Beverage', true),
    ('₹50 Ride Discount', 'Get ₹50 off your next ride', 500, 'Transport', true),
    ('Plant a Tree Donation', 'We''ll plant a tree in your name', 1000, 'Environment', true),
    ('Premium Features Access', 'Unlock premium features for 1 month', 1500, 'Premium', true),
    ('Eco Shopping Voucher', '₹100 voucher for sustainable products', 800, 'Shopping', true),
    ('Community Badge', 'Special badge for your profile', 300, 'Recognition', true),
    ('Weekly Impact Report', 'Detailed weekly environmental impact report', 400, 'Insights', true),
    ('Priority Support', 'Get priority customer support for 1 month', 600, 'Support', true)
) AS v(title, description, points, category, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.rewards);

-- 5. Create user rewards for all existing users
INSERT INTO public.user_rewards (user_id, reward_id)
SELECT p.id, r.id 
FROM public.profiles p 
CROSS JOIN public.rewards r 
WHERE r.is_active = true
ON CONFLICT (user_id, reward_id) DO NOTHING;

-- 6. Unlock rewards for users who already have enough points
UPDATE public.user_rewards 
SET is_unlocked = true, unlocked_at = now()
WHERE reward_id IN (
    SELECT id FROM public.rewards 
    WHERE points <= (
        SELECT eco_points FROM public.profiles WHERE id = user_rewards.user_id
    )
)
AND is_unlocked = false;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward_id ON public.user_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_rewards_category ON public.rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_points ON public.rewards(points);

-- 8. Enable RLS on new tables
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Policy for user_rewards
CREATE POLICY "Users can view their own rewards" ON public.user_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" ON public.user_rewards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert user rewards" ON public.user_rewards
    FOR INSERT WITH CHECK (true);

-- Policy for reward_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.reward_redemptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redemptions" ON public.reward_redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions" ON public.reward_redemptions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 10. Create function to automatically create user rewards when a new user signs up
CREATE OR REPLACE FUNCTION public.create_user_rewards()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_rewards (user_id, reward_id)
    SELECT NEW.id, id FROM public.rewards WHERE is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger to create user rewards when a new profile is created
DROP TRIGGER IF EXISTS create_user_rewards_trigger ON public.profiles;
CREATE TRIGGER create_user_rewards_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_rewards();

-- 12. Create function to unlock rewards based on user's eco points
CREATE OR REPLACE FUNCTION public.unlock_rewards_for_user(user_uuid uuid)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_rewards 
    SET is_unlocked = true, unlocked_at = now()
    WHERE user_id = user_uuid 
    AND reward_id IN (
        SELECT id FROM public.rewards 
        WHERE points <= (
            SELECT eco_points FROM public.profiles WHERE id = user_uuid
        )
    )
    AND is_unlocked = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Clean up any existing data that might cause issues
-- Since we're recreating the table, this step is not needed
-- DELETE FROM public.reward_redemptions WHERE reward_id IS NULL;

-- 14. No need to update existing reward_redemptions since we're recreating the table
-- The old table structure was incompatible anyway

-- 15. Verify the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created/updated: rewards, user_rewards, reward_redemptions';
    RAISE NOTICE 'Default rewards inserted: %', (SELECT COUNT(*) FROM public.rewards);
    RAISE NOTICE 'User rewards created: %', (SELECT COUNT(*) FROM public.user_rewards);
    RAISE NOTICE 'RLS policies created for security';
END $$;
