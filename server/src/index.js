require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Çerezli oturum kullanıldığı için köken serbest bırakılmaz.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
// Giriş denemelerini IP başına sınırlayabilmek için gerçek istemci adresi gerekir.
app.set('trust proxy', 1);

app.use('/api', routes);

// Üretimde derlenmiş Vue uygulamasını aynı sunucudan servis et.
const clientDist = path.join(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Merkezî hata yakalayıcı.
// Beklenmeyen veritabanı hataları kullanıcıya ham haliyle gösterilmez;
// günlüğe tam hali yazılır, arayüze anlaşılır bir cümle döner.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500
    ? 'Sunucuda beklenmeyen bir hata oluştu. Ayrıntı sunucu günlüğünde.'
    : err.message;
  res.status(status).json({ error: message });
});

if (!process.env.APP_PASSWORD_HASH) {
  console.warn('⚠ APP_PASSWORD_HASH tanımlı değil — giriş yapılamaz. `npm run set-password "parola"` çalıştır.');
}

app.listen(PORT, () => {
  console.log(`▶ SEO Kontrol Listesi API  http://localhost:${PORT}`);
  console.log(`  Yapay zekâ: ${process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || 'gemini-3.7-flash') : 'kapalı (GEMINI_API_KEY tanımlı değil)'}`);
});
