/**
 * Deterministik kural motoru.
 *
 * Her kural bir madde koduna karşılık gelir ve
 *   { status: 'pass'|'warn'|'fail'|'skip', message, evidence }
 * döndürür. Ölçülebilen her şey burada ölçülür; yapay zekâ yalnızca
 * yorum gerektiren maddelerde devreye girer (bkz. ai.js).
 */

const { words } = require('./extract');

/** Türkçe karakterleri ve büyük/küçük harfi normalleştirir. */
const norm = (s) =>
  (s || '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const has = (haystack, needle) => !!needle && norm(haystack).includes(norm(needle));

const ok   = (message, evidence) => ({ status: 'pass', message, evidence });
const warn = (message, evidence) => ({ status: 'warn', message, evidence });
const bad  = (message, evidence) => ({ status: 'fail', message, evidence });
const skip = (message) => ({ status: 'skip', message });

// Aşağıdaki iki liste bilerek ASCII yazılmıştır: karşılaştırma norm() çıktısı üzerinden yapılır.
const TR_STOPWORDS = ['ve', 'ile', 'icin', 'bir', 'bu', 'de', 'da', 'ki', 'ya', 'ama', 'veya', 'nin', 'nun'];
const WEAK_ANCHORS = [
  'buraya tiklayin', 'tikla', 'tiklayin', 'devami', 'devamini oku', 'daha fazla',
  'link', 'baglanti', 'buradan', 'oku', 'incele', 'goruntule', 'click here', 'read more', 'here',
];

/** Alan adından marka tahmini: www.ornekmarka.com → ornekmarka */
const brandOf = (host) => (host || '').replace(/^www\./, '').split('.')[0];

const RULES = {
  // ═══════════════════════ URL ═══════════════════════
  URL_01: (p, ctx) => {
    if (!p.slug) return warn('Sayfanın kalıcı bağlantısı yok (ana sayfa ya da kök dizin olabilir).', p.pathname);
    const parts = p.slug.split('-').filter(Boolean);
    const kwOk = ctx.focusKeyword ? has(p.slug.replace(/-/g, ' '), ctx.focusKeyword) : null;
    const ev = `Adres: "${p.slug}" (${parts.length} kelime)`;

    if (parts.length > 7) return bad(`Adres ${parts.length} kelime — çok uzun, 3-5 kelimeye indir.`, ev);
    if (parts.length > 5) return warn(`Adres ${parts.length} kelime — biraz uzun, 5 kelimeye indirebilirsin.`, ev);
    if (kwOk === false) return bad(`Adres, odak anahtar kelimeyi ("${ctx.focusKeyword}") içermiyor.`, ev);
    if (kwOk === null) return warn('Adres uzunluğu uygun. Odak anahtar kelime girmediğin için kelime kontrolü yapılamadı.', ev);
    return ok(`Adres ${parts.length} kelime ve odak anahtar kelimeyi içeriyor.`, ev);
  },

  URL_02: (p) => {
    if (!p.slug) return skip('Kalıcı bağlantı yok.');
    const ev = `Adres: "${p.slug}"`;
    const hard = [];
    if (/[çğıöşüÇĞİÖŞÜ]/.test(p.slug)) hard.push('Türkçe karakter');
    if (/[A-Z]/.test(p.slug)) hard.push('büyük harf');
    if (p.slug.includes('_')) hard.push('alt çizgi');
    if (/%[0-9A-Fa-f]{2}/.test(p.pathname)) hard.push('kodlanmış karakter');
    if (hard.length) return bad(`Adreste sorun var: ${hard.join(', ')}.`, ev);
    if (/\b(19|20)\d{2}\b/.test(p.slug))
      return warn('Adreste yıl geçiyor. Etkinlik ya da sürüm adıysa sorun değil; değilse çıkar, içerik güncellenince adres bayatlar.', ev);
    return ok('Adres temiz: yalnızca küçük harf, rakam ve tire.', ev);
  },

  URL_03: (p) => {
    if (!p.slug) return skip('Kalıcı bağlantı yok.');
    const found = p.slug.split('-').filter((w) => TR_STOPWORDS.includes(norm(w)));
    return found.length
      ? warn(`Adreste gereksiz kelime var: ${found.join(', ')}.`, `Adres: "${p.slug}"`)
      : ok('Adreste dolgu kelime yok.', `Adres: "${p.slug}"`);
  },

  // ═══════════════════════ BAŞLIK ═══════════════════════
  TTL_01: (p) => {
    if (!p.title) return bad('Sayfada <title> etiketi yok.');
    const n = p.title.length;
    const ev = `${n} karakter: "${p.title}"`;
    if (n < 40) return bad(`Başlık ${n} karakter — çok kısa, 50-60 aralığına çıkar.`, ev);
    if (n > 65) return bad(`Başlık ${n} karakter — Google kesecek, 60 karaktere indir.`, ev);
    if (n < 50 || n > 60) return warn(`Başlık ${n} karakter — ideal aralık 50-60.`, ev);
    return ok(`Başlık ${n} karakter, ideal aralıkta.`, ev);
  },

  TTL_02: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemiş.');
    if (!p.title) return bad('Sayfada <title> etiketi yok.');
    const pos = norm(p.title).indexOf(norm(ctx.focusKeyword));
    if (pos === -1) return bad(`Odak anahtar kelime ("${ctx.focusKeyword}") başlıkta geçmiyor.`, p.title);
    if (pos > 30) return warn(`Anahtar kelime başlıkta ${pos}. karakterde — başa yaklaştır.`, p.title);
    return ok(`Anahtar kelime başlığın ${pos}. karakterinde.`, p.title);
  },

  TTL_03: (p) => {
    const h1 = p.h1s[0]?.text;
    if (!h1 || !p.title) return skip('Başlık veya H1 okunamadı.');
    const bare = p.title.split(/\s[|–—-]\s/)[0];
    return norm(bare) === norm(h1)
      ? warn('SEO başlığı ile H1 birebir aynı. SEO başlığını arama odaklı farklılaştır.', `H1: "${h1}"`)
      : ok('SEO başlığı ile H1 farklı.', `Başlık: "${bare}"\nH1: "${h1}"`);
  },

  TTL_05: (p) => {
    if (!p.title) return skip('Başlık yok.');
    const letters = p.title.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
    const upperRatio = letters ? letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length / letters.length : 0;
    const marks = (p.title.match(/[!?]/g) || []).length;
    if (letters.length > 10 && upperRatio > 0.7)
      return bad('Başlığın neredeyse tamamı büyük harf — Google başlığı kendi yeniden yazar.', p.title);
    if (marks > 1) return bad(`Başlıkta ${marks} adet ünlem/soru işareti var — en fazla 1 kullan.`, p.title);
    return ok('Başlık biçimi temiz.', p.title);
  },

  TTL_06: (p) => {
    if (!p.title) return skip('Başlık yok.');
    const brand = brandOf(p.host);
    const segs = p.title.split(/\s[|–—-]\s/).map((s) => s.trim());
    if (!has(p.title, brand)) return ok('Başlıkta marka adı kullanılmamış (sorun değil).', p.title);
    if (segs.length > 1 && has(segs[segs.length - 1], brand)) return ok('Marka adı başlığın sonunda, ayırıcı ile.', p.title);
    if (has(segs[0], brand)) return bad('Marka adı başlığın başında — en değerli ilk karakterleri harcıyor, sona al.', p.title);
    return warn('Marka adı başlık içinde, ayırıcı olmadan geçiyor.', p.title);
  },

  TTL_07: (p) => {
    if (!p.title) return skip('Başlık yok.');
    const m = p.title.match(/\b(19|20)\d{2}\b/);
    if (!m) return ok('Başlıkta yıl geçmiyor.', p.title);
    const year = Number(m[0]);
    const now = new Date().getFullYear();
    if (year < now)
      return warn(`Başlıkta ${year} yazıyor, güncel yıl ${now}. İçeriği güncelleyip yılı yenile ya da yılı kaldır.`, p.title);
    return ok(`Başlıkta güncel yıl (${year}) kullanılmış.`, p.title);
  },

  // ═══════════════════════ META AÇIKLAMA ═══════════════════════
  MTA_01: (p) => {
    const d = p.metaDescription;
    if (!d) return bad('Meta açıklama tanımlı değil — Google sayfadan rastgele cümle çekecek.');
    if (/%%|\{\{|\[\[/.test(d)) return bad('Meta açıklamada işlenmemiş şablon değişkeni var.', d);
    if (words(d).length < 8) return bad(`Meta açıklama çok kısa (${words(d).length} kelime).`, d);
    return ok('Meta açıklama elle yazılmış.', d);
  },

  MTA_02: (p) => {
    const d = p.metaDescription;
    if (!d) return skip('Meta açıklama yok (bkz. MTA_01).');
    const n = d.length;
    const ev = `${n} karakter: "${d}"`;
    if (n < 100) return bad(`Meta açıklama ${n} karakter — çok kısa, alan boşa gidiyor (hedef 120-158).`, ev);
    if (n > 165) return bad(`Meta açıklama ${n} karakter — Google kesecek (hedef 120-158).`, ev);
    if (n < 120 || n > 158) return warn(`Meta açıklama ${n} karakter — ideal aralık 120-158.`, ev);
    return ok(`Meta açıklama ${n} karakter, ideal aralıkta.`, ev);
  },

  MTA_03: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemiş.');
    if (!p.metaDescription) return skip('Meta açıklama yok (bkz. MTA_01).');
    return has(p.metaDescription, ctx.focusKeyword)
      ? ok('Anahtar kelime meta açıklamada geçiyor.', p.metaDescription)
      : bad(`Anahtar kelime ("${ctx.focusKeyword}") meta açıklamada geçmiyor.`, p.metaDescription);
  },

  // ═══════════════════════ HİYERARŞİ ═══════════════════════
  HDG_01: (p) => {
    const n = p.h1s.length;
    if (n === 0) return bad('Sayfada H1 yok. Yazının ana konusu tanımsız kalıyor.');
    if (n > 1) return bad(`Sayfada ${n} adet H1 var. Yalnızca 1 tane olmalı.`, p.h1s.map((h) => h.text).join('\n'));
    return ok('Tam olarak 1 adet H1 var.', p.h1s[0].text);
  },

  HDG_02: (p) => {
    const h1 = p.h1s[0];
    if (!h1) return skip('H1 yok (bkz. HDG_01).');
    if (!h1.text) return bad('H1 boş.');
    if (norm(h1.text) === norm(brandOf(p.host)))
      return bad('H1, site adıyla aynı — yazının konusunu anlatmıyor. Bu bir tema hatasıdır.', h1.text);
    if (words(h1.text).length < 3) return warn(`H1 çok kısa (${words(h1.text).length} kelime).`, h1.text);
    return ok('H1 yazının konusunu anlatıyor.', h1.text);
  },

  HDG_03: (p) => {
    const hs = p.headings.filter((h) => !h.empty);
    if (hs.length < 2) return skip('Karşılaştırılacak yeterli başlık yok.');
    const jumps = [];
    for (let i = 1; i < hs.length; i++) {
      if (hs[i].level - hs[i - 1].level > 1) {
        jumps.push(`H${hs[i - 1].level} ("${hs[i - 1].text.slice(0, 40)}") → H${hs[i].level} ("${hs[i].text.slice(0, 40)}")`);
      }
    }
    return jumps.length
      ? bad(`${jumps.length} yerde başlık seviyesi atlanmış.`, jumps.join('\n'))
      : ok('Başlık hiyerarşisi kesintisiz, seviye atlanmamış.', hs.map((h) => `H${h.level}`).join(' → '));
  },

  HDG_05: (p) => {
    const h2s = p.headings.filter((h) => h.level === 2 && !h.empty);
    if (h2s.length < 2)
      return bad(`Sayfada ${h2s.length} adet H2 var. En az 2 alt başlık aç.`, h2s.map((h) => h.text).join('\n'));
    const thin = h2s.filter((h) => h.textAfterWords < 20);
    if (thin.length)
      return warn(`${thin.length} H2 altında neredeyse hiç içerik yok.`, thin.map((h) => `"${h.text}" → ${h.textAfterWords} kelime`).join('\n'));
    return ok(`${h2s.length} adet H2 var, hepsinin altında içerik mevcut.`, h2s.map((h) => h.text).join('\n'));
  },

  HDG_07: (p) => {
    const problems = [];
    p.headings.forEach((h) => {
      if (h.empty) problems.push(`H${h.level}: boş başlık`);
      else if (h.hasImage) problems.push(`H${h.level} "${h.text.slice(0, 40)}": içinde görsel var`);
      else if (h.hasLink && h.inContent) problems.push(`H${h.level} "${h.text.slice(0, 40)}": içinde bağlantı var`);
    });
    return problems.length
      ? warn(`${problems.length} başlıkta sorun var.`, problems.join('\n'))
      : ok('Boş ya da görsel/bağlantı içeren başlık yok.');
  },

  // ═══════════════════════ İÇERİK ═══════════════════════
  CNT_01: (p) => {
    const n = p.wordCount;
    const ev = `${n} kelime`;
    if (n < 300) return bad(`İçerik ${n} kelime — konuyu karşılaması zor (hedef 600+).`, ev);
    if (n < 600) return warn(`İçerik ${n} kelime — rakiplerle karşılaştır, eksik alt konu var mı bak.`, ev);
    return ok(`İçerik ${n} kelime.`, ev);
  },

  CNT_02: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemiş.');
    const ev = p.firstWords.slice(0, 200) + '…';
    return has(p.firstWords, ctx.focusKeyword)
      ? ok('Anahtar kelime ilk 100 kelimede geçiyor.', ev)
      : bad(`Anahtar kelime ("${ctx.focusKeyword}") ilk 100 kelimede geçmiyor.`, ev);
  },

  CNT_03: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemiş.');
    if (!p.wordCount) return skip('İçerik metni okunamadı.');
    const kw = norm(ctx.focusKeyword);
    const body = norm(p.bodyText);
    let count = 0, idx = 0;
    while ((idx = body.indexOf(kw, idx)) !== -1) { count++; idx += kw.length; }
    const density = (count * words(ctx.focusKeyword).length * 100) / p.wordCount;
    const ev = `${count} kez geçiyor · yoğunluk %${density.toFixed(2)} · toplam ${p.wordCount} kelime`;
    if (count === 0) return bad('Anahtar kelime içerikte hiç geçmiyor.', ev);
    if (density > 3) return bad(`Yoğunluk %${density.toFixed(2)} — aşırı tekrar, spam sinyali üretir.`, ev);
    if (density > 2.5) return warn(`Yoğunluk %${density.toFixed(2)} — üst sınıra yakın.`, ev);
    if (density < 0.5) return warn(`Yoğunluk %${density.toFixed(2)} — düşük, doğal birkaç tekrar ekleyebilirsin.`, ev);
    return ok(`Yoğunluk %${density.toFixed(2)} — sağlıklı aralıkta.`, ev);
  },

  CNT_04: (p) => {
    if (!p.paragraphs.length) return skip('Paragraf bulunamadı.');
    const longs = p.paragraphs.filter((x) => x.words > 150);
    const mid = p.paragraphs.filter((x) => x.words > 100 && x.words <= 150);
    if (longs.length)
      return bad(`${longs.length} paragraf 150 kelimeden uzun — mobilde okunmaz.`,
        longs.map((x) => `${x.words} kelime: "${x.text.slice(0, 70)}…"`).join('\n'));
    if (mid.length > 2) return warn(`${mid.length} paragraf 100 kelimeyi aşıyor — bölmeyi düşün.`);
    return ok('Paragraf uzunlukları makul.', `En uzun paragraf: ${Math.max(...p.paragraphs.map((x) => x.words))} kelime`);
  },

  CNT_05: (p) => {
    const ev = `${p.listCount} liste maddesi · ${p.tableCount} tablo`;
    if (p.listCount === 0 && p.tableCount === 0)
      return bad('İçerikte hiç liste ya da tablo yok — taranabilirlik düşük.', ev);
    if (p.listCount < 3 && p.tableCount === 0) return warn('Çok az liste öğesi var.', ev);
    return ok('İçerikte liste veya tablo mevcut.', ev);
  },

  CNT_09: (p) => {
    const missing = [];
    if (!p.authorName) missing.push('yazar adı');
    if (!p.publishedAt && !p.modifiedAt) missing.push('tarih');
    const ev = `Yazar: ${p.authorName || 'bulunamadı'}\nTarih: ${p.modifiedAt || p.publishedAt || 'bulunamadı'}`;
    return missing.length
      ? warn(`Sayfada ${missing.join(' ve ')} bulunamadı — E-E-A-T sinyali eksik.`, ev)
      : ok('Yazar ve tarih bilgisi mevcut.', ev);
  },

  // ═══════════════════════ GÖRSELLER ═══════════════════════
  IMG_01: (p) => {
    if (p.og.image) return ok('Öne çıkan görsel tanımlı (og:image üzerinden doğrulandı).', p.og.image);
    if (p.images.length)
      return warn('og:image yok; sayfada görsel var ama öne çıkan görsel atanmamış olabilir.', `${p.images.length} görsel bulundu`);
    return bad('Sayfada hiç görsel yok ve og:image tanımsız.');
  },

  IMG_02: (p) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Görsel yok.');
    const missing = imgs.filter((i) => !i.hasAltAttr || !i.alt);
    return missing.length
      ? bad(`${imgs.length} görselin ${missing.length} tanesinde alternatif metin eksik.`,
          missing.slice(0, 8).map((i) => i.filename).join('\n'))
      : ok(`${imgs.length} görselin tamamında alternatif metin var.`);
  },

  IMG_04: (p) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Görsel yok.');
    const vague = imgs.filter(
      (i) => /^(img|dsc|pxl|screenshot|photo|image|untitled)[-_]?\d/i.test(i.filename) || /^\d+\./.test(i.filename)
    );
    return vague.length
      ? warn(`${vague.length} görselin dosya adı açıklayıcı değil.`, vague.slice(0, 8).map((i) => i.filename).join('\n'))
      : ok('Görsel dosya adları açıklayıcı.');
  },

  IMG_05: (p, ctx) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Görsel yok.');
    const oldFormat = imgs.filter((i) => !['webp', 'avif'].includes(i.ext));
    const heavy = (ctx.imageProbes || []).filter((x) => x.bytes && x.bytes > 200 * 1024);

    if (heavy.length)
      return bad(`${heavy.length} görsel 200 KB'tan ağır.`,
        heavy.map((x) => `${Math.round(x.bytes / 1024)} KB — ${x.url.split('/').pop()}`).join('\n'));
    if (oldFormat.length)
      return warn(`${imgs.length} görselin ${oldFormat.length} tanesi WebP/AVIF değil. Dönüştürmek sayfa ağırlığını belirgin düşürür.`,
        oldFormat.slice(0, 8).map((i) => i.filename).join('\n'));
    return ok('Görseller modern biçimde ve makul boyutta.', `${imgs.length} görsel kontrol edildi`);
  },

  IMG_06: (p) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Görsel yok.');
    const missing = imgs.filter((i) => !i.width || !i.height);
    return missing.length
      ? warn(`${imgs.length} görselin ${missing.length} tanesinde genişlik/yükseklik yok — sayfa yüklenirken zıplayabilir.`,
          missing.slice(0, 8).map((i) => i.filename).join('\n'))
      : ok('Tüm görsellerde genişlik ve yükseklik tanımlı.');
  },

  IMG_07: (p) => {
    const imgs = p.images;
    if (!imgs.length) return skip('Görsel yok.');
    const first = imgs[0];
    const rest = imgs.slice(1);
    const lazyRest = rest.filter((i) => i.lazy).length;
    if (first.lazy)
      return bad('Sayfadaki ilk görsel tembel yükleniyor — LCP süresini doğrudan geciktirir.', first.src);
    if (rest.length && lazyRest === 0)
      return warn('Alt taraftaki görsellerin hiçbiri tembel yüklenmiyor — gereksiz veri indiriliyor.', `${rest.length} görsel`);
    return ok('İlk görsel hemen, alttakiler tembel yükleniyor.',
      `İlk görsel: ${first.filename}\n${rest.length} alt görselin ${lazyRest} tanesi tembel`);
  },

  // ═══════════════════════ BAĞLANTILAR ═══════════════════════
  LNK_01: (p) => {
    const n = p.internalLinks.length;
    if (n === 0) return bad('İçerikte hiç iç bağlantı yok.');
    if (n < 3) return warn(`Yalnızca ${n} iç bağlantı var — en az 3 olmalı.`, p.internalLinks.map((l) => l.href).join('\n'));
    return ok(`${n} iç bağlantı mevcut.`, p.internalLinks.slice(0, 8).map((l) => `${l.anchor} → ${l.href}`).join('\n'));
  },

  LNK_02: (p) => {
    if (!p.internalLinks.length) return skip('İç bağlantı yok (bkz. LNK_01).');
    const weak = p.internalLinks.filter((l) => !l.isImageLink && WEAK_ANCHORS.includes(norm(l.anchor)));
    const empty = p.internalLinks.filter((l) => !l.anchor);
    if (weak.length || empty.length)
      return warn(`${weak.length + empty.length} bağlantıda metin zayıf ya da boş.`,
        [...weak, ...empty].slice(0, 8).map((l) => `"${l.anchor || '(boş)'}" → ${l.href}`).join('\n'));
    return ok('Bağlantı metinleri açıklayıcı.');
  },

  LNK_04: (p) => {
    const n = p.externalLinks.length;
    if (n === 0) return warn('Hiç dış bağlantı yok — iddiaları kaynakla desteklemek güven verir.');
    const noNewTab = p.externalLinks.filter((l) => l.target !== '_blank');
    if (noNewTab.length === n)
      return warn(`${n} dış bağlantı var ama hiçbiri yeni sekmede açılmıyor.`,
        p.externalLinks.slice(0, 5).map((l) => l.href).join('\n'));
    return ok(`${n} dış bağlantı mevcut.`, p.externalLinks.slice(0, 5).map((l) => l.href).join('\n'));
  },

  LNK_05: (p, ctx) => {
    const probes = ctx.linkProbes || [];
    if (!probes.length) return skip('Kontrol edilecek bağlantı bulunamadı.');
    // 403 ve 429 botları engelleyen sitelerden gelir, kırık sayılmaz.
    const broken = probes.filter((x) => !x.ok && x.status !== 403 && x.status !== 429);
    return broken.length
      ? bad(`${broken.length} kırık bağlantı var.`, broken.map((x) => `${x.status || x.error} — ${x.url}`).join('\n'))
      : ok(`${probes.length} bağlantı kontrol edildi, kırık bağlantı yok.`);
  },

  LNK_06: (p) => {
    const ext = p.externalLinks;
    if (!ext.length) return skip('Dış bağlantı yok.');
    const affiliate = /(\/ref=|[?&](ref|aff|affiliate|tag|partner)=|\/go\/|\/out\/|\/redirect\/|amzn\.to|bit\.ly)/i;
    const suspects = ext.filter((l) => affiliate.test(l.href) && !/sponsored|nofollow/.test(l.rel));
    return suspects.length
      ? warn(`${suspects.length} bağlantı ortaklık/yönlendirme gibi görünüyor ama rel="sponsored" ya da "nofollow" taşımıyor.`,
          suspects.slice(0, 8).map((l) => l.href).join('\n'))
      : ok('İşaretlenmemiş ortaklık bağlantısı yok.');
  },

  // ═══════════════════════ TEKNİK ═══════════════════════
  TEC_01: (p) => {
    if (p.robotsMeta.includes('noindex'))
      return bad('Sayfada noindex var — Google bu sayfayı dizine EKLEMEZ.', `meta robots: ${p.robotsMeta}`);
    if (p.xRobots.includes('noindex'))
      return bad('X-Robots-Tag üstbilgisinde noindex var (sunucu taraflı).', `X-Robots-Tag: ${p.xRobots}`);
    if (p.robotsMeta.includes('nofollow'))
      return warn('Sayfa dizine eklenebilir ama tüm bağlantıları nofollow.', `meta robots: ${p.robotsMeta}`);
    return ok('Sayfa dizine eklenebilir.', p.robotsMeta ? `meta robots: ${p.robotsMeta}` : 'noindex yok');
  },

  TEC_02: (p) => {
    if (!p.canonical) return warn('Canonical etiketi yok.');
    const strip = (x) => x.replace(/\/$/, '').replace(/^https?:\/\/(www\.)?/, '').split('#')[0];
    return strip(p.canonical) === strip(p.url)
      ? ok('Canonical sayfanın kendisini gösteriyor.', p.canonical)
      : bad('Canonical BAŞKA bir sayfayı gösteriyor — bu sayfa sıralamadan çıkar.',
          `Canonical: ${p.canonical}\nSayfa:     ${p.url}`);
  },

  TEC_03: (p) => {
    if (p.jsonld.some((n) => n.__parseError)) return bad('JSON-LD var ama bozuk, okunamadı.');
    const types = p.jsonld.flatMap((n) => (Array.isArray(n?.['@type']) ? n['@type'] : [n?.['@type']])).filter(Boolean);
    const graphTypes = p.jsonld.flatMap((n) => (n?.['@graph'] || []).map((g) => g?.['@type'])).flat().filter(Boolean);
    const all = [...types, ...graphTypes].map(String);
    if (!all.length) return bad('Sayfada JSON-LD yapısal verisi yok.');
    return all.some((t) => /Article|BlogPosting|NewsArticle/i.test(t))
      ? ok('Article/BlogPosting şeması mevcut.', all.join(', '))
      : warn('Yapısal veri var ama Article/BlogPosting türü yok.', all.join(', '));
  },

  TEC_04: (p) => {
    const missing = [];
    if (!p.og.title) missing.push('og:title');
    if (!p.og.description) missing.push('og:description');
    if (!p.og.image) missing.push('og:image');
    const present = Object.entries(p.og).filter(([, v]) => v).map(([k]) => k).join(', ') || 'hiçbiri';
    return missing.length
      ? bad(`Open Graph eksik: ${missing.join(', ')}.`, `Mevcut: ${present}`)
      : ok('Open Graph başlık, açıklama ve görseli tanımlı.', p.og.image);
  },

  TEC_05: (p) => {
    if (!p.twitter.card) return warn('twitter:card tanımlı değil.');
    return p.twitter.card === 'summary_large_image'
      ? ok('Twitter/X kartı büyük görselli.', p.twitter.card)
      : warn(`twitter:card değeri "${p.twitter.card}" — "summary_large_image" daha çok tıklanma getirir.`);
  },

  TEC_06: (p) => {
    if (!p.viewport) return bad('viewport etiketi yok — sayfa mobilde bozulur.');
    return /width\s*=\s*device-width/i.test(p.viewport)
      ? ok('Mobil viewport tanımlı.', p.viewport)
      : warn('viewport var ama device-width kullanılmamış.', p.viewport);
  },
};

/** ctx.linkProbes ve ctx.imageProbes doldurulmuş halde çağrılır. */
function runRules(page, ctx) {
  const results = {};
  for (const [code, fn] of Object.entries(RULES)) {
    try {
      results[code] = { ...fn(page, ctx), source: 'rule' };
    } catch (err) {
      results[code] = { status: 'skip', source: 'rule', message: `Kural çalıştırılamadı: ${err.message}` };
    }
  }
  return results;
}

module.exports = { runRules, RULES, norm };
