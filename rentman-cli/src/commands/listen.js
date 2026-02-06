const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

/**
 * Listen for real-time updates on a specific task
 * @param {string} taskId - The task UUID to watch
 */
module.exports = async (taskId) => {
    console.log(`\n👁️  Watching task: ${taskId}`);
    console.log('─'.repeat(50));
    console.log('Listening for status changes... (Press Ctrl+C to stop)\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // First, get current task status
    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error(`❌ Task not found: ${taskId}`);
        process.exit(1);
    }

    console.log(`📋 Current Status: ${task.status}`);
    console.log(`📍 Title: ${task.title}`);
    console.log(`💰 Budget: $${task.budget_amount}`);
    console.log('');

    // Subscribe to changes
    const channel = supabase
        .channel(`task-${taskId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'tasks',
                filter: `id=eq.${taskId}`
            },
            (payload) => {
                const newStatus = payload.new.status;
                const oldStatus = payload.old?.status;
                const timestamp = new Date().toLocaleTimeString();

                console.log(`[${timestamp}] 📡 Status Update: ${oldStatus} → ${newStatus}`);

                if (newStatus === 'ASSIGNED') {
                    console.log(`  👤 Human accepted: ${payload.new.human_id || 'Unknown'}`);
                } else if (newStatus === 'IN_PROGRESS') {
                    console.log(`  🏃 Human is working on the task`);
                } else if (newStatus === 'COMPLETED') {
                    console.log(`  ✅ Task completed!`);
                    if (payload.new.proof_urls?.length > 0) {
                        console.log(`  📸 Proof: ${payload.new.proof_urls.join(', ')}`);
                    }
                    console.log('\n🎉 Mission accomplished! Exiting...');
                    process.exit(0);
                } else if (newStatus === 'FAILED') {
                    console.log(`  ❌ Task failed`);
                    process.exit(1);
                }

                console.log('');
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('🔗 Connected to real-time updates');
            } else if (status === 'CLOSED') {
                console.log('🔌 Connection closed');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Channel error');
                process.exit(1);
            }
        });

    // Keep process alive
    process.on('SIGINT', () => {
        console.log('\n👋 Stopping listener...');
        supabase.removeChannel(channel);
        process.exit(0);
    });
};
