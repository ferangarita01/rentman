const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔒 Checking RLS Policies for tasks table...\n');

  // Query RLS policies directly via SQL
  const { data: policies, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'tasks' 
      AND schemaname = 'public'
      ORDER BY policyname;
    `
  });

  if (error) {
    console.log('⚠️  Cannot query pg_policies directly. Trying alternative method...\n');
    
    // Alternative: Check if we can insert
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .insert({
        title: 'RLS_TEST',
        description: 'Testing RLS',
        budget_amount: 10,
        task_type: 'general',
        requester_id: testUserId,
        status: 'open',
        priority: 5,
        budget_currency: 'USD',
        payment_type: 'fixed',
        payment_status: 'pending'
      })
      .select();

    if (testError) {
      console.log('❌ RLS Test Insert Error:', testError.message);
      console.log('   Code:', testError.code);
      console.log('   Details:', testError.details);
    } else {
      console.log('✅ Test insert successful (using service role key - bypasses RLS)');
      // Clean up
      if (testData && testData[0]) {
        await supabase.from('tasks').delete().eq('id', testData[0].id);
        console.log('   Cleaned up test record');
      }
    }
  } else {
    console.log('📋 RLS Policies for "tasks" table:');
    console.log('━'.repeat(80));
    
    if (!policies || policies.length === 0) {
      console.log('⚠️  NO RLS POLICIES FOUND!');
      console.log('   This means INSERT operations will FAIL for regular users.');
    } else {
      policies.forEach((policy, i) => {
        console.log(`\n${i + 1}. Policy: ${policy.policyname}`);
        console.log(`   Command: ${policy.cmd}`);
        console.log(`   Roles: ${policy.roles}`);
        console.log(`   Permissive: ${policy.permissive}`);
        if (policy.qual) console.log(`   Using: ${policy.qual}`);
        if (policy.with_check) console.log(`   With Check: ${policy.with_check}`);
      });
    }
  }

  // Check current RLS status
  console.log('\n' + '━'.repeat(80));
  console.log('\n🔐 Checking RLS enforcement...\n');

  const { data: rlsCheck, error: rlsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        relname as table_name,
        relrowsecurity as rls_enabled,
        relforcerowsecurity as rls_forced
      FROM pg_class
      WHERE relname = 'tasks'
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `
  });

  if (!rlsError && rlsCheck) {
    console.log('RLS Status:', rlsCheck);
  } else {
    console.log('Could not check RLS status via SQL');
  }
}

checkRLSPolicies().catch(console.error);
