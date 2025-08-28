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

async function testSession() {
  try {
    console.log('🧪 Testing session authentication...');

    // Test 1: Check if we can access support tickets with service role
    console.log('📋 Testing direct database access...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ticketsError) {
      console.error('❌ Error accessing support tickets:', ticketsError);
      return;
    }

    console.log(`✅ Successfully accessed ${tickets.length} support tickets directly`);

    // Test 2: Check admin users
    console.log('👥 Checking admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Test 3: Test RPC function
    if (tickets.length > 0) {
      console.log('💬 Testing add_ticket_message RPC...');
      const { data: messageData, error: messageError } = await supabase.rpc('add_ticket_message', {
        ticket_id: tickets[0].id,
        sender_type: 'admin',
        message_text: 'Test message from service role',
        sender_id: null
      });

      if (messageError) {
        console.error('❌ Error testing RPC:', messageError);
      } else {
        console.log('✅ RPC function working correctly');
      }
    }

    console.log('🎉 Session test completed!');
    console.log('📝 Summary:');
    console.log(`  - ✅ Direct database access: Working`);
    console.log(`  - ✅ Admin users: ${adminUsers.length} found`);
    console.log(`  - ✅ Support tickets: ${tickets.length} accessible`);
    console.log('  - ✅ Service role authentication: Working');

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. You may need to:');
      console.log('   1. Sign up with a @kiit.ac.in email address, or');
      console.log('   2. Update a user\'s role to "admin" in the profiles table');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSession();
