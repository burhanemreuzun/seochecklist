<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { api, editorName } from '../lib/api.js';
import ChecklistItem from '../components/ChecklistItem.vue';

const props = defineProps({ id: { type: [String, Number], required: true } });

const categories = ref([]);
const items = ref([]);
const post = ref(null);
const checks = ref({});          // code -> post_checks satiri
const findings = ref({});        // code -> bulgu
const audit = ref(null);
const lastRun = ref(null);       // denetimden donen tam sonuc

const loading = ref(true);
const auditing = ref(false);
const saving = ref(false);
const error = ref('');
const busyCodes = ref(new Set());
const showOnly = ref('all');     // all | problems | manual

const STATUS_OPTS = [
  { v: 'draft', l: 'Taslak' },
  { v: 'review', l: 'Kontrolde' },
  { v: 'published', l: 'Yayinda' },
];

// ─────────────────────── veri ───────────────────────
async function load() {
  loading.value = true;
  try {
    const [def, detail] = await Promise.all([api.checklist(), api.getPost(props.id)]);
    categories.value = def.categories;
    items.value = def.items;
    post.value = detail.post;
    checks.value = Object.fromEntries(detail.checks.map((c) => [c.item_code, c]));
    audit.value = detail.audit;
    findings.value = Object.fromEntries(detail.findings.map((f) => [f.item_code, f]));
    error.value = '';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(() => props.id, load);

// ─────────────────────── eylemler ───────────────────────
async function runAudit() {
  if (!post.value?.url) {
    error.value = 'Once yazinin URL\'ini gir.';
    return;
  }
  auditing.value = true;
  error.value = '';
  try {
    const r = await api.auditPost(post.value.id, {
      url: post.value.url,
      focus_keyword: post.value.focus_keyword,
    });
    lastRun.value = r;
    findings.value = Object.fromEntries(r.findings.filter((f) => f.status !== 'manual').map((f) => [f.code, f]));
    audit.value = { score: r.score, created_at: new Date().toISOString().slice(0, 16).replace('T', ' ') };
  } catch (err) {
    error.value = err.message;
  } finally {
    auditing.value = false;
  }
}

async function toggle(code, value) {
  busyCodes.value = new Set(busyCodes.value).add(code);
  try {
    const row = await api.setCheck(post.value.id, code, {
      is_checked: value,
      checked_by: editorName.get() || null,
    });
    checks.value = { ...checks.value, [code]: row };
  } catch (err) {
    error.value = err.message;
  } finally {
    const s = new Set(busyCodes.value);
    s.delete(code);
    busyCodes.value = s;
  }
}

let saveTimer;
function savePost(patch) {
  post.value = { ...post.value, ...patch };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saving.value = true;
    try {
      await api.updatePost(post.value.id, patch);
    } catch (err) {
      error.value = err.message;
    } finally {
      saving.value = false;
    }
  }, 500);
}

// ─────────────────────── turetilmis durum ───────────────────────
function statusOf(item) {
  if (item.mode === 'manual') return checks.value[item.code]?.is_checked ? 'pass' : 'manual';
  const f = findings.value[item.code];
  return f ? f.status : 'pending';
}

const summary = computed(() => {
  const acc = { pass: 0, warn: 0, fail: 0, skip: 0, manual: 0, pending: 0 };
  items.value.forEach((i) => acc[statusOf(i)]++);
  return acc;
});

/** Yayini engelleyen maddeler: kritik + (otomatik hata veya isaretlenmemis manuel). */
const blockers = computed(() =>
  items.value.filter((i) => {
    if (i.severity !== 'critical') return false;
    const s = statusOf(i);
    return s === 'fail' || s === 'manual' || s === 'pending';
  })
);

const ready = computed(() => !!audit.value && blockers.value.length === 0);

const score = computed(() => lastRun.value?.score ?? audit.value?.score ?? null);
const scoreClass = computed(() =>
  score.value === null ? 'none' : score.value >= 85 ? 'good' : score.value >= 65 ? 'mid' : 'bad'
);

const visibleItems = computed(() => {
  if (showOnly.value === 'problems')
    return items.value.filter((i) => ['fail', 'warn'].includes(statusOf(i)));
  if (showOnly.value === 'manual')
    return items.value.filter((i) => i.mode === 'manual' && !checks.value[i.code]?.is_checked);
  return items.value;
});

const grouped = computed(() =>
  categories.value
    .map((c) => ({ ...c, items: visibleItems.value.filter((i) => i.category_key === c.key) }))
    .filter((c) => c.items.length)
);

function catStat(cat) {
  const all = items.value.filter((i) => i.category_key === cat.key);
  const done = all.filter((i) => statusOf(i) === 'pass').length;
  const bad = all.filter((i) => statusOf(i) === 'fail').length;
  return { done, total: all.length, bad };
}
</script>

<template>
  <div v-if="loading" class="empty">Yukleniyor…</div>
  <div v-else-if="!post" class="empty"><div class="display">Yazi bulunamadi.</div></div>

  <div v-else class="page">
    <RouterLink to="/" class="back mono">← tum yazilar</RouterLink>

    <!-- ───────── ust panel ───────── -->
    <section class="card control-panel rise">
      <div class="cp-main">
        <input
          class="title-input display"
          :value="post.title"
          aria-label="Yazi basligi"
          @input="savePost({ title: $event.target.value })"
        />

        <div class="cp-fields">
          <div class="field grow">
            <label for="cp-url">Denetlenecek URL</label>
            <input
              id="cp-url" class="input mono" placeholder="https://site.com/yazi-adresi/"
              :value="post.url || ''"
              @input="savePost({ url: $event.target.value })"
            />
          </div>
          <div class="field">
            <label for="cp-kw">Odak anahtar kelime</label>
            <input
              id="cp-kw" class="input" placeholder="odak kelime"
              :value="post.focus_keyword || ''"
              @input="savePost({ focus_keyword: $event.target.value })"
            />
          </div>
          <div class="field">
            <label for="cp-st">Durum</label>
            <select id="cp-st" class="input" :value="post.status" @change="savePost({ status: $event.target.value })">
              <option v-for="o in STATUS_OPTS" :key="o.v" :value="o.v">{{ o.l }}</option>
            </select>
          </div>
        </div>

        <div class="cp-actions">
          <button class="btn btn-primary" :disabled="auditing || !post.url" @click="runAudit">
            {{ auditing ? 'Denetleniyor…' : 'Kontrol Et' }}
          </button>
          <span class="mono tiny muted">
            <template v-if="saving">kaydediliyor…</template>
            <template v-else-if="audit?.created_at">son denetim: {{ String(audit.created_at).slice(0, 16) }}</template>
            <template v-else>henuz denetlenmedi</template>
          </span>
        </div>
      </div>

      <!-- skor damgasi -->
      <div class="cp-score">
        <div class="stamp" :class="scoreClass">
          <span v-if="score !== null" class="stamp-num">{{ score }}</span>
          <span v-else class="stamp-dash">?</span>
          <span class="stamp-cap mono">skor</span>
        </div>
        <div class="tallies mono">
          <span class="t t-pass">{{ summary.pass }} gecti</span>
          <span class="t t-warn">{{ summary.warn }} uyari</span>
          <span class="t t-fail">{{ summary.fail }} hata</span>
          <span class="t t-manual">{{ summary.manual + summary.pending }} bekliyor</span>
        </div>
      </div>
    </section>

    <p v-if="error" class="err">{{ error }}</p>

    <!-- ───────── yayin kapisi ───────── -->
    <section class="gate" :class="ready ? 'gate-ok' : 'gate-block'">
      <div class="gate-mark display">{{ ready ? 'YAYINA HAZIR' : 'YAYINLAMA' }}</div>
      <div class="gate-body">
        <template v-if="ready">
          <p>Kritik maddelerin tamami temiz. Yayinlayabilirsin.</p>
        </template>
        <template v-else-if="!audit">
          <p><strong>Once "Kontrol Et"e bas.</strong> Denetim calistirilmadan yayin onayi verilmez.</p>
        </template>
        <template v-else>
          <p><strong>{{ blockers.length }} kritik madde acik.</strong> Bunlar kapanmadan yayinlama:</p>
          <ul class="gate-list">
            <li v-for="b in blockers" :key="b.code">
              <span class="mono code">{{ b.code }}</span> {{ b.label }}
              <em v-if="findings[b.code]?.message" class="gate-why">— {{ findings[b.code].message }}</em>
              <em v-else-if="b.mode === 'manual'" class="gate-why">— kontrol edip isaretlemedin</em>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <!-- ───────── filtre ───────── -->
    <div class="filters">
      <button class="pill" :class="{ on: showOnly === 'all' }" @click="showOnly = 'all'">
        Tumu <span class="mono">{{ items.length }}</span>
      </button>
      <button class="pill" :class="{ on: showOnly === 'problems' }" @click="showOnly = 'problems'">
        Sorunlular <span class="mono">{{ summary.fail + summary.warn }}</span>
      </button>
      <button class="pill" :class="{ on: showOnly === 'manual' }" @click="showOnly = 'manual'">
        Elle isaretlenecek <span class="mono">{{ summary.manual }}</span>
      </button>
    </div>

    <!-- ───────── liste ───────── -->
    <div v-if="!grouped.length" class="empty">
      <div class="display">Bu filtrede madde yok.</div>
    </div>

    <section v-for="(cat, ci) in grouped" :key="cat.key" class="cat rise" :style="{ animationDelay: ci * 40 + 'ms' }">
      <header class="cat-head">
        <h2 class="display">
          <span class="cat-icon">{{ cat.icon }}</span>{{ cat.label }}
        </h2>
        <div class="cat-stat mono">
          <span :class="{ 'has-bad': catStat(cat).bad }">
            {{ catStat(cat).done }}/{{ catStat(cat).total }}
          </span>
          <span v-if="catStat(cat).bad" class="cat-bad">· {{ catStat(cat).bad }} hata</span>
        </div>
      </header>
      <ul class="cat-items">
        <ChecklistItem
          v-for="it in cat.items"
          :key="it.code"
          :item="it"
          :finding="findings[it.code] || null"
          :check="checks[it.code] || null"
          :busy="busyCodes.has(it.code)"
          @toggle="toggle"
        />
      </ul>
    </section>

    <p v-if="lastRun && !lastRun.ai.used" class="ai-note mono">
      Not: yapay zeka degerlendirmesi calismadi — {{ lastRun.ai.reason }}
    </p>
  </div>
</template>

<style scoped>
.back { display: inline-block; font-size: 11.5px; color: var(--ink-3); text-decoration: none; margin-bottom: 16px; }
.back:hover { color: var(--red); }

/* ───── ust panel ───── */
.control-panel { display: flex; gap: 28px; padding: 24px 26px; margin-bottom: 22px; }
.cp-main { flex: 1; min-width: 0; }

.title-input {
  width: 100%;
  font-size: clamp(22px, 3vw, 30px);
  border: 0; border-bottom: 1px dashed var(--rule-strong);
  background: transparent; color: var(--ink);
  padding: 0 0 7px; margin-bottom: 18px;
}
.title-input:focus { outline: 0; border-bottom-color: var(--red); }

.cp-fields { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
.cp-fields .field { min-width: 150px; }
.cp-fields .grow { flex: 1; min-width: 260px; }

.cp-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.tiny { font-size: 11px; }

/* skor damgasi */
.cp-score { flex: none; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.stamp {
  width: 108px; height: 108px;
  display: grid; place-items: center; align-content: center;
  border: 3px double currentColor; border-radius: 50%;
  transform: rotate(-5deg);
  animation: stamp 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
.stamp-num { font-family: var(--serif); font-size: 42px; line-height: 1; }
.stamp-dash { font-family: var(--serif); font-size: 40px; line-height: 1; }
.stamp-cap { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; margin-top: 3px; }
.stamp.good { color: var(--green); background: var(--green-soft); }
.stamp.mid  { color: var(--amber); background: var(--amber-soft); }
.stamp.bad  { color: var(--red);   background: var(--red-soft); }
.stamp.none { color: var(--rule-strong); border-style: dashed; }

.tallies { display: grid; gap: 2px; font-size: 10.5px; text-align: right; }
.t-pass { color: var(--green); }
.t-warn { color: var(--amber); }
.t-fail { color: var(--red); }
.t-manual { color: var(--blue); }

@media (max-width: 780px) {
  .control-panel { flex-direction: column-reverse; }
  .cp-score { flex-direction: row; justify-content: flex-start; align-items: center; gap: 18px; }
  .tallies { text-align: left; }
}

.err { border-left: 3px solid var(--red); background: var(--red-soft);
  padding: 10px 14px; margin: 0 0 18px; font-size: 13.5px; }

/* ───── yayin kapisi ───── */
.gate {
  display: flex; gap: 22px; align-items: flex-start;
  padding: 18px 22px; margin-bottom: 30px;
  border: 2px solid; border-radius: 2px;
}
.gate-ok { border-color: var(--green); background: var(--green-soft); }
.gate-block { border-color: var(--red); background: var(--red-soft); }
.gate-mark {
  flex: none; font-size: 19px; letter-spacing: 0.04em;
  padding: 5px 12px; border: 2px solid currentColor; border-radius: 2px;
  transform: rotate(-3deg); white-space: nowrap;
}
.gate-ok .gate-mark { color: var(--green); }
.gate-block .gate-mark { color: var(--red); }
.gate-body { flex: 1; min-width: 0; }
.gate-body p { margin: 4px 0 0; font-size: 13.5px; }
.gate-list { margin: 9px 0 0; padding-left: 0; list-style: none; font-size: 13px; }
.gate-list li { padding: 3px 0; border-top: 1px dotted rgba(22,19,15,0.18); }
.gate-list .code { font-size: 10.5px; color: var(--ink-3); margin-right: 6px; }
.gate-why { color: var(--ink-2); font-style: italic; }
@media (max-width: 640px) { .gate { flex-direction: column; } }

/* ───── filtre ───── */
.filters { display: flex; gap: 8px; margin-bottom: 22px; flex-wrap: wrap; }
.pill {
  padding: 6px 13px; border: 1px solid var(--rule-strong); border-radius: 2px;
  background: transparent; color: var(--ink-2); font-size: 12.5px; font-weight: 500;
  transition: all 0.14s ease;
}
.pill span { color: var(--ink-3); font-size: 11px; margin-left: 4px; }
.pill:hover { border-color: var(--ink); }
.pill.on { background: var(--ink); border-color: var(--ink); color: var(--paper-2); }
.pill.on span { color: var(--rule-strong); }

/* ───── kategoriler ───── */
.cat { margin-bottom: 34px; }
.cat-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  padding-bottom: 8px; border-bottom: 2px solid var(--ink);
}
.cat-head h2 { font-size: 23px; margin: 0; display: flex; align-items: center; gap: 10px; }
.cat-icon { font-size: 17px; }
.cat-stat { font-size: 11px; color: var(--ink-3); letter-spacing: 0.06em; }
.cat-stat .has-bad { color: var(--ink-2); }
.cat-bad { color: var(--red); }
.cat-items { list-style: none; margin: 0; padding: 0; }

.ai-note {
  font-size: 11.5px; color: var(--ink-3);
  border-top: 1px solid var(--rule); padding-top: 12px;
}
</style>
