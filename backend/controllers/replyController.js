// controllers/replyController.js

const { client } = require('../config/elasticsearch');
const logger = require('../utils/logger');
const openai = require('../config/openai');
const { findRelevantAgenda } = require('../services/vectorService');

const USE_MOCK = true; // 🔁 Toggle this to false when OpenAI is active

/**
 * @route POST /api/reply/suggest
 * @desc Generate AI-powered reply using OpenAI and context from agenda (or mocked)
 */
const suggestReply = async (req, res) => {
  try {
    let email;

    // Case 1: Fetch by ID from Elasticsearch
    if (req.body.id) {
      logger.info(`📥 Fetching email from Elasticsearch with ID: ${req.body.id}`);
      const result = await client.get({
        index: 'emails',
        id: req.body.id
      });
      email = result._source || result.body._source;
    }

    // Case 2: Use raw email from request body
    else if (req.body.text) {
      logger.info('📩 Using raw email data from request body');
      email = req.body;
    } else {
      logger.warn('⚠️ Missing email ID or text in request');
      return res.status(400).json({ error: 'Missing email id or text in request' });
    }

    const from = email.from || 'someone';
    const body = email.text || email.html || '';

    // === Step 1: Retrieve agenda context (RAG) ===
    const agendaContext = await findRelevantAgenda(body);

    if (!agendaContext) {
      logger.warn('⚠️ No relevant agenda context found');
      return res.status(404).json({ error: 'No agenda context found for reply' });
    }

    // === MOCK MODE ===
    if (USE_MOCK) {
      const replyText = `Hi ${from}, thanks for reaching out! You can book a time here: https://cal.com/example`;
      logger.info(`✅ [MOCK] Generated reply for: ${from}`);
      return res.status(200).json({ success: true, reply: replyText });
    }

    // === REAL OpenAI MODE ===
    const prompt = `
You are a professional assistant writing email replies.

The user received this email:
"${body}"

Use the following context:
"${agendaContext}"

Write a short, polite, and helpful reply to the sender: ${from}.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an email reply assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    const replyText = response.choices[0].message.content.trim();

    logger.info(`✅ AI-generated reply for: ${from}`);
    res.status(200).json({
      success: true,
      reply: replyText
    });

  } catch (err) {
    logger.error(`❌ Failed to generate reply: ${err.message}`);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
};

module.exports = {
  suggestReply
};
