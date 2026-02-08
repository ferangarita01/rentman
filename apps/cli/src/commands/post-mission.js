/**
 * Post Mission Command - Create Task via Agent Gateway
 * Uses NACL signature authentication
 */

const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { createTask } = require('../lib/api');
const { getIdentity, getConfigPath } = require('../lib/secure-config');

async function postMission(file) {
  console.log(chalk.bold.blue('\n📤 Rentman CLI - Post Mission\n'));

  // 1. Check identity
  const identity = getIdentity();

  if (!identity) {
    console.error(chalk.red('❌ No identity found'));
    console.log(chalk.yellow('→ Run: rentman init'));
    console.log(chalk.gray(`   Identity should be in: ${getConfigPath()}`));
    process.exit(1);
  }

  console.log(chalk.gray(`✓ Authenticated as: ${identity.public_agent_id} (${identity.source})`));

  // 2. Load or create task data
  let taskData = {};

  if (file) {
    // Load from JSON file
    if (!fs.existsSync(file)) {
      console.error(chalk.red(`❌ File not found: ${file}`));
      process.exit(1);
    }

    try {
      taskData = JSON.parse(fs.readFileSync(file, 'utf-8'));
      console.log(chalk.green(`✓ Loaded task from: ${file}`));
    } catch (error) {
      console.error(chalk.red(`❌ Invalid JSON: ${error.message}`));
      process.exit(1);
    }
  } else {
    // Interactive wizard
    console.log(chalk.cyan('✨ Interactive Task Creation\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Task Title:',
        validate: (input) => input.length >= 10 || 'Title too short (min 10 chars)',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        validate: (input) => input.length >= 20 || 'Description too short (min 20 chars)',
      },
      {
        type: 'list',
        name: 'task_type',
        message: 'Task Type:',
        choices: [
          'verification',
          'delivery',
          'repair',
          'representation',
          'creative',
          'communication',
        ],
      },
      {
        type: 'number',
        name: 'budget_amount',
        message: 'Budget ($):',
        default: 15,
        validate: (input) => input > 0 || 'Budget must be positive',
      },
      {
        type: 'confirm',
        name: 'hasLocation',
        message: 'Specific location required?',
        default: false,
      },
    ]);

    taskData = {
      title: answers.title,
      description: answers.description,
      task_type: answers.task_type,
      budget_amount: answers.budget_amount,
      budget_currency: 'USD',
      payment_type: 'fixed',
      priority: 3,
      proof_requirements: ['photo', 'gps'],
    };

    // Add location if needed
    if (answers.hasLocation) {
      const location = await inquirer.prompt([
        {
          type: 'input',
          name: 'address',
          message: 'Address/City:',
        },
        {
          type: 'number',
          name: 'lat',
          message: 'Latitude:',
          default: 0,
        },
        {
          type: 'number',
          name: 'lng',
          message: 'Longitude:',
          default: 0,
        },
      ]);

      taskData.location_address = location.address;
      taskData.geo_location = {
        lat: location.lat,
        lng: location.lng,
      };
    }
  }

  // 3. Validate required fields
  if (!taskData.title || !taskData.description) {
    console.error(chalk.red('❌ Missing required fields: title, description'));
    process.exit(1);
  }

  // 4. Display task summary
  console.log(chalk.white('\n📋 Task Summary:'));
  console.log(chalk.cyan(`  Title: ${taskData.title}`));
  console.log(chalk.cyan(`  Type: ${taskData.task_type || 'N/A'}`));
  console.log(chalk.cyan(`  Budget: $${taskData.budget_amount || 0}`));
  console.log('');

  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Post this task to the marketplace?',
      default: true,
    },
  ]);

  if (!confirm.proceed) {
    console.log(chalk.yellow('❌ Cancelled'));
    process.exit(0);
  }

  // 5. Submit to Agent Gateway
  const spinner = ora('Submitting task to Agent Gateway...').start();

  try {
    const response = await createTask(taskData);

    spinner.succeed('Task posted successfully!');

    console.log(chalk.green.bold('\n✅ Task Created!\n'));
    console.log(chalk.white('Task Details:'));
    console.log(chalk.cyan(`  • Task ID: ${response.data.task_id}`));
    console.log(chalk.cyan(`  • Status: ${response.data.status}`));
    console.log(chalk.cyan(`  • Created: ${response.data.created_at}`));

    if (response.data.escrow_required) {
      console.log(chalk.yellow('\n⚠️  Escrow payment required'));
      console.log(chalk.gray('   Payment will be held until task completion'));
    }

    console.log(chalk.white.bold('\n📋 Next Steps:'));
    console.log(chalk.white('  1. Listen for contracts: rentman listen'));
    console.log(chalk.white('  2. View task: rentman task view ' + response.data.task_id));

    console.log('');
  } catch (error) {
    spinner.fail('Failed to post task');

    console.error(chalk.red(`\n❌ Error: ${error.message}`));

    if (error.code === 'AUTH_FAILED') {
      console.log(chalk.yellow('→ Re-initialize: rentman init'));
    } else if (error.code === 'VALIDATION_ERROR') {
      console.log(chalk.yellow('→ Check task data format'));
      if (error.details) {
        console.log(chalk.gray('   ' + JSON.stringify(error.details, null, 2)));
      }
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log(chalk.yellow('→ Wait before retrying'));
    }

    process.exit(1);
  }
}

module.exports = postMission;
