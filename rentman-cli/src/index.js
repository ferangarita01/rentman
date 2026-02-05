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
  .command('task:create <file>')
  .description('Create a new task from JSON file')
  .action(async (file) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        process.exit(1);
      }

      const taskData = JSON.parse(fs.readFileSync(file, 'utf-8'));
      
      const ajv = new Ajv();
      const validate = ajv.compile(taskSchema);
      const valid = validate(taskData);
      
      if (!valid) {
        console.error('❌ Invalid task schema:');
        console.error(validate.errors);
        process.exit(1);
      }

      console.log('📋 Creating task...');
      console.log(JSON.stringify(taskData, null, 2));

      const response = await apiRequest('/market-tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      if (response.success) {
        console.log(`✅ Task Created: ${response.data.id}`);
        console.log(`Status: ${response.data.status}`);
        console.log(`Budget: $${response.data.budget_amount}`);
      } else {
        console.error('❌ Task creation failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('task:map')
  .description('ASCII visualization of active tasks')
  .action(async () => {
    try {
      const response = await apiRequest('/market-tasks?status=OPEN');
      
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

program.parse();
