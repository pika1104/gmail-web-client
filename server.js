const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
require('dotenv').config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());
app.use(express.static('public'));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
);

// 認証ルート
app.get('/auth/login', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify']
  });
  res.redirect(authUrl);
});

// コールバック
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  req.session.tokens = tokens;
  oauth2Client.setCredentials(tokens);
  res.redirect('/');
});

// メール一覧取得
app.get('/api/emails', async (req, res) => {
  if (!req.session.tokens) return res.status(401).json({ error: 'Not authenticated' });
  
  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const result = await gmail.users.messages.list({ userId: 'me', maxResults: 20 });
    res.json(result.data.messages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// メール送信
app.post('/api/send', async (req, res) => {
  if (!req.session.tokens) return res.status(401).json({ error: 'Not authenticated' });
  
  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  const { to, subject, message } = req.body;
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    message
  ].join('\n');
  
  const encodedMessage = Buffer.from(email).toString('base64');
  
  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
