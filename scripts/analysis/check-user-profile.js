const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserProfile() {
  const userId = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';
  
  console.log('🔍 Checking profile for user:', userId);
  console.log('━'.repeat(80));

  // 1. Check profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('\n📋 PROFILES TABLE:');
  if (profileError) {
    console.log('❌ Error:', profileError.message);
    console.log('   Code:', profileError.code);
    console.log('   Details:', profileError.details);
  } else if (profile) {
    console.log('✅ Profile found!');
    console.log('   Email:', profile.email);
    console.log('   Name:', profile.full_name);
    console.log('   Credits:', profile.credits);
    console.log('   Status:', profile.status);
    console.log('   Created:', profile.created_at);
  }

  // 2. Check humans table
  const { data: human, error: humanError } = await supabase
    .from('humans')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('\n👤 HUMANS TABLE:');
  if (humanError) {
    console.log('❌ Error:', humanError.message);
    console.log('   Code:', humanError.code);
  } else if (human) {
    console.log('✅ Human profile found!');
    console.log('   Level:', human.current_level);
    console.log('   Reputation:', human.reputation_score);
    console.log('   Tasks completed:', human.total_tasks_completed);
  }

  // 3. Check auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

  console.log('\n🔐 AUTH.USERS:');
  if (authError) {
    console.log('❌ Error:', authError.message);
  } else if (authUser) {
    console.log('✅ Auth user found!');
    console.log('   Email:', authUser.user.email);
    console.log('   Created:', authUser.user.created_at);
    console.log('   Last sign in:', authUser.user.last_sign_in_at);
  }

  // 4. Check transactions
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n💰 TRANSACTIONS:');
  if (txError) {
    console.log('❌ Error:', txError.message);
  } else if (txs && txs.length > 0) {
    console.log(`✅ Found ${txs.length} transactions`);
    txs.forEach((tx, i) => {
      console.log(`   ${i+1}. ${tx.type}: ${tx.amount} ${tx.currency} - ${tx.status} (${tx.created_at})`);
    });
  } else {
    console.log('⚠️  No transactions found');
  }

  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`   Profile exists: ${profile ? '✅ YES' : '❌ NO'}`);
  console.log(`   Human exists: ${human ? '✅ YES' : '❌ NO'}`);
  console.log(`   Auth user exists: ${authUser ? '✅ YES' : '❌ NO'}`);
  console.log(`   Has transactions: ${txs && txs.length > 0 ? '✅ YES' : '❌ NO'}`);
}

checkUserProfile().catch(console.error);
