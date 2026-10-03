

const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// max 5 submissions per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again later.' }
});

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

app.post('/api/contact', limiter, async (req, res) => {
  const { name = '', email = '', subject = '', message = '' } = req.body || {};

  // server-side validation — never trust the client
  const errors = [];
  if (name.trim().length < 2) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
  if (message.trim().length < 10) errors.push('message');
  if (errors.length) {
    return res.status(400).json({ error: 'Invalid fields', fields: errors });
  }

  const transport = buildTransport();
  if (!transport) {
    console.warn('[contact] No SMTP configured — logging instead:', { name, email, subject });
    return res.status(503).json({ error: 'Mail is not configured on this server.' });
  }

  try {
    await transport.sendMail({
      from: `"Portfolio site" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || 'prasiddhimainali07@gmail.com',
      replyTo: `"${name}" <${email}>`,
      subject: subject || `New enquiry from ${name}`,
      text: `${message}\n\n— ${name} <${email}>`,
      html: `<p>${message.replace(/\n/g, '<br>')}</p><hr><p><b>${name}</b><br>${email}</p>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] send failed:', err.message);
    res.status(500).json({ error: 'Could not send the message.' });
  }
});

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
