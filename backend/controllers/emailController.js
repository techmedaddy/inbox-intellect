// controllers/emailController.js

const { client } = require('../config/elasticsearch');

/**
 * GET /api/emails
 * Fetch all emails or filter by folder/account/category
 */
const getEmails = async (req, res) => {
  try {
    const { folder, account, category, limit = 50 } = req.query;

    const filters = [];

    if (folder) filters.push({ term: { folder } });
    if (account) filters.push({ term: { account } });
    if (category) filters.push({ term: { category } });

    const query = {
      index: 'emails',
      size: parseInt(limit),
      sort: [{ date: 'desc' }],
      body: {
        query: filters.length
          ? { bool: { must: filters } }
          : { match_all: {} }
      }
    };

    const result = await client.search(query);
    const hits = result.body.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.status(200).json(hits);
  } catch (err) {
    console.error('❌ Error fetching emails:', err.message);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

/**
 * GET /api/emails/search?q=term
 * Full-text search in subject, from, and text content
 */
const searchEmails = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: 'Missing search query' });

    const result = await client.search({
      index: 'emails',
      size: 50,
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['subject^3', 'text', 'from'],
            fuzziness: 'AUTO'
          }
        }
      }
    });

    const hits = result.body.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.status(200).json(hits);
  } catch (err) {
    console.error('❌ Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
};

/**
 * GET /api/emails/:id
 * Fetch single email by its Elasticsearch ID
 */
const getEmailById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.get({
      index: 'emails',
      id
    });

    res.status(200).json({ id, ...result.body._source });
  } catch (err) {
    console.error('❌ Error fetching email by ID:', err.message);
    if (err.meta?.statusCode === 404) {
      res.status(404).json({ error: 'Email not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch email' });
    }
  }
};

module.exports = {
  getEmails,
  searchEmails,
  getEmailById
};
