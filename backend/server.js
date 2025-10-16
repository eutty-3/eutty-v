require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

/* ---------------- CONFIG ---------------- */
const PORT = process.env.PORT || 3000;
// Load all necessary environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS; // ❗ This MUST be your Gmail App Password on Render 
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 465; // Use 465 for secure: true

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ WARNING: EMAIL credentials not set in environment variables');
}

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// CORS
app.use((req, res, next) => {
  // Ensure the frontend URL is correct and secure
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* ---------------- CONTACT FORM ROUTE ---------------- */
// 🟢 FIXED: Using variables and removed the 'tls' block for secure connection on port 465
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT == 465, // Set to true if 465, false if 587
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, 
  },
});

// Test transporter
transporter.verify((err, success) => {
  if (err) console.error('❌ Email setup error (Check credentials/port):', err);
  else console.log('✅ Email server ready');
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`, // Use user's email as from address
      to: EMAIL_USER, // Send the email to your own account
      subject: `📩 New Message from EuttyVA: ${name}`,
      text: `From: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    // ❗ CRITICAL: This console log will show the error in the Render service logs
    console.error('❌ Email send error:', err); 
    // Return a generic error to the user for security
    res.status(500).json({ error: 'Failed to send message. Please check server logs.' });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
