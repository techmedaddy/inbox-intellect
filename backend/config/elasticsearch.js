// config/elasticsearch.js

const { Client } = require('@elastic/elasticsearch');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

// Create a new Elasticsearch client instance
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:49200',
  maxRetries: 3,
  requestTimeout: 10000,
  sniffOnStart: false,
});

/**
 * Checks the connection to Elasticsearch and logs cluster health.
 */
async function checkElasticsearchConnection() {
  try {
    const health = await client.cluster.health();
    logger.info(`✅ Elasticsearch cluster status: ${health.status}`);
  } catch (err) {
    logger.error(`❌ Elasticsearch connection failed: ${err.message}`);
    process.exit(1); // Exit if ES is unreachable
  }
}

/**
 * Creates the `emails` index if it doesn't exist, with proper mappings.
 */
async function initializeEmailIndex() {
  const indexName = 'emails';

  try {
    const exists = await client.indices.exists({ index: indexName });

    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              subject: { type: 'text' },
              from: { type: 'text' },
              to: { type: 'text' },
              folder: { type: 'keyword' },
              account: { type: 'keyword' },
              text: { type: 'text' },
              date: { type: 'date' },
              category: { type: 'keyword' },
              indexedAt: { type: 'date' }
            }
          }
        }
      });
      logger.info('📁 Created Elasticsearch index: emails');
    } else {
      logger.info('📁 Elasticsearch index already exists: emails');
    }

  } catch (err) {
    logger.error(`❌ Error initializing Elasticsearch index: ${err.message}`);
  }
}

module.exports = {
  client,
  checkElasticsearchConnection,
  initializeEmailIndex,
};
