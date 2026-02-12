/**
 * Deep Database Inspector - Messages & Threads
 * This script checks messages, RLS policies, and thread generation
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
  console.log('🔬 DEEP INSPECTION: Messages & Threads');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Count total messages in DB
  console.log('📊 Step 1: Counting messages in database...');
  const { count: messageCount, error: countError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Error counting messages:', countError.message);
  } else {
    console.log(`✅ Total messages in database: ${messageCount || 0}`);
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Step 2: Get all messages (if any)
  console.log('📧 Step 2: Fetching all messages...');
  const { data: allMessages, error: allMsgError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (allMsgError) {
    console.log('❌ Error fetching messages:', allMsgError.message);
  } else {
    console.log(`✅ Retrieved ${allMessages?.length || 0} message(s)`);
    if (allMessages && allMessages.length > 0) {
      console.log('\n   Messages:');
      allMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. [${msg.sender_type}] ${msg.content.substring(0, 50)}...`);
        console.log(`      Task: ${msg.task_id}`);
        console.log(`      Sender: ${msg.sender_id}`);
        console.log(`      Created: ${msg.created_at}`);
      });
    } else {
      console.log('   ⚠️  NO MESSAGES FOUND');
      console.log('   This is why threads are empty!');
    }
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Step 3: Check tasks that should have messages
  console.log('📋 Step 3: Checking tasks that should have messages...');
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, title, status, requester_id, agent_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (tasksErr) {
    console.log('❌ Error fetching tasks:', tasksErr.message);
  } else {
    console.log(`✅ Found ${tasks?.length || 0} task(s)\n`);
    
    if (tasks && tasks.length > 0) {
      console.log('   Checking which tasks have messages...\n');
      
      for (const task of tasks) {
        const { data: taskMsgs, error: taskMsgErr } = await supabase
          .from('messages')
          .select('id, content, sender_type')
          .eq('task_id', task.id);
        
        const msgCount = taskMsgs?.length || 0;
        const status = msgCount > 0 ? '✅' : '❌';
        
        console.log(`   ${status} Task: ${task.title}`);
        console.log(`      ID: ${task.id}`);
        console.log(`      Status: ${task.status}`);
        console.log(`      Messages: ${msgCount}`);
        console.log(`      Requester: ${task.requester_id}`);
        console.log(`      Agent: ${task.agent_id || 'None'}`);
        
        if (taskMsgs && taskMsgs.length > 0) {
          taskMsgs.forEach(msg => {
            console.log(`        - [${msg.sender_type}] ${msg.content.substring(0, 40)}...`);
          });
        }
        console.log('');
      }
    }
  }

  console.log('\n─────────────────────────────────────────────────────────\n');

  // Step 4: Test getThreads logic with a real user
  console.log('🧪 Step 4: Testing getThreads() logic...\n');
  
  // Get first profile as test user
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(1);

  if (profileErr || !profiles || profiles.length === 0) {
    console.log('⚠️  No profiles found. Cannot test getThreads.');
  } else {
    const testUserId = profiles[0].id;
    console.log(`   Testing with user: ${profiles[0].full_name || 'Unknown'}`);
    console.log(`   User ID: ${testUserId}\n`);
    
    // Simulate getThreads logic
    const { data: userTasks, error: userTasksErr } = await supabase
      .from('tasks')
      .select('id, title, task_type, status, agent_id, requester_id')
      .or(`agent_id.eq.${testUserId},requester_id.eq.${testUserId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (userTasksErr) {
      console.log('   ❌ Error fetching user tasks:', userTasksErr.message);
    } else {
      console.log(`   ✅ User has ${userTasks?.length || 0} task(s)\n`);
      
      if (userTasks && userTasks.length > 0) {
        const taskIds = userTasks.map(t => t.id);
        
        const { data: messages, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false });
        
        if (msgErr) {
          console.log('   ❌ Error fetching messages for tasks:', msgErr.message);
        } else {
          console.log(`   ✅ Found ${messages?.length || 0} message(s) for these tasks\n`);
          
          // Build threads
          const threads = userTasks.map(task => {
            const taskMessages = messages?.filter(m => m.task_id === task.id) || [];
            const latestMessage = taskMessages[0];
            const unreadCount = taskMessages.filter(
              m => !m.read_at && m.sender_id !== testUserId
            ).length;
            
            return {
              id: `contract-${task.id}`,
              task_id: task.id,
              task_title: task.title,
              task_type: task.task_type,
              last_message: latestMessage?.content || 'No messages yet',
              last_message_at: latestMessage?.created_at || task.status,
              unread_count: unreadCount,
              sender_type: latestMessage?.sender_type || 'system',
              task_status: task.status
            };
          });
          
          console.log('   📨 Generated Threads:\n');
          threads.forEach((thread, i) => {
            console.log(`   ${i + 1}. ${thread.task_title}`);
            console.log(`      Last message: ${thread.last_message.substring(0, 50)}...`);
            console.log(`      Unread: ${thread.unread_count}`);
            console.log(`      Type: ${thread.task_type}`);
            console.log('');
          });
        }
      } else {
        console.log('   ⚠️  User has no tasks. Inbox will be empty (except AI thread).');
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🏁 DEEP INSPECTION COMPLETE\n');
  
  console.log('📊 DIAGNOSIS:');
  console.log('─────────────────────────────────────────────────────────');
  if (messageCount === 0) {
    console.log('❌ PROBLEM: No messages in database');
    console.log('   SOLUTION: Run SETUP_INBOX_MESSAGES.sql to create');
    console.log('             initial system messages for existing tasks');
  } else {
    console.log('✅ Messages table has data');
    console.log('   If inbox still shows "failed", check:');
    console.log('   1. User authentication state');
    console.log('   2. RLS policies (user permissions)');
    console.log('   3. Frontend error logs in browser console');
  }
  console.log('─────────────────────────────────────────────────────────\n');
}

deepInspect().catch(console.error);
