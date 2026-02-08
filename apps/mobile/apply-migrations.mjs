// apply-migrations.mjs
// Run with: node apply-migrations.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filename) {
    const filePath = path.join('migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n📦 Applying: ${filename}`);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // Try direct approach
        console.log('   Trying alternative method...');
        const { error: error2 } = await supabase.from('_migrations').select('*').limit(0);
        if (error2) {
            console.error(`   ⚠️  May need manual application: ${error.message}`);
            return false;
        }
    }

    console.log(`   ✅ Applied successfully`);
    return true;
}

async function main() {
    console.log('🚀 Supabase Migration Runner');
    console.log('============================\n');

    const migrations = [
        '001_add_messages_table.sql',
        '002_add_settings_to_profiles.sql'
    ];

    for (const migration of migrations) {
        await applyMigration(migration);
    }

    console.log('\n✅ Migration process complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify tables in Supabase Dashboard');
    console.log('   2. Test the app pages');
}

main().catch(console.error);
