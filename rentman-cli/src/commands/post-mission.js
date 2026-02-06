const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const chalk = require('chalk');
const { createClient } = require('@supabase/supabase-js');

// Config
const IDENTITY_FILE = path.join(process.cwd(), 'rentman_identity.json');

async function postMission(file) {
    console.log(chalk.bold.blue('\nRentman CLI - Post Mission (Signed)\n'));

    // 1. Load Identity (Env Vars Priority > Local File)
    let identity;

    if (process.env.RENTMAN_SECRET_KEY && process.env.RENTMAN_AGENT_ID) {
        console.log(chalk.gray('[+] Identity loaded from Environment Variables (Secure)'));
        identity = {
            agent_id: process.env.RENTMAN_AGENT_ID,
            secret_key: process.env.RENTMAN_SECRET_KEY,
            api_url: process.env.RENTMAN_API_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co'
        };
    } else if (fs.existsSync(IDENTITY_FILE)) {
        identity = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf-8'));
        console.log(chalk.gray(`[+] Identity loaded from file: ${identity.public_agent_id}`));
    } else {
        console.error(chalk.red('[!] Identity not found. Set RENTMAN_SECRET_KEY or run `rentman init`.'));
        process.exit(1);
    }

    // 2. Load Task Payload
    if (!fs.existsSync(file)) {
        console.error(chalk.red(`[x] File not found: ${file}`));
        process.exit(1);
    }
    const taskData = JSON.parse(fs.readFileSync(file, 'utf-8'));

    // Add Timestamp and Nonce to prevent Replay Attacks
    const payload = {
        ...taskData,
        agent_id: identity.agent_id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
    };

    // 3. Sign Payload
    console.log(chalk.yellow('[*] Signing Mission...'));
    const message = JSON.stringify(payload);
    // Decode secret key from Base64
    const secretKey = naclUtil.decodeBase64(identity.secret_key);
    // Sign
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(message), secretKey);
    const signatureBase64 = naclUtil.encodeBase64(signature);

    console.log(chalk.green(`[+] Signature generated.`));

    // 4. Send to Supabase
    // Using identity.api_url or fallback
    const supabaseUrl = identity.api_url || process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(chalk.yellow('[*] Broadcasting to Rentman Protocol...'));

    // Fix: Format location as PostGIS WKT `POINT(lng lat)`
    // And ensure only existing columns are sent
    const locationWKT = (payload.location && payload.location.lat && payload.location.lng)
        ? `POINT(${payload.location.lng} ${payload.location.lat})`
        : null;

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title: payload.title,
            description: payload.description,
            status: 'open', // Lowercase to satisfy constraint
            budget_amount: payload.budget_amount,
            task_type: payload.task_type || 'general',
            location: locationWKT, // PostGIS
            location_address: payload.location?.address,
            // KYA Fields
            agent_id: identity.agent_id, // Link to Agent
            signature: signatureBase64,  // Proof of Author
            payload_hash: 'TODO_HASH',   // Optional integrity check
            metadata: payload            // Full payload
        })
        .select()
        .single();

    if (error) {
        console.error(chalk.red('[x] Broadcast Failed:'), error.message);
        return;
    }

    console.log(chalk.bold.green(`\n[SUCCESS] Mission Posted!`));
    console.log(chalk.white(`ID: ${data.id}`));
    console.log(chalk.white(`Budget: $${data.budget_amount}`));
    console.log(chalk.gray(`Verify at: ${supabaseUrl}/dashboard`));
}

module.exports = postMission;
