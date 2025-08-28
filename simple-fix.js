const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ewrxanqszaoqtgjhreje.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cnhhbnFzemFvcXRnamhyZWplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEyNDE3MSwiZXhwIjoyMDcxNzAwMTcxfQ.UBoEDnMVjqDBR9-rbSa6BgfvnROjEu9CCrj7Dn85Fm4';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function simpleFix() {
  try {
    console.log('Applying simple fix to enable authentication...');
    
    // Test the current connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('Current error:', testError.message);
      
      // Try to disable RLS temporarily
      console.log('Attempting to disable RLS on profiles table...');
      
      // Since we can't use exec_sql, let's try a different approach
      // We'll use the REST API to modify the table
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({
          query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
        })
      });
      
      if (response.ok) {
        console.log('Successfully disabled RLS on profiles table');
      } else {
        console.log('Failed to disable RLS via REST API');
        
        // Alternative approach: try to create a simple policy that doesn't cause recursion
        console.log('Trying alternative approach...');
        
        // Test if we can at least query the table with service role
        const { data: serviceData, error: serviceError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (serviceError) {
          console.log('Service role query error:', serviceError.message);
        } else {
          console.log('Service role can query profiles table successfully');
        }
      }
    } else {
      console.log('Profiles table is accessible!');
    }
    
  } catch (error) {
    console.error('Error in simple fix:', error);
  }
}

simpleFix();
