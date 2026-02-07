const Conf = new (require('conf'))();
const chalk = require('chalk');

const allowedKeys = ['agent_id', 'secret_key', 'api_url'];

function configCommand(key, value) {
    if (!key || key === 'list') {
        console.log(chalk.bold('\nCurrent Configuration:'));
        console.log(chalk.gray('---------------------'));
        for (const k of allowedKeys) {
            const val = Conf.get(k);
            let displayVal = val;

            if (!val) {
                displayVal = chalk.gray('(not set)');
            } else if (k === 'secret_key') {
                displayVal = val.substring(0, 4) + '...';
            }

            console.log(`${chalk.cyan(k)}: ${displayVal}`);
        }
        console.log(chalk.gray(`\nConfig file: ${Conf.path}\n`));
        return;
    }

    if (value === undefined) {
        if (allowedKeys.includes(key)) {
            console.log(Conf.get(key));
        } else {
            console.error(chalk.red(`Invalid key: ${key}`));
            console.log(`Allowed keys: ${allowedKeys.join(', ')}`);
        }
    } else {
        if (allowedKeys.includes(key)) {
            Conf.set(key, value);
            console.log(chalk.green(`\n✔ Configuration updated: ${key}`));
        } else {
            console.error(chalk.red(`Invalid key: ${key}`));
            console.log(`Allowed keys: ${allowedKeys.join(', ')}`);
        }
    }
}

module.exports = configCommand;
