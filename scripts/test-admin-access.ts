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

async function testAdminAccess() {
  try {
    console.log('🧪 Testing admin access to support tickets...');

    // First, create a test ticket
    const { data: newTicket, error: createError } = await supabase
      .from('support_tickets')
      .insert([
        {
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Test Ticket for Admin Access',
          message: 'This is a test ticket to verify admin access',
          status: 'new'
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating test ticket:', createError);
      return;
    }

    console.log(`✅ Created test ticket with ID: ${newTicket.id}`);

    // Test fetching all tickets (admin should be able to see this)
    const { data: tickets, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching tickets:', fetchError);
      return;
    }

    console.log(`✅ Successfully fetched ${tickets.length} tickets`);
    console.log('📋 Tickets found:');
    tickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. ID: ${ticket.id}, Subject: ${ticket.subject}, Status: ${ticket.status}`);
    });

    // Test fetching specific ticket
    const { data: specificTicket, error: specificError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', newTicket.id)
      .single();

    if (specificError) {
      console.error('❌ Error fetching specific ticket:', specificError);
      return;
    }

    console.log(`✅ Successfully fetched specific ticket: ${specificTicket.subject}`);

    // Test updating ticket status
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update({ status: 'in_progress' })
      .eq('id', newTicket.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating ticket:', updateError);
      return;
    }

    console.log(`✅ Successfully updated ticket status to: ${updatedTicket.status}`);

    // Test adding a message
    const { data: messageData, error: messageError } = await supabase.rpc('add_ticket_message', {
      ticket_id: newTicket.id,
      sender_type: 'admin',
      message_text: 'Test admin message',
      sender_id: null
    });

    if (messageError) {
      console.error('❌ Error adding message:', messageError);
      return;
    }

    console.log('✅ Successfully added admin message to ticket');

    console.log('🎉 All admin access tests passed!');
    console.log('📝 Summary:');
    console.log('  - ✅ Can create tickets');
    console.log('  - ✅ Can fetch all tickets');
    console.log('  - ✅ Can fetch specific tickets');
    console.log('  - ✅ Can update ticket status');
    console.log('  - ✅ Can add messages to tickets');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAccess();
