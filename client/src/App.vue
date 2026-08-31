<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, editorName } from './lib/api.js';
import { session } from './lib/session.js';

const route = useRoute();
const router = useRouter();
const health = ref(null);
const editor = ref(editorName.get());

// Giriş ekranında üst çubuk gösterilmez.
const chrome = computed(() => route.name !== 'login');

onMounted(async () => {
  try { health.value = await api.health(); } catch { health.value = { ok: false }; }
});

async function logout() {
  try { await api.logout(); } finally {
    session.set(false);
    router.replace({ name: 'login' });
  }
}

function saveEditor(e) {
  editor.value = e.target.value;
  editorName.set(editor.value);
}
</script>

<template>
  <div class="page">
    <!-- yüzen gezinme çubuğu -->
    <div v-if="chrome" class="navwrap">
      <nav class="nav">
        <RouterLink to="/" class="brand">SEO Kontrol<span class="dot">.</span></RouterLink>

        <div class="nav-right">
          <div v-if="health" class="state" :title="health.ok ? 'Sunucu bağlı' : 'Sunucuya ulaşılamıyor'">
            <span class="led" :class="health.ok ? 'on' : 'off'"></span>
            <span class="state-txt">
              {{ health.ai?.enabled ? health.ai.model : 'yapay zekâ kapalı' }}
            </span>
          </div>
          <input
            class="who"
            :value="editor"
            placeholder="Adın"
            aria-label="Editör adı"
            @input="saveEditor"
          />
          <button class="out" type="button" title="Çıkış yap" @click="logout">Çıkış</button>
        </div>
      </nav>
    </div>

    <main :class="chrome ? 'shell' : ''">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.navwrap {
  position: sticky; top: 0; z-index: 50;
  padding: 16px 24px 26px;
  background: linear-gradient(var(--bg) 60%, rgba(255, 255, 255, 0));
}
.nav {
  max-width: 1140px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  padding: 9px 9px 9px 22px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.brand {
  font-size: 16.5px; font-weight: 600; letter-spacing: -0.035em;
  text-decoration: none; color: var(--ink); white-space: nowrap;
}
.brand .dot { color: var(--accent); }
.state { border: 1px solid var(--line); }

.nav-right { display: flex; align-items: center; gap: 10px; }

.state {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 14px;
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: 12.5px; color: var(--muted);
  white-space: nowrap;
}
.led { width: 6px; height: 6px; border-radius: 50%; flex: none; }
.led.on { background: var(--pass); }
.led.off { background: var(--fail); }

.who {
  width: 132px;
  padding: 8px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--bg);
  font-family: inherit; font-size: 13px; color: var(--ink);
  letter-spacing: -0.01em;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.who::placeholder { color: #b3b3b3; }
.who:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }

.out {
  padding: 8px 15px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--muted);
  font-family: inherit; font-size: 13px; font-weight: 500;
  letter-spacing: -0.01em;
  transition: color 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}
.out:hover { color: var(--fail); border-color: var(--fail-line); background: var(--fail-soft); }

@media (max-width: 640px) {
  .navwrap { padding: 12px 16px 20px; }
  .nav { padding: 8px 8px 8px 18px; }
  .state-txt { display: none; }
  .who { width: 88px; }
  .out { padding: 8px 12px; }
}
</style>
