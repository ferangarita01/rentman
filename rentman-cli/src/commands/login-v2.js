const { createClient } = require('@supabase/supabase-js');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Constants (Should eventually move to a unified config)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co';
// Anon key is safe to expose in CLI as it's public.
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

const SESSION_FILE = path.join(process.cwd(), 'rentman_session.json');

async function loginV2() {
    console.log(chalk.bold.blue('\nRentman CLI - Login V2 (Direct Supabase)\n'));

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: input => input.includes('@') || 'Please enter a valid email'
        },
        {
            type: 'password',
            name: 'password',
            message: 'Password:',
            mask: '*'
        }
    ]);

    console.log(chalk.yellow('\n[*] Authenticating with Rentman Protocol...'));

    const { data, error } = await supabase.auth.signInWithPassword({
        email: answers.email,
        password: answers.password
    });

    if (error) {
        console.error(chalk.red(`[x] Login Failed: ${error.message}`));
        process.exit(1);
    }

    // Save Session
    const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user_id: data.user.id,
        email: data.user.email,
        expires_at: data.session.expires_at
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));

    console.log(chalk.green(`[+] Success! Welcome, ${data.user.email}`));
    console.log(chalk.gray(`[i] Session saved to: ${SESSION_FILE}`));
    console.log(chalk.blue(`\nYou can now use generalized commands.`));
}

module.exports = loginV2;
