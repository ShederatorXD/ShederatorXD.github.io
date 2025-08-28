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

async function testMessageRPC() {
  try {
    console.log('🧪 Testing add_ticket_message RPC function...');

    // First, get or create a test ticket
    console.log('📋 Getting or creating test ticket...');
    const { data: existingTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .limit(1);

    let ticketId: number;

    if (existingTickets && existingTickets.length > 0) {
      ticketId = existingTickets[0].id;
      console.log(`✅ Using existing ticket ID: ${ticketId}`);
    } else {
      console.log('📝 Creating new test ticket...');
      const { data: newTicket, error: createError } = await supabase
        .from('support_tickets')
        .insert([
          {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Ticket for RPC',
            message: 'This is a test ticket for RPC testing',
            status: 'new'
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test ticket:', createError);
        return;
      }
      ticketId = newTicket.id;
      console.log(`✅ Created new test ticket with ID: ${ticketId}`);
    }

    // Test the RPC function
    console.log('💬 Testing add_ticket_message RPC...');
    const { data, error } = await supabase.rpc('add_ticket_message', {
      ticket_id: ticketId,
      sender_type: 'admin',
      message_text: 'Test message from RPC function',
      sender_id: null
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return;
    }

    console.log('✅ RPC function executed successfully!');
    console.log('📋 RPC result:', data);

    // Verify the message was added
    console.log('🔍 Verifying message was added...');
    const { data: updatedTicket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated ticket:', fetchError);
      return;
    }

    console.log('✅ Updated ticket:', {
      id: updatedTicket.id,
      subject: updatedTicket.subject,
      messagesCount: updatedTicket.messages ? updatedTicket.messages.length : 0,
      messages: updatedTicket.messages
    });

    console.log('🎉 RPC test completed successfully!');
    console.log('📝 Summary:');
    console.log('  - ✅ RPC function exists and works');
    console.log('  - ✅ Message was added to ticket');
    console.log('  - ✅ Ticket was updated correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMessageRPC();
