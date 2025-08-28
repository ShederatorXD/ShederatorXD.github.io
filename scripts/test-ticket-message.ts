import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Get environment variables with validation
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Error: ${name} is not set in .env file`);
    console.log('Please make sure your .env file has the following variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    process.exit(1);
  }
  return value;
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

console.log('🔑 Using Supabase URL:', supabaseUrl.replace(/\/.*$/, '/***'));
console.log('🔑 Using Service Role Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddMessage() {
  try {
    // First, create a test ticket if none exists
    const { data: existingTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .limit(1);

    let ticketId: number;

    if (existingTickets && existingTickets.length > 0) {
      ticketId = existingTickets[0].id;
      console.log(`Using existing ticket ID: ${ticketId}`);
    } else {
      const { data: newTicket, error: createError } = await supabase
        .from('support_tickets')
        .insert([
          {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Ticket',
            message: 'This is a test ticket',
            status: 'new'
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      ticketId = newTicket.id;
      console.log(`Created new test ticket with ID: ${ticketId}`);
    }

    // Test adding a message
    console.log('Testing add_ticket_message function...');
    const { data, error } = await supabase.rpc('add_ticket_message', {
      ticket_id: ticketId,
      sender_type: 'admin',
      message_text: 'This is a test message from admin',
      sender_id: null
    });

    if (error) {
      console.error('Error calling add_ticket_message:', error);
      return;
    }

    console.log('Success! Message added. Updated ticket data:', data);

    // Verify the message was added
    const { data: ticket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated ticket:', fetchError);
      return;
    }

    console.log('Updated ticket with messages:', ticket);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAddMessage();
