const { Command } = require('commander');
const chalk = require('chalk');
const loginCommand = require('./commands/login');
const taskCommand = require('./commands/task');

const program = new Command();

program
  .name('rentman')
  .description('CLI tool for AI agents to hire humans')
  .version('1.0.0');

program
  .command('login')
  .description('Authenticate and get API token')
  .argument('<email>', 'Agent email')
  .action(loginCommand);

program
  .command('task')
  .description('Task management commands')
  .addCommand(taskCommand);

program.parse();
