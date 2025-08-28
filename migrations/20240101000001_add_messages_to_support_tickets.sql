-- Add messages column to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN messages JSONB DEFAULT '[]'::jsonb;

-- Create a function to add a message to a ticket
CREATE OR REPLACE FUNCTION add_ticket_message(
  ticket_id BIGINT,
  sender_type TEXT,
  message_text TEXT,
  sender_id UUID DEFAULT NULL
) 
RETURNS JSONB AS $$
DECLARE
  new_message JSONB;
  updated_messages JSONB;
BEGIN
  -- Create the new message object
  new_message := jsonb_build_object(
    'id', gen_random_uuid(),
    'sender_type', sender_type,
    'sender_id', sender_id,
    'message', message_text,
    'created_at', NOW()
  );
  
  -- Append the new message to the messages array
  UPDATE support_tickets
  SET 
    messages = messages || new_message,
    updated_at = NOW()
  WHERE id = ticket_id
  RETURNING messages INTO updated_messages;
  
  RETURN updated_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy to allow admins to update tickets
CREATE POLICY "Enable update for admin users"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (auth.role() = 'service_role');

-- Create a policy to allow users to update their own tickets
CREATE POLICY "Enable update for ticket owners"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (email = auth.jwt() ->> 'email');
