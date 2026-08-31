/**
 * Kontrol listesini yazdırılabilir Markdown'a çevirir (docs/CHECKLIST.md).
 * Tanımlar checklist.seed.js'te değiştiğinde bu dosyayı yeniden üret:
 *   node server/src/db/export-md.js
 */
const fs = require('fs');
const path = require('path');
const { CATEGORIES, ITEMS } = require('./checklist.seed');

const MODE = { rule: 'otomatik', ai: 'yapay zekâ', manual: 'elle' };
const SEV = { critical: 'KRİTİK', high: 'Önemli', medium: 'Orta' };

const lines = [
  '# SEO Kontrol Listesi',
  '',
  `${ITEMS.length} madde, ${CATEGORIES.length} başlık altında.`,
  'Bu dosya `server/src/db/checklist.seed.js` dosyasından üretilir; elle düzenleme.',
  '',
  '| İşaret | Anlamı |',
  '| --- | --- |',
  '| `otomatik` | Kural motoru ölçer, editör işaretleyemez. |',
  '| `yapay zekâ` | Gemini değerlendirir, editör işaretleyemez. |',
  '| `elle` | Editörün kontrol edip işaretlemesi gerekir. |',
  '',
];

for (const c of CATEGORIES) {
  const items = ITEMS.filter((i) => i.category === c.key);
  lines.push(`## ${c.icon} ${c.label}`, '');
  for (const i of items) {
    lines.push(`- [ ] **${i.code}** · \`${SEV[i.severity]}\` · \`${MODE[i.mode]}\` — ${i.label}`);
    lines.push(`  - *Neden önemli:* ${i.why}`);
    lines.push(`  - *Nasıl yapılır:* ${i.how}`);
  }
  lines.push('');
}

const out = path.join(__dirname, '../../../docs/CHECKLIST.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(`✔ ${out} yazıldı (${ITEMS.length} madde)`);
