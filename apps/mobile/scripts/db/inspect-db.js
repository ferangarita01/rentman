/**
 * Supabase Database Inspector
 * This script checks the current state of the database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🔍 INSPECTING SUPABASE DATABASE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Check if messages table exists
  console.log('📋 TEST 1: Checking if messages table exists...');
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (messagesError) {
    console.log('❌ Messages table ERROR:');
    console.log('   Error code:', messagesError.code);
    console.log('   Error message:', messagesError.message);
    console.log('   Details:', messagesError.details);
    console.log('   Hint:', messagesError.hint);
    
    if (messagesError.message.includes('relation') && messagesError.message.includes('does not exist')) {
      console.log('\n⚠️  MESSAGES TABLE DOES NOT EXIST');
      console.log('   You need to run: SETUP_INBOX_MESSAGES.sql');
    }
  } else {
    console.log('✅ Messages table exists!');
    console.log(`   Found ${messages?.length || 0} message(s) in sample`);
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Test 2: Check tasks table
  console.log('📋 TEST 2: Checking tasks table...');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, status, created_at')
    .limit(5);

  if (tasksError) {
    console.log('❌ Tasks table ERROR:', tasksError.message);
  } else {
    console.log(`✅ Tasks table exists! Found ${tasks?.length || 0} task(s)`);
    if (tasks && tasks.length > 0) {
      console.log('\n   Sample tasks:');
      tasks.forEach((task, i) => {
        console.log(`   ${i + 1}. [${task.status}] ${task.title}`);
        console.log(`      ID: ${task.id}`);
      });
    }
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Test 3: Check profiles table
  console.log('📋 TEST 3: Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, settings')
    .limit(3);

  if (profilesError) {
    console.log('❌ Profiles table ERROR:', profilesError.message);
  } else {
    console.log(`✅ Profiles table exists! Found ${profiles?.length || 0} profile(s)`);
    if (profiles && profiles.length > 0) {
      console.log('\n   Sample profiles:');
      profiles.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.full_name || 'No name'}`);
        console.log(`      Has settings: ${profile.settings ? 'Yes' : 'No'}`);
      });
    }
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Test 4: Try to get threads (simulating the app logic)
  console.log('📋 TEST 4: Simulating getThreads() logic...');
  
  // First get a user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.log('⚠️  No authenticated user. Skipping thread simulation.');
    console.log('   (This is expected when running from CLI)');
  } else {
    const userId = userData.user.id;
    console.log(`   User ID: ${userId}`);
    
    // Try to get tasks for this user
    const { data: userTasks, error: userTasksError } = await supabase
      .from('tasks')
      .select('id, title, task_type, status')
      .or(`agent_id.eq.${userId},requester_id.eq.${userId}`)
      .limit(5);
    
    if (userTasksError) {
      console.log('❌ Error fetching user tasks:', userTasksError.message);
    } else {
      console.log(`✅ Found ${userTasks?.length || 0} task(s) for user`);
      
      if (userTasks && userTasks.length > 0) {
        // Try to get messages for these tasks
        const taskIds = userTasks.map(t => t.id);
        const { data: taskMessages, error: taskMessagesError } = await supabase
          .from('messages')
          .select('*')
          .in('task_id', taskIds);
        
        if (taskMessagesError) {
          console.log('❌ Error fetching messages:', taskMessagesError.message);
        } else {
          console.log(`✅ Found ${taskMessages?.length || 0} message(s) for tasks`);
        }
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🏁 INSPECTION COMPLETE\n');
  
  // Summary
  console.log('📊 SUMMARY:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Messages table: ${messagesError ? '❌ MISSING' : '✅ EXISTS'}`);
  console.log(`Tasks table:    ${tasksError ? '❌ ERROR' : '✅ EXISTS'}`);
  console.log(`Profiles table: ${profilesError ? '❌ ERROR' : '✅ EXISTS'}`);
  console.log('─────────────────────────────────────────────────────────\n');
  
  if (messagesError && messagesError.message.includes('does not exist')) {
    console.log('🔧 NEXT STEPS:');
    console.log('1. Open Supabase Dashboard SQL Editor');
    console.log('2. Copy and paste: SETUP_INBOX_MESSAGES.sql');
    console.log('3. Execute the script');
    console.log('4. Re-run this inspector to verify\n');
  }
}

inspectDatabase().catch(console.error);
