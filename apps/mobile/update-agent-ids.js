const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateTasks() {
  console.log('🔍 Getting current user...\n');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ No user logged in. Please log in first.');
    return;
  }
  
  console.log('👤 User ID:', user.id);
  console.log('📧 Email:', user.email);
  console.log('');
  
  // Check tasks without agent_id
  console.log('🔍 Checking tasks without agent_id...\n');
  
  const { data: tasksToUpdate, error: checkError } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, assigned_human_id')
    .is('agent_id', null)
    .eq('status', 'open');
  
  if (checkError) {
    console.error('❌ Error:', checkError);
    return;
  }
  
  console.log(`Found ${tasksToUpdate?.length || 0} tasks without agent_id:\n`);
  
  if (tasksToUpdate && tasksToUpdate.length > 0) {
    tasksToUpdate.forEach((task, i) => {
      console.log(`${i + 1}. ${task.title}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Status: ${task.status}`);
      console.log('');
    });
    
    // Update tasks
    console.log(`\n🔄 Updating ${tasksToUpdate.length} tasks with agent_id = ${user.id}...\n`);
    
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({ agent_id: user.id })
      .is('agent_id', null)
      .eq('status', 'open')
      .select();
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log(`✅ Successfully updated ${updated?.length || 0} tasks!`);
      console.log('');
      console.log('These tasks will now appear in Inbox > Managing tab');
    }
  } else {
    console.log('ℹ️  No tasks to update. All open tasks already have agent_id assigned.');
  }
  
  // Show final stats
  console.log('\n📊 Final stats:\n');
  
  const { data: allUserTasks } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, assigned_human_id')
    .or(`agent_id.eq.${user.id},assigned_human_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
  
  if (allUserTasks) {
    const asAgent = allUserTasks.filter(t => t.agent_id === user.id);
    const asWorker = allUserTasks.filter(t => t.assigned_human_id === user.id);
    
    console.log(`Total tasks: ${allUserTasks.length}`);
    console.log(`  - As agent (created): ${asAgent.length} → Will show in "Managing"`);
    console.log(`  - As worker (assigned): ${asWorker.length} → Will show in "Doing"`);
  }
}

updateTasks().then(() => process.exit(0));
