/**
 * Table Structure Inspector
 * Shows actual column names in tasks table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTableStructure() {
  console.log('🔍 INSPECTING TASKS TABLE STRUCTURE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get one task with all columns
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log('⚠️  No tasks found in database');
    return;
  }

  const task = tasks[0];
  const columns = Object.keys(task);

  console.log('📋 Available columns in tasks table:\n');
  columns.forEach((col, i) => {
    const value = task[col];
    const type = typeof value;
    const preview = type === 'string' && value.length > 50 
      ? value.substring(0, 47) + '...'
      : String(value);
    
    console.log(`   ${i + 1}. ${col}`);
    console.log(`      Type: ${type}`);
    console.log(`      Sample: ${preview}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('🔍 COLUMN MAPPING ANALYSIS:\n');
  console.log('   Looking for user/agent columns...\n');
  
  const userColumns = columns.filter(c => 
    c.includes('user') || 
    c.includes('agent') || 
    c.includes('requester') ||
    c.includes('created_by') ||
    c.includes('assigned')
  );
  
  if (userColumns.length > 0) {
    console.log('   ✅ Found user-related columns:');
    userColumns.forEach(col => {
      console.log(`      - ${col} = ${task[col]}`);
    });
  } else {
    console.log('   ❌ No obvious user/agent columns found');
    console.log('      Need to check database schema documentation');
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
}

inspectTableStructure().catch(console.error);
