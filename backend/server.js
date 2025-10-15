require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

/* ---------------- CONFIG ---------------- */
const PORT = process.env.PORT || 3000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ WARNING: EMAIL credentials not set in environment variables');
}

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* ---------------- CONTACT FORM ROUTE ---------------- */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, // Gmail App Password
  },
  tls: { rejectUnauthorized: false },
});

// Test transporter
transporter.verify((err, success) => {
  if (err) console.error('❌ Email setup error:', err);
  else console.log('✅ Email server ready');
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: EMAIL_USER,
      subject: `📩 New Message from ${name}`,
      text: `From: ${name}\nEmail: ${email}\n\n${message}`,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Email send error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

