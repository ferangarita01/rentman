const { getStripe } = require('../config/stripe');
const { getSupabase } = require('../config/supabase');

const healthCheck = (req, res) => {
    try {
        const stripe = getStripe();
        const supabase = getSupabase();

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            services: {
                stripe: !!stripe,
                supabase: !!supabase
            }
        });
    } catch (e) {
        res.status(500).json({ status: 'unhealthy', error: e.message });
    }
};

const rootCheck = (req, res) => {
    res.status(200).send('Rentman Backend is Active 🧠');
};

const debugDbCheck = async (req, res) => {
    try {
        console.log('🔍 Debug DB Check Initiated');
        const supabase = getSupabase();

        const { data: simpleData, error: simpleError } = await supabase
            .from('transactions')
            .select('*')
            .limit(5);

        const formatError = (err) => {
            if (!err) return null;
            return {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code,
                name: err.name,
                full: JSON.stringify(err, Object.getOwnPropertyNames(err))
            };
        };

        res.json({
            status: 'ok',
            check_time: new Date().toISOString(),
            query_result: {
                data: simpleData,
                count: simpleData ? simpleData.length : 0,
                error: formatError(simpleError)
            },
            env: {
                has_supabase: !!supabase,
                service_role_loaded: true
            }
        });
    } catch (e) {
        console.error('Debug Check Failed:', e);
        res.status(500).json({ error: e.message });
    }
};

module.exports = { healthCheck, rootCheck, debugDbCheck };
