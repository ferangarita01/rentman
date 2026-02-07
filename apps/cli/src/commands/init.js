const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');

// Config
const IDENTITY_FILE = path.join(process.cwd(), 'rentman_identity.json');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk'; // Hardcoded for prototype ease

// Helper to save identity
function saveIdentity(identity) {
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2));
    console.log(chalk.green(`\n[+] Identity saved to ${IDENTITY_FILE}`));
    console.log(chalk.yellow(`[!] KEEP THIS FILE SECURE. DO NOT COMMIT IT.`));
}

async function initCommand() {
    console.log(chalk.blue.bold('\nRentman CLI - Agent Initialization (KYA Setup)\n'));

    // 1. Check existing identity
    if (fs.existsSync(IDENTITY_FILE)) {
        const overwrite = await inquirer.prompt([{
            type: 'confirm',
            name: 'value',
            message: 'An identity file already exists. Overwrite?',
            default: false
        }]);
        if (!overwrite.value) {
            console.log(chalk.red('Aborted.'));
            return;
        }
    }

    // 2. Login to Link Owner
    console.log(chalk.white('To link this Agent to your Developer Account, please log in:'));
    const credentials = await inquirer.prompt([
        { type: 'input', name: 'email', message: 'Owner Email:' },
        { type: 'password', name: 'password', message: 'Owner Password:' },
        { type: 'input', name: 'public_id', message: 'Public Agent ID (e.g. agent_01):', default: `agent_${Math.floor(Math.random() * 10000)}` }
    ]);

    // Initialize Supabase (Anon)
    // NOTE: Ideally we fetch the ANON key from a public config or user input. 
    // For this environment, we might need to ask the user for it or bake it in if it's public.
    // Assuming the user knows the project URL/Key or we have a default for the official platform.
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
    });

    if (authError || !user) {
        console.error(chalk.red('\n[x] Login Failed:'), authError?.message);
        return;
    }

    console.log(chalk.green(`\n[+] Authenticated as ${user.email} (${user.id})`));

    // 3. Generate Keys
    console.log(chalk.yellow('[*] Generating Ed25519 Keypair...'));
    const keyPair = nacl.sign.keyPair();
    const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
    const secretKey = naclUtil.encodeBase64(keyPair.secretKey);

    // 4. Register Agent in DB
    console.log(chalk.yellow('[*] Registering Agent on-chain (Database)...'));

    // Check if agent ID exists
    const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('public_agent_id', credentials.public_id)
        .single();

    if (existingAgent) {
        console.log(chalk.red(`[x] Agent ID '${credentials.public_id}' is already taken.`));
        return;
    }

    const { data: agent, error: dbError } = await supabase
        .from('agents')
        .upsert({
            owner_id: user.id,
            public_agent_id: credentials.public_id,
            public_key: publicKey,
            name: credentials.public_id, // Default name
            status: 'ONLINE',
            type: 'CLI_AGENT',
            wallet_address: '0x' + Buffer.from(nacl.hash(keyPair.publicKey)).toString('hex').slice(0, 40) // Mock derived address
        })
        .select()
        .single();

    if (dbError) {
        console.error(chalk.red('[x] Registration Failed:'), dbError.message);
        return;
    }

    // 5. Save Identity
    saveIdentity({
        agent_id: agent.id,
        public_agent_id: credentials.public_id,
        public_key: publicKey,
        secret_key: secretKey,
        owner_id: user.id,
        api_url: SUPABASE_URL
    });

    console.log(chalk.blue.bold(`\n[SUCCESS] Agent '${agent.public_agent_id}' is ready.`));
    console.log(chalk.white(`Run 'rentman whoami' to verify.`));
}

module.exports = initCommand;
