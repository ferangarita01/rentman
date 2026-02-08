/**
 * Rentman CLI - Main Entry Point
 * Secure, production-ready version
 */

require('dotenv').config();

const { Command } = require('commander');
const chalk = require('chalk');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

// Check for updates
updateNotifier({ pkg }).notify();

const program = new Command();

program
  .name('rentman')
  .description('CLI tool for AI agents to hire humans via Rentman marketplace')
  .version(pkg.version);

// ============================================
// Core Commands
// ============================================

program
  .command('init')
  .description('Initialize agent identity (KYA) and link to owner account')
  .action(require('./commands/init-secure'));

program
  .command('post-mission [file]')
  .description('Create a task in the marketplace (from JSON file or interactive)')
  .alias('post')
  .action(require('./commands/post-mission-secure'));

program
  .command('listen <taskId>')
  .description('Listen for real-time updates on a task')
  .alias('watch')
  .action(require('./commands/listen'));

program
  .command('config <key> [value]')
  .description('Get/set configuration values')
  .action(require('./commands/config'));

program
  .command('legal [type]')
  .description('View legal documents (privacy, terms)')
  .action(require('./commands/legal'));

program
  .command('guide')
  .description('Show the Rentman workflow guide')
  .action(require('./commands/guide'));

// ============================================
// Task Management
// ============================================

program
  .command('task:list')
  .description('List available tasks in the marketplace')
  .option('-s, --status <status>', 'Filter by status (open, in_progress, completed)')
  .option('-t, --type <type>', 'Filter by task type')
  .action(async (options) => {
    try {
      const { getTasks } = require('./lib/api');
      const ora = (await import('ora')).default;
      const Table = require('cli-table3');

      const spinner = ora('Fetching tasks...').start();

      const response = await getTasks({
        status: options.status,
        task_type: options.type,
      });

      spinner.stop();

      if (response.success && response.data && response.data.length > 0) {
        const table = new Table({
          head: [
            chalk.cyan('ID'),
            chalk.cyan('Type'),
            chalk.cyan('Title'),
            chalk.cyan('Budget'),
            chalk.cyan('Status'),
          ],
        });

        const icons = {
          delivery: '📦',
          verification: '✅',
          repair: '🔧',
          representation: '👤',
          creative: '🎨',
          communication: '📞',
        };

        response.data.forEach((task) => {
          const icon = icons[task.task_type] || '📋';
          table.push([
            task.id.substring(0, 8) + '...',
            `${icon} ${task.task_type}`,
            task.title.substring(0, 30),
            chalk.green(`$${task.budget_amount}`),
            task.status,
          ]);
        });

        console.log(table.toString());
        console.log(
          chalk.gray(`\nShowing ${response.data.length} tasks (Page ${response.pagination?.page || 1})`)
        );
      } else {
        console.log(chalk.yellow('No tasks found.'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('task:view <taskId>')
  .description('View details of a specific task')
  .action(async (taskId) => {
    try {
      const { getTask } = require('./lib/api');
      const ora = (await import('ora')).default;

      const spinner = ora('Fetching task...').start();
      const response = await getTask(taskId);
      spinner.stop();

      const task = response.data;

      console.log(chalk.bold.blue('\n📋 Task Details\n'));
      console.log(chalk.white('ID:          ') + chalk.cyan(task.id));
      console.log(chalk.white('Title:       ') + chalk.cyan(task.title));
      console.log(chalk.white('Type:        ') + chalk.cyan(task.task_type));
      console.log(chalk.white('Status:      ') + chalk.cyan(task.status));
      console.log(chalk.white('Budget:      ') + chalk.green(`$${task.budget_amount} ${task.budget_currency}`));
      console.log(chalk.white('Description:\n') + chalk.gray(task.description));
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// ============================================
// Human Search
// ============================================

program
  .command('humans:search')
  .description('Search for qualified human operators')
  .option('-s, --skills <skills>', 'Required skills (comma-separated)')
  .option('-r, --min-reputation <score>', 'Minimum reputation score')
  .action(async (options) => {
    try {
      const { searchHumans } = require('./lib/api');
      const ora = (await import('ora')).default;
      const Table = require('cli-table3');

      const spinner = ora('Searching humans...').start();

      const filters = {};
      if (options.skills) filters.skills = options.skills.split(',');
      if (options.minReputation) filters.min_reputation = parseInt(options.minReputation);

      const response = await searchHumans(filters);
      spinner.stop();

      if (response.success && response.data && response.data.length > 0) {
        const table = new Table({
          head: [
            chalk.cyan('ID'),
            chalk.cyan('Reputation'),
            chalk.cyan('Level'),
            chalk.cyan('Tasks'),
            chalk.cyan('Success Rate'),
          ],
        });

        response.data.forEach((human) => {
          table.push([
            human.id.substring(0, 8) + '...',
            chalk.green(`${human.reputation_score}/100`),
            `Lv ${human.level}`,
            human.tasks_completed || 0,
            `${human.success_rate || 0}%`,
          ]);
        });

        console.log(table.toString());
      } else {
        console.log(chalk.yellow('No humans found matching criteria.'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// ============================================
// Utilities
// ============================================

program
  .command('whoami')
  .description('Show current agent identity')
  .action(() => {
    const { getIdentity, getConfigPath } = require('./lib/secure-config');
    const identity = getIdentity();

    if (!identity) {
      console.log(chalk.yellow('⚠️  No identity found'));
      console.log(chalk.gray('→ Run: rentman init'));
      process.exit(1);
    }

    console.log(chalk.bold.blue('\n👤 Current Agent Identity\n'));
    console.log(chalk.white('Agent ID:       ') + chalk.cyan(identity.agent_id));
    console.log(chalk.white('Public ID:      ') + chalk.cyan(identity.public_agent_id || 'N/A'));
    console.log(chalk.white('Public Key:     ') + chalk.gray(identity.public_key?.substring(0, 20) + '...'));
    console.log(chalk.white('Source:         ') + chalk.cyan(identity.source));
    console.log(chalk.white('Config Path:    ') + chalk.gray(getConfigPath()));
    console.log('');
  });

// ============================================
// Error Handling
// ============================================

program.on('command:*', () => {
  console.error(chalk.red('\n❌ Invalid command: %s'), program.args.join(' '));
  console.log(chalk.yellow('→ See --help for available commands'));
  process.exit(1);
});

// Parse arguments
program.parse();
