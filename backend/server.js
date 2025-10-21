require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');

const app = express();

/* ---------------- CONFIG ---------------- */
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const resend = new Resend(process.env.RESEND_API_KEY);

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
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const data = await resend.emails.send({
      from: 'EuttyVA<onboarding@resend.dev>', // You can change this once you verify a domain
      to: 'euttyvirtual@gmail.com', // Replace with your real inbox
      subject: `📩 Message from EuttyVA: ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    console.log('✅ Email sent:', data);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Email send error:', err);
    res.status(500).json({ error: 'Failed to send message. Please check server logs.' });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
