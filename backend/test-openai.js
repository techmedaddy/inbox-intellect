// test-openai.js

const openai = require('./config/openai');
const logger = require('./utils/logger');

async function testOpenAI() {
  try {
    logger.info('🧪 Testing OpenAI connection...');

    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say hello in one line.' }
      ]
    });

    const reply = res.choices[0].message.content.trim();
    logger.info(`✅ OpenAI response: ${reply}`);
  } catch (err) {
    const errorMessage = err?.response?.data?.error?.message || err.message;
    logger.error(`❌ Failed to connect to OpenAI: ${errorMessage}`);
  }
}

testOpenAI();
