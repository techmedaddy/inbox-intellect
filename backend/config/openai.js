// config/openai.js

const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Validate that the API key is present
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing in the .env file');
  process.exit(1);
}

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an instance of OpenAIApi
const openai = new OpenAIApi(configuration);

module.exports = openai;
