/**
 * Check metadata structure
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetadata() {
  console.log('🔍 CHECKING TASK METADATA\n');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, metadata, assigned_human_id')
    .limit(5);

  tasks?.forEach((task, i) => {
    console.log(`${i + 1}. ${task.title}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   assigned_human_id: ${task.assigned_human_id}`);
    console.log(`   metadata:`, JSON.stringify(task.metadata, null, 2));
    console.log('');
  });
}

checkMetadata().catch(console.error);
