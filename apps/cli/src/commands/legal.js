/**
 * Legal Command - View Terms and Privacy Policy
 * Compliance with app store requirements
 */

const chalk = require('chalk');
const { spawn } = require('child_process');
const { platform } = require('os');

const LEGAL_DOCS = {
  privacy: 'https://rentman.app/privacy-policy.html',
  terms: 'https://rentman.app/terms-of-service.html',
};

/**
 * Open URL in default browser (cross-platform)
 */
function openBrowser(url) {
  let command;

  switch (platform()) {
    case 'darwin': // macOS
      command = 'open';
      break;
    case 'win32': // Windows
      command = 'start';
      break;
    default: // Linux and others
      command = 'xdg-open';
  }

  const child = spawn(command, [url], {
    detached: true,
    stdio: 'ignore',
    shell: platform() === 'win32', // Windows needs shell
  });

  child.unref();
}

async function legalCommand(type) {
  console.log(chalk.bold.blue('\n📜 Rentman Legal Documents\n'));

  if (!type) {
    // Show menu
    console.log(chalk.white('Available legal documents:\n'));
    console.log(chalk.cyan('  privacy  ') + chalk.gray('- Privacy Policy'));
    console.log(chalk.cyan('  terms    ') + chalk.gray('- Terms of Service'));
    console.log('');
    console.log(chalk.white('Usage:'));
    console.log(chalk.gray('  rentman legal privacy'));
    console.log(chalk.gray('  rentman legal terms'));
    console.log('');
    console.log(chalk.white('Links:'));
    console.log(chalk.gray('  Privacy: ' + LEGAL_DOCS.privacy));
    console.log(chalk.gray('  Terms:   ' + LEGAL_DOCS.terms));
    console.log('');
    return;
  }

  if (type === 'privacy') {
    console.log(chalk.green('Opening Privacy Policy...'));
    console.log(chalk.gray(LEGAL_DOCS.privacy));
    openBrowser(LEGAL_DOCS.privacy);
    console.log(chalk.white('\n✓ Opened in browser'));
  } else if (type === 'terms') {
    console.log(chalk.green('Opening Terms of Service...'));
    console.log(chalk.gray(LEGAL_DOCS.terms));
    openBrowser(LEGAL_DOCS.terms);
    console.log(chalk.white('\n✓ Opened in browser'));
  } else {
    console.error(chalk.red(`❌ Unknown document type: ${type}`));
    console.log(chalk.yellow('→ Valid options: privacy, terms'));
    process.exit(1);
  }
}

module.exports = legalCommand;
