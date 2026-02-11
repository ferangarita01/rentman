const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const SUPABASE_URL = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

// Crear cliente
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    console.log('🔌 Conectando a Supabase...\n');
    
    try {
        // Test 1: Verificar RLS en todas las tablas
        console.log('📊 Test 1: Verificando RLS en tablas públicas\n');
        
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
        
        if (tablesError) {
            console.error('❌ Error consultando tablas:', tablesError.message);
        }
        
        // Test 2: Listar tablas usando query SQL
        console.log('📋 Test 2: Listando tablas con RLS\n');
        
        const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
            query: `
                SELECT 
                    schemaname,
                    tablename,
                    rowsecurity AS rls_enabled
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            `
        });
        
        if (rlsError) {
            console.log('⚠️  No se puede usar RPC (esperado si no está configurado)');
            console.log('   Usaremos queries directas en su lugar...\n');
        }
        
        // Test 3: Consultar tasks (debe mostrar solo OPEN)
        console.log('📋 Test 3: Consultando tareas OPEN (RLS activo)\n');
        
        const { data: tasks, error: tasksError, count } = await supabase
            .from('tasks')
            .select('id, title, status, created_at', { count: 'exact' })
            .limit(5);
        
        if (tasksError) {
            console.error('❌ Error consultando tasks:', tasksError.message);
            console.error('   Código:', tasksError.code);
            console.error('   Detalles:', tasksError.details);
        } else {
            console.log(`✅ Conexión exitosa - ${count} tareas encontradas`);
            if (tasks && tasks.length > 0) {
                console.log('\n📄 Primeras tareas:');
                tasks.forEach((task, i) => {
                    console.log(`   ${i + 1}. [${task.status}] ${task.title}`);
                    console.log(`      ID: ${task.id}`);
                    console.log(`      Creado: ${task.created_at}\n`);
                });
            } else {
                console.log('   (No hay tareas en la base de datos)\n');
            }
        }
        
        // Test 4: Verificar policies activas
        console.log('🔒 Test 4: Verificando policies de seguridad\n');
        
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('schemaname, tablename, policyname')
            .eq('schemaname', 'public')
            .limit(10);
        
        if (policiesError) {
            console.log('⚠️  No se pueden consultar policies directamente');
            console.log('   (Requiere permisos especiales)\n');
        } else if (policies && policies.length > 0) {
            console.log(`✅ ${policies.length} policies encontradas:`);
            policies.forEach(p => {
                console.log(`   • ${p.tablename}: ${p.policyname}`);
            });
        }
        
    } catch (error) {
        console.error('\n❌ Error general:', error.message);
    }
}

testConnection();
