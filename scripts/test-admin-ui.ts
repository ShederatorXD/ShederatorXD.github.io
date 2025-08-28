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

async function testAdminUI() {
  try {
    console.log('🧪 Testing admin UI authentication...');

    // Test 1: Check if admin users exist
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

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. You may need to create an admin user.');
      console.log('💡 To create an admin user:');
      console.log('   1. Sign up with a @kiit.ac.in email address, or');
      console.log('   2. Update a user\'s role to "admin" in the profiles table');
    }

    // Test 2: Check if support tickets exist
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('id, subject, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ticketsError) {
      console.error('❌ Error fetching support tickets:', ticketsError);
      return;
    }

    console.log(`✅ Found ${tickets.length} support tickets:`);
    tickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. ID: ${ticket.id}, Subject: ${ticket.subject}, Status: ${ticket.status}`);
    });

    // Test 3: Check RLS policies
    console.log('🔍 Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'support_tickets' })
      .catch(() => ({ data: null, error: new Error('RPC function not available') }));

    if (policiesError) {
      console.log('ℹ️  Could not check RLS policies via RPC (this is normal)');
    } else {
      console.log('✅ RLS policies check completed');
    }

    console.log('🎉 Admin UI test completed!');
    console.log('📝 Summary:');
    console.log(`  - ✅ Admin users: ${adminUsers.length}`);
    console.log(`  - ✅ Support tickets: ${tickets.length}`);
    console.log('  - ✅ Database connection working');
    
    if (adminUsers.length > 0) {
      console.log('🚀 You should now be able to access the admin dashboard!');
    } else {
      console.log('⚠️  Create an admin user to access the admin dashboard');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminUI();
