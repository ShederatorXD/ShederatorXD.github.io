-- Fix RLS policies to allow admin users to access support tickets
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for admin users" ON public.support_tickets;

-- Create a new policy that allows admin users to read all tickets
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

-- Create a policy that allows admin users to update tickets
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

-- Create a policy that allows admin users to insert messages (via RPC)
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

-- Also ensure we have a policy for regular users to create tickets
CREATE POLICY IF NOT EXISTS "Enable insert for all users"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);
