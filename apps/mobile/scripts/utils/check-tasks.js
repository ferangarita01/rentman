// Quick script to check tasks in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTasks() {
  console.log('🔍 Checking tasks in database...\n');
  
  // Get all tasks
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, assigned_human_id, requester_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Found ${tasks.length} tasks:\n`);
  
  tasks.forEach((task, i) => {
    console.log(`${i + 1}. ${task.title}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   agent_id: ${task.agent_id || 'NULL'}`);
    console.log(`   assigned_human_id: ${task.assigned_human_id || 'NULL'}`);
    console.log(`   requester_id: ${task.requester_id || 'NULL'}`);
    console.log(`   created_at: ${task.created_at}`);
    console.log('');
  });
  
  // Check current user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log(`\n👤 Current user ID: ${user.id}\n`);
    
    // Tasks where user is agent
    const managing = tasks.filter(t => t.agent_id === user.id);
    console.log(`📋 Tasks you created (agent_id): ${managing.length}`);
    managing.forEach(t => console.log(`   - ${t.title} (${t.status})`));
    
    // Tasks where user is worker
    const doing = tasks.filter(t => t.assigned_human_id === user.id);
    console.log(`\n🔨 Tasks assigned to you: ${doing.length}`);
    doing.forEach(t => console.log(`   - ${t.title} (${t.status})`));
  }
}

checkTasks().then(() => process.exit(0));
