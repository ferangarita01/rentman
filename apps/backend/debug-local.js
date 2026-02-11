const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log('--- DIAGNOSTICO DE BASE DE DATOS ---');

    // 1. Check Transactions
    console.log('\n1. Consultando tabla "transactions"...');
    const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .limit(10);

    if (txError) {
        console.error('❌ Error leyendo transactions:', txError);
    } else {
        console.log(`✅ Registros encontrados: ${txs.length}`);
        if (txs.length > 0) {
            console.log('Muestra:', txs[0]);
        } else {
            console.log('⚠️ La tabla está VACÍA.');
        }
    }

    // 2. Check Deposits (Old table)
    console.log('\n2. Consultando tabla "deposits"...');
    const { data: deps, error: depError } = await supabase
        .from('deposits')
        .select('*')
        .limit(10);

    if (depError) {
        console.log('ℹ️ Error leyendo deposits (probablemente no existe):', depError.message);
    } else {
        console.log(`Registros encontrados en deposits: ${deps.length}`);
    }
    // 3. List Users & Insert Test
    console.log('\n3. Listando Usuarios...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !users || users.length === 0) {
        console.error('❌ No se pudieron listar usuarios:', authError);
    } else {
        const testUser = users[0];
        console.log(`Usuario encontrado: ${testUser.id} (${testUser.email})`);

        console.log('\n4. Insertando transacción de prueba...');
        const { data: insertData, error: insertError } = await supabase.from('transactions').insert({
            user_id: testUser.id,
            type: 'deposit',
            amount: 50.00,
            currency: 'USD',
            status: 'completed',
            description: 'System Verification Deposit',
            processed_at: new Date().toISOString(),
            metadata: { source: 'debug_script' }
        }).select();

        if (insertError) {
            console.error('❌ Error insertando:', insertError);
        } else {
            console.log('✅ Transacción insertada correctamente:', insertData);
        }
    }
}

// check(); // Already called at bottom, need to make sure I don't double call or structure properly.
// Rewriting the file execution flow.
check();
