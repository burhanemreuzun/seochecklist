<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api, editorName } from '../lib/api.js';

const router = useRouter();
const posts = ref([]);
const loading = ref(true);
const error = ref('');
const creating = ref(false);
const filter = ref('');

const form = ref({ title: '', url: '', focus_keyword: '' });

const STATUS_LABEL = { draft: 'Taslak', review: 'Kontrolde', published: 'Yayinda' };

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return posts.value;
  return posts.value.filter(
    (p) => p.title.toLowerCase().includes(q) || (p.url || '').toLowerCase().includes(q)
  );
});

async function load() {
  loading.value = true;
  try {
    posts.value = await api.listPosts();
    error.value = '';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function create() {
  if (!form.value.title.trim()) return;
  creating.value = true;
  try {
    const post = await api.createPost({ ...form.value, editor: editorName.get() || null });
    router.push({ name: 'post', params: { id: post.id } });
  } catch (err) {
    error.value = err.message;
  } finally {
    creating.value = false;
  }
}

async function remove(post) {
  if (!confirm(`"${post.title}" silinsin mi? Denetim gecmisi de silinir.`)) return;
  try {
    await api.deletePost(post.id);
    posts.value = posts.value.filter((p) => p.id !== post.id);
  } catch (err) {
    error.value = err.message;
  }
}

const scoreClass = (s) =>
  s === null || s === undefined ? 'none' : s >= 85 ? 'good' : s >= 65 ? 'mid' : 'bad';

onMounted(load);
</script>

<template>
  <div>
    <!-- yeni yazi -->
    <section class="card card-pad new-post rise">
      <div class="eyebrow" style="margin-bottom: 14px">Yeni yazi kaydi ac</div>
      <form class="new-grid" @submit.prevent="create">
        <div class="field" style="grid-area: t">
          <label for="np-title">Yazi basligi</label>
          <input id="np-title" v-model="form.title" class="input" placeholder="Kombi basinci nasil ayarlanir?" required />
        </div>
        <div class="field" style="grid-area: k">
          <label for="np-kw">Odak anahtar kelime</label>
          <input id="np-kw" v-model="form.focus_keyword" class="input" placeholder="kombi basinc ayari" />
        </div>
        <div class="field" style="grid-area: u">
          <label for="np-url">URL <span class="muted" style="text-transform: none; letter-spacing: 0">(sonra da girilebilir)</span></label>
          <input id="np-url" v-model="form.url" class="input mono" placeholder="https://site.com/kombi-basinc-ayari/" />
        </div>
        <div style="grid-area: b; display: flex; align-items: flex-end">
          <button class="btn btn-primary" type="submit" :disabled="creating || !form.title.trim()">
            {{ creating ? 'Aciliyor…' : 'Kaydi ac →' }}
          </button>
        </div>
      </form>
    </section>

    <p v-if="error" class="err">{{ error }}</p>

    <!-- liste -->
    <div class="spread list-head">
      <div class="eyebrow">Kayitli yazilar <span v-if="posts.length">({{ posts.length }})</span></div>
      <input v-model="filter" class="input search" placeholder="Ara…" />
    </div>

    <div v-if="loading" class="empty">Yukleniyor…</div>

    <div v-else-if="!filtered.length" class="empty">
      <div class="display">Liste bos.</div>
      <p>Yukaridan ilk yazi kaydini ac.</p>
    </div>

    <ul v-else class="post-list">
      <li v-for="(p, i) in filtered" :key="p.id" class="post-row rise" :style="{ animationDelay: i * 28 + 'ms' }">
        <RouterLink :to="{ name: 'post', params: { id: p.id } }" class="post-link">
          <div class="score" :class="scoreClass(p.last_score)">
            <template v-if="p.last_score !== null && p.last_score !== undefined">
              <span class="score-num">{{ p.last_score }}</span>
            </template>
            <span v-else class="score-dash">—</span>
          </div>

          <div class="grow post-main">
            <div class="post-title">{{ p.title }}</div>
            <div class="post-meta mono">
              <span class="badge" :class="'badge-' + (p.status === 'published' ? 'pass' : p.status === 'review' ? 'warn' : 'skip')">
                {{ STATUS_LABEL[p.status] }}
              </span>
              <span v-if="p.focus_keyword">◆ {{ p.focus_keyword }}</span>
              <span v-if="p.url" class="url-cell">{{ p.url }}</span>
              <span v-else class="muted">URL girilmemis</span>
            </div>
          </div>

          <div class="post-side mono">
            <div v-if="p.last_audit_at">{{ String(p.last_audit_at).slice(0, 16) }}</div>
            <div v-else class="muted">hic denetlenmedi</div>
            <div class="muted">{{ p.checked_count }} madde isaretli</div>
          </div>
        </RouterLink>
        <button class="btn btn-ghost btn-sm del" title="Sil" @click="remove(p)">Sil</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.new-post { margin-bottom: 34px; }
.new-grid {
  display: grid;
  gap: 16px 18px;
  grid-template-columns: 1.4fr 1fr auto;
  grid-template-areas: 't k b' 'u u b';
}
@media (max-width: 760px) {
  .new-grid { grid-template-columns: 1fr; grid-template-areas: 't' 'k' 'u' 'b'; }
}

.err {
  border-left: 3px solid var(--red);
  background: var(--red-soft);
  padding: 10px 14px;
  margin: 0 0 20px;
  font-size: 13.5px;
}

.list-head { margin-bottom: 12px; align-items: center; }
.search { width: 200px; padding: 6px 10px; font-size: 13px; }

.post-list { list-style: none; margin: 0; padding: 0; }

.post-row {
  display: flex;
  align-items: stretch;
  border-top: 1px solid var(--rule);
  transition: background 0.14s ease;
}
.post-row:last-child { border-bottom: 1px solid var(--rule); }
.post-row:hover { background: var(--paper-2); }
.post-row:hover .del { opacity: 1; }

.post-link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 15px 4px;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

/* Skor damgasi — duzeltmen muhru gibi */
.score {
  flex: none;
  width: 52px; height: 52px;
  display: grid; place-items: center;
  border: 2px solid currentColor;
  border-radius: 50%;
  font-family: var(--mono);
  font-weight: 600;
  transform: rotate(-4deg);
}
.score-num { font-size: 17px; letter-spacing: -0.03em; }
.score-dash { font-size: 15px; }
.score.good { color: var(--green); background: var(--green-soft); }
.score.mid  { color: var(--amber); background: var(--amber-soft); }
.score.bad  { color: var(--red);   background: var(--red-soft); }
.score.none { color: var(--rule-strong); background: transparent; border-style: dashed; }

.post-main { min-width: 0; }
.post-title { font-weight: 600; font-size: 16px; letter-spacing: -0.01em; margin-bottom: 5px; }
.post-meta {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-size: 11.5px; color: var(--ink-3);
}
.url-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 340px; }

.post-side { flex: none; text-align: right; font-size: 11px; color: var(--ink-2); line-height: 1.6; }

.del {
  align-self: center; margin-left: 12px;
  opacity: 0; transition: opacity 0.14s ease;
  color: var(--red); border-color: var(--rule);
}
.del:focus-visible { opacity: 1; }

@media (max-width: 700px) {
  .post-side { display: none; }
  .url-cell { max-width: 180px; }
}
</style>
