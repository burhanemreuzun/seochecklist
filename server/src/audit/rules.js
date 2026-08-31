/**
 * Deterministik kural motoru.
 *
 * Her kural bir madde koduna karsilik gelir ve
 *   { status: 'pass'|'warn'|'fail'|'skip', message, evidence }
 * dondurur. Olculebilen her sey burada olculur; yapay zeka yalnizca
 * yorum gerektiren maddelerde devreye girer (bkz. ai.js).
 */

const { words } = require('./extract');

/** Turkce karakterleri ve buyuk/kucuk harfi normalize eder. */
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

const TR_STOPWORDS = ['ve', 'ile', 'icin', 'bir', 'bu', 'de', 'da', 'ki', 'ya', 'ama', 'veya', 'nin', 'nun'];
const GENERIC_HEADINGS = ['giris', 'sonuc', 'ozet', 'genel', 'genel bakis', 'hakkinda', 'son soz', 'kapanis', 'diger', 'notlar'];
const WEAK_ANCHORS = ['buraya tiklayin', 'tikla', 'tiklayin', 'devami', 'devamini oku', 'daha fazla', 'link', 'buradan', 'oku', 'incele', 'goruntule', 'click here', 'read more', 'here'];

/** Alan adindan marka tahmini: www.ornekmarka.com -> ornekmarka */
const brandOf = (host) => (host || '').replace(/^www\./, '').split('.')[0];

const RULES = {
  // ═══════════════════════ URL & SLUG ═══════════════════════
  URL_01: (p, ctx) => {
    if (!p.slug) return warn('Sayfanin bir slug\'i yok (ana sayfa veya kok dizin).', p.pathname);
    const parts = p.slug.split('-').filter(Boolean);
    const kwOk = ctx.focusKeyword ? has(p.slug.replace(/-/g, ' '), ctx.focusKeyword) : null;
    const ev = `slug: "${p.slug}" (${parts.length} kelime)`;

    if (parts.length > 7) return bad(`Slug ${parts.length} kelime - cok uzun, 3-5 kelimeye indir.`, ev);
    if (parts.length > 5) return warn(`Slug ${parts.length} kelime - biraz uzun, 5 kelimeye indirebilirsin.`, ev);
    if (kwOk === false) return bad(`Slug odak anahtar kelimeyi ("${ctx.focusKeyword}") icermiyor.`, ev);
    if (kwOk === null) return warn(`Slug uzunlugu uygun. Anahtar kelime girmedigin icin kelime kontrolu yapilamadi.`, ev);
    return ok(`Slug ${parts.length} kelime ve odak anahtar kelimeyi iceriyor.`, ev);
  },

  URL_02: (p) => {
    if (!p.slug) return skip('Slug yok.');
    const ev = `slug: "${p.slug}"`;
    // Kesin hatalar: URL'i bozar veya okunmaz yapar.
    const hard = [];
    if (/[çğıöşüÇĞİÖŞÜ]/.test(p.slug)) hard.push('Turkce karakter');
    if (/[A-Z]/.test(p.slug)) hard.push('buyuk harf');
    if (p.slug.includes('_')) hard.push('alt cizgi');
    if (/%[0-9A-Fa-f]{2}/.test(p.pathname)) hard.push('kodlanmis karakter');
    if (hard.length) return bad(`Slug'da sorun var: ${hard.join(', ')}.`, ev);
    // Yil mesru olabilir (etkinlik/surum adi), o yuzden sadece uyari.
    if (/\b(19|20)\d{2}\b/.test(p.slug))
      return warn('Slug\'da yil var. Etkinlik/surum adiysa sorun degil; degilse cikar - icerik guncellenince URL bayatlar.', ev);
    return ok('Slug temiz: sadece kucuk harf, rakam ve tire.', ev);
  },

  URL_03: (p) => {
    if (!p.slug) return skip('Slug yok.');
    const found = p.slug.split('-').filter((w) => TR_STOPWORDS.includes(norm(w)));
    return found.length
      ? warn(`Slug'da gereksiz kelime var: ${found.join(', ')}.`, `slug: "${p.slug}"`)
      : ok('Slug\'da dolgu kelime yok.', `slug: "${p.slug}"`);
  },

  // ═══════════════════════ BASLIK ═══════════════════════
  TTL_01: (p) => {
    if (!p.title) return bad('Sayfada <title> etiketi yok.');
    const n = p.title.length;
    const ev = `${n} karakter: "${p.title}"`;
    if (n < 40) return bad(`Baslik ${n} karakter - cok kisa, 50-60 arasina cikar.`, ev);
    if (n > 65) return bad(`Baslik ${n} karakter - Google kesecek, 60 karaktere indir.`, ev);
    if (n < 50 || n > 60) return warn(`Baslik ${n} karakter - ideal aralik 50-60.`, ev);
    return ok(`Baslik ${n} karakter, ideal aralikta.`, ev);
  },

  TTL_02: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemis.');
    if (!p.title) return bad('Sayfada <title> etiketi yok.');
    const pos = norm(p.title).indexOf(norm(ctx.focusKeyword));
    if (pos === -1) return bad(`Odak anahtar kelime ("${ctx.focusKeyword}") baslikta gecmiyor.`, p.title);
    if (pos > 30) return warn(`Anahtar kelime baslikta ${pos}. karakterde - basa yaklastir.`, p.title);
    return ok(`Anahtar kelime basligin ${pos}. karakterinde.`, p.title);
  },

  TTL_03: (p) => {
    const h1 = p.h1s[0]?.text;
    if (!h1 || !p.title) return skip('Baslik veya H1 okunamadi.');
    // Marka ekini soyup karsilastir.
    const bare = p.title.split(/\s[|–—-]\s/)[0];
    return norm(bare) === norm(h1)
      ? warn('SEO basligi ile H1 birebir ayni. SEO basligini arama odakli farklilastir.', `H1: "${h1}"`)
      : ok('SEO basligi ile H1 farkli.', `title: "${bare}" / H1: "${h1}"`);
  },

  TTL_05: (p) => {
    if (!p.title) return skip('Baslik yok.');
    const letters = p.title.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
    const upperRatio = letters ? letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length / letters.length : 0;
    const bangs = (p.title.match(/[!?]/g) || []).length;
    if (letters.length > 10 && upperRatio > 0.7) return bad('Baslik neredeyse tamami buyuk harf - Google basligi yeniden yazar.', p.title);
    if (bangs > 1) return bad(`Baslikta ${bangs} adet !/? var - en fazla 1 kullan.`, p.title);
    return ok('Baslik bicimi temiz.', p.title);
  },

  TTL_06: (p) => {
    if (!p.title) return skip('Baslik yok.');
    const brand = brandOf(p.host);
    const segs = p.title.split(/\s[|–—-]\s/).map((s) => s.trim());
    if (!has(p.title, brand)) return ok('Baslikta marka adi kullanilmamis (sorun degil).', p.title);
    if (segs.length > 1 && has(segs[segs.length - 1], brand)) return ok('Marka adi basligin sonunda, ayirici ile.', p.title);
    if (has(segs[0], brand)) return bad('Marka adi basligin BASINDA - degerli ilk karakterleri harciyor, sona al.', p.title);
    return warn('Marka adi baslik icinde ayirici olmadan geciyor.', p.title);
  },

  TTL_07: (p) => {
    if (!p.title) return skip('Baslik yok.');
    const m = p.title.match(/\b(19|20)\d{2}\b/);
    if (!m) return ok('Baslikta yil gecmiyor.', p.title);
    const year = Number(m[0]);
    const now = new Date().getFullYear();
    if (year < now) return warn(`Baslikta ${year} yazili, guncel yil ${now}. Icerigi guncelleyip yili yenile ya da yili kaldir.`, p.title);
    return ok(`Baslikta guncel yil (${year}) kullanilmis.`, p.title);
  },

  // ═══════════════════════ META ACIKLAMA ═══════════════════════
  MTA_01: (p) => {
    const d = p.metaDescription;
    if (!d) return bad('Meta aciklama tanimli degil - Google sayfadan rastgele cumle cekecek.');
    if (/%%|\{\{|\[\[/.test(d)) return bad('Meta aciklamada islenmemis sablon degiskeni var.', d);
    if (words(d).length < 8) return bad(`Meta aciklama cok kisa (${words(d).length} kelime).`, d);
    return ok('Meta aciklama elle yazilmis.', d);
  },

  MTA_02: (p) => {
    const d = p.metaDescription;
    if (!d) return skip('Meta aciklama yok (MTA_01).');
    const n = d.length;
    const ev = `${n} karakter: "${d}"`;
    if (n < 100) return bad(`Meta aciklama ${n} karakter - cok kisa, alan bosa gidiyor (hedef 120-158).`, ev);
    if (n > 165) return bad(`Meta aciklama ${n} karakter - Google kesecek (hedef 120-158).`, ev);
    if (n < 120 || n > 158) return warn(`Meta aciklama ${n} karakter - ideal aralik 120-158.`, ev);
    return ok(`Meta aciklama ${n} karakter, ideal aralikta.`, ev);
  },

  MTA_03: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemis.');
    if (!p.metaDescription) return skip('Meta aciklama yok (MTA_01).');
    return has(p.metaDescription, ctx.focusKeyword)
      ? ok('Anahtar kelime meta aciklamada geciyor.', p.metaDescription)
      : bad(`Anahtar kelime ("${ctx.focusKeyword}") meta aciklamada gecmiyor.`, p.metaDescription);
  },

  // ═══════════════════════ HEADING HIYERARSISI ═══════════════════════
  HDG_01: (p) => {
    const n = p.h1s.length;
    if (n === 0) return bad('Sayfada H1 yok. Yazinin ana konusu tanimsiz.');
    if (n > 1) return bad(`Sayfada ${n} adet H1 var. Sadece 1 tane olmali.`, p.h1s.map((h) => h.text).join(' | '));
    return ok('Tam olarak 1 adet H1 var.', p.h1s[0].text);
  },

  HDG_02: (p) => {
    const h1 = p.h1s[0];
    if (!h1) return skip('H1 yok (HDG_01).');
    const brand = brandOf(p.host);
    if (!h1.text) return bad('H1 bos.');
    if (norm(h1.text) === norm(brand)) return bad('H1 site adiyla ayni - yazinin konusunu anlatmiyor (tema hatasi).', h1.text);
    if (words(h1.text).length < 3) return warn(`H1 cok kisa (${words(h1.text).length} kelime).`, h1.text);
    return ok('H1 yazinin konusunu anlatiyor.', h1.text);
  },

  HDG_03: (p) => {
    const hs = p.headings.filter((h) => !h.empty);
    if (hs.length < 2) return skip('Karsilastirilacak yeterli baslik yok.');
    const jumps = [];
    for (let i = 1; i < hs.length; i++) {
      if (hs[i].level - hs[i - 1].level > 1) {
        jumps.push(`H${hs[i - 1].level} ("${hs[i - 1].text.slice(0, 40)}") → H${hs[i].level} ("${hs[i].text.slice(0, 40)}")`);
      }
    }
    return jumps.length
      ? bad(`${jumps.length} yerde baslik seviyesi atlanmis.`, jumps.join('\n'))
      : ok('Baslik hiyerarsisi kesintisiz: seviye atlanmamis.', hs.map((h) => `H${h.level}`).join(' '));
  },

  HDG_05: (p) => {
    const h2s = p.headings.filter((h) => h.level === 2 && !h.empty);
    if (h2s.length < 2) return bad(`Sayfada ${h2s.length} adet H2 var. En az 2 alt baslik ac.`, h2s.map((h) => h.text).join(' | '));
    const thin = h2s.filter((h) => h.textAfterWords < 20);
    if (thin.length) return warn(`${thin.length} H2 altinda neredeyse hic icerik yok.`, thin.map((h) => `"${h.text}" (${h.textAfterWords} kelime)`).join('\n'));
    return ok(`${h2s.length} adet H2 var, hepsinin altinda icerik mevcut.`, h2s.map((h) => h.text).join(' | '));
  },

  HDG_07: (p) => {
    const problems = [];
    p.headings.forEach((h) => {
      if (h.empty) problems.push(`H${h.level}: bos baslik`);
      else if (h.hasImage) problems.push(`H${h.level} "${h.text.slice(0, 40)}": icinde gorsel var`);
      else if (h.hasLink && h.inContent) problems.push(`H${h.level} "${h.text.slice(0, 40)}": icinde link var`);
    });
    return problems.length
      ? warn(`${problems.length} baslikta sorun var.`, problems.join('\n'))
      : ok('Bos veya gorsel/link iceren baslik yok.');
  },

  // ═══════════════════════ ICERIK ═══════════════════════
  CNT_01: (p) => {
    const n = p.wordCount;
    const ev = `${n} kelime`;
    if (n < 300) return bad(`Icerik ${n} kelime - konuyu karsilamasi zor (hedef 600+).`, ev);
    if (n < 600) return warn(`Icerik ${n} kelime - rakiplerle karsilastir, eksik alt konu var mi bak.`, ev);
    return ok(`Icerik ${n} kelime.`, ev);
  },

  CNT_02: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemis.');
    return has(p.firstWords, ctx.focusKeyword)
      ? ok('Anahtar kelime ilk 100 kelimede geciyor.', p.firstWords.slice(0, 160) + '…')
      : bad(`Anahtar kelime ("${ctx.focusKeyword}") ilk 100 kelimede gecmiyor.`, p.firstWords.slice(0, 160) + '…');
  },

  CNT_03: (p, ctx) => {
    if (!ctx.focusKeyword) return skip('Odak anahtar kelime girilmemis.');
    if (!p.wordCount) return skip('Icerik metni okunamadi.');
    const kw = norm(ctx.focusKeyword);
    const body = norm(p.bodyText);
    let count = 0, idx = 0;
    while ((idx = body.indexOf(kw, idx)) !== -1) { count++; idx += kw.length; }
    const density = (count * words(ctx.focusKeyword).length * 100) / p.wordCount;
    const ev = `${count} kez geciyor, yogunluk %${density.toFixed(2)} (${p.wordCount} kelime)`;
    if (count === 0) return bad('Anahtar kelime icerikte hic gecmiyor.', ev);
    if (density > 3) return bad(`Yogunluk %${density.toFixed(2)} - asiri tekrar (keyword stuffing).`, ev);
    if (density > 2.5) return warn(`Yogunluk %${density.toFixed(2)} - ust sinira yakin.`, ev);
    if (density < 0.5) return warn(`Yogunluk %${density.toFixed(2)} - dusuk, dogal birkac tekrar ekleyebilirsin.`, ev);
    return ok(`Yogunluk %${density.toFixed(2)} - saglikli aralikta.`, ev);
  },

  CNT_04: (p) => {
    if (!p.paragraphs.length) return skip('Paragraf bulunamadi.');
    const longs = p.paragraphs.filter((x) => x.words > 150);
    const mid = p.paragraphs.filter((x) => x.words > 100 && x.words <= 150);
    if (longs.length) return bad(`${longs.length} paragraf 150 kelimeden uzun - mobilde okunmaz.`, longs.map((x) => `${x.words} kelime: "${x.text.slice(0, 70)}…"`).join('\n'));
    if (mid.length > 2) return warn(`${mid.length} paragraf 100 kelimeyi asiyor - bolmeyi dusun.`);
    return ok('Paragraf uzunluklari makul.', `en uzun paragraf: ${Math.max(...p.paragraphs.map((x) => x.words))} kelime`);
  },

  CNT_05: (p) => {
    const ev = `${p.listCount} liste maddesi, ${p.tableCount} tablo`;
    if (p.listCount === 0 && p.tableCount === 0) return bad('Icerikte hic liste veya tablo yok - taranabilirlik dusuk.', ev);
    if (p.listCount < 3 && p.tableCount === 0) return warn('Cok az liste ogesi var.', ev);
    return ok('Icerikte liste/tablo mevcut.', ev);
  },

  CNT_09: (p) => {
    const missing = [];
    if (!p.authorName) missing.push('yazar adi');
    if (!p.publishedAt && !p.modifiedAt) missing.push('tarih');
    return missing.length
      ? warn(`Sayfada ${missing.join(' ve ')} bulunamadi (E-E-A-T sinyali eksik).`, `yazar: ${p.authorName || '-'} / tarih: ${p.modifiedAt || p.publishedAt || '-'}`)
      : ok('Yazar ve tarih bilgisi mevcut.', `${p.authorName} · ${p.modifiedAt || p.publishedAt}`);
  },

  // ═══════════════════════ GORSELLER ═══════════════════════
  IMG_01: (p) => {
    if (p.og.image) return ok('One cikan gorsel tanimli (og:image uzerinden dogrulandi).', p.og.image);
    if (p.images.length) return warn('og:image yok; sayfada gorsel var ama one cikan gorsel atanmamis olabilir.', `${p.images.length} gorsel bulundu`);
    return bad('Sayfada hic gorsel yok ve og:image tanimsiz.');
  },

  IMG_02: (p) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Gorsel yok.');
    const missing = imgs.filter((i) => !i.hasAltAttr || !i.alt);
    return missing.length
      ? bad(`${missing.length}/${imgs.length} gorselde alt metin eksik.`, missing.slice(0, 8).map((i) => i.filename).join('\n'))
      : ok(`${imgs.length} gorselin tamaminda alt metin var.`);
  },

  IMG_04: (p) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Gorsel yok.');
    const bad_ = imgs.filter((i) => /^(img|dsc|pxl|screenshot|photo|image|untitled)[-_]?\d/i.test(i.filename) || /^\d+\./.test(i.filename));
    return bad_.length
      ? warn(`${bad_.length} gorselin dosya adi aciklayici degil.`, bad_.slice(0, 8).map((i) => i.filename).join('\n'))
      : ok('Gorsel dosya adlari aciklayici.');
  },

  IMG_05: (p, ctx) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Gorsel yok.');
    const modern = imgs.filter((i) => ['webp', 'avif'].includes(i.ext));
    const probes = ctx.imageProbes || [];
    const heavy = probes.filter((x) => x.bytes && x.bytes > 200 * 1024);
    const lines = [];
    if (modern.length < imgs.length) lines.push(`${imgs.length - modern.length}/${imgs.length} gorsel WebP/AVIF degil`);
    if (heavy.length) lines.push(...heavy.map((x) => `${Math.round(x.bytes / 1024)} KB - ${x.url.split('/').pop()}`));
    if (heavy.length) return bad(`${heavy.length} gorsel 200 KB'tan agir.`, lines.join('\n'));
    if (modern.length < imgs.length) return warn(lines.join('\n'), 'WebP/AVIF\'e cevirmek sayfa agirligini belirgin dusurur.');
    return ok('Gorseller modern formatta ve makul boyutta.', `${imgs.length} gorsel kontrol edildi`);
  },

  IMG_06: (p) => {
    const imgs = p.contentImages.length ? p.contentImages : p.images;
    if (!imgs.length) return skip('Gorsel yok.');
    const missing = imgs.filter((i) => !i.width || !i.height);
    return missing.length
      ? warn(`${missing.length}/${imgs.length} gorselde width/height yok - sayfa yuklenirken ziplayabilir (CLS).`, missing.slice(0, 8).map((i) => i.filename).join('\n'))
      : ok('Tum gorsellerde width/height tanimli.');
  },

  IMG_07: (p) => {
    const imgs = p.images;
    if (!imgs.length) return skip('Gorsel yok.');
    const first = imgs[0];
    const rest = imgs.slice(1);
    const lazyRest = rest.filter((i) => i.lazy).length;
    if (first.lazy) return bad('Sayfadaki ilk gorsel lazy-load ile yukleniyor - LCP suresini dogrudan geciktirir.', first.src);
    if (rest.length && lazyRest === 0) return warn('Alt taraftaki gorsellerin hicbiri lazy-load degil - gereksiz veri indiriliyor.', `${rest.length} gorsel`);
    return ok('Ilk gorsel hemen, alttakiler tembel yukleniyor.', `ilk: ${first.filename}, ${lazyRest}/${rest.length} alt gorsel lazy`);
  },

  // ═══════════════════════ BAGLANTILAR ═══════════════════════
  LNK_01: (p) => {
    const n = p.internalLinks.length;
    if (n === 0) return bad('Icerikte hic ic link yok.');
    if (n < 3) return warn(`Sadece ${n} ic link var - en az 3 olmali.`, p.internalLinks.map((l) => l.href).join('\n'));
    return ok(`${n} ic link mevcut.`, p.internalLinks.slice(0, 8).map((l) => `${l.anchor} → ${l.href}`).join('\n'));
  },

  LNK_02: (p) => {
    if (!p.internalLinks.length) return skip('Ic link yok (LNK_01).');
    const weak = p.internalLinks.filter((l) => !l.isImageLink && WEAK_ANCHORS.includes(norm(l.anchor)));
    const empty = p.internalLinks.filter((l) => !l.anchor);
    if (weak.length || empty.length)
      return warn(`${weak.length + empty.length} linkte anchor metni zayif veya bos.`, [...weak, ...empty].slice(0, 8).map((l) => `"${l.anchor || '(bos)'}" → ${l.href}`).join('\n'));
    return ok('Anchor metinleri aciklayici.');
  },

  LNK_04: (p) => {
    const n = p.externalLinks.length;
    if (n === 0) return warn('Hic dis link yok - iddialari kaynakla desteklemek guven verir.');
    const noNewTab = p.externalLinks.filter((l) => l.target !== '_blank');
    if (noNewTab.length === n) return warn(`${n} dis link var ama hicbiri yeni sekmede acilmiyor.`, p.externalLinks.slice(0, 5).map((l) => l.href).join('\n'));
    return ok(`${n} dis link mevcut.`, p.externalLinks.slice(0, 5).map((l) => l.href).join('\n'));
  },

  LNK_05: (p, ctx) => {
    const probes = ctx.linkProbes || [];
    if (!probes.length) return skip('Kontrol edilecek link bulunamadi.');
    const broken = probes.filter((x) => !x.ok && x.status !== 403 && x.status !== 429);
    return broken.length
      ? bad(`${broken.length} kirik link var.`, broken.map((x) => `${x.status || x.error} - ${x.url}`).join('\n'))
      : ok(`${probes.length} link kontrol edildi, kirik link yok.`);
  },

  LNK_06: (p) => {
    const ext = p.externalLinks;
    if (!ext.length) return skip('Dis link yok.');
    const affiliatePattern = /(\/ref=|[?&](ref|aff|affiliate|tag|utm_source=affiliate|partner)=|go\/|out\/|redirect\/|amzn\.to|bit\.ly)/i;
    const suspects = ext.filter((l) => affiliatePattern.test(l.href) && !/sponsored|nofollow/.test(l.rel));
    return suspects.length
      ? warn(`${suspects.length} link afiliye/yonlendirme gibi gorunuyor ama rel="sponsored" veya "nofollow" tasimiyor.`, suspects.slice(0, 8).map((l) => l.href).join('\n'))
      : ok('Afiliye gorunumlu isaretsiz link yok.');
  },

  // ═══════════════════════ TEKNIK ═══════════════════════
  TEC_01: (p) => {
    if (p.robotsMeta.includes('noindex')) return bad('Sayfada noindex var - Google bu sayfayi dizine EKLEMEZ.', `meta robots: ${p.robotsMeta}`);
    if (p.xRobots.includes('noindex')) return bad('X-Robots-Tag ustbilgisinde noindex var (sunucu tarafli).', `X-Robots-Tag: ${p.xRobots}`);
    if (p.robotsMeta.includes('nofollow')) return warn('Sayfa indekslenebilir ama tum linkler nofollow.', `meta robots: ${p.robotsMeta}`);
    return ok('Sayfa indekslenebilir.', p.robotsMeta ? `meta robots: ${p.robotsMeta}` : 'noindex yok');
  },

  TEC_02: (p) => {
    if (!p.canonical) return warn('Canonical etiketi yok.');
    const strip = (x) => x.replace(/\/$/, '').replace(/^https?:\/\/(www\.)?/, '').split('#')[0];
    return strip(p.canonical) === strip(p.url)
      ? ok('Canonical sayfanin kendisine isaret ediyor.', p.canonical)
      : bad('Canonical BASKA bir sayfayi gosteriyor - bu sayfa siralamadan cikar.', `canonical: ${p.canonical}\nsayfa:     ${p.url}`);
  },

  TEC_03: (p) => {
    const types = p.jsonld.flatMap((n) => (Array.isArray(n?.['@type']) ? n['@type'] : [n?.['@type']])).filter(Boolean);
    const graphTypes = p.jsonld.flatMap((n) => (n?.['@graph'] || []).map((g) => g?.['@type'])).flat().filter(Boolean);
    const all = [...types, ...graphTypes].map(String);
    if (p.jsonld.some((n) => n.__parseError)) return bad('JSON-LD var ama bozuk (parse edilemedi).');
    if (!all.length) return bad('Sayfada JSON-LD yapisal veri yok.');
    const article = all.some((t) => /Article|BlogPosting|NewsArticle/i.test(t));
    return article
      ? ok('Article/BlogPosting semasi mevcut.', all.join(', '))
      : warn('Yapisal veri var ama Article/BlogPosting tipi yok.', all.join(', '));
  },

  TEC_04: (p) => {
    const missing = [];
    if (!p.og.title) missing.push('og:title');
    if (!p.og.description) missing.push('og:description');
    if (!p.og.image) missing.push('og:image');
    return missing.length
      ? bad(`Open Graph eksik: ${missing.join(', ')}.`, `mevcut: ${Object.entries(p.og).filter(([, v]) => v).map(([k]) => k).join(', ') || 'yok'}`)
      : ok('Open Graph baslik, aciklama ve gorsel tanimli.', p.og.image);
  },

  TEC_05: (p) => {
    if (!p.twitter.card) return warn('twitter:card tanimli degil.');
    return p.twitter.card === 'summary_large_image'
      ? ok('Twitter/X karti buyuk gorselli.', p.twitter.card)
      : warn(`twitter:card = "${p.twitter.card}" - "summary_large_image" daha cok tiklama getirir.`);
  },

  TEC_06: (p) => {
    if (!p.viewport) return bad('viewport meta etiketi yok - sayfa mobilde bozulur.');
    return /width\s*=\s*device-width/i.test(p.viewport)
      ? ok('Mobil viewport tanimli.', p.viewport)
      : warn('viewport var ama device-width kullanilmamis.', p.viewport);
  },
};

/** ctx.linkProbes / ctx.imageProbes doldurulmus halde cagrilir. */
function runRules(page, ctx) {
  const results = {};
  for (const [code, fn] of Object.entries(RULES)) {
    try {
      results[code] = { ...fn(page, ctx), source: 'rule' };
    } catch (err) {
      results[code] = { status: 'skip', source: 'rule', message: `Kural calistirilamadi: ${err.message}` };
    }
  }
  return results;
}

module.exports = { runRules, RULES, norm };
