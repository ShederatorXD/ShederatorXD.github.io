#!/usr/bin/env node

/**
 * Fix EcoRewards System Database Issues
 * 
 * This script helps you fix the database issues that are causing:
 * - Admin can't create rewards
 * - Book-ride gets stuck at "booking..."
 * - Rewards don't display properly
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 EcoRewards System Database Fix');
console.log('=====================================\n');

console.log('🚨 Current Issues Detected:');
console.log('1. reward_redemptions.reward_id is integer but should be uuid');
console.log('2. Missing foreign key constraints');
console.log('3. Database constraint violations causing book-ride to fail\n');

console.log('📋 To Fix These Issues:');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Navigate to SQL Editor');
console.log('4. Copy the migration file: migrations/20240101000006_fix_rewards_system.sql');
console.log('5. Paste and execute the SQL\n');

console.log('📁 Migration File Location:');
const migrationPath = path.join(__dirname, '../migrations/20240101000006_fix_rewards_system.sql');
if (fs.existsSync(migrationPath)) {
  console.log(`✅ Found: ${migrationPath}`);
  console.log('\n📖 Migration File Contents:');
  console.log('=====================================');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  console.log(migrationContent);
  console.log('=====================================');
} else {
  console.log(`❌ Not found: ${migrationPath}`);
  console.log('Please check if the migration file exists.');
}

console.log('\n🎯 What This Fix Will Do:');
console.log('✅ Fix reward_redemptions table structure');
console.log('✅ Add missing columns to rewards table');
console.log('✅ Create user_rewards table for tracking');
console.log('✅ Insert default rewards');
console.log('✅ Set up proper foreign key constraints');
console.log('✅ Enable RLS security policies');
console.log('✅ Ensure each user gets each reward only once\n');

console.log('⚠️  Important Notes:');
console.log('- This will drop and recreate the reward_redemptions table');
console.log('- Any existing redemption data will be lost');
console.log('- Make sure you have admin access to your Supabase project');
console.log('- Backup your data if needed\n');

console.log('🚀 After Running the Migration:');
console.log('1. Test admin reward creation at /dashboard/admin');
console.log('2. Check rewards display at /dashboard/ecopoints');
console.log('3. Test book-ride functionality');
console.log('4. Verify all database constraints are working\n');

console.log('📞 Need Help?');
console.log('- Check the detailed guide: docs/FIX_REWARDS_MIGRATION.md');
console.log('- Look for error messages in the browser console');
console.log('- Verify your environment variables are set correctly\n');

console.log('✨ Good luck! This should fix your EcoRewards system.');
