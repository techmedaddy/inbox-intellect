// backend/app.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const emailRoutes = require('./routes/emailRoutes');
const replyRoutes = require('./routes/replyRoutes');

dotenv.config(); // Load environment variables from .env

const app = express();

// === MIDDLEWARE ===
app.use(cors());                            // Enable CORS
app.use(express.json());                    // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));                     // Log HTTP requests

// === ROUTES ===
app.use('/api/emails', emailRoutes);        // All email-related routes
app.use('/api/reply', replyRoutes);         // Suggested reply routes

// === ROOT ENDPOINT ===
app.get('/', (req, res) => {
  res.send('📬 Inbox Intellect API is running');
});

// === 404 HANDLER ===
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// === ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
