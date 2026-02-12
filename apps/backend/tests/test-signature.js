/**
 * UNIT TESTS FOR BACKEND SIGNATURE VERIFICATION
 * Tests cryptographic validation without needing full infrastructure
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { createClient } = require('@supabase/supabase-js');

// Test Configuration
const TEST_CASES = [
    {
        name: "Valid signature from known agent",
        shouldPass: true,
        setup: () => {
            // Generate keypair
            const keypair = nacl.sign.keyPair();
            const agent_id = "test-agent-123";
            const title = "Test Task";
            const timestamp = Date.now();
            const nonce = "abc123";
            
            // Sign message
            const message = `${title}:${agent_id}:${timestamp}:${nonce}`;
            const signature = nacl.sign.detached(
                naclUtil.decodeUTF8(message),
                keypair.secretKey
            );
            
            return {
                agent_id,
                title,
                timestamp,
                nonce,
                signature: naclUtil.encodeBase64(signature),
                public_key: naclUtil.encodeBase64(keypair.publicKey)
            };
        }
    },
    {
        name: "Invalid signature (tampered message)",
        shouldPass: false,
        setup: () => {
            const keypair = nacl.sign.keyPair();
            const agent_id = "test-agent-456";
            const title = "Original Title";
            const timestamp = Date.now();
            const nonce = "xyz789";
            
            // Sign with original title
            const message = `${title}:${agent_id}:${timestamp}:${nonce}`;
            const signature = nacl.sign.detached(
                naclUtil.decodeUTF8(message),
                keypair.secretKey
            );
            
            // Return with tampered title
            return {
                agent_id,
                title: "TAMPERED Title",
                timestamp,
                nonce,
                signature: naclUtil.encodeBase64(signature),
                public_key: naclUtil.encodeBase64(keypair.publicKey)
            };
        }
    },
    {
        name: "Wrong public key",
        shouldPass: false,
        setup: () => {
            const keypair1 = nacl.sign.keyPair();
            const keypair2 = nacl.sign.keyPair(); // Different keypair
            const agent_id = "test-agent-789";
            const title = "Test Task";
            const timestamp = Date.now();
            const nonce = "def456";
            
            // Sign with keypair1
            const message = `${title}:${agent_id}:${timestamp}:${nonce}`;
            const signature = nacl.sign.detached(
                naclUtil.decodeUTF8(message),
                keypair1.secretKey
            );
            
            // But return keypair2's public key
            return {
                agent_id,
                title,
                timestamp,
                nonce,
                signature: naclUtil.encodeBase64(signature),
                public_key: naclUtil.encodeBase64(keypair2.publicKey)
            };
        }
    }
];

// Verification function (same as backend)
function verifySignature(record, publicKey) {
    const message = `${record.title}:${record.agent_id}:${record.timestamp}:${record.nonce}`;
    const signatureBytes = naclUtil.decodeBase64(record.signature);
    const messageBytes = naclUtil.decodeUTF8(message);
    const publicKeyBytes = naclUtil.decodeBase64(publicKey);
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}

// Run tests
console.log('\n🔐 SIGNATURE VERIFICATION UNIT TESTS\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

TEST_CASES.forEach((testCase, index) => {
    const data = testCase.setup();
    const result = verifySignature(data, data.public_key);
    
    const success = (result === testCase.shouldPass);
    const status = success ? '✅ PASS' : '❌ FAIL';
    
    console.log(`\n[${index + 1}] ${testCase.name}`);
    console.log(`   Expected: ${testCase.shouldPass ? 'VALID' : 'INVALID'}`);
    console.log(`   Got:      ${result ? 'VALID' : 'INVALID'}`);
    console.log(`   ${status}`);
    
    if (success) {
        passed++;
    } else {
        failed++;
        console.log(`   ⚠️  Test failed unexpectedly!`);
    }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
