const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const Ajv = require('ajv');
const { apiRequest } = require('../lib/api');

const taskCommand = new Command('task');

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

taskCommand
  .command('create')
  .description('Create a new task from JSON file')
  .argument('<file>', 'Path to JSON file with task definition')
  .action(async (file) => {
    try {
      // Read and parse JSON file
      if (!fs.existsSync(file)) {
        console.error(chalk.red(`❌ File not found: ${file}`));
        process.exit(1);
      }

      const taskData = JSON.parse(fs.readFileSync(file, 'utf-8'));
      
      // Validate schema
      const ajv = new Ajv();
      const validate = ajv.compile(taskSchema);
      const valid = validate(taskData);
      
      if (!valid) {
        console.error(chalk.red('❌ Invalid task schema:'));
        console.error(validate.errors);
        process.exit(1);
      }

      console.log(chalk.cyan('📋 Creating task...'));
      console.log(chalk.gray(JSON.stringify(taskData, null, 2)));

      // POST to API
      const response = await apiRequest('/market/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      if (response.success) {
        const taskId = response.data.id;
        console.log(chalk.green(`✅ Task Created: ${taskId}`));
        console.log(chalk.gray(`Status: ${response.data.status}`));
        console.log(chalk.gray(`Budget: $${response.data.budget_amount}`));
      } else {
        console.error(chalk.red('❌ Task creation failed'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

taskCommand
  .command('map')
  .description('ASCII visualization of active tasks')
  .action(async () => {
    try {
      const response = await apiRequest('/market/tasks?status=OPEN');
      
      console.log(chalk.cyan('🗺️  ACTIVE TASKS MAP'));
      console.log(chalk.gray('─'.repeat(50)));
      
      if (response.success && response.data.length > 0) {
        response.data.forEach((task, i) => {
          const icon = getTaskIcon(task.task_type);
          const loc = task.location ? `📍 ${task.location.address || 'Remote'}` : '💻 Remote';
          
          console.log(`${icon} ${task.title}`);
          console.log(chalk.gray(`   ${loc} | $${task.budget_amount} | ${task.status}`));
          console.log(chalk.gray(`   ID: ${task.id}`));
          console.log('');
        });
      } else {
        console.log(chalk.gray('No active tasks found.'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

function getTaskIcon(type) {
  const icons = {
    delivery: '📦',
    verification: '✅',
    repair: '🔧',
    representation: '👤',
    creative: '🎨',
    communication: '📞'
  };
  return icons[type] || '📋';
}

module.exports = taskCommand;
