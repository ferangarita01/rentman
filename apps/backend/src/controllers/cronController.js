const { getSupabase } = require('../config/supabase');
const { autoApproveExpiredProofs } = require('../services/cronService');

const autoApprove = async (req, res) => {
    try {
        console.log('⏰ Cron triggered: auto-approve');
        const supabase = getSupabase();

        await autoApproveExpiredProofs(supabase);

        res.json({ success: true, message: 'Auto-approve completed' });
    } catch (error) {
        console.error('❌ Cron error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { autoApprove };
