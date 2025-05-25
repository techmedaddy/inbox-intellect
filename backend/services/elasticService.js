// services/elasticService.js

const { client } = require('../config/elasticsearch');
const logger = require('../utils/logger');

/**
 * Indexes a single email into the Elasticsearch "emails" index
 * @param {Object} email - Email object to index
 */
async function indexEmail(email) {
  try {
    await client.index({
      index: 'emails',
      document: email
    });
    logger.info(`📦 Indexed email: ${email.subject} | ${email.from}`);
  } catch (err) {
    logger.error(`❌ Failed to index email: ${err.message}`);
  }
}

module.exports = {
  indexEmail
};
