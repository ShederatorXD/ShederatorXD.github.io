-- Simple fix for admin access to support tickets
-- Run this in your Supabase SQL editor

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'support_tickets';

-- Drop any existing admin policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.support_tickets;

-- Create new admin policies
CREATE POLICY "Enable read access for admin users"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable update for admin users"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable insert for admin users"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Ensure regular users can still create tickets
CREATE POLICY "Enable insert for all users"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'support_tickets';
