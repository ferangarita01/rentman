#!/usr/bin/env node

/**
 * Migration Script
 * Migrates old rentman_identity.json to secure Conf storage
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { saveIdentity, getConfigPath } = require('./src/lib/secure-config');

const OLD_IDENTITY_FILE = path.join(process.cwd(), 'rentman_identity.json');
const BACKUP_FILE = path.join(process.cwd(), '_BACKUP_rentman_identity.json.bak');

console.log(chalk.blue.bold('\n🔄 Rentman CLI - Identity Migration Tool\n'));
console.log(chalk.gray('This tool migrates your identity from local JSON to secure storage\n'));

// Check if old file exists
if (!fs.existsSync(OLD_IDENTITY_FILE)) {
  console.log(chalk.yellow('⚠️  No rentman_identity.json found in current directory'));
  console.log(chalk.gray('   Nothing to migrate'));
  process.exit(0);
}

try {
  // Read old identity
  console.log(chalk.white('Reading old identity file...'));
  const oldIdentity = JSON.parse(fs.readFileSync(OLD_IDENTITY_FILE, 'utf-8'));

  // Validate structure
  if (!oldIdentity.agent_id || !oldIdentity.secret_key) {
    console.error(chalk.red('❌ Invalid identity file format'));
    process.exit(1);
  }

  console.log(chalk.green(`✓ Found agent: ${oldIdentity.public_agent_id || oldIdentity.agent_id}`));

  // Save to secure storage
  console.log(chalk.white('\nMigrating to secure storage...'));
  
  const identity = {
    agent_id: oldIdentity.agent_id,
    public_agent_id: oldIdentity.public_agent_id,
    secret_key: oldIdentity.secret_key,
    public_key: oldIdentity.public_key,
    owner_id: oldIdentity.owner_id,
  };

  saveIdentity(identity);

  console.log(chalk.green('✓ Identity migrated successfully'));
  console.log(chalk.cyan(`   New location: ${getConfigPath()}`));

  // Backup old file
  console.log(chalk.white('\nBacking up old file...'));
  fs.copyFileSync(OLD_IDENTITY_FILE, BACKUP_FILE);
  console.log(chalk.green(`✓ Backup created: ${BACKUP_FILE}`));

  // Ask to delete
  console.log(chalk.yellow.bold('\n⚠️  SECURITY RECOMMENDATION:'));
  console.log(chalk.yellow('   Delete the old identity file to prevent accidental commits'));
  console.log(chalk.white('\nTo delete (recommended):'));
  console.log(chalk.gray(`   rm ${OLD_IDENTITY_FILE}`));
  console.log(chalk.gray('   rm _BACKUP_rentman_identity.json.bak'));

  console.log(chalk.green.bold('\n✅ Migration Complete!'));
  console.log(chalk.white('\nYour identity is now securely stored in:'));
  console.log(chalk.cyan(`  ${getConfigPath()}`));
  console.log('');

} catch (error) {
  console.error(chalk.red(`\n❌ Migration failed: ${error.message}`));
  process.exit(1);
}
