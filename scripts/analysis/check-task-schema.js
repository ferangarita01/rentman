const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uoekolfgbbmvhzsfkjef.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ'
);

async function investigate() {
  console.log('=== INVESTIGATING TASKS TABLE ===\n');
  
  // 1. Check column constraints
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('column_name, is_nullable, column_default, data_type')
    .eq('table_name', 'tasks')
    .in('column_name', ['agent_id', 'requester_id', 'assigned_human_id']);
    
  console.log('1. COLUMN NULLABLE STATUS:');
  console.log(JSON.stringify(columns, null, 2));
  
  // 2. Check FK constraints
  const { data: fks, error: fkError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='tasks'
        AND kcu.column_name IN ('agent_id', 'requester_id', 'assigned_human_id');
    `
  });
  
  console.log('\n2. FOREIGN KEY CONSTRAINTS:');
  console.log(JSON.stringify(fks, null, 2));
  
  // 3. Check current data
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('id, agent_id, requester_id, assigned_human_id, status')
    .limit(5);
    
  console.log('\n3. SAMPLE TASKS DATA:');
  console.log(JSON.stringify(tasks, null, 2));
  
  // 4. Check profiles (agents table)
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, full_name, is_agent')
    .limit(10);
    
  console.log('\n4. AVAILABLE PROFILES:');
  console.log(JSON.stringify(profiles, null, 2));
}

investigate().catch(console.error);
