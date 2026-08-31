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
  <div class="shell">
    <header class="masthead">
      <div>
        <div class="eyebrow">Yayin Oncesi Duzeltme Provasi</div>
        <h1><RouterLink to="/" style="color: inherit; text-decoration: none">SEO <em>Kontrol</em> Listesi</RouterLink></h1>
      </div>

      <div class="head-right">
        <input
          class="input mono editor-input"
          :value="editor"
          placeholder="Adin…"
          aria-label="Editor adi"
          @input="saveEditor"
        />
        <div v-if="health" class="eyebrow status-line">
          <span :class="health.ok ? 'dot-ok' : 'dot-bad'"></span>
          {{ health.ok ? 'Bagli' : 'Sunucu yok' }}
          ·
          {{ health.ai?.enabled ? health.ai.model : 'AI kapali' }}
        </div>
      </div>
    </header>
    <div class="masthead-rule"></div>

    <RouterView />
  </div>
</template>

<style scoped>
.head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.editor-input { width: 190px; text-align: right; padding: 6px 10px; font-size: 12.5px; }
.status-line { display: flex; align-items: center; gap: 7px; }
.dot-ok, .dot-bad { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.dot-ok { background: var(--green); }
.dot-bad { background: var(--red); }
@media (max-width: 640px) {
  .masthead { flex-direction: column; align-items: flex-start; }
  .head-right { align-items: flex-start; }
}
</style>
