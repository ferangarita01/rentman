const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.rentman');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getConfig() {
  ensureConfigDir();
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return {};
}

function setConfig(key, value) {
  ensureConfigDir();
  const config = getConfig();
  config[key] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey() {
  const config = getConfig();
  return config.apiKey;
}

module.exports = { getConfig, setConfig, getApiKey };
