const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateContractError() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INVESTIGACIÓN: Error al Crear Contrato - APK');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Verificar constraint de status usando query directa
  console.log('1️⃣  CONSTRAINT tasks_status_check:');
  const { data: constraints, error: err1 } = await supabase
    .from('information_schema.check_constraints')
    .select('*')
    .eq('constraint_name', 'tasks_status_check');
  
  console.log('   Status constraint:', JSON.stringify(constraints, null, 2));

  // 2. Verificar estructura de la tabla tasks
  console.log('\n2️⃣  COLUMNAS DE LA TABLA tasks:');
  const { data: columns, error: err2 } = await supabase.rpc('exec_sql', {
    sql: `SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'tasks' AND table_schema = 'public'
          ORDER BY ordinal_position`
  });
  
  if (columns) {
    console.log(JSON.stringify(columns, null, 2));
  } else {
    console.log('   Error:', err2);
  }

  // 3. Verificar si agent_id puede ser NULL
  console.log('\n3️⃣  ¿agent_id PERMITE NULL?');
  const agentIdCol = columns?.find(c => c.column_name === 'agent_id');
  if (agentIdCol) {
    console.log(`   is_nullable: ${agentIdCol.is_nullable}`);
    console.log(`   default: ${agentIdCol.column_default}`);
  }

  // 4. Verificar que existen perfiles de usuarios
  console.log('\n4️⃣  USUARIOS/PERFILES EXISTENTES:');
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, email, is_agent, full_name')
    .limit(5);
  
  if (profiles) {
    console.log(`   Total perfiles encontrados: ${profiles.length}`);
    profiles.forEach(p => {
      console.log(`   - ID: ${p.id.substring(0, 8)}... | Email: ${p.email} | Agent: ${p.is_agent}`);
    });
  } else {
    console.log('   Error:', profilesErr);
  }

  // 5. Verificar tabla agents
  console.log('\n5️⃣  AGENTES EXISTENTES EN LA TABLA agents:');
  const { data: agents, error: agentsErr } = await supabase
    .from('agents')
    .select('id, name, agent_type, status')
    .limit(5);
  
  if (agents) {
    console.log(`   Total agentes encontrados: ${agents.length}`);
    agents.forEach(a => {
      console.log(`   - ID: ${a.id.substring(0, 8)}... | Name: ${a.name} | Type: ${a.agent_type}`);
    });
  } else {
    console.log('   Error:', agentsErr);
  }

  // 6. Verificar tareas existentes
  console.log('\n6️⃣  TAREAS EXISTENTES (últimas 3):');
  const { data: existingTasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, title, status, agent_id, requester_id')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (existingTasks) {
    console.log(`   Total tareas: ${existingTasks.length}`);
    existingTasks.forEach(t => {
      console.log(`   - ${t.title} | Status: ${t.status} | AgentID: ${t.agent_id || 'NULL'}`);
    });
  }

  // 7. Intentar crear un task de prueba SIN agent_id
  console.log('\n7️⃣  PRUEBA: Crear task SIN agent_id (como APK):');
  const testUserId = profiles && profiles.length > 0 ? profiles[0].id : null;
  
  if (testUserId) {
    console.log(`   Usando requester_id: ${testUserId.substring(0, 8)}...`);
    
    const { data: testTask, error: testErr } = await supabase
      .from('tasks')
      .insert({
        title: 'TEST_CONTRACT_APK_' + Date.now(),
        description: 'Testing contract creation from APK without agent_id',
        budget_amount: 10.00,
        task_type: 'general',
        requester_id: testUserId,
        agent_id: null,  // ← Esto es lo crítico
        status: 'open',
        priority: 5,
        budget_currency: 'USD',
        payment_type: 'fixed',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (testErr) {
      console.log('\n   ❌ ERROR AL CREAR TASK:');
      console.log('   Mensaje:', testErr.message);
      console.log('   Código:', testErr.code);
      console.log('   Detalles:', testErr.details);
      console.log('   Hint:', testErr.hint);
    } else {
      console.log('   ✅ SUCCESS! Task creado:', testTask.id);
      console.log('   Limpiando task de prueba...');
      await supabase.from('tasks').delete().eq('id', testTask.id);
      console.log('   ✅ Task eliminado');
    }
  } else {
    console.log('   ⚠️  No hay usuarios para probar');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  FIN DE LA INVESTIGACIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
}

investigateContractError()
  .catch(err => {
    console.error('ERROR FATAL:', err);
    process.exit(1);
  });
