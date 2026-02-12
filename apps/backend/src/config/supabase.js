const { createClient } = require('@supabase/supabase-js');
const { getSecret } = require('./secrets');

let supabaseInstance = null;

async function initializeSupabase() {
    if (supabaseInstance) return supabaseInstance;

    const SUPABASE_URL = await getSecret('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = await getSecret('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase credentials');
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase initialized');
    return supabaseInstance;
}

function getSupabase() {
    if (!supabaseInstance) {
        throw new Error('Supabase not initialized. Call initializeSupabase() first.');
    }
    return supabaseInstance;
}

module.exports = { initializeSupabase, getSupabase };
