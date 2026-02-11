const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  const userId = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';
  
  console.log('🔍 COMPLETE SUPABASE DIAGNOSIS\n');
  console.log('━'.repeat(80));

  // 1. Check RLS is enabled
  const { data: rlsCheck, error: rlsError } = await supabase.rpc('sql', {
    query: `
      SELECT 
        relname as table_name,
        relrowsecurity as rls_enabled
      FROM pg_class 
      WHERE relname = 'profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `
  });

  if (!rlsError && rlsCheck) {
    console.log('\n1️⃣ RLS STATUS:');
    console.log(rlsCheck);
  } else {
    console.log('\n1️⃣ Checking RLS manually...');
    // Try direct query
    const { data: tables } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'profiles')
      .single();
    console.log('   RLS Enabled:', tables);
  }

  // 2. Check policies
  console.log('\n2️⃣ RLS POLICIES:');
  const { data: policies, error: polError } = await supabase
    .rpc('sql', {
      query: `
        SELECT policyname, cmd, qual::text, with_check::text
        FROM pg_policies 
        WHERE tablename = 'profiles';
      `
    });

  if (!polError && policies) {
    console.log(policies);
  } else {
    console.log('   Error fetching policies:', polError?.message);
  }

  // 3. Check if profile exists (service role - bypasses RLS)
  console.log('\n3️⃣ PROFILE CHECK (Service Role):');
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profError) {
    console.log('   ❌ Error:', profError.message);
  } else {
    console.log('   ✅ Profile found:');
    console.log('      Email:', profile.email);
    console.log('      Credits:', profile.credits);
    console.log('      Status:', profile.status);
  }

  // 4. Test with ANON key (simulates app)
  console.log('\n4️⃣ SIMULATING APP REQUEST (Anon Key):');
  const anonClient = createClient(supabaseUrl, supabaseAnon);
  
  // First, authenticate as the user
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: 'ferangarita01@gmail.com',
    password: 'test123' // Replace with actual password if needed
  });

  if (authError) {
    console.log('   ❌ Cannot authenticate:', authError.message);
    console.log('   Skipping authenticated test...');
  } else {
    console.log('   ✅ Authenticated as:', authData.user.email);
    
    // Now try to get profile
    const { data: anonProfile, error: anonError } = await anonClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (anonError) {
      console.log('   ❌ RLS BLOCKING:', anonError.message);
      console.log('   Code:', anonError.code);
      console.log('   Details:', anonError.details);
    } else {
      console.log('   ✅ Profile accessible via anon+auth!');
      console.log('      Email:', anonProfile.email);
      console.log('      Credits:', anonProfile.credits);
    }
  }

  console.log('\n' + '━'.repeat(80));
}

diagnose().catch(console.error);
