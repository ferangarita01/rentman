const { getSupabase } = require('../config/supabase');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

async function updateTaskStatus(taskId, status, metadataUpdate = {}) {
    const supabase = getSupabase();
    await supabase.from('tasks').update({
        status: status,
        metadata: metadataUpdate
    }).eq('id', taskId);
}

async function verifyTaskSignature(record) {
    const supabase = getSupabase();

    // Fetch Agent
    const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('public_key')
        .eq('id', record.agent_id)
        .single();

    if (agentError || !agent) {
        throw new Error('Agent not found');
    }

    const signature = record.signature;
    const payload = record.metadata;

    if (!signature || !payload) {
        throw new Error('Missing signature or payload');
    }

    // Reconstruct message
    const message = `${record.title}:${record.agent_id}:${payload.timestamp}:${payload.nonce}`;
    const signatureBytes = naclUtil.decodeBase64(signature);
    const messageBytes = naclUtil.decodeUTF8(message);
    const publicKeyBytes = naclUtil.decodeBase64(agent.public_key);

    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!verified) {
        throw new Error('Signature verification failed');
    }

    return true;
}

module.exports = { updateTaskStatus, verifyTaskSignature };
