#!/usr/bin/env node
/**
 * Terminalden hızlı denetim:
 *   node src/cli.js <adres> [odak anahtar kelime] [--tumu]
 * Veritabanı gerektirmez.
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../.env') });
const { auditUrl } = require('./audit');
const { ITEMS } = require('./db/checklist.seed');

const SIMGE = { pass: '✅', warn: '⚠️ ', fail: '❌', skip: '➖', manual: '👤' };
const byCode = Object.fromEntries(ITEMS.map((i) => [i.code, i]));

(async () => {
  const args = process.argv.slice(2);
  const hepsi = args.includes('--tumu') || args.includes('--all');
  const [url, ...kw] = args.filter((a) => !a.startsWith('--'));

  if (!url) {
    console.error('Kullanım: node src/cli.js <adres> [odak anahtar kelime] [--tumu]');
    process.exit(1);
  }

  try {
    const r = await auditUrl(url, { focusKeyword: kw.join(' ') });

    console.log(`\n${r.url}`);
    console.log(`Skor: ${r.score}/100  ·  ✅ ${r.counts.pass} geçti  ⚠️  ${r.counts.warn} uyarı  ❌ ${r.counts.fail} hata  ➖ ${r.counts.skip} atlandı  👤 ${r.counts.manual} elle`);
    console.log(`Yapay zekâ: ${r.ai.used ? r.ai.model : 'kapalı — ' + r.ai.reason}`);
    console.log(`${r.stats.wordCount} kelime · ${r.stats.headingCount} başlık · ${r.stats.imageCount} görsel · ${r.durationMs} ms\n`);

    if (r.blockers.length) {
      console.log('🚫 YAYINI ENGELLEYEN KRİTİK HATALAR');
      r.blockers.forEach((b) => console.log(`   ${b.code}  ${b.label}\n         → ${b.message}`));
      console.log('');
    }

    for (const f of r.findings) {
      if (f.status === 'pass' && !hepsi) continue;
      console.log(`${SIMGE[f.status]} [${f.code}] ${byCode[f.code].label}`);
      if (f.message) console.log(`     ${f.message}`);
      if (f.evidence) console.log(`     ↳ ${String(f.evidence).split('\n').join('\n       ')}`);
    }

    if (!hepsi) console.log('\n(Geçen maddeleri de görmek için --tumu ekle)');
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }
})();
