// services/emailParser.js

const { simpleParser } = require('mailparser');

/**
 * Parses a raw email buffer using mailparser and returns a structured object.
 *
 * @param {Buffer | string} rawEmail - The raw email data from IMAP fetch.
 * @param {string} account - The email account the message came from.
 * @param {string} folder - The folder it belongs to (e.g., INBOX).
 * @returns {Promise<Object>} Parsed email object
 */
async function parseEmail(rawEmail, account, folder = 'INBOX') {
  try {
    const parsed = await simpleParser(rawEmail);

    // Structure the output cleanly
    return {
      account,
      folder,
      subject: parsed.subject || '(no subject)',
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      cc: parsed.cc?.text || '',
      bcc: parsed.bcc?.text || '',
      replyTo: parsed.replyTo?.text || '',
      date: parsed.date || new Date(),
      text: parsed.text || '',
      html: parsed.html || '',
      messageId: parsed.messageId || '',
      attachments: parsed.attachments?.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size
      })) || []
    };

  } catch (err) {
    console.error('❌ Failed to parse email:', err.message);
    return null;
  }
}

module.exports = parseEmail;
