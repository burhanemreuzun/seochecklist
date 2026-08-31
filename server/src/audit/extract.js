const cheerio = require('cheerio');

/** İçerik gövdesini bulmak için sırayla denenen seçiciler. */
const CONTENT_SELECTORS = [
  'article .entry-content',
  '.entry-content',
  '.post-content',
  '.article-content',
  '.wp-block-post-content',
  'main article',
  'article',
  'main',
  '#content',
];

const text = (s) => (s || '').replace(/\s+/g, ' ').trim();
const words = (s) => text(s).split(' ').filter(Boolean);

function absolute(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/** HTML'den, denetim kurallarının ihtiyaç duyduğu tüm olguları çıkarır. */
function extract(html, pageUrl, headers = {}) {
  const $ = cheerio.load(html);
  const base = pageUrl;
  const u = new URL(pageUrl);

  // ── head ────────────────────────────────────────────────
  const metaOf = (name) =>
    text($(`meta[name="${name}" i]`).attr('content')) ||
    text($(`meta[property="${name}" i]`).attr('content')) ||
    null;

  const jsonld = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      Array.isArray(parsed) ? jsonld.push(...parsed) : jsonld.push(parsed);
    } catch {
      jsonld.push({ __parseError: true });
    }
  });

  const robotsMeta = (metaOf('robots') || '').toLowerCase();
  const xRobots = String(headers['x-robots-tag'] || '').toLowerCase();

  // ── içerik gövdesi ──────────────────────────────────────
  let $content = null;
  for (const sel of CONTENT_SELECTORS) {
    const found = $(sel).first();
    if (found.length && words(found.text()).length > 50) {
      $content = found;
      break;
    }
  }
  const scopedContent = !!$content;
  if (!$content) $content = $('body');

  // Gezinme ve altbilgi gürültüsünü metin ölçümlerinden düşür.
  const $clean = $content.clone();
  $clean.find('nav, header, footer, aside, script, style, noscript, .comments, #comments, .sidebar').remove();

  const bodyText = text($clean.text());
  const wordCount = words(bodyText).length;

  // ── başlıklar ───────────────────────────────────────────
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const $el = $(el);
    if ($el.closest('nav, footer, aside, .sidebar, #comments, .comments').length) return;
    headings.push({
      level: Number(el.tagName.slice(1)),
      text: text($el.text()),
      empty: !text($el.text()),
      hasImage: $el.find('img, svg').length > 0,
      hasLink: $el.find('a').length > 0,
      inContent: scopedContent ? $el.closest($content).length > 0 : true,
      // Başlığın altında, bir sonraki başlığa kadar kaç kelime var (boş bölüm tespiti)
      textAfterWords: words($el.nextUntil('h1, h2, h3, h4, h5, h6').text()).length,
    });
  });

  // ── paragraflar / listeler / tablolar ───────────────────
  const paragraphs = [];
  $clean.find('p').each((_, el) => {
    const t = text($(el).text());
    if (t) paragraphs.push({ words: words(t).length, text: t });
  });
  const listCount = $clean.find('ul li, ol li').length;
  const tableCount = $clean.find('table').length;

  // ── görseller ───────────────────────────────────────────
  const images = [];
  $('img').each((_, el) => {
    const $el = $(el);
    if ($el.closest('nav, footer, aside, .sidebar, #comments').length) return;
    const raw = $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src') || '';
    const src = absolute(raw, base);
    if (!src || src.startsWith('data:')) return;
    const path = (() => { try { return new URL(src).pathname; } catch { return src; } })();
    images.push({
      src,
      filename: path.split('/').pop() || '',
      ext: (path.split('.').pop() || '').toLowerCase().split('?')[0],
      alt: $el.attr('alt') === undefined ? null : text($el.attr('alt')),
      hasAltAttr: $el.attr('alt') !== undefined,
      width: $el.attr('width') || null,
      height: $el.attr('height') || null,
      lazy: (($el.attr('loading') || '').toLowerCase() === 'lazy') ||
            /lazy/i.test($el.attr('class') || ''),
      inContent: scopedContent ? $el.closest($content).length > 0 : true,
      order: images.length,
    });
  });

  // ── bağlantılar ─────────────────────────────────────────
  const links = [];
  $clean.find('a[href]').each((_, el) => {
    const $el = $(el);
    const href = absolute($el.attr('href'), base);
    if (!href || !/^https?:/i.test(href)) return;
    let internal = false;
    try { internal = new URL(href).hostname === u.hostname; } catch {}
    links.push({
      href,
      anchor: text($el.text()) || (text($el.find('img').attr('alt')) ? '[görsel]' : ''),
      isImageLink: $el.find('img').length > 0 && !text($el.text()),
      rel: ($el.attr('rel') || '').toLowerCase(),
      target: $el.attr('target') || '',
      internal,
    });
  });

  // ── yazar ve tarih ──────────────────────────────────────
  const publishedAt =
    metaOf('article:published_time') ||
    text($('time[datetime]').first().attr('datetime')) ||
    null;
  const modifiedAt = metaOf('article:modified_time') || null;
  const authorName =
    metaOf('author') ||
    text($('[rel="author"]').first().text()) ||
    text($('.author, .byline, .entry-author, .author-name').first().text()) ||
    (jsonld.map((n) => n?.author?.name).find(Boolean) || null);

  return {
    url: pageUrl,
    host: u.hostname,
    slug: decodeURIComponent(u.pathname.replace(/\/+$/, '').split('/').pop() || ''),
    pathname: u.pathname,

    title: text($('head title').first().text()) || null,
    metaDescription: metaOf('description'),
    canonical: absolute($('link[rel="canonical"]').attr('href') || '', base),
    robotsMeta,
    xRobots,
    viewport: metaOf('viewport'),
    lang: text($('html').attr('lang')) || null,

    og: {
      title: metaOf('og:title'),
      description: metaOf('og:description'),
      image: metaOf('og:image'),
      type: metaOf('og:type'),
    },
    twitter: {
      card: metaOf('twitter:card'),
      title: metaOf('twitter:title'),
      image: metaOf('twitter:image'),
    },
    jsonld,

    scopedContent,
    headings,
    h1s: headings.filter((h) => h.level === 1),
    paragraphs,
    listCount,
    tableCount,
    wordCount,
    bodyText,
    firstWords: words(bodyText).slice(0, 100).join(' '),

    images,
    contentImages: images.filter((i) => i.inContent),
    links,
    internalLinks: links.filter((l) => l.internal),
    externalLinks: links.filter((l) => !l.internal),

    authorName,
    publishedAt,
    modifiedAt,
  };
}

module.exports = { extract, text, words };
