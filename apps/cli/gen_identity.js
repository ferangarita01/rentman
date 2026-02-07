const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const fs = require('fs');
const path = require('path');

const keyPair = nacl.sign.keyPair();
const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey);
const secretKeyBase64 = naclUtil.encodeBase64(keyPair.secretKey);
const agentUUID = "55ea7c98-132d-450b-8712-4f369d763261"; // Fixed UUID for testing

const identity = {
    agent_id: agentUUID,
    public_agent_id: "agent_test_01",
    public_key: publicKeyBase64,
    secret_key: secretKeyBase64,
    owner_id: null, // Null allowed
    api_url: "https://uoekolfgbbmvhzsfkjef.supabase.co"
};

fs.writeFileSync('rentman_identity.json', JSON.stringify(identity, null, 2));

console.log('SQL_TO_RUN:');
console.log(`INSERT INTO agents (id, name, public_agent_id, public_key, status, type) VALUES ('${agentUUID}', 'Test Agent 01', 'agent_test_01', '${publicKeyBase64}', 'ONLINE', 'CLI_AGENT') ON CONFLICT (id) DO UPDATE SET public_key = '${publicKeyBase64}';`);
