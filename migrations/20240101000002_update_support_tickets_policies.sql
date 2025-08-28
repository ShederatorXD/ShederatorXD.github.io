-- Update policies to allow admin users to access support tickets

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable update for ticket owners" ON public.support_tickets;

-- Create new policies
-- Allow admins to read all tickets
CREATE POLICY "Enable read access for admin users"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Allow admins to update all tickets
CREATE POLICY "Enable update for admin users"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Allow users to read their own tickets
CREATE POLICY "Enable read for ticket owners"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow users to update their own tickets
CREATE POLICY "Enable update for ticket owners"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow authenticated users to insert new tickets
CREATE POLICY "Enable insert for authenticated users"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);
