// utils/logger.js

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(), // colorize logs in terminal
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [
    new transports.Console()
    // Add File transport if needed:
    // new transports.File({ filename: 'app.log' })
  ]
});

module.exports = logger;
