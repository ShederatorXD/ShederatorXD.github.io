const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://ewrxanqszaoqtgjhreje.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cnhhbnFzemFvcXRnamhyZWplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEyNDE3MSwiZXhwIjoyMDcxNzAwMTcxfQ.UBoEDnMVjqDBR9-rbSa6BgfvnROjEu9CCrj7Dn85Fm4';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixDatabase() {
  try {
    console.log('Fixing database policies...');
    
    // Read the migration file
    const sql = fs.readFileSync('./migrations/fix_profiles_policies.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { query: statement });
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
      }
    }
    
    console.log('Database fix completed!');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

fixDatabase();
