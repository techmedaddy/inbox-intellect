// services/slackNotifier.js

const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const slackToken = process.env.SLACK_TOKEN;
const slackChannel = process.env.SLACK_CHANNEL;

if (!slackToken || !slackChannel) {
  logger.warn('⚠️ Slack token or channel not configured in .env');
}

const slackClient = new WebClient(slackToken);

/**
 * Sends a Slack message for "Interested" categorized emails
 * @param {Object} email - Parsed and categorized email object
 */
async function sendSlackNotification(email) {
  if (!slackToken || !slackChannel) return;
  if (email.category !== 'Interested') return;

  const message = `🚀 *New Interested Lead!*
*From:* ${email.from}
*Subject:* ${email.subject}
*Snippet:* ${email.text?.slice(0, 200) || '[No text]'}
`;

  try {
    const res = await slackClient.chat.postMessage({
      channel: slackChannel,
      text: message,
      mrkdwn: true
    });

    if (!res.ok) throw new Error(res.error);

    logger.info(`📣 Slack notification sent for lead: ${email.from} | ${email.subject}`);
  } catch (err) {
    logger.error(`❌ Slack notification failed: ${err.message}`);
  }
}

module.exports = sendSlackNotification;
