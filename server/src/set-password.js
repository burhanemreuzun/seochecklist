#!/usr/bin/env node
/**
 * Giriş parolasını belirler.
 *
 *   npm run set-password "yeni parola"
 *
 * Parolanın scrypt özetini üretir ve .env dosyasındaki APP_PASSWORD_HASH
 * satırını günceller. Parolanın kendisi hiçbir yere yazılmaz.
 * SESSION_SECRET yoksa rastgele üretilir.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword } = require('./auth');

const plain = process.argv.slice(2).join(' ').trim();
if (!plain) {
  console.error('Kullanım: npm run set-password "parola"');
  process.exit(1);
}
if (plain.length < 8) {
  console.error('✖ Parola en az 8 karakter olmalı.');
  process.exit(1);
}

const envPath = path.join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error('✖ .env dosyası yok. Önce: cp .env.example .env');
  process.exit(1);
}

let env = fs.readFileSync(envPath, 'utf8');

const upsert = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  env = re.test(env) ? env.replace(re, line) : env.replace(/\n*$/, `\n${line}\n`);
};

upsert('APP_PASSWORD_HASH', hashPassword(plain));
if (!/^SESSION_SECRET=.+$/m.test(env)) {
  upsert('SESSION_SECRET', crypto.randomBytes(32).toString('base64url'));
  console.log('  SESSION_SECRET üretildi.');
}

fs.writeFileSync(envPath, env);
console.log('✔ Parola güncellendi. Sunucuyu yeniden başlat.');
console.log('  Not: .env sürüm kontrolüne girmez, parola kaynak kodda tutulmaz.');
