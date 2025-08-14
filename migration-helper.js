// Migration Helper Script
// This script will help you run the migration using the Supabase JavaScript client

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://fctvityawavmuethxxix.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this

async function runMigration() {
  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('./run-migration.sql', 'utf8');
    
    console.log('Running migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('Error executing statement:', error);
          console.error('Statement:', statement);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Check if service role key is provided
if (!supabaseServiceKey) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('To get your service role key:');
  console.log('1. Go to https://supabase.com/dashboard/project/fctvityawavmuethxxix/settings/api');
  console.log('2. Copy the "service_role" key');
  console.log('3. Set it as an environment variable:');
  console.log('   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.log('4. Then run: node migration-helper.js');
} else {
  runMigration();
}
