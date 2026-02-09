// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTO-APPROVE PROOFS CRON JOB
// Runs hourly to auto-approve proofs pending > 24 hours
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { createClient } = require('@supabase/supabase-js');

async function autoApproveExpiredProofs(supabaseClient) {
    console.log('🕐 Starting auto-approve cron job...');

    try {
        // Use provided supabase client or fail
        const supabase = supabaseClient;
        if (!supabase) {
            throw new Error('Supabase client not provided');
        }

        // Calculate cutoff time (24 hours ago)
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        const cutoffISO = cutoffTime.toISOString();

        console.log(`⏰ Cutoff time: ${cutoffISO}`);

        // Get expired proofs
        const { data: expiredProofs, error: selectError } = await supabase
            .from('task_proofs')
            .select('id, task_id, title, created_at')
            .eq('status', 'pending')
            .lt('created_at', cutoffISO);

        if (selectError) {
            console.error('❌ Error fetching expired proofs:', selectError);
            return;
        }

        if (!expiredProofs || expiredProofs.length === 0) {
            console.log('✅ No expired proofs found');
            return;
        }

        console.log(`📋 Found ${expiredProofs.length} expired proofs to auto-approve`);

        // Auto-approve each proof
        let approvedCount = 0;
        for (const proof of expiredProofs) {
            const { error: updateError } = await supabase
                .from('task_proofs')
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: '00000000-0000-0000-0000-000000000000', // System UUID
                    rejection_reason: null
                })
                .eq('id', proof.id);

            if (updateError) {
                console.error(`❌ Failed to approve proof ${proof.id}:`, updateError);
            } else {
                approvedCount++;
                console.log(`✅ Auto-approved proof: ${proof.title} (${proof.id})`);

                // Check if all proofs for this task are now approved
                const { data: taskProofs } = await supabase
                    .from('task_proofs')
                    .select('status')
                    .eq('task_id', proof.task_id);

                const allApproved = taskProofs.every(p => p.status === 'approved');

                if (allApproved) {
                    console.log(`🎯 All proofs approved for task ${proof.task_id} - ready for payment release`);
                    
                    // Optionally update task status
                    await supabase
                        .from('tasks')
                        .update({
                            status: 'COMPLETED',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', proof.task_id);
                }
            }
        }

        console.log(`✅ Auto-approve completed: ${approvedCount}/${expiredProofs.length} proofs approved`);

    } catch (error) {
        console.error('❌ Auto-approve cron error:', error);
        throw error;
    }
}

module.exports = { autoApproveExpiredProofs };

