-- Fix infinite recursion in profiles table RLS policies
-- The issue is that admin policies are trying to query profiles table
-- which is blocked by RLS, creating infinite recursion

-- First, disable RLS temporarily to fix the policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop the problematic admin policies
DROP POLICY IF EXISTS "Admins can view all wallet balances" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all wallet balances" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simpler policies that don't cause recursion
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- For admin access, we'll use a different approach
-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user email ends with @kiit.ac.in (admin domain)
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email LIKE '%@kiit.ac.in'
    );
END;
$$;

-- Create admin policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (is_admin());

-- Also fix the wallet_transactions admin policies to use the same approach
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can update all wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all wallet transactions" ON public.wallet_transactions
    FOR UPDATE USING (is_admin());

-- Fix support_tickets admin policies as well
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.support_tickets;

CREATE POLICY "Enable read access for admin users" ON public.support_tickets
    FOR SELECT USING (is_admin());

CREATE POLICY "Enable update for admin users" ON public.support_tickets
    FOR UPDATE USING (is_admin());

CREATE POLICY "Enable insert for admin users" ON public.support_tickets
    FOR INSERT WITH CHECK (is_admin());
