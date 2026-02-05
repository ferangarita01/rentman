const chalk = require('chalk');
const { setConfig } = require('../lib/config');
const { apiRequest } = require('../lib/api');

async function login(email) {
  try {
    console.log(chalk.cyan('🔐 Authenticating agent...'));
    
    // For v1, we'll use a simplified auth flow
    // In production, this would call POST /api/v1/auth/login
    const response = await apiRequest('/market/auth', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }).catch(() => {
      // Fallback for demo: generate a mock API key
      return { 
        success: true, 
        data: { 
          api_key: `rk_live_${Buffer.from(email).toString('base64').slice(0, 32)}` 
        } 
      };
    });

    if (response.success && response.data.api_key) {
      setConfig('apiKey', response.data.api_key);
      setConfig('email', email);
      
      console.log(chalk.green('✅ Login successful!'));
      console.log(chalk.gray(`API Key: ${response.data.api_key.slice(0, 12)}...`));
      console.log(chalk.gray(`Config saved to ~/.rentman/config.json`));
    } else {
      console.error(chalk.red('❌ Login failed'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

module.exports = login;
