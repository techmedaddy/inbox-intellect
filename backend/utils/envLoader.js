// utils/envLoader.js

const dotenv = require('dotenv');
const logger = require('./logger');

// Load env variables from .env file
dotenv.config();

// List of required environment variables
const REQUIRED_ENV_VARS = [
  'PORT',
  'OPENAI_API_KEY',
  'ELASTICSEARCH_URL',
  'IMAP_EMAIL_1',
  'IMAP_PASS_1',
  'IMAP_EMAIL_2',
  'IMAP_PASS_2',
  'SLACK_TOKEN',
  'SLACK_CHANNEL',
  'WEBHOOK_URL'
];

/**
 * Validates all required .env variables are present
 */
function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  logger.info('✅ Environment variables loaded and validated.');
}

module.exports = { validateEnv };
