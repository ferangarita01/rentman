/**
 * Init Command - Secure Agent Initialization (KYA)
 * Generates identity and stores in secure user directory
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { createClient } = require('@supabase/supabase-js');
const { generateKeyPair } = require('../lib/crypto');
const { saveIdentity, getConfigPath, getApiConfig } = require('../lib/secure-config');

async function initCommand() {
  console.log(chalk.blue.bold('\n🤖 Rentman CLI - Agent Initialization (KYA)\n'));

  // Get API config
  const apiConfig = getApiConfig();

  if (!apiConfig.supabaseKey) {
    console.error(chalk.red('\n❌ Error: SUPABASE_ANON_KEY not set'));
    console.log(chalk.yellow('→ Create .env file: cp .env.example .env'));
    console.log(chalk.yellow('→ Add your Supabase anon key to .env'));
    process.exit(1);
  }

  // 1. Ask for user credentials
  console.log(chalk.white('To link this Agent to your Developer Account, please log in:'));
  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Owner Email:',
      validate: (input) => input.includes('@') || 'Invalid email',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Owner Password:',
      validate: (input) => input.length >= 6 || 'Password too short',
    },
    {
      type: 'input',
      name: 'public_id',
      message: 'Public Agent ID (e.g. agent_01):',
      default: `agent_${Math.floor(Math.random() * 10000)}`,
    },
  ]);

  // 2. Authenticate with Supabase
  const spinner = ora('Authenticating...').start();

  const supabase = createClient(apiConfig.supabaseUrl, apiConfig.supabaseKey);

  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (authError || !user) {
    spinner.fail('Authentication failed');
    console.error(chalk.red(`\n❌ ${authError?.message || 'Login failed'}`));
    process.exit(1);
  }

  spinner.succeed(`Authenticated as ${user.email}`);

  // 3. Generate Ed25519 keypair
  spinner.start('Generating cryptographic keys...');
  const { publicKey, secretKey } = generateKeyPair();
  spinner.succeed('Keys generated');

  // 4. Check if agent already exists
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id')
    .eq('public_agent_id', credentials.public_id)
    .single();

  if (existingAgent) {
    spinner.fail('Agent already exists');
    console.error(chalk.red(`\n❌ Agent ID "${credentials.public_id}" is already registered`));
    console.log(chalk.yellow('→ Choose a different public_agent_id'));
    process.exit(1);
  }

  // 5. Register agent in database
  spinner.start('Registering agent on-chain...');

  const { data: agent, error: insertError } = await supabase
    .from('agents')
    .insert({
      public_agent_id: credentials.public_id,
      owner_id: user.id,
      public_key: publicKey,
      type: 'cli',
      name: `CLI Agent - ${credentials.public_id}`,
      is_active: true,
      permissions: ['create_task', 'read_tasks', 'hire_human', 'verify_proof'],
    })
    .select()
    .single();

  if (insertError) {
    spinner.fail('Registration failed');
    console.error(chalk.red(`\n❌ ${insertError.message}`));
    process.exit(1);
  }

  spinner.succeed('Agent registered successfully');

  // 6. Save identity to secure storage
  spinner.start('Saving identity...');

  const identity = {
    agent_id: agent.id,
    public_agent_id: credentials.public_id,
    public_key: publicKey,
    secret_key: secretKey,
    owner_id: user.id,
  };

  saveIdentity(identity);

  spinner.succeed('Identity saved securely');

  // 7. Success message
  console.log(chalk.green.bold('\n✅ Initialization Complete!\n'));
  console.log(chalk.white('Agent Details:'));
  console.log(chalk.cyan(`  • Agent ID: ${agent.id}`));
  console.log(chalk.cyan(`  • Public ID: ${credentials.public_id}`));
  console.log(chalk.cyan(`  • Owner: ${user.email}`));
  console.log(chalk.cyan(`  • Identity stored: ${getConfigPath()}`));

  console.log(chalk.yellow.bold('\n⚠️  SECURITY NOTES:'));
  console.log(chalk.yellow('  • Your identity is stored in your user directory'));
  console.log(chalk.yellow('  • Never share your secret key'));
  console.log(chalk.yellow('  • Keys are used to sign all API requests'));

  console.log(chalk.white.bold('\n📋 Next Steps:'));
  console.log(chalk.white('  1. Create a task: rentman post-mission task.json'));
  console.log(chalk.white('  2. Listen for contracts: rentman listen'));
  console.log(chalk.white('  3. Get help: rentman guide'));

  console.log('');
}

module.exports = initCommand;
