// services/webhookSender.js

const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
  logger.warn('⚠️ WEBHOOK_URL is missing in .env file');
}

/**
 * Triggers a webhook.site POST request for "Interested" emails
 * @param {Object} email - Parsed and categorized email object
 */
async function triggerWebhook(email) {
  if (!webhookUrl) return;
  if (email.category !== 'Interested') return;

  const payload = {
    event: 'interested_lead',
    data: {
      from: email.from,
      subject: email.subject,
      account: email.account,
      folder: email.folder,
      category: email.category,
      date: email.date,
      preview: email.text?.slice(0, 250) || '',
    }
  };

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status !== 200 && response.status !== 201) {
      logger.warn(`⚠️ Webhook responded with unexpected status: ${response.status}`);
    } else {
      logger.info(`🔗 Webhook triggered successfully for ${email.from} | ${email.subject}`);
    }

  } catch (err) {
    logger.error(`❌ Failed to trigger webhook: ${err.message}`);
  }
}

module.exports = triggerWebhook;
