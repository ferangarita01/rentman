import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n🔍 RENTMAN DATABASE AUDIT\n');
  console.log('=' .repeat(60));
  
  // Get all tasks
  console.log(`\n📊 ALL TASKS IN DATABASE:`);
  console.log('-'.repeat(60));
  
  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (tasksError) {
    console.log('❌ Error:', tasksError.message);
  } else {
    console.log(`✅ Found ${allTasks.length} tasks\n`);
    allTasks.forEach((task, i) => {
      console.log(`\n--- TASK ${i + 1} ---`);
      console.log(`ID: ${task.id}`);
      console.log(`Title: ${task.title}`);
      console.log(`Description: ${task.description}`);
      console.log(`Type: ${task.task_type}`);
      console.log(`Budget: ${task.budget_amount} ${task.budget_currency}`);
      console.log(`Status: ${task.status}`);
      console.log(`Location: ${task.location_address || 'N/A'}`);
      console.log(`Created: ${task.created_at}`);
    });
  }
  
  // Get all profiles
  console.log(`\n\n📊 ALL PROFILES IN DATABASE:`);
  console.log('-'.repeat(60));
  
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    console.log('❌ Error:', profilesError.message);
  } else {
    console.log(`✅ Found ${allProfiles.length} profiles\n`);
    allProfiles.forEach((profile, i) => {
      console.log(`\n--- PROFILE ${i + 1} ---`);
      console.log(`ID: ${profile.id}`);
      console.log(`Email: ${profile.email}`);
      console.log(`Name: ${profile.full_name || 'N/A'}`);
      console.log(`Credits: ${profile.credits}`);
      console.log(`Is Agent: ${profile.is_agent}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Database audit complete\n');
}

checkDatabase().catch(console.error);
