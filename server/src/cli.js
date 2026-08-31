#!/usr/bin/env node
/**
 * Terminalden hizli denetim:
 *   node src/cli.js <url> [odak anahtar kelime]
 * Veritabani gerektirmez.
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../../.env') });
const { auditUrl } = require('./audit');
const { ITEMS } = require('./db/checklist.seed');

const ICON = { pass: '✅', warn: '⚠️ ', fail: '❌', skip: '➖', manual: '👤' };
const byCode = Object.fromEntries(ITEMS.map((i) => [i.code, i]));

(async () => {
  const [url, ...kw] = process.argv.slice(2);
  if (!url) {
    console.error('Kullanim: node src/cli.js <url> [odak anahtar kelime]');
    process.exit(1);
  }
  try {
    const r = await auditUrl(url, { focusKeyword: kw.join(' ') });
    console.log(`\n${r.url}`);
    console.log(`Skor: ${r.score}/100  ·  ✅${r.counts.pass} ⚠️ ${r.counts.warn} ❌${r.counts.fail} ➖${r.counts.skip} 👤${r.counts.manual}`);
    console.log(`AI: ${r.ai.used ? r.ai.model : 'kapali - ' + r.ai.reason}`);
    console.log(`${r.stats.wordCount} kelime · ${r.stats.headingCount} baslik · ${r.stats.imageCount} gorsel · ${r.durationMs}ms\n`);

    if (r.blockers.length) {
      console.log('🚫 YAYINI ENGELLEYEN KRITIK HATALAR:');
      r.blockers.forEach((b) => console.log(`   ${b.code} ${b.label}\n      → ${b.message}`));
      console.log('');
    }

    for (const f of r.findings) {
      if (f.status === 'pass' && !process.argv.includes('--all')) continue;
      const it = byCode[f.code];
      console.log(`${ICON[f.status]} [${f.code}] ${it.label}`);
      if (f.message) console.log(`     ${f.message}`);
      if (f.evidence) console.log(`     ↳ ${String(f.evidence).split('\n').join('\n       ')}`);
    }
    console.log('\n(--all ile gecen maddeler de listelenir)');
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }
})();
