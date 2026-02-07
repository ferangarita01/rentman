#!/usr/bin/env node
/**
 * INTEGRATION TEST: CLI → Supabase
 * Tests task creation without backend/webhook processing
 */

const { createClient } = require('@supabase/supabase-js');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

const SUPABASE_URL = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

async function runIntegrationTest() {
    console.log('\n🔗 INTEGRATION TEST: CLI → Supabase\n');
    console.log('='.repeat(60));
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Generate test agent
    const keypair = nacl.sign.keyPair();
    const testAgentId = `test-agent-${Date.now()}`;
    const publicKey = naclUtil.encodeBase64(keypair.publicKey);
    const secretKey = keypair.secretKey;
    
    console.log(`\n[1] Registering test agent: ${testAgentId}`);
    
    try {
        const { data: agent, error } = await supabase
            .from('agents')
            .insert({
                id: testAgentId,
                public_key: publicKey,
                email: `test-${Date.now()}@rentman.test`
            })
            .select()
            .single();
        
        if (error) throw error;
        console.log('   ✅ Agent registered');
        testsPassed++;
    } catch (err) {
        console.log('   ❌ Failed:', err.message);
        testsFailed++;
        process.exit(1);
    }
    
    // Create signed task
    console.log('\n[2] Creating signed task');
    
    const taskData = {
        title: `Integration Test ${new Date().toISOString()}`,
        description: 'Automated integration test',
        task_type: 'verification',
        budget_amount: 10,
        agent_id: testAgentId,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
    };
    
    // Sign
    const message = `${taskData.title}:${taskData.agent_id}:${taskData.timestamp}:${taskData.nonce}`;
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(message), secretKey);
    const signatureBase64 = naclUtil.encodeBase64(signature);
    
    try {
        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                title: taskData.title,
                description: taskData.description,
                task_type: taskData.task_type,
                budget_amount: taskData.budget_amount,
                agent_id: taskData.agent_id,
                signature: signatureBase64,
                metadata: taskData,
                status: 'open'
            })
            .select()
            .single();
        
        if (error) throw error;
        console.log('   ✅ Task created:', task.id);
        testsPassed++;
        
        // Verify task is readable
        console.log('\n[3] Verifying task is readable');
        
        const { data: readTask, error: readError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task.id)
            .single();
        
        if (readError) throw readError;
        
        if (readTask.signature !== signatureBase64) {
            throw new Error('Signature mismatch after read');
        }
        
        console.log('   ✅ Task readable and signature intact');
        testsPassed++;
        
        // Cleanup
        console.log('\n[4] Cleanup test data');
        
        await supabase.from('tasks').delete().eq('id', task.id);
        await supabase.from('agents').delete().eq('id', testAgentId);
        
        console.log('   ✅ Cleanup complete');
        testsPassed++;
        
    } catch (err) {
        console.log('   ❌ Failed:', err.message);
        testsFailed++;
        
        // Cleanup on failure
        try {
            await supabase.from('agents').delete().eq('id', testAgentId);
        } catch {}
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(60) + '\n');
    
    process.exit(testsFailed > 0 ? 1 : 0);
}

runIntegrationTest().catch(err => {
    console.error('💥 Unhandled error:', err);
    process.exit(1);
});
