// config/openai.js

const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  logger.error('❌ OPENAI_API_KEY is missing in the .env file');
  process.exit(1);
}

// OpenAI v4 style client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

logger.info('🤖 OpenAI client initialized');

module.exports = openai;
