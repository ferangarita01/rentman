// Using native fetch in Node.js 18+

const SUPABASE_URL = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ';

async function investigateDB() {
  console.log('🔍 INVESTIGACIÓN COMPLETA DEL PROBLEMA\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Ver cuántos agentes hay
    console.log('\n📊 1. CONTEO DE AGENTES:');
    const agentsRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=count`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    const agentsCount = agentsRes.headers.get('content-range');
    console.log(`   Total agentes: ${agentsCount}`);
    
    // 2. Ver agentes actuales
    console.log('\n🤖 2. AGENTES EN LA BASE DE DATOS:');
    const agentsListRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=id,name,type,status`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const agentsList = await agentsListRes.json();
    console.log(JSON.stringify(agentsList, null, 2));
    
    // 3. Ver perfiles (humanos)
    console.log('\n👤 3. PERFILES DE HUMANOS:');
    const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,is_agent&limit=5`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const profiles = await profilesRes.json();
    console.log(JSON.stringify(profiles, null, 2));
    
    // 4. Ver últimas tasks
    console.log('\n📋 4. ÚLTIMAS TASKS (incluye fallidos):');
    const tasksRes = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=id,title,agent_id,requester_id,status,created_at&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const tasks = await tasksRes.json();
    console.log(JSON.stringify(tasks, null, 2));
    
    // 5. Ver constraint definition
    console.log('\n🔒 5. CONSTRAINT tasks_agent_id_fkey:');
    const constraintRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_name = 'tasks_agent_id_fkey';
        `
      })
    });
    
    if (constraintRes.ok) {
      const constraint = await constraintRes.json();
      console.log(JSON.stringify(constraint, null, 2));
    } else {
      console.log('   No se pudo obtener vía RPC, constraint definido en schema');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ INVESTIGACIÓN COMPLETA\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

investigateDB();
