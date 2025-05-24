// controllers/searchController.js

const { client } = require('../config/elasticsearch');

/**
 * Full-text search handler
 * @route GET /api/emails/search?q=term
 */
const searchEmails = async (req, res) => {
  const { q } = req.query;

  if (!q) return res.status(400).json({ error: 'Missing search query' });

  try {
    const result = await client.search({
      index: 'emails',
      size: 50,
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['subject^2', 'text', 'from'],
            fuzziness: 'AUTO',
          }
        }
      }
    });

    const hits = result.body.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json(hits);

  } catch (err) {
    console.error('❌ Search failed:', err.message);
    res.status(500).json({ error: 'Elasticsearch search error' });
  }
};

/**
 * Filtered email listing handler
 * @route GET /api/emails?folder=inbox&account=user@gmail.com&category=Interested
 */
const filterEmails = async (req, res) => {
  const { folder, account, category, limit = 50 } = req.query;

  const filters = [];

  if (folder) filters.push({ term: { folder } });
  if (account) filters.push({ term: { account } });
  if (category) filters.push({ term: { category } });

  try {
    const result = await client.search({
      index: 'emails',
      size: parseInt(limit),
      sort: [{ date: 'desc' }],
      body: {
        query: filters.length
          ? { bool: { must: filters } }
          : { match_all: {} }
      }
    });

    const hits = result.body.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json(hits);

  } catch (err) {
    console.error('❌ Filter fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch filtered emails' });
  }
};

module.exports = {
  searchEmails,
  filterEmails,
};
