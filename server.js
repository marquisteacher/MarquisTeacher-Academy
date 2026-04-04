// ═══════════════════════════════════════════════════════════
//  MarquisTeacher Academy — server.js
//  Serves the site + proxies Claude API calls securely
// ═══════════════════════════════════════════════════════════
const express = require('express');
const path    = require('path');
const app     = express();

app.use(express.json());

// ── CLAUDE API PROXY ──────────────────────────────────────
// Keeps your API key secret — never exposed to the browser
app.post('/api/chat', async (req, res) => {
  const key = process.env.CLAUDE_KEY;
  if (!key) { return res.status(500).json({ error: 'CLAUDE_KEY not configured' }); }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'AI service unavailable', detail: e.message });
  }
});

// ── STATIC FILES ──────────────────────────────────────────
// Serve everything in /public (your existing site)
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MarquisTeacher Academy running on port ${PORT}`);
});
