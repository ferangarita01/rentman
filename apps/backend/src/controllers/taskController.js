const { getSupabase } = require('../config/supabase');
const { validateProofWithAI } = require('../services/aiService');
const { sendNotification } = require('../services/notificationService');

const uploadProof = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { taskId, humanId, proofType, title, description, fileUrl, locationData } = req.body;

        if (!taskId || !humanId || !proofType || !title) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.assigned_human_id !== humanId) return res.status(403).json({ error: 'Not assigned to this task' });

        let aiValidation = null;
        if ((proofType === 'photo' || proofType === 'video') && fileUrl) {
            aiValidation = await validateProofWithAI(fileUrl, task);
        }

        const { data: proof, error: proofError } = await supabase
            .from('task_proofs')
            .insert({
                task_id: taskId,
                human_id: humanId,
                proof_type: proofType,
                title: title,
                description: description,
                file_url: fileUrl,
                location_data: locationData,
                ai_validation: aiValidation,
                status: 'pending'
            })
            .select()
            .single();

        if (proofError) {
            console.error('❌ Proof insert error:', proofError);
            return res.status(500).json({ error: 'Failed to save proof' });
        }

        // NOTIFICATION: Notify Requester
        await sendNotification(
            task.requester_id,
            'Nueva Prueba de Trabajo',
            `El operador ha subido una prueba: ${title}`,
            { taskId: taskId, type: 'proof_uploaded' }
        );

        res.json({
            success: true,
            proofId: proof.id,
            aiValidation: aiValidation,
            message: 'Proof uploaded successfully'
        });

    } catch (error) {
        console.error('❌ Proof upload error:', error);
        res.status(500).json({ error: error.message });
    }
};

const reviewProof = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { proofId, action, reviewerId, rejectionReason } = req.body;

        if (!proofId || !action || !reviewerId) return res.status(400).json({ error: 'proofId, action, and reviewerId required' });
        if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'action must be approve or reject' });

        const { data: proof } = await supabase
            .from('task_proofs')
            .select('*, tasks(*)')
            .eq('id', proofId)
            .single();

        if (!proof) return res.status(404).json({ error: 'Proof not found' });
        if (proof.tasks.requester_id !== reviewerId) return res.status(403).json({ error: 'Only requester can review' });

        const updateData = {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString()
        };

        if (action === 'reject' && rejectionReason) {
            updateData.rejection_reason = rejectionReason;
        }

        await supabase.from('task_proofs').update(updateData).eq('id', proofId);

        // NOTIFICATION: Notify Worker
        const statusMsg = action === 'approve' ? 'Aprobada ✅' : 'Rechazada ❌';
        await sendNotification(
            proof.human_id,
            `Prueba ${statusMsg}`,
            `Tu prueba "${proof.title}" ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}.`,
            { taskId: proof.task_id, type: 'proof_reviewed' }
        );

        res.json({ success: true, message: `Proof ${action}d`, proofId: proofId });

    } catch (error) {
        console.error('❌ Proof review error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadProof, reviewProof };
