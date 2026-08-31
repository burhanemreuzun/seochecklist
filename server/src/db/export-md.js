/**
 * Kontrol listesini yazdırılabilir Markdown'a çevirir (docs/CHECKLIST.md).
 * Tanımlar checklist.seed.js'te değiştiğinde bu dosyayı yeniden üret:
 *   node server/src/db/export-md.js
 */
const fs = require('fs');
const path = require('path');
const audit = require('./checklist.seed');
const writing = require('./writing.seed');

const MODE = { rule: 'otomatik', ai: 'yapay zekâ', manual: 'elle' };
const SEV = { critical: 'KRİTİK', high: 'Önemli', medium: 'Orta' };

const lines = [
  '# SEO Kontrol Listesi',
  '',
  `Denetim listesi ${audit.ITEMS.length} madde, yazım listesi ${writing.ITEMS.length} adım.`,
  'Bu dosya `checklist.seed.js` ve `writing.seed.js` dosyalarından üretilir; elle düzenleme.',
  '',
  '| İşaret | Anlamı |',
  '| --- | --- |',
  '| `otomatik` | Kural motoru ölçer, editör işaretleyemez. |',
  '| `yapay zekâ` | Gemini değerlendirir, editör işaretleyemez. |',
  '| `elle` | Editörün kontrol edip işaretlemesi gerekir. |',
  '',
];

/** Bir listeyi başlığıyla birlikte yazar. */
function writeList(title, intro, { CATEGORIES, ITEMS }) {
  lines.push('---', '', `# ${title}`, '', intro, '');
  for (const c of CATEGORIES) {
    const items = ITEMS.filter((i) => i.category === c.key);
    lines.push(`## ${c.icon} ${c.label}`, '');
    for (const i of items) {
      const mode = MODE[i.mode || 'manual'];
      lines.push(`- [ ] **${i.code}** · \`${SEV[i.severity]}\` · \`${mode}\` — ${i.label}`);
      lines.push(`  - *Neden önemli:* ${i.why}`);
      lines.push(`  - *Nasıl yapılır:* ${i.how}`);
    }
    lines.push('');
  }
}

writeList(
  'Yazım listesi — sıfırdan içerik',
  'Sıfırdan yazarken yukarıdan aşağı takip edilir. Tamamı elle işaretlenir; ortada henüz ölçülecek bir sayfa yoktur.',
  writing
);
writeList(
  'Denetim listesi — var olan sayfa',
  'Yayındaki sayfaya karşı çalıştırılır. 47 madde otomatik ölçülür, 11 madde editörün kontrolündedir.',
  audit
);

const out = path.join(__dirname, '../../../docs/CHECKLIST.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(`✔ ${out} yazıldı (${writing.ITEMS.length} yazım adımı + ${audit.ITEMS.length} denetim maddesi)`);
