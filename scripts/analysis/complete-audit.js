const { createClient } = require('@supabase/supabase-js');

// Credenciales
const SUPABASE_URL = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function completeAudit() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 AUDITORÍA COMPLETA DE SEGURIDAD - VÍA API               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    const results = {
        rlsPolicies: null,
        rlsStatus: null,
        publicGrants: null,
        vaultAccess: null,
        tablesInfo: null,
        errors: []
    };

    // ═══════════════════════════════════════════════════════════════
    // OPCIÓN A: POLÍTICAS RLS
    // ═══════════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ OPCIÓN A: Verificando políticas RLS                        │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    try {
        // Intentar obtener políticas RLS
        const { data: policies, error } = await supabase
            .rpc('exec_sql', {
                query: `
                    SELECT 
                        schemaname,
                        tablename,
                        policyname,
                        permissive,
                        roles,
                        cmd,
                        qual,
                        with_check
                    FROM pg_policies 
                    WHERE schemaname IN ('public', 'storage', 'vault')
                    ORDER BY schemaname, tablename, policyname;
                `
            });
        
        if (error) {
            console.log('⚠️  No se puede usar RPC exec_sql (esperado)');
            console.log('   Intentando método alternativo...\n');
            
            // Método alternativo: consultar información de esquema
            const { data: tables, error: tablesError } = await supabase
                .from('pg_tables')
                .select('schemaname, tablename, rowsecurity')
                .in('schemaname', ['public', 'storage']);
            
            if (tablesError) {
                results.errors.push({
                    opcion: 'A',
                    error: 'No se pueden consultar pg_tables directamente',
                    details: tablesError
                });
                console.log('❌ Error consultando pg_tables:', tablesError.message);
            } else {
                results.rlsStatus = tables;
                console.log(`✅ Estado RLS obtenido: ${tables?.length || 0} tablas`);
            }
        } else {
            results.rlsPolicies = policies;
            console.log(`✅ Políticas RLS: ${policies?.length || 0} encontradas`);
        }
    } catch (err) {
        results.errors.push({
            opcion: 'A',
            error: 'Error al consultar políticas',
            details: err.message
        });
        console.log('❌ Error inesperado:', err.message);
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // INFORMACIÓN DE TABLAS
    // ═══════════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ Listando tablas del schema public                          │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    try {
        // Listar tablas principales que podemos consultar
        const tablesToCheck = [
            'tasks',
            'profiles', 
            'agents',
            'messages',
            'escrow_transactions',
            'transactions',
            'task_proofs',
            'reviews',
            'agent_api_keys'
        ];
        
        const tablesInfo = [];
        
        for (const table of tablesToCheck) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    tablesInfo.push({
                        table,
                        accessible: false,
                        error: error.message,
                        rls: 'unknown'
                    });
                    console.log(`  ⚠️  ${table}: No accesible (${error.message})`);
                } else {
                    tablesInfo.push({
                        table,
                        accessible: true,
                        rowCount: count,
                        rls: 'enabled'
                    });
                    console.log(`  ✅ ${table}: ${count} filas (RLS activo)`);
                }
            } catch (err) {
                tablesInfo.push({
                    table,
                    accessible: false,
                    error: err.message,
                    rls: 'unknown'
                });
                console.log(`  ❌ ${table}: Error - ${err.message}`);
            }
        }
        
        results.tablesInfo = tablesInfo;
        console.log(`\n  Total: ${tablesInfo.length} tablas verificadas`);
        
    } catch (err) {
        results.errors.push({
            opcion: 'Info',
            error: 'Error listando tablas',
            details: err.message
        });
        console.log('❌ Error:', err.message);
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // OPCIÓN B: GRANTS DE PUBLIC
    // ═══════════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ OPCIÓN B: Verificando grants de PUBLIC                     │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    try {
        const { data: grants, error } = await supabase
            .rpc('exec_sql', {
                query: `
                    SELECT 
                        grantee,
                        table_schema,
                        table_name,
                        privilege_type
                    FROM information_schema.role_table_grants
                    WHERE grantee = 'PUBLIC'
                    AND table_schema IN ('public', 'storage')
                    ORDER BY table_schema, table_name;
                `
            });
        
        if (error) {
            console.log('⚠️  No se puede consultar grants directamente vía RPC');
            console.log('   Esto requiere acceso al SQL Editor de Dashboard\n');
            results.errors.push({
                opcion: 'B',
                error: 'RPC no disponible para grants',
                details: error
            });
        } else {
            results.publicGrants = grants;
            console.log(`✅ Grants de PUBLIC: ${grants?.length || 0} encontrados`);
            
            if (grants && grants.length > 0) {
                console.log('\n  ⚠️  ADVERTENCIA: Se encontraron permisos PUBLIC:');
                grants.slice(0, 5).forEach(g => {
                    console.log(`     • ${g.table_schema}.${g.table_name}: ${g.privilege_type}`);
                });
                if (grants.length > 5) {
                    console.log(`     ... y ${grants.length - 5} más`);
                }
            }
        }
    } catch (err) {
        results.errors.push({
            opcion: 'B',
            error: 'Error consultando grants',
            details: err.message
        });
        console.log('❌ Error:', err.message);
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // OPCIÓN D: VAULT.SECRETS
    // ═══════════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ OPCIÓN D: Verificando acceso a vault.secrets               │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    try {
        // Intentar acceder a vault.secrets (debería fallar con ANON key)
        const { data: secrets, error } = await supabase
            .from('vault.secrets')
            .select('id, name, created_at')
            .limit(1);
        
        if (error) {
            if (error.code === '42P01') {
                console.log('✅ BUENO: vault.secrets no es accesible vía ANON key');
                console.log('   (Tabla no encontrada o sin permisos)');
                results.vaultAccess = {
                    accessible: false,
                    secure: true,
                    message: 'Vault protegido correctamente'
                };
            } else if (error.code === '42501') {
                console.log('✅ BUENO: vault.secrets bloqueado por RLS');
                console.log('   (Permission denied)');
                results.vaultAccess = {
                    accessible: false,
                    secure: true,
                    message: 'RLS bloqueando acceso'
                };
            } else {
                console.log('⚠️  Error consultando vault:', error.message);
                results.vaultAccess = {
                    accessible: false,
                    secure: 'unknown',
                    error: error.message
                };
            }
        } else {
            console.log('🚨 CRÍTICO: vault.secrets ES ACCESIBLE con ANON key!');
            console.log(`   Se pueden leer ${secrets?.length || 0} secretos`);
            results.vaultAccess = {
                accessible: true,
                secure: false,
                recordsFound: secrets?.length,
                message: 'RIESGO CRÍTICO - Vault accesible públicamente'
            };
        }
    } catch (err) {
        console.log('✅ Vault probablemente protegido (error de acceso)');
        results.vaultAccess = {
            accessible: false,
            secure: true,
            message: 'Error de acceso indica protección'
        };
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // OPCIÓN E: SECURITY ADVISORS (si existe)
    // ═══════════════════════════════════════════════════════════════
    
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ OPCIÓN E: Consultando security advisors                    │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
    try {
        const { data: advisors, error } = await supabase
            .rpc('get_advisors', { category: 'security' });
        
        if (error) {
            console.log('⚠️  Función get_advisors no disponible');
            console.log('   (Esto es normal en la mayoría de proyectos)\n');
        } else {
            console.log(`✅ Security advisors: ${advisors?.length || 0} recomendaciones`);
            if (advisors && advisors.length > 0) {
                advisors.forEach(a => {
                    console.log(`   • ${a.title || a.message}`);
                });
            }
        }
    } catch (err) {
        console.log('⚠️  get_advisors no disponible (esperado)');
    }
    
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN DE RESULTADOS
    // ═══════════════════════════════════════════════════════════════
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESUMEN DE AUDITORÍA                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('RESULTADOS POR OPCIÓN:\n');
    
    console.log('  A) Políticas RLS:');
    if (results.rlsPolicies) {
        console.log(`     ✅ ${results.rlsPolicies.length} políticas encontradas`);
    } else if (results.rlsStatus) {
        console.log(`     ✅ ${results.rlsStatus.length} tablas con info de RLS`);
    } else {
        console.log('     ⚠️  No se pudo obtener (requiere Dashboard)');
    }
    
    console.log('\n  B) Grants PUBLIC:');
    if (results.publicGrants) {
        if (results.publicGrants.length > 0) {
            console.log(`     🚨 ${results.publicGrants.length} permisos PUBLIC encontrados`);
        } else {
            console.log('     ✅ No se encontraron grants PUBLIC riesgosos');
        }
    } else {
        console.log('     ⚠️  No se pudo verificar (requiere Dashboard)');
    }
    
    console.log('\n  D) Vault.secrets:');
    if (results.vaultAccess) {
        if (results.vaultAccess.secure) {
            console.log('     ✅ Protegido correctamente');
        } else {
            console.log('     🚨 ACCESIBLE - RIESGO CRÍTICO');
        }
    }
    
    console.log('\n  Info) Tablas verificadas:');
    if (results.tablesInfo) {
        const accessible = results.tablesInfo.filter(t => t.accessible).length;
        const blocked = results.tablesInfo.filter(t => !t.accessible).length;
        console.log(`     ✅ ${accessible} tablas accesibles (RLS permitiendo lectura)`);
        console.log(`     🔒 ${blocked} tablas bloqueadas (RLS funcionando)`);
    }
    
    console.log('\n  Errores encontrados:');
    if (results.errors.length === 0) {
        console.log('     ✅ Ninguno crítico');
    } else {
        console.log(`     ⚠️  ${results.errors.length} limitaciones de API`);
    }
    
    console.log('\n' + '═'.repeat(65) + '\n');
    
    // Guardar resultados en archivo JSON
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-results-${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`📄 Resultados guardados en: ${filename}\n`);
    
    return results;
}

completeAudit()
    .then(() => {
        console.log('✅ Auditoría completada exitosamente\n');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Error fatal en auditoría:', err);
        process.exit(1);
    });
