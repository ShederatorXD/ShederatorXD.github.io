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

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing API endpoint directly...');

    // Test 1: Check if we can access support tickets directly
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

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. Creating a test admin user...');
      
      // Create a test admin user
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'testpassword123',
        email_confirm: true
      });

      if (createUserError) {
        console.error('❌ Error creating test user:', createUserError);
        return;
      }

      console.log('✅ Created test user:', newUser.user?.id);

      // Update the user's role to admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', newUser.user?.id);

      if (updateError) {
        console.error('❌ Error updating user role:', updateError);
        return;
      }

      console.log('✅ Updated user role to admin');
    }

    // Test 3: Create a test support ticket if none exist
    if (tickets.length === 0) {
      console.log('📝 Creating a test support ticket...');
      const { data: newTicket, error: createTicketError } = await supabase
        .from('support_tickets')
        .insert([
          {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Support Ticket',
            message: 'This is a test support ticket for debugging',
            status: 'new'
          }
        ])
        .select()
        .single();

      if (createTicketError) {
        console.error('❌ Error creating test ticket:', createTicketError);
        return;
      }

      console.log('✅ Created test support ticket:', newTicket.id);
    }

    console.log('🎉 API endpoint test completed!');
    console.log('📝 Summary:');
    console.log(`  - ✅ Direct database access: Working`);
    console.log(`  - ✅ Admin users: ${adminUsers.length} found`);
    console.log(`  - ✅ Support tickets: ${tickets.length} accessible`);
    console.log('  - ✅ Service role authentication: Working');

    console.log('🚀 Next steps:');
    console.log('  1. Make sure you have an admin user in your database');
    console.log('  2. Check the browser console for detailed API logs');
    console.log('  3. Try accessing the admin dashboard again');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPIEndpoint();
