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

const STATUS_LABEL = { draft: 'Taslak', review: 'Kontrolde', published: 'Yayında' };

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
  if (!confirm(`"${post.title}" silinsin mi? Denetim geçmişi de birlikte silinir.`)) return;
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
    <!-- hero -->
    <header class="hero rise">
      <div class="eyebrow">Yayın öncesi kontrol</div>
      <h1 class="h1">
        Yayınlamadan önce<br />
        <span class="soft">sayfayı denetleyelim.</span>
      </h1>
      <p class="lead hero-lead">
        58 maddenin 47'si otomatik ölçülür. Başlık, başlık hiyerarşisi, meta açıklama,
        alternatif metinler, canonical ve kırık bağlantılar beyan edilmez &mdash; ölçülür.
      </p>
    </header>

    <!-- yeni kayit -->
    <section class="card card-pad new-post rise" style="animation-delay: 60ms">
      <div class="new-head">
        <h2 class="h3">Yeni yazı kaydı</h2>
        <p class="muted new-sub">Başlığı gir; adresi sonra da ekleyebilirsin.</p>
      </div>

      <form class="new-grid" @submit.prevent="create">
        <div class="field" style="grid-area: t">
          <label for="np-title">Yazı başlığı</label>
          <input id="np-title" v-model="form.title" class="input" placeholder="Kombi basıncı nasıl ayarlanır?" required />
        </div>
        <div class="field" style="grid-area: k">
          <label for="np-kw">Odak anahtar kelime</label>
          <input id="np-kw" v-model="form.focus_keyword" class="input" placeholder="kombi basınç ayarı" />
        </div>
        <div class="field" style="grid-area: u">
          <label for="np-url">Adres <span class="opt">isteğe bağlı</span></label>
          <input id="np-url" v-model="form.url" class="input mono" placeholder="https://site.com/kombi-basinc-ayari/" />
        </div>
        <div class="submit-cell">
          <button class="btn btn-primary" type="submit" :disabled="creating || !form.title.trim()">
            {{ creating ? 'Açılıyor' : 'Kaydı aç' }}
            <span class="btn-arrow" aria-hidden="true">&#8594;</span>
          </button>
        </div>
      </form>
    </section>

    <p v-if="error" class="notice">{{ error }}</p>

    <!-- kayıtlı yazılar -->
    <div class="spread list-head">
      <h2 class="h3">Kayıtlı yazılar <span class="count">{{ posts.length }}</span></h2>
      <input v-model="filter" class="input search" placeholder="Ara" aria-label="Yazılarda ara" />
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <div v-else-if="!filtered.length" class="empty">
      <div class="h2">Liste boş</div>
      <p>Yukarıdan ilk yazı kaydını aç.</p>
    </div>

    <ul v-else class="post-list">
      <li v-for="(p, i) in filtered" :key="p.id" class="post-row rise" :style="{ animationDelay: 80 + i * 30 + 'ms' }">
        <RouterLink :to="{ name: 'post', params: { id: p.id } }" class="post-link">
          <div class="score" :class="scoreClass(p.last_score)">
            <span v-if="p.last_score !== null && p.last_score !== undefined">{{ p.last_score }}</span>
            <span v-else class="dash">&ndash;</span>
          </div>

          <div class="grow post-main">
            <div class="post-title">{{ p.title }}</div>
            <div class="post-meta">
              <span class="badge" :class="'badge-' + (p.status === 'published' ? 'pass' : p.status === 'review' ? 'warn' : 'skip')">
                {{ STATUS_LABEL[p.status] }}
              </span>
              <span v-if="p.focus_keyword" class="kw">{{ p.focus_keyword }}</span>
              <span v-if="p.url" class="url-cell mono">{{ p.url }}</span>
              <span v-else class="muted">Adres girilmemiş</span>
            </div>
          </div>

          <div class="post-side">
            <div v-if="p.last_audit_at">{{ String(p.last_audit_at).slice(0, 16) }}</div>
            <div v-else class="muted">hiç denetlenmedi</div>
            <div class="muted">{{ p.checked_count }} madde işaretli</div>
          </div>

          <span class="go" aria-hidden="true">&#8594;</span>
        </RouterLink>
        <button class="btn btn-ghost btn-sm del" title="Sil" @click="remove(p)">Sil</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.hero { padding: 26px 0 54px; max-width: 760px; }
.hero .h1 { margin: 16px 0 20px; }
.hero .soft {
  /* İkinci satır renk geçişiyle yazılır: sayfaya fotoğraf koymadan renk katar. */
  background: linear-gradient(96deg, var(--accent) 0%, #6b3ff0 42%, #d63a6a 78%, #e0521f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
@supports not (background-clip: text) { .hero .soft { color: var(--accent); } }
.hero-lead { max-width: 620px; margin: 0; }

.new-post { margin-bottom: 66px; position: relative; overflow: hidden; }
.new-post::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 3px;
  background: linear-gradient(90deg, var(--c-url), var(--c-title), var(--c-content), var(--c-publish));
}
.new-head { margin-bottom: 22px; }
.new-sub { margin: 5px 0 0; font-size: 14px; }
.opt { text-transform: none; letter-spacing: 0; color: #b3b3b3; font-weight: 400; }

.new-grid {
  display: grid;
  gap: 18px 20px;
  grid-template-columns: 1.35fr 1fr;
  grid-template-areas: 't k' 'u u';
}
.submit-cell { grid-column: 1 / -1; }
@media (max-width: 720px) {
  .new-grid { grid-template-columns: 1fr; grid-template-areas: 't' 'k' 'u'; }
}

.list-head { margin-bottom: 18px; align-items: center; }
.count {
  display: inline-block; margin-left: 8px; padding: 2px 10px;
  border-radius: var(--r-pill);
  background: var(--accent-soft); color: var(--accent);
  font-size: 12.5px; font-weight: 500; letter-spacing: 0;
}
.search { width: 210px; padding: 9px 15px; font-size: 13.5px; border-radius: var(--r-pill); }

.post-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }

.post-row {
  display: flex; align-items: stretch;
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  background: var(--bg);
  transition: border-color 0.18s ease, background 0.18s ease;
}
.post-row:hover { border-color: var(--line-2); background: var(--surface); }
.post-row:hover .del { opacity: 1; }
.post-row:hover .go { opacity: 1; transform: none; }

.post-link {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 20px;
  padding: 18px 22px;
  color: inherit; text-decoration: none;
}

.score {
  flex: none;
  width: 50px; height: 50px;
  display: grid; place-items: center;
  border-radius: 50%;
  border: 1px solid;
  font-size: 16px; font-weight: 600; letter-spacing: -0.04em;
}
.score .dash { opacity: 0.5; }
.score.good { color: var(--pass); background: var(--pass-soft); border-color: var(--pass-line); }
.score.mid  { color: var(--warn); background: var(--warn-soft); border-color: var(--warn-line); }
.score.bad  { color: var(--fail); background: var(--fail-soft); border-color: var(--fail-line); }
.score.none { color: var(--muted); background: var(--surface); border-color: var(--line-2); }

.post-main { min-width: 0; }
.post-title { font-size: 16.5px; font-weight: 500; letter-spacing: -0.025em; margin-bottom: 7px; }
.post-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12.5px; color: var(--muted); }
.kw { color: var(--ink-2); }
.kw::before { content: '\25C6'; color: var(--peach); margin-right: 5px; font-size: 8px; vertical-align: middle; }
.url-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 330px; font-size: 11.5px; }

.post-side { flex: none; text-align: right; font-size: 12px; color: var(--ink-2); line-height: 1.55; }

.go {
  flex: none; align-self: center;
  width: 30px; height: 30px; display: grid; place-items: center;
  border-radius: 50%; background: var(--dark); color: #fff; font-size: 13px;
  opacity: 0; transform: translateX(-4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.del {
  align-self: center; margin: 0 16px 0 0;
  opacity: 0; color: var(--fail);
  transition: opacity 0.18s ease, border-color 0.18s ease;
}
.del:hover { border-color: var(--fail); }
.del:focus-visible { opacity: 1; }

@media (max-width: 760px) {
  .post-side, .go { display: none; }
  .url-cell { max-width: 170px; }
  .post-link { padding: 15px 16px; gap: 14px; }
}
</style>
