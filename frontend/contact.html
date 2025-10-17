require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const multer = require('multer');

const app = express();

/* ---------------- CONFIG ---------------- */
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.static(path.join(__dirname, 'frontend')));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Multer config (memory storage)
const upload = multer(); // stores uploaded files in memory

/* ---------------- CONTACT FORM ROUTE ---------------- */
app.post('/api/contact', upload.none(), async (req, res) => {
  try {
    const { name, email, message, subject, reason, location_lat, location_lng } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Build email HTML content
    let htmlContent = `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      ${subject ? `<p><b>Subject:</b> ${subject}</p>` : ''}
      ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
      <p><b>Message:</b></p>
      <p>${message}</p>
    `;

    if (location_lat && location_lng) {
      htmlContent += `<p><b>Location:</b> ${location_lat}, ${location_lng}</p>`;
    }

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'EuttyVA<onboarding@resend.dev>',
      to: 'euttyvirtual@gmail.com',
      subject: `📩 Message from EuttyVA: ${name}`,
      html: htmlContent,
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