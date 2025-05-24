// controllers/replyController.js

const openai = require('../config/openai');
const { client } = require('../config/elasticsearch');
const { findRelevantAgenda } = require('../services/vectorService');
const logger = require('../utils/logger');

/**
 * @route POST /api/reply/suggest
 * @desc Generate AI-powered suggested reply using RAG
 * @body { id: string } or { text: string, from: string, subject: string }
 */
const suggestReply = async (req, res) => {
  try {
    let email;

    // Case 1: Email ID is provided (fetch from Elasticsearch)
    if (req.body.id) {
      logger.info(`📥 Fetching email from Elasticsearch with ID: ${req.body.id}`);
      const result = await client.get({
        index: 'emails',
        id: req.body.id
      });
      email = result.body._source;
    }

    // Case 2: Raw email text is sent directly
    else if (req.body.text) {
      logger.info('📩 Using raw email data from request body');
      email = req.body;
    } else {
      logger.warn('⚠️ Missing email ID or text in request');
      return res.status(400).json({ error: 'Missing email id or text in request' });
    }

    // Step 1: Find best matching agenda item
    const agendaContext = await findRelevantAgenda(email.text);

    if (!agendaContext) {
      logger.warn('⚠️ No relevant agenda found for email reply generation');
      return res.status(404).json({ error: 'No relevant agenda found for reply' });
    }

    // Step 2: Create prompt and call OpenAI
    const prompt = `
You are a helpful, polite assistant writing email replies.

Incoming email:
"${email.text}"

Use the following context:
"${agendaContext}"

Write a short, professional response to the sender: ${email.from}.
`;

    logger.info(`🧠 Generating reply using OpenAI for: ${email.from} | ${email.subject}`);

    const reply = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      messages: [
        { role: 'system', content: 'You are a polite email assistant.' },
        { role: 'user', content: prompt }
      ]
    });

    const suggestedReply = reply.data.choices[0].message.content.trim();

    logger.info(`✅ Reply generated for ${email.from}`);
    res.status(200).json({
      success: true,
      reply: suggestedReply
    });

  } catch (err) {
    logger.error(`❌ Error generating suggested reply: ${err.message}`);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
};

module.exports = {
  suggestReply
};
