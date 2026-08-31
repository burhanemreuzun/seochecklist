/**
 * Oturum durumu.
 *
 * Sunucudaki çerez tek doğruluk kaynağıdır; burada yalnızca her sayfa
 * geçişinde ağ isteği atmamak için önbellek tutulur. Giriş, çıkış ve 401
 * durumlarında bu önbellek elle güncellenir.
 */
import { api } from './api.js';

let cached = null; // null = henüz sorulmadı

export const session = {
  /** Bilinmiyorsa sunucuya sorar, biliniyorsa önbellekten döner. */
  async check() {
    if (cached === null) {
      try {
        cached = (await api.me()).authenticated;
      } catch {
        cached = false;
      }
    }
    return cached;
  },
  set(value) { cached = value; },
  invalidate() { cached = null; },
};
