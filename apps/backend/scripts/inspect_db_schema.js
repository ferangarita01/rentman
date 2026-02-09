require('dotenv').config({ path: '../../../.env' });
require('dotenv').config({ path: '../../../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectSchema() {
    console.log('🔍 Inspecting Table Structures...');

    // 1. Inspect 'agents'
    const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .limit(1);

    if (agentsError) {
        console.error('❌ Error fetching agents:', agentsError.message);
    } else if (agents.length > 0) {
        console.log('\n📄 AGENTS Table Columns:', Object.keys(agents[0]));
        console.log('Sample Agent:', agents[0]);
    } else {
        console.log('\n⚠️ Agents table is empty.');
    }

    // 2. Inspect 'tasks'
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1);

    if (tasksError) {
        console.error('❌ Error fetching tasks:', tasksError.message);
    } else if (tasks.length > 0) {
        console.log('\n📋 TASKS Table Columns:', Object.keys(tasks[0]));
        console.log('Sample Task:', tasks[0]);
    } else {
        console.log('\n⚠️ Tasks table is empty.');
    }
}

inspectSchema();
