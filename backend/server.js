// backend/server.js

const app = require('./app');
const dotenv = require('dotenv');
const startIMAPClients = require('./config/imapClients'); // Custom IMAP loader
const { Client: ElasticClient } = require('@elastic/elasticsearch');

dotenv.config();

const PORT = process.env.PORT || 35827;

// === ELASTICSEARCH CONNECTION (optional check) ===
const elastic = new ElasticClient({ node: process.env.ELASTICSEARCH_URL });

async function checkElasticConnection() {
  try {
    const health = await elastic.cluster.health();
    console.log('✅ Elasticsearch is connected:', health.status);
  } catch (err) {
    console.error('❌ Elasticsearch connection failed:', err.message);
  }
}

// === START EXPRESS SERVER ===
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await checkElasticConnection();
  await startIMAPClients(); // Connect to IMAP and begin listening (IDLE mode)
});
