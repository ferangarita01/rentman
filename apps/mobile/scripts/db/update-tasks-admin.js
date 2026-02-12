const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uoekolqgbbmvhzsfkjef.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateTasks() {
  console.log('🔍 Connecting to Supabase...\n');
  
  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError || !users || users.length === 0) {
    console.error('❌ Error getting users:', usersError);
    return;
  }
  
  console.log(`Found ${users.length} user(s):\n`);
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email}`);
    console.log(`   ID: ${u.id}`);
    console.log('');
  });
  
  // Use the first user (probably you)
  const targetUser = users[0];
  console.log(`\nUsing user: ${targetUser.email} (${targetUser.id})\n`);
  
  // Check tasks without agent_id
  console.log('🔍 Checking tasks without agent_id...\n');
  
  const { data: tasksToUpdate, error: checkError } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, assigned_human_id, created_at')
    .is('agent_id', null)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  
  if (checkError) {
    console.error('❌ Error checking tasks:', checkError);
    return;
  }
  
  console.log(`📋 Found ${tasksToUpdate?.length || 0} tasks without agent_id:\n`);
  
  if (tasksToUpdate && tasksToUpdate.length > 0) {
    tasksToUpdate.forEach((task, i) => {
      console.log(`${i + 1}. ${task.title}`);
      console.log(`   ID: ${task.id.substring(0, 8)}...`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${new Date(task.created_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log(`\n🔄 Updating ${tasksToUpdate.length} tasks with agent_id = ${targetUser.id}...\n`);
    
    // Update tasks
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({ agent_id: targetUser.id })
      .is('agent_id', null)
      .eq('status', 'open')
      .select('id, title, status');
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
    } else {
      console.log(`✅ Successfully updated ${updated?.length || 0} tasks!\n`);
      if (updated && updated.length > 0) {
        updated.forEach((t, i) => {
          console.log(`   ✓ ${t.title} (${t.status})`);
        });
      }
      console.log('\n🎉 These tasks will now appear in Inbox > Managing tab!');
    }
  } else {
    console.log('ℹ️  No tasks to update. All open tasks already have agent_id assigned.');
  }
  
  // Show final stats
  console.log('\n📊 Final stats:\n');
  
  const { data: allUserTasks } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, assigned_human_id')
    .or(`agent_id.eq.${targetUser.id},assigned_human_id.eq.${targetUser.id}`)
    .order('created_at', { ascending: false });
  
  if (allUserTasks) {
    const asAgent = allUserTasks.filter(t => t.agent_id === targetUser.id);
    const asWorker = allUserTasks.filter(t => t.assigned_human_id === targetUser.id);
    
    console.log(`Total tasks for ${targetUser.email}: ${allUserTasks.length}`);
    console.log(`  - Managing (agent_id): ${asAgent.length} tasks → Shows in "Managing" tab`);
    console.log(`  - Doing (assigned): ${asWorker.length} tasks → Shows in "Doing" tab`);
    console.log('');
    
    if (asAgent.length > 0) {
      console.log('📝 Managing:');
      asAgent.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.title} (${t.status})`);
      });
      if (asAgent.length > 5) console.log(`   ... and ${asAgent.length - 5} more`);
      console.log('');
    }
    
    if (asWorker.length > 0) {
      console.log('🔨 Doing:');
      asWorker.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.title} (${t.status})`);
      });
      if (asWorker.length > 5) console.log(`   ... and ${asWorker.length - 5} more`);
    }
  }
  
  console.log('\n✅ Done! Refresh the app to see changes in Inbox.');
}

updateTasks().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
