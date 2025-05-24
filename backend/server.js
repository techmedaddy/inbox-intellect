// backend/server.js

const app = require('./app');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { validateEnv } = require('./utils/envLoader');
const {
  checkElasticsearchConnection,
  initializeEmailIndex
} = require('./config/elasticsearch');
const startIMAPClients = require('./config/imapClients');
const initializeIMAPService = require('./services/imapService');
const { loadAgendaToMemory } = require('./services/vectorService');

// Load environment variables and validate required keys
dotenv.config();
validateEnv();

const PORT = process.env.PORT || 35827;

(async function startServer() {
  try {
    logger.info('🚀 Starting ReachInbox Onebox backend...');

    // Step 1: Check Elasticsearch health and prepare index
    await checkElasticsearchConnection();
    await initializeEmailIndex();

    // Step 2: Load agenda/context for RAG reply generation
    await loadAgendaToMemory();

    // Step 3: Start Express HTTP server
    app.listen(PORT, () => {
      logger.info(`✅ Server running at: http://localhost:${PORT}`);
    });

    // Step 4: Initialize IMAP sync and email classification pipeline
    await startIMAPClients();
    initializeIMAPService();

  } catch (err) {
    logger.error(`❌ Server startup failed: ${err.stack || err.message}`);
    process.exit(1); // Exit with failure
  }
})();
