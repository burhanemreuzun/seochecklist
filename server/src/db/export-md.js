/**
 * Checklist'i yazdirilabilir Markdown'a cevirir (docs/CHECKLIST.md).
 * Tanimlar checklist.seed.js'te degistiginde bu dosyayi yeniden uret:
 *   node server/src/db/export-md.js
 */
const fs = require('fs');
const path = require('path');
const { CATEGORIES, ITEMS } = require('./checklist.seed');

const MODE = { rule: 'otomatik', ai: 'yapay zeka', manual: 'elle' };
const SEV = { critical: 'KRITIK', high: 'Onemli', medium: 'Orta' };

const lines = [
  '# SEO Kontrol Listesi',
  '',
  `${ITEMS.length} madde · ${CATEGORIES.length} baslik altinda.`,
  'Bu dosya `server/src/db/checklist.seed.js` dosyasindan uretilir - elle duzenleme.',
  '',
  '| Isaret | Anlami |',
  '| --- | --- |',
  '| `otomatik` | Kural motoru olcer, editor isaretleyemez. |',
  '| `yapay zeka` | Gemini degerlendirir, editor isaretleyemez. |',
  '| `elle` | Editorun kontrol edip isaretlemesi gerekir. |',
  '',
];

for (const c of CATEGORIES) {
  const items = ITEMS.filter((i) => i.category === c.key);
  lines.push(`## ${c.icon} ${c.label}`, '');
  for (const i of items) {
    lines.push(`- [ ] **${i.code}** · \`${SEV[i.severity]}\` · \`${MODE[i.mode]}\` — ${i.label}`);
    lines.push(`  - *Neden:* ${i.why}`);
    lines.push(`  - *Nasil:* ${i.how}`);
  }
  lines.push('');
}

const out = path.join(__dirname, '../../../docs/CHECKLIST.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(`✔ ${out} yazildi (${ITEMS.length} madde)`);
