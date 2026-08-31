<script setup>
import { ref, onMounted } from 'vue';
import { api, editorName } from './lib/api.js';

const health = ref(null);
const editor = ref(editorName.get());

onMounted(async () => {
  try { health.value = await api.health(); } catch { health.value = { ok: false }; }
});

function saveEditor(e) {
  editor.value = e.target.value;
  editorName.set(editor.value);
}
</script>

<template>
  <div class="page">
    <!-- yuzen pill gezinme -->
    <div class="navwrap">
      <nav class="nav">
        <RouterLink to="/" class="brand">SEO Kontrol<span class="dot">.</span></RouterLink>

        <div class="nav-right">
          <div v-if="health" class="state" :title="health.ok ? 'Sunucu bagli' : 'Sunucuya ulasilamiyor'">
            <span class="led" :class="health.ok ? 'on' : 'off'"></span>
            <span class="state-txt">
              {{ health.ai?.enabled ? health.ai.model : 'AI kapali' }}
            </span>
          </div>
          <input
            class="who"
            :value="editor"
            placeholder="Adin"
            aria-label="Editor adi"
            @input="saveEditor"
          />
        </div>
      </nav>
    </div>

    <main class="shell">
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

@media (max-width: 640px) {
  .navwrap { padding: 12px 16px 20px; }
  .nav { padding: 8px 8px 8px 18px; }
  .state-txt { display: none; }
  .who { width: 96px; }
}
</style>
