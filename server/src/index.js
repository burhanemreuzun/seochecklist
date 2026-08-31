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

// Derlenmiş Vue uygulamasını aynı sunucudan servis et.
// Derleme yapılmamışsa Express'in "Cannot GET /" yanıtı yerine ne yapılması
// gerektiğini söyleyen bir sayfa döndürülür; dağıtımda en sık karşılaşılan
// durum budur ve o mesaj hiçbir şey anlatmıyor.
const clientDist = path.join(__dirname, '../../client/dist');
const clientBuilt = require('fs').existsSync(path.join(clientDist, 'index.html'));

if (clientBuilt) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  console.warn('⚠ client/dist bulunamadı — arayüz derlenmemiş. Derleme komutu: npm run build');
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.status(503).type('html').send(`<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Arayüz derlenmemiş</title></head>
<body style="font:16px/1.6 system-ui,sans-serif;max-width:640px;margin:80px auto;padding:0 24px;color:#0a0a0a">
<h1 style="font-size:24px;letter-spacing:-.02em">Arayüz derlenmemiş</h1>
<p>Sunucu çalışıyor ama <code>client/dist</code> klasörü yok, yani derleme adımı çalışmamış.</p>
<p>Hosting panelinde <strong>derleme komutunu</strong> şu değere ayarla ve yeniden dağıt:</p>
<pre style="background:#f5f4f1;border:1px solid #ececec;border-radius:8px;padding:12px 14px">npm run hosting:build</pre>
<p>API çalışır durumda: <a href="/api/health">/api/health</a></p>
</body></html>`);
  });
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

/**
 * Kabuk erişimi olmayan sunucularda (paylaşımlı hosting, otomatik dağıtım)
 * tabloların ve maddelerin kurulmasını sağlar. Her iki işlem de yinelenebilir:
 * tablo varsa dokunmaz, madde varsa günceller.
 * Sunucu dinlemeye başladıktan SONRA çalışır; veritabanına ulaşılamazsa uygulama
 * yine de açık kalır ve durum /api/health üzerinden görülür.
 */
async function autoMigrate() {
  if (process.env.AUTO_MIGRATE !== 'true') return;
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const run = promisify(execFile);
  for (const script of ['db/migrate.js', 'db/seed.js']) {
    try {
      const { stdout } = await run(process.execPath, [path.join(__dirname, script)], { timeout: 45000 });
      process.stdout.write(stdout);
    } catch (err) {
      console.error(`⚠ Otomatik kurulum adımı başarısız (${script}):`, err.stderr || err.message);
    }
  }
}

// Port ÖNCE açılır. Veritabanı kurulumu arkada çalışır ve bağlanmayı asla
// geciktirmez: aksi halde veritabanına ulaşılamadığında süreç hiç dinlemeye
// başlamaz ve önündeki vekil sunucu 503 döndürür.
app.listen(PORT, () => {
  console.log(`▶ SEO Kontrol Listesi API  ${PORT} portunda`);
  console.log(`  Veritabanı: ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'seochecklist'}`);
  console.log(`  Yapay zekâ: ${process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || 'gemini-3.7-flash') : 'kapalı (GEMINI_API_KEY tanımlı değil)'}`);
  autoMigrate();
});
