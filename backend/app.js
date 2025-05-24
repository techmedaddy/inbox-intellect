// backend/app.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const emailRoutes = require('./routes/emailRoutes');
const replyRoutes = require('./routes/replyRoutes');

dotenv.config();

const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Still useful for HTTP logs

// === Routes ===
app.use('/api/emails', emailRoutes);
app.use('/api/reply', replyRoutes);

// === Health Check ===
app.get('/', (req, res) => {
  logger.info('✅ Health check hit at /');
  res.send('📬 ReachInbox Onebox API is up and running.');
});

// === 404 Handler ===
app.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// === Global Error Handler ===
app.use((err, req, res, next) => {
  logger.error(`❌ Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
