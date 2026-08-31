require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

// Uretimde derlenmis Vue uygulamasini ayni sunucudan servis et.
const clientDist = path.join(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Merkezi hata yakalayici.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Beklenmeyen hata.' });
});

app.listen(PORT, () => {
  console.log(`▶ SEO Checklist API  http://localhost:${PORT}`);
  console.log(`  AI: ${process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || 'gemini-3.7-flash') : 'kapali (GEMINI_API_KEY yok)'}`);
});
