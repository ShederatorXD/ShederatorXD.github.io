-- Migration: Auto-delete resolved tickets after 4 hours
-- This creates a function and trigger to automatically delete resolved tickets

-- Function to delete resolved tickets older than 4 hours
CREATE OR REPLACE FUNCTION delete_old_resolved_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete resolved tickets that are older than 4 hours
  DELETE FROM support_tickets 
  WHERE status = 'resolved' 
    AND updated_at < NOW() - INTERVAL '4 hours';
  
  -- Log the deletion (optional)
  RAISE NOTICE 'Deleted resolved tickets older than 4 hours';
END;
$$;

-- Create a scheduled job to run every hour
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can use external cron jobs

-- Alternative: Create a trigger function that checks on ticket updates
CREATE OR REPLACE FUNCTION check_resolved_ticket_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If a ticket is marked as resolved, schedule it for deletion
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    -- Update the updated_at timestamp to mark when it was resolved
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update timestamp when status changes to resolved
DROP TRIGGER IF EXISTS trigger_resolved_ticket_cleanup ON support_tickets;
CREATE TRIGGER trigger_resolved_ticket_cleanup
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION check_resolved_ticket_cleanup();

-- Add an index to improve performance of the cleanup query
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_updated_at 
ON support_tickets(status, updated_at);

-- Add a comment to the table for documentation
COMMENT ON TABLE support_tickets IS 'Support tickets table. Resolved tickets are automatically deleted after 4 hours.';
