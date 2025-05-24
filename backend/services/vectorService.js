// services/vectorService.js

const openai = require('../config/openai');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// In-memory embedding store
let knowledgeBase = [];

/**
 * Loads static agenda entries and embeds them using OpenAI
 */
async function loadAgendaToMemory() {
  const filePath = path.join(__dirname, '../data/agenda.txt');

  if (!fs.existsSync(filePath)) {
    logger.warn('⚠️ agenda.txt file not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8').split('\n\n').filter(p => p.trim().length > 0);

  for (const paragraph of content) {
    const embedding = await getEmbedding(paragraph);
    if (embedding.length > 0) {
      knowledgeBase.push({ text: paragraph, embedding });
    }
  }

  logger.info(`📚 Loaded ${knowledgeBase.length} agenda items into memory`);
}

/**
 * Generates a vector embedding for a given string
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function getEmbedding(text) {
  try {
    const res = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return res.data.data[0].embedding;
  } catch (err) {
    logger.error(`❌ Embedding generation failed: ${err.message}`);
    return [];
  }
}

/**
 * Computes cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const normA = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

/**
 * Finds the most relevant agenda entry for a given email
 * @param {string} emailText
 * @returns {Promise<string|null>} Best matching agenda entry
 */
async function findRelevantAgenda(emailText) {
  const emailEmbedding = await getEmbedding(emailText);

  if (!emailEmbedding.length) {
    logger.warn('⚠️ Email embedding is empty — skipping agenda match');
    return null;
  }

  let bestMatch = null;
  let highestScore = -1;

  for (const item of knowledgeBase) {
    const score = cosineSimilarity(emailEmbedding, item.embedding);
    if (score > highestScore) {
      bestMatch = item.text;
      highestScore = score;
    }
  }

  logger.info(`🎯 Best agenda match found with similarity score: ${highestScore.toFixed(4)}`);
  return bestMatch;
}

module.exports = {
  loadAgendaToMemory,
  findRelevantAgenda
};
