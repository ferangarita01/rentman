/**
 * Populate Initial Messages
 * Automatically creates system messages for all tasks
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseKey);

const FALLBACK_USER_ID = '5b3b3f7e-5529-4f6f-b132-2a34dc935160'; // First profile ID

async function populateMessages() {
  console.log('📧 POPULATING INITIAL MESSAGES');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, assigned_human_id, metadata');

  if (tasksError) {
    console.log('❌ Error fetching tasks:', tasksError.message);
    return;
  }

  console.log(`📋 Found ${tasks?.length || 0} tasks\n`);

  let created = 0;
  let skipped = 0;

  for (const task of tasks || []) {
    // Check if message already exists
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('task_id', task.id)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipping "${task.title}" - already has messages`);
      skipped++;
      continue;
    }

    // Determine sender_id
    const senderId = 
      task.agent_id || 
      task.assigned_human_id || 
      task.metadata?.agent_id ||
      FALLBACK_USER_ID;

    // Determine message content based on status
    let content;
    switch (task.status) {
      case 'pending':
        content = 'Contract created and awaiting agent assignment.';
        break;
      case 'assigned':
        content = 'Agent assigned. Ready to begin.';
        break;
      case 'in_progress':
        content = 'Task in progress.';
        break;
      case 'completed':
        content = 'Task completed successfully.';
        break;
      case 'open':
        content = 'Contract open. Awaiting agent acceptance.';
        break;
      default:
        content = 'Contract initialized.';
    }

    // Create message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        task_id: task.id,
        sender_id: senderId,
        sender_type: 'system',
        content: content,
        message_type: 'system'
      });

    if (insertError) {
      console.log(`❌ Failed to create message for "${task.title}":`, insertError.message);
    } else {
      console.log(`✅ Created message for "${task.title}"`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Message: ${content}`);
      created++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🏁 COMPLETE\n');
  console.log(`✅ Created: ${created} messages`);
  console.log(`⏭️  Skipped: ${skipped} tasks (already had messages)`);
  console.log('\n═══════════════════════════════════════════════════════\n');

  // Verify
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total messages in database: ${count}\n`);

  // Show sample
  const { data: sampleMessages } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      sender_type,
      created_at,
      tasks (
        title,
        status
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (sampleMessages && sampleMessages.length > 0) {
    console.log('📨 Sample messages:\n');
    sampleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.sender_type}] ${msg.content}`);
      console.log(`   Task: ${msg.tasks?.title || 'Unknown'}`);
      console.log(`   Created: ${msg.created_at}`);
      console.log('');
    });
  }
}

populateMessages().catch(console.error);
