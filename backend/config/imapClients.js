// config/imapClients.js

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const EventEmitter = require('events');
const dotenv = require('dotenv');
const { DateTime } = require('luxon');
const logger = require('../utils/logger');

dotenv.config();

const emailEmitter = new EventEmitter();

// Define email accounts from .env
const accounts = [
  {
    user: process.env.IMAP_EMAIL_1,
    password: process.env.IMAP_PASS_1,
  },
 // {
   // user: process.env.IMAP_EMAIL_2,
    //password: process.env.IMAP_PASS_2,
 // }
];

// Fetch emails from the last 30 days
const sinceDate = DateTime.now().minus({ days: 30 }).toRFC2822();

function connectToImap(account) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.user,
      password: account.password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', () => {
      logger.info(`📥 Connected to ${account.user}`);
      openInbox((err, box) => {
        if (err) return reject(err);

        // === Fetch last 30 days of emails ===
        imap.search(['ALL', ['SINCE', sinceDate]], (err, results) => {
          if (err) return reject(err);
          if (!results || results.length === 0) {
            logger.info(`ℹ️ No recent emails for ${account.user}`);
            return resolve();
          }

          const fetch = imap.fetch(results, { bodies: '', markSeen: false });

          fetch.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', async () => {
              const parsed = await simpleParser(buffer);
              emailEmitter.emit('email', {
                account: account.user,
                subject: parsed.subject,
                from: parsed.from?.text,
                to: parsed.to?.text,
                text: parsed.text,
                html: parsed.html,
                date: parsed.date,
                folder: 'INBOX',
              });
            });
          });

          fetch.once('end', () => {
            logger.info(`📨 Initial sync complete for ${account.user}`);
          });
        });

        // === Listen for new emails ===
        imap.on('mail', () => {
          const fetch = imap.seq.fetch('1:*', {
            bodies: '',
            markSeen: false,
            struct: true
          });

          fetch.on('message', (msg) => {
            let buffer = '';
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', async () => {
              const parsed = await simpleParser(buffer);
              emailEmitter.emit('email', {
                account: account.user,
                subject: parsed.subject,
                from: parsed.from?.text,
                to: parsed.to?.text,
                text: parsed.text,
                html: parsed.html,
                date: parsed.date,
                folder: 'INBOX',
              });
            });
          });
        });

        resolve();
      });
    });

    imap.once('error', (err) => {
      logger.error(`❌ IMAP error for ${account.user}: ${err.message}`);
    });

    imap.once('end', () => {
      logger.warn(`🛑 IMAP connection ended for ${account.user}`);
    });

    imap.connect();
  });
}

async function startIMAPClients() {
  for (const account of accounts) {
    try {
      await connectToImap(account);
    } catch (err) {
      logger.error(`❌ Failed to connect to ${account.user}: ${err.message}`);
    }
  }
}

module.exports = startIMAPClients;
module.exports.emailEmitter = emailEmitter;
