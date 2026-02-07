const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const chalk = require('chalk');
const { createClient } = require('@supabase/supabase-js');
const inquirer = require('inquirer');
const Conf = new (require('conf'))();

// Config
const IDENTITY_FILE = path.join(process.cwd(), 'rentman_identity.json');

async function postMission(file) {
    console.log(chalk.bold.blue('\nRentman CLI - Post Mission\n'));

    // 1. Load Identity (Priority: Env > Conf > Local File)
    let identity;
    const confIdentity = {
        agent_id: Conf.get('agent_id'),
        secret_key: Conf.get('secret_key'),
        api_url: Conf.get('api_url')
    };

    if (process.env.RENTMAN_SECRET_KEY && process.env.RENTMAN_AGENT_ID) {
        console.log(chalk.gray('[+] Identity loaded from Environment Variables (Secure)'));
        identity = {
            agent_id: process.env.RENTMAN_AGENT_ID,
            secret_key: process.env.RENTMAN_SECRET_KEY,
            api_url: process.env.RENTMAN_API_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co'
        };
    } else if (confIdentity.agent_id && confIdentity.secret_key) {
        // Silent load from Conf
        identity = confIdentity;
    } else if (fs.existsSync(IDENTITY_FILE)) {
        identity = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf-8'));
        console.log(chalk.gray(`[+] Identity loaded from file: ${identity.public_agent_id}`));
    } else {
        console.error(chalk.red('[!] Identity not found. Run `rentman config set ...` or set ENV vars.'));
        process.exit(1);
    }

    // 2. Load Task Payload (File or Wizard)
    let taskData = {};
    if (file) {
        if (!fs.existsSync(file)) {
            console.error(chalk.red(`[x] File not found: ${file}`));
            process.exit(1);
        }
        taskData = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } else {
        // Wizard Mode
        console.log(chalk.cyan('✨ Interactive Mission Creation\n'));
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Mission Title:',
                validate: input => input.length > 0
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description:'
            },
            {
                type: 'list',
                name: 'task_type',
                message: 'Type:',
                choices: ['verification', 'delivery', 'repair', 'representation', 'creative', 'communication']
            },
            {
                type: 'number',
                name: 'budget_amount',
                message: 'Budget ($):',
                default: 15
            },
            {
                type: 'confirm',
                name: 'hasLocation',
                message: 'Is specific location required?',
                default: false
            },
            {
                type: 'input',
                name: 'location.address',
                message: 'Address/City:',
                when: (answers) => answers.hasLocation
            },
            {
                type: 'number',
                name: 'location.lat',
                message: 'Latitude:',
                when: (answers) => answers.hasLocation,
                default: 0
            },
            {
                type: 'number',
                name: 'location.lng',
                message: 'Longitude:',
                when: (answers) => answers.hasLocation,
                default: 0
            }
        ]);
        taskData = answers;
    }

    // Add Timestamp and Nonce (Replay Attack Prevention)
    const payload = {
        ...taskData,
        agent_id: identity.agent_id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
    };

    const ora = (await import('ora')).default;
    const spinner = ora('Cryptographic Signing...').start();

    // 3. Sign Payload
    try {
        const message = `${payload.title}:${payload.agent_id}:${payload.timestamp}:${payload.nonce}`;
        const secretKey = naclUtil.decodeBase64(identity.secret_key);
        const signature = nacl.sign.detached(naclUtil.decodeUTF8(message), secretKey);
        const signatureBase64 = naclUtil.encodeBase64(signature);

        spinner.succeed('Signature generated');
        spinner.start('Broadcasting to Rentman Network...');

        // 4. Send to Supabase
        const supabaseUrl = identity.api_url || process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

        const supabase = createClient(supabaseUrl, supabaseKey);

        const locationWKT = (payload.location && payload.location.lat && payload.location.lng)
            ? `POINT(${payload.location.lng} ${payload.location.lat})`
            : null;

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title: payload.title,
                description: payload.description,
                status: 'open',
                budget_amount: payload.budget_amount,
                task_type: payload.task_type || 'general',
                location: locationWKT,
                location_address: payload.location?.address,
                agent_id: identity.agent_id,
                signature: signatureBase64,
                metadata: payload
            })
            .select()
            .single();

        if (error) {
            spinner.fail('Broadcast Failed');
            throw error;
        }

        spinner.succeed('Mission Posted Successfully!');

        const Table = require('cli-table3');
        const table = new Table();
        table.push(
            { 'ID': chalk.cyan(data.id) },
            { 'Title': chalk.white(data.title) },
            { 'Budget': chalk.green(`$${data.budget_amount}`) },
            { 'Status': data.status }
        );
        console.log(table.toString());
        console.log(chalk.gray(`\nVerify at: ${supabaseUrl}/dashboard`));

    } catch (err) {
        spinner.stop();
        console.error(chalk.red('\n[!] Error:'), err.message);
    }
}

module.exports = postMission;
