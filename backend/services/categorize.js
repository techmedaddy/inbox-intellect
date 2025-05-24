// services/categorize.js

const openai = require('../config/openai');
const logger = require('../utils/logger');

/**
 * Categorizes an email using OpenAI GPT model.
 * Returns one of: Interested, Meeting Booked, Not Interested, Spam, Out of Office
 *
 * @param {Object} email - Parsed email object
 * @returns {Promise<string>} Category
 */
async function categorizeEmail(email) {
  const { subject, text, from } = email;

  const prompt = `
You are an intelligent email classifier. 
Given the following email content, classify it into one of these categories:
- Interested
- Meeting Booked
- Not Interested
- Spam
- Out of Office

Respond with only one of the above categories. No explanation.

---

From: ${from}
Subject: ${subject}
Body:
${text}
`;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an email classification assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const categoryRaw = response.data.choices[0].message.content.trim();

    const validCategories = [
      'Interested',
      'Meeting Booked',
      'Not Interested',
      'Spam',
      'Out of Office'
    ];

    const match = validCategories.find(cat =>
      categoryRaw.toLowerCase().includes(cat.toLowerCase())
    );

    const finalCategory = match || 'Uncategorized';

    logger.info(`🧠 AI classified email from "${from}" as: ${finalCategory}`);
    return finalCategory;

  } catch (err) {
    logger.error(`❌ OpenAI classification failed: ${err.message}`);
    return 'Uncategorized';
  }
}

module.exports = categorizeEmail;
