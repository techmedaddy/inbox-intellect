// routes/emailRoutes.js

const express = require('express');
const router = express.Router();

const {
  getEmailById
} = require('../controllers/emailController');

const {
  searchEmails,
  filterEmails
} = require('../controllers/searchController');

// Filtered and all email list
router.get('/', filterEmails);

// Full-text search
router.get('/search', searchEmails);

// Email by ID
router.get('/:id', getEmailById);

module.exports = router;
