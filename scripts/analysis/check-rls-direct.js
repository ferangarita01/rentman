const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
  console.log('🔍 Checking RLS Policies on profiles table\n');

  // Direct SQL query to check RLS
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  console.log('📋 Can query profiles table:', !error);
  if (error) console.log('   Error:', error.message);

  // Check if we can see system tables
  const { data: pg, error: pgErr } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');

  console.log('\n📜 Can access pg_policies:', !pgErr);
  if (pgErr) {
    console.log('   Error:', pgErr.message);
    console.log('   Code:', pgErr.code);
  } else {
    console.log('   Policies found:', pg?.length || 0);
    if (pg && pg.length > 0) {
      pg.forEach(p => {
        console.log(`\n   Policy: ${p.policyname}`);
        console.log(`   Command: ${p.cmd}`);
        console.log(`   Using: ${p.qual}`);
      });
    }
  }

  // Try to list all tables to understand structure
  console.log('\n📊 Listing accessible tables:');
  const { data: tables, error: tablesErr } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .limit(10);

  if (!tablesErr && tables) {
    console.log('   Tables:', tables.map(t => t.table_name).join(', '));
  } else {
    console.log('   Cannot access information_schema');
  }

  console.log('\n━'.repeat(80));
  console.log('\n💡 RECOMMENDATION:');
  console.log('   Go to Supabase Dashboard → SQL Editor');
  console.log('   Run these queries to check RLS:\n');
  console.log('   SELECT policyname, cmd FROM pg_policies WHERE tablename = \'profiles\';');
  console.log('   SELECT relrowsecurity FROM pg_class WHERE relname = \'profiles\';\n');
}

checkRLS().catch(console.error);
