/**
 * Denetim orkestratoru.
 *
 * Akis:  sayfayi cek → HTML'i ayristir → link/gorsel yokla →
 *        kural motorunu calistir → AI maddelerini degerlendir → skorla
 *
 * Tasarim karari: olculebilen her sey kural motorunda olculur (deterministik,
 * ucretsiz, tekrarlanabilir). Yapay zeka sadece yorum gerektiren 7 maddede
 * devreye girer. Bu sayede AI kapali olsa bile denetimin buyuk kismi calisir.
 */

const { fetchPage, probe, mapLimit } = require('./fetch');
const { extract } = require('./extract');
const { runRules } = require('./rules');
const { runAi } = require('./ai');
const { ITEMS } = require('../db/checklist.seed');

const MAX_LINK_PROBES = 25;
const MAX_IMAGE_PROBES = 15;
const PROBE_CONCURRENCY = 6;

const ITEM_BY_CODE = Object.fromEntries(ITEMS.map((i) => [i.code, i]));

/**
 * @param {string} url            denetlenecek sayfa
 * @param {object} opts
 * @param {string} [opts.focusKeyword]
 * @param {boolean} [opts.useAi=true]
 */
async function auditUrl(url, opts = {}) {
  const startedAt = Date.now();
  const focusKeyword = (opts.focusKeyword || '').trim() || null;
  const useAi = opts.useAi !== false;

  // 1) Sayfayi cek
  let res;
  try {
    res = await fetchPage(url);
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'Sayfa zaman asimina ugradi.' : err.message;
    throw Object.assign(new Error(`Sayfa cekilemedi: ${reason}`), { code: 'FETCH_FAILED' });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`Sayfa ${res.status} donduruyor - once bu hatayi cozmelisin.`), {
      code: 'BAD_STATUS',
      status: res.status,
    });
  }

  // 2) Ayristir
  const page = extract(res.html, res.finalUrl, res.headers);

  // 3) Link ve gorselleri yokla (kirik link + gorsel agirligi icin)
  const linkTargets = [...new Set(page.links.map((l) => l.href))].slice(0, MAX_LINK_PROBES);
  const imageTargets = [...new Set((page.contentImages.length ? page.contentImages : page.images).map((i) => i.src))]
    .slice(0, MAX_IMAGE_PROBES);

  const [linkProbes, imageProbes] = await Promise.all([
    mapLimit(linkTargets, PROBE_CONCURRENCY, probe),
    mapLimit(imageTargets, PROBE_CONCURRENCY, probe),
  ]);

  // 4) Kural motoru + 5) AI (paralel)
  const ruleResults = runRules(page, { focusKeyword, linkProbes, imageProbes });
  const ai = useAi
    ? await runAi(page, focusKeyword)
    : { used: false, reason: 'AI kontrolu bu calistirmada kapatildi.', results: {} };

  // 6) Tum maddeleri birlestir
  const findings = ITEMS.map((item) => {
    const r = ruleResults[item.code] || ai.results?.[item.code];
    if (r) return { code: item.code, ...r };
    return {
      code: item.code,
      status: 'manual',
      source: 'manual',
      message: 'Bu madde otomatik olculemez - kontrol edip elle isaretlemelisin.',
    };
  });

  // 7) Skor: sadece otomatik olculebilen maddeler uzerinden
  const scored = findings.filter((f) => ['pass', 'warn', 'fail'].includes(f.status));
  const weightOf = (f) => ITEM_BY_CODE[f.code]?.weight || 1;
  const earned = scored.reduce((sum, f) => sum + weightOf(f) * (f.status === 'pass' ? 1 : f.status === 'warn' ? 0.5 : 0), 0);
  const total = scored.reduce((sum, f) => sum + weightOf(f), 0);
  const score = total ? Math.round((earned / total) * 100) : 0;

  const counts = findings.reduce((a, f) => ((a[f.status] = (a[f.status] || 0) + 1), a), {});
  const blockers = findings.filter(
    (f) => f.status === 'fail' && ITEM_BY_CODE[f.code]?.severity === 'critical'
  );

  return {
    url: res.finalUrl,
    requestedUrl: url,
    redirected: res.redirected,
    httpStatus: res.status,
    focusKeyword,
    score,
    counts: {
      pass: counts.pass || 0,
      warn: counts.warn || 0,
      fail: counts.fail || 0,
      skip: counts.skip || 0,
      manual: counts.manual || 0,
    },
    blockers: blockers.map((b) => ({ code: b.code, label: ITEM_BY_CODE[b.code].label, message: b.message })),
    ai: { used: ai.used, model: ai.model || null, reason: ai.reason || null },
    findings,
    stats: {
      wordCount: page.wordCount,
      headingCount: page.headings.length,
      imageCount: page.images.length,
      internalLinks: page.internalLinks.length,
      externalLinks: page.externalLinks.length,
      probedLinks: linkProbes.length,
      ttfbMs: res.ttfbMs,
    },
    durationMs: Date.now() - startedAt,
  };
}

module.exports = { auditUrl };
