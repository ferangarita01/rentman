const { createClient } = require('@supabase/supabase-js');

// Hardcode the values temporarily (we'll get them from .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ Missing Supabase credentials');
  console.log('\nPlease run with environment variables:');
  console.log('');
  console.log('$env:NEXT_PUBLIC_SUPABASE_URL="your-url"; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"; node update-tasks-simple.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateTasks() {
  console.log('🔍 Getting current user...\n');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ No user logged in.');
    console.log('Please log in to the app first, then run this script.');
    return;
  }
  
  console.log('✅ User ID:', user.id);
  console.log('📧 Email:', user.email);
  console.log('');
  
  // Update tasks
  console.log('🔄 Updating tasks without agent_id...\n');
  
  const { data: updated, error: updateError } = await supabase
    .from('tasks')
    .update({ agent_id: user.id })
    .is('agent_id', null)
    .eq('status', 'open')
    .select('id, title, status');
  
  if (updateError) {
    console.error('❌ Error:', updateError);
  } else {
    console.log(`✅ Updated ${updated?.length || 0} tasks`);
    if (updated && updated.length > 0) {
      updated.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.title}`);
      });
    }
  }
  
  console.log('\n✅ Done! These tasks will now appear in Inbox > Managing');
}

updateTasks().then(() => process.exit(0));
