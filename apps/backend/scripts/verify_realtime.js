require('dotenv').config({ path: '../../.env' });
require('dotenv').config({ path: '../../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRealtime() {
    console.log('🔄 meaningful: Starting Realtime Verification...');

    const testTask = {
        title: 'VERIFICATION_TEST_PROTOCOL',
        description: 'Verifying dashboard realtime socket connection.',
        status: 'pending',
        budget_amount: 99.99,
        location: 'CyberSpace',
        ai_analysis: { type: 'verification' }
    };

    // 1. Insert Task
    console.log('1️⃣ Inserting Test Task...');
    const { data, error } = await supabase.from('tasks').insert(testTask).select().single();

    if (error) {
        console.error('❌ Insert Failed:', error.message);
        return;
    }

    console.log(`✅ Task Inserted: ${data.id}`);
    console.log('👀 Check your Dashboard "Live_Mission_Feed" now!');

    // 2. Wait 5 seconds
    console.log('⏳ Waiting 5 seconds before update...');
    await new Promise(r => setTimeout(r, 5000));

    // 3. Update Task
    console.log('2️⃣ Updating Task Status to "in_progress"...');
    const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', data.id);

    if (updateError) {
        console.error('❌ Update Failed:', updateError.message);
    } else {
        console.log('✅ Task Updated.');
        console.log('👀 Dashboard status should change to "in_progress".');
    }

    // 4. Wait 5 seconds
    console.log('⏳ Waiting 5 seconds before cleanup...');
    await new Promise(r => setTimeout(r, 5000));

    // 5. Delete Task
    console.log('3️⃣ Deleting Test Task...');
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', data.id);

    if (deleteError) {
        console.error('❌ Delete Failed:', deleteError.message);
    } else {
        console.log('✅ Task Deleted.');
        console.log('👀 Task should disappear from Dashboard.');
    }
}

testRealtime();
