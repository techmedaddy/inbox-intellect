// config/imapClients.js

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const EventEmitter = require('events');
const dotenv = require('dotenv');
const { DateTime } = require('luxon');

dotenv.config();

// Event emitter to broadcast new parsed emails
const emailEmitter = new EventEmitter();

// List of accounts (expandable to more than 2)
const accounts = [
  {
    user: process.env.IMAP_EMAIL_1,
    password: process.env.IMAP_PASS_1,
  },
  {
    user: process.env.IMAP_EMAIL_2,
    password: process.env.IMAP_PASS_2,
  }
];

// 30 days ago (RFC822 date string)
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

    imap.once('ready', function () {
      console.log(`📥 Connected to ${account.user}`);
      openInbox(function (err, box) {
        if (err) return reject(err);

        // === Step 1: Fetch last 30 days of emails ===
        imap.search(['ALL', ['SINCE', sinceDate]], function (err, results) {
          if (err) return reject(err);
          if (!results || results.length === 0) {
            console.log(`ℹ️ No recent emails for ${account.user}`);
            return;
          }

          const fetch = imap.fetch(results, { bodies: '', markSeen: false });

          fetch.on('message', function (msg, seqno) {
            let buffer = '';
            msg.on('body', function (stream) {
              stream.on('data', function (chunk) {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', async function () {
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

          fetch.once('end', function () {
            console.log(`📨 Initial sync complete for ${account.user}`);
          });
        });

        // === Step 2: Listen for new emails via IDLE ===
        imap.on('mail', function () {
          const fetch = imap.seq.fetch('1:*', {
            bodies: '',
            markSeen: false,
            struct: true
          });

          fetch.on('message', function (msg, seqno) {
            let buffer = '';
            msg.on('body', function (stream) {
              stream.on('data', function (chunk) {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', async function () {
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

    imap.once('error', function (err) {
      console.error(`❌ IMAP error for ${account.user}:`, err.message);
    });

    imap.once('end', function () {
      console.log(`🛑 Connection ended for ${account.user}`);
    });

    imap.connect();
  });
}

async function startIMAPClients() {
  for (const account of accounts) {
    try {
      await connectToImap(account);
    } catch (err) {
      console.error(`Failed to connect to ${account.user}:`, err.message);
    }
  }
}

module.exports = startIMAPClients;
module.exports.emailEmitter = emailEmitter;
