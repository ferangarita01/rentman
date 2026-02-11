const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uoekolfgbbmvhzsfkjef.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNDM3NSwiZXhwIjoyMDg1OTAwMzc1fQ.RWcX3r44l1mmJOxOJHyaOR_Tih1mJ6ZEw1z2fkY1mIQ'
);

console.log('🔴 REAL-TIME LOGGING ACTIVADO - Monitoreando TODO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⏰ Timestamp:', new Date().toISOString());
console.log('');

const tables = [
  'tasks', 'transactions', 'escrow_transactions', 
  'profiles', 'agents', 'agent_commissions',
  'messages', 'task_assignments'
];

tables.forEach(table => {
  supabase
    .channel('realtime:' + table)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: table },
      (payload) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 EVENTO DB:', payload.eventType.toUpperCase());
        console.log('📋 Tabla:', table);
        console.log('⏰ Timestamp:', new Date().toISOString());
        console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
      }
    )
    .subscribe((status) => {
      console.log('✅ Suscrito a ' + table + ':', status);
    });
});

console.log('');
console.log('🎯 Monitoreando cambios en:', tables.join(', '));
console.log('💡 Presiona Ctrl+C para detener');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
