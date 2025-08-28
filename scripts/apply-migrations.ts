import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function applyMigrations() {
  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get migration filename from command line argument
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Please provide a migration filename as argument');
    console.error('Usage: npx ts-node scripts/apply-migrations.ts <migration-file>');
    process.exit(1);
  }

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Applying migration: ${migrationFile}`);
  
  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
    process.exit(1);
  }
}

applyMigrations();
