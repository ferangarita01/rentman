const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStripeBalance() {
  const userId = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';

  console.log('🔍 Checking Stripe balance for user:', userId);
  console.log('━'.repeat(80));

  // 1. Get profile with stripe customer id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.log('❌ Profile not found');
    return;
  }

  console.log('\n📋 Profile Info:');
  console.log('   Email:', profile.email);
  console.log('   Credits (Supabase):', profile.credits);
  console.log('   Stripe Customer ID:', profile.stripe_customer_id || 'NOT SET');
  console.log('   Stripe Connect ID:', profile.stripe_account_id || 'NOT SET');

  // 2. If has Stripe customer, check balance
  if (profile.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      console.log('\n💳 Stripe Customer:');
      console.log('   ID:', customer.id);
      console.log('   Balance:', customer.balance / 100, 'USD');
      console.log('   Currency:', customer.currency || 'usd');

      // Check payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card'
      });

      console.log('   Payment Methods:', paymentMethods.data.length);

    } catch (err) {
      console.log('\n❌ Error fetching Stripe customer:', err.message);
    }
  } else {
    console.log('\n⚠️  No Stripe customer ID - user has not linked payment');
  }

  // 3. Check transactions
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('\n💰 Transactions:');
  if (txs && txs.length > 0) {
    let balance = 0;
    txs.forEach(tx => {
      balance += tx.type === 'deposit' ? tx.amount : -tx.amount;
      console.log(`   ${tx.type.padEnd(12)} ${tx.amount.toString().padStart(6)} ${tx.currency} (${tx.status}) - Balance: ${balance}`);
    });
    console.log(`\n   📊 Calculated Balance: $${balance} USD`);
  } else {
    console.log('   No transactions found');
  }
}

checkStripeBalance().catch(console.error);
