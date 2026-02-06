const { Command } = require('commander');
const loginCommand = require('./commands/login');
const fs = require('fs');
const Ajv = require('ajv');
const { apiRequest } = require('./lib/api');

const program = new Command();

program
  .name('rentman')
  .description('CLI tool for AI agents to hire humans')
  .version('1.0.0');

program
  .command('login <email>')
  .description('Authenticate and get API token')
  .action(loginCommand);

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
  .command('post-mission <file>')
  .description('Post a Signed Mission (KYA) to the requested Agents')
  .alias('post')
  .action(require('./commands/post-mission'));

program
  .command('task:map')
  .description('ASCII visualization of active tasks')
  .action(async () => {
    try {
      const response = await apiRequest('/tasks?status=open');

      console.log('🗺️  ACTIVE TASKS MAP');
      console.log('─'.repeat(50));

      if (response.success && response.data.length > 0) {
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
          const loc = task.location_address || '💻 Remote';

          console.log(`${icon} ${task.title}`);
          console.log(`   📍 ${loc} | $${task.budget_amount} | ${task.status}`);
          console.log(`   ID: ${task.id}`);
          console.log('');
        });
      } else {
        console.log('No active tasks found.');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
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
