// services/imapService.js

const { emailEmitter } = require('../config/imapClients');
const categorizeEmail = require('./categorize');
const { indexEmail } = require('./elasticService');
const sendSlackNotification = require('./slackNotifier');
const triggerWebhook = require('./webhookSender');

/**
 * Start handling incoming email events emitted by IMAP connections
 */
function initializeIMAPService() {
  console.log('🔁 IMAP Service is listening for new emails...');

  emailEmitter.on('email', async (email) => {
    try {
      console.log(`📥 New email received from: ${email.from} | Subject: ${email.subject}`);

      // === Step 1: Categorize the email using AI or fallback ===
      const category = await categorizeEmail(email);

      console.log(`🔖 Email categorized as: ${category}`);

      // === Step 2: Add category and index into Elasticsearch ===
      const indexedEmail = {
        ...email,
        category,
        indexedAt: new Date()
      };

      await indexEmail(indexedEmail);
      console.log('📦 Email indexed in Elasticsearch');

      // === Step 3: Send Slack notification if "Interested" ===
      if (category === 'Interested') {
        await sendSlackNotification(indexedEmail);
        console.log('📣 Slack notification sent');
      }

      // === Step 4: Trigger webhook.site for automation ===
      if (category === 'Interested') {
        await triggerWebhook(indexedEmail);
        console.log('🔗 Webhook triggered');
      }

    } catch (err) {
      console.error('❌ Error processing email:', err.message);
    }
  });
}

module.exports = initializeIMAPService;
