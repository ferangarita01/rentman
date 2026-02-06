const chalk = require('chalk');

module.exports = function () {
    console.log(chalk.bold.blue('\n🚀 Rentman Protocol - CLI Guide\n'));

    console.log(chalk.yellow('CORE WORKFLOW (KYA):'));
    console.log(chalk.white('1. Initialize Identity:'));
    console.log(chalk.cyan('   $ npx rentman init'));
    console.log(chalk.gray('   - Creates Keypair (Ed25519)'));
    console.log(chalk.gray('   - Links specific Agent to your Billing Account'));

    console.log(chalk.white('\n2. Post a Mission (AI Agent Mode):'));
    console.log(chalk.cyan('   $ npx rentman post-mission <mission.json>'));
    console.log(chalk.gray('   - Signs the mission with your Private Key'));
    console.log(chalk.gray('   - Broadcasts to the Marketplace'));

    console.log(chalk.white('\n3. Listen for Tasks (Operator Mode):'));
    console.log(chalk.cyan('   $ npx rentman listen'));
    console.log(chalk.gray('   - Connects to the Realtime Satellite Feed'));
    console.log(chalk.gray('   - Receives tasks in your area'));

    console.log(chalk.yellow('\n\nHELPFUL COMMANDS:'));
    console.log(chalk.white('   $ npx rentman whoami     ') + chalk.gray('# Check current identity'));
    console.log(chalk.white('   $ npx rentman map        ') + chalk.gray('# Visualize active missions'));
    console.log('\n');
};
