#!/usr/bin/env node
/**
 * Kurulumdan sonra arayüzü derler.
 *
 * Neden gerekli: bazı hosting panelleri yalnızca `npm install` çalıştırır ve
 * ayrı bir derleme adımı tanımlanmamışsa `client/dist` hiç oluşmaz. O durumda
 * sunucu ayağa kalkar ama servis edecek arayüz bulamaz.
 *
 * Bu betik kurulumu ASLA başarısız kılmaz:
 *  - vite kurulu değilse (üretim kurulumunda devDependencies atlanmış olabilir)
 *    sessizce atlar,
 *  - derleme hata verirse uyarır ama sıfır koduyla çıkar.
 * Böylece ayrı bir derleme adımı tanımlıysa o adım işi devralır.
 */

const { existsSync } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const clientDir = path.join(root, 'client');

// Derlenecek bir arayüz yoksa yapacak iş yok.
if (!existsSync(path.join(clientDir, 'package.json'))) process.exit(0);

// vite çözümlenemiyorsa devDependencies kurulmamıştır; derleme adımına bırak.
try {
  require.resolve('vite/package.json', { paths: [clientDir, root] });
} catch {
  console.log('· Arayüz derlemesi atlandı (vite kurulu değil).');
  process.exit(0);
}

const res = spawnSync('npm', ['run', 'build', '--workspace', 'client'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (res.status !== 0) {
  console.warn('⚠ Arayüz derlenemedi. Derleme adımını ayrıca çalıştır: npm run build');
}
process.exit(0);
