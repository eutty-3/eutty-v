require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// Config
const PORT = process.env.PORT || 3000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ WARNING: EMAIL credentials not set in .env');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// CORS for local testing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* ---------------- CONTACT FORM (EMAIL) ---------------- */
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

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'All fields are required.' });

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: EMAIL_USER,
      subject: `📩 New Message from ${name}`,
      text: `From: ${name}\nEmail: ${email}\n\n${message}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Email send error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'All fields are required.' });

  const mailData = {
    from: `"${name}" <${email}>`,
    to: EMAIL_USER,
    subject: `📩 New Message from ${name}`,
    text: `From: ${name}\nEmail: ${email}\n\n${message}`,
  };

  // ⚡ Send asynchronously, no await
  transporter.sendMail(mailData)
    .then(info => console.log(`✅ Email sent: ${info.response}`))
    .catch(err => console.error('❌ Email send error:', err));

  // 💨 Respond instantly (email continues in background)
  res.status(200).json({ success: true, message: "Message received! We'll reply soon." });
});

/* ---------------- DEFAULT ROUTE (FIXED FOR EXPRESS 5) ---------------- */
// ✅ Catch-all for frontend routes (works in Express 5+)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

});
