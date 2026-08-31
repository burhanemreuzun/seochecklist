#!/usr/bin/env node
/**
 * Tek dosyalık, içe aktarılabilir SQL çıktısı üretir.
 *
 *   node server/src/db/export-sql.js
 *
 * Şemayı ve 93 kontrol listesi maddesini birleştirip docs/seochecklist.sql
 * dosyasına yazar. Sunucuda kabuk erişimi yoksa bu dosya phpMyAdmin'den içe
 * aktarılarak kurulum tamamlanabilir.
 *
 * Veritabanı bağlantısı gerektirmez; çıktı tamamen kaynak dosyalardan üretilir.
 * Yeniden çalıştırılabilir olması için tablolar IF NOT EXISTS ile,
 * kayıtlar ON DUPLICATE KEY UPDATE ile yazılır.
 */

const fs = require('fs');
const path = require('path');
const { escape } = require('mysql2');

const auditList = require('./checklist.seed');
const writeList = require('./writing.seed');

const LISTS = [
  { list: 'audit', ...auditList },
  { list: 'write', ...writeList },
];

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

const out = [
  '-- ---------------------------------------------------------------',
  '-- SEO Kontrol Listesi — kurulum dosyası',
  '--',
  '-- phpMyAdmin > veritabanını seç > İçe Aktar > bu dosyayı yükle.',
  '-- CREATE DATABASE içermez; hedef veritabanı önceden seçilmiş olmalıdır.',
  '-- Tekrar tekrar çalıştırılabilir: tablolar korunur, maddeler güncellenir.',
  '--',
  '-- Bu dosya üretilmiştir, elle düzenleme:',
  '--   node server/src/db/export-sql.js',
  '-- ---------------------------------------------------------------',
  '',
  'SET NAMES utf8mb4;',
  'SET FOREIGN_KEY_CHECKS = 1;',
  '',
  '-- ============ ŞEMA ============',
  '',
  schema.trim(),
  '',
  '-- ============ KATEGORİLER ============',
  '',
];

for (const { list, CATEGORIES } of LISTS) {
  for (const c of CATEGORIES) {
    out.push(
      'INSERT INTO categories (`key`, `list`, label, icon, sort) VALUES ' +
      `(${escape(c.key)}, ${escape(list)}, ${escape(c.label)}, ${escape(c.icon)}, ${c.sort})` +
      ' ON DUPLICATE KEY UPDATE `list`=VALUES(`list`), label=VALUES(label), icon=VALUES(icon), sort=VALUES(sort);'
    );
  }
}

out.push('', '-- ============ MADDELER ============', '');

const allCodes = [];
for (const { list, ITEMS } of LISTS) {
  let sort = 0;
  for (const i of ITEMS) {
    sort += 10;
    allCodes.push(i.code);
    out.push(
      'INSERT INTO checklist_items (code, `list`, category_key, label, why, how, severity, weight, mode, sort, is_active) VALUES ' +
      `(${escape(i.code)}, ${escape(list)}, ${escape(i.category)}, ${escape(i.label)}, ` +
      `${escape(i.why)}, ${escape(i.how)}, ${escape(i.severity)}, ${i.weight}, ` +
      `${escape(i.mode || 'manual')}, ${sort}, 1)` +
      ' ON DUPLICATE KEY UPDATE `list`=VALUES(`list`), category_key=VALUES(category_key),' +
      ' label=VALUES(label), why=VALUES(why), how=VALUES(how), severity=VALUES(severity),' +
      ' weight=VALUES(weight), mode=VALUES(mode), sort=VALUES(sort), is_active=1;'
    );
  }
}

// Listeden çıkarılmış maddeler silinmez; eski denetim kayıtları onlara bağlıdır.
out.push(
  '',
  '-- Listeden çıkarılan maddeler pasife alınır (silinmez; geçmiş kayıtlar onlara bağlı).',
  `UPDATE checklist_items SET is_active = 0 WHERE code NOT IN (${allCodes.map(escape).join(', ')});`,
  ''
);

const target = path.join(__dirname, '../../../docs/seochecklist.sql');
fs.writeFileSync(target, out.join('\n'));

const total = LISTS.reduce((n, l) => n + l.ITEMS.length, 0);
const cats = LISTS.reduce((n, l) => n + l.CATEGORIES.length, 0);
console.log(`✔ ${target} yazıldı`);
console.log(`  ${cats} kategori, ${total} madde · ${(fs.statSync(target).size / 1024).toFixed(1)} KB`);
