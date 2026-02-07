const { Command } = require('commander');
const loginCommand = require('./commands/login');
const fs = require('fs');
const Ajv = require('ajv');
const { apiRequest } = require('./lib/api');
const chalk = require('chalk');

const program = new Command();

program
  .name('rentman')
  .description('CLI tool for AI agents to hire humans')
  .version('1.0.0');

program
  .command('login <email>')
  .description('Authenticate and get API token')
  .description('Authenticate and get API token')
  .action(loginCommand);

program
  .command('login-v2')
  .description('Authenticate via Supabase (Modern Standard)')
  .action(require('./commands/login-v2'));


program
  .command('init')
  .description('Initialize Agent Identity (KYA) and link to Owner')
  .action(require('./commands/init'));

program
  .command('guide')
  .description('Show the Rentman Workflow Guide')
  .action(require('./commands/guide'));

// JSON Schema for task validation
const taskSchema = {
  type: 'object',
  required: ['title', 'description', 'task_type', 'budget_amount'],
  properties: {
    title: { type: 'string', maxLength: 200 },
    description: { type: 'string' },
    task_type: {
      type: 'string',
      enum: ['delivery', 'verification', 'repair', 'representation', 'creative', 'communication']
    },
    location: {
      type: 'object',
      required: ['lat', 'lng'],
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 },
        address: { type: 'string' }
      }
    },
    budget_amount: { type: 'number', minimum: 1 },
    required_skills: {
      type: 'array',
      items: { type: 'string' }
    },
    requirements: { type: 'object' }
  }
};

program
  .command('post-mission [file]')
  .description('Post a Signed Mission (KYA) to the requested Agents')
  .alias('post')
  .action(require('./commands/post-mission'));

program
  .command('config [key] [value]')
  .description('Get/Set configuration (agent_id, secret_key, api_url)')
  .action(require('./commands/config'));

program
  .command('task:map')
  .description('Visual table of active tasks')
  .action(async () => {
    try {
      const ora = (await import('ora')).default;
      const spinner = ora('Fetching tasks...').start();

      const response = await apiRequest('/tasks?status=open');
      spinner.stop();

      if (response.success && response.data.length > 0) {
        const Table = require('cli-table3');
        const table = new Table({
          head: [chalk.cyan('ID'), chalk.cyan('Type'), chalk.cyan('Title'), chalk.cyan('Budget'), chalk.cyan('Location')]
        });

        response.data.forEach((task) => {
          const icons = {
            delivery: '📦',
            verification: '✅',
            repair: '🔧',
            representation: '👤',
            creative: '🎨',
            communication: '📞'
          };
          const icon = icons[task.task_type] || '📋';

          table.push([
            task.id.substring(0, 8),
            `${icon} ${task.task_type}`,
            task.title.substring(0, 30),
            chalk.green(`$${task.budget_amount}`),
            task.location_address || 'Remote'
          ]);
        });

        console.log(table.toString());
      } else {
        console.log(chalk.yellow('No active tasks found.'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });
// Listen command for real-time updates
const listenCommand = require('./commands/listen');

program
  .command('listen <taskId>')
  .alias('watch')
  .description('Listen for real-time updates on a task')
  .action(listenCommand);

// Alias commands


program.parse();
