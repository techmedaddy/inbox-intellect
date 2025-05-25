// services/vectorService.js (MOCKED – no OpenAI)

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// In-memory plain-text knowledge base
let knowledgeBase = [];

/**
 * Loads agenda lines from agenda.txt into memory (no embeddings)
 */
async function loadAgendaToMemory() {
  const filePath = path.join(__dirname, '../data/agenda.txt');

  if (!fs.existsSync(filePath)) {
    logger.warn('⚠️ agenda.txt file not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8')
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);

  knowledgeBase = content;
  logger.info(`📚 [MOCK] Loaded ${knowledgeBase.length} agenda items into memory`);
}

/**
 * Finds the most relevant agenda entry by keyword matching
 * @param {string} emailText
 * @returns {Promise<string|null>}
 */
async function findRelevantAgenda(emailText) {
  const text = emailText.toLowerCase();

  let match = knowledgeBase.find(p =>
    text.includes('interview') && p.toLowerCase().includes('interview') ||
    text.includes('schedule') && p.toLowerCase().includes('book') ||
    text.includes('job') && p.toLowerCase().includes('resume') ||
    text.includes('meeting') && p.toLowerCase().includes('meeting')
  );

  if (!match) {
    match = knowledgeBase[0] || null;
    logger.warn('⚠️ [MOCK] No strong match found — defaulting to first agenda item');
  } else {
    logger.info('🎯 [MOCK] Matched agenda item by keyword');
  }

  return match;
}

module.exports = {
  loadAgendaToMemory,
  findRelevantAgenda
};
