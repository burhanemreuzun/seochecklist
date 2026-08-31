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
  <div v-if="loading" class="empty">Yukleniyor</div>
  <div v-else-if="!post" class="empty"><div class="h2">Yazi bulunamadi</div></div>

  <div v-else>
    <RouterLink to="/" class="back">&#8592; Tum yazilar</RouterLink>

    <!-- ───────── kontrol paneli ───────── -->
    <section class="panel rise">
      <div class="panel-main">
        <input
          class="title-input"
          :value="post.title"
          aria-label="Yazi basligi"
          @input="savePost({ title: $event.target.value })"
        />

        <div class="fields">
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

        <div class="actions">
          <button class="btn btn-primary" :disabled="auditing || !post.url" @click="runAudit">
            {{ auditing ? 'Denetleniyor' : 'Kontrol Et' }}
            <span class="btn-arrow" aria-hidden="true">&#8594;</span>
          </button>
          <span class="saved">
            <template v-if="saving">kaydediliyor</template>
            <template v-else-if="audit?.created_at">son denetim {{ String(audit.created_at).slice(0, 16) }}</template>
            <template v-else>henuz denetlenmedi</template>
          </span>
        </div>
      </div>

      <!-- skor -->
      <aside class="panel-score">
        <div class="ring" :class="scoreClass" :style="{ '--pct': (score ?? 0) + '%' }">
          <div class="ring-in">
            <span v-if="score !== null" class="ring-num">{{ score }}</span>
            <span v-else class="ring-num dim">&ndash;</span>
            <span class="ring-cap">skor</span>
          </div>
        </div>
        <ul class="tallies">
          <li><i class="d d-pass"></i>{{ summary.pass }} gecti</li>
          <li><i class="d d-warn"></i>{{ summary.warn }} uyari</li>
          <li><i class="d d-fail"></i>{{ summary.fail }} hata</li>
          <li><i class="d d-wait"></i>{{ summary.manual + summary.pending }} bekliyor</li>
        </ul>
      </aside>
    </section>

    <p v-if="error" class="notice">{{ error }}</p>

    <!-- ───────── yayin kapisi ───────── -->
    <section class="gate" :class="ready ? 'gate-ok' : 'gate-block'">
      <div class="gate-tag">
        <span class="gate-led"></span>{{ ready ? 'Yayina hazir' : 'Yayinlama' }}
      </div>
      <div class="gate-body">
        <template v-if="ready">
          <p class="gate-lead">Kritik maddelerin tamami temiz. Yayinlayabilirsin.</p>
        </template>
        <template v-else-if="!audit">
          <p class="gate-lead">Once <strong>Kontrol Et</strong>&#8217;e bas. Denetim calistirilmadan yayin onayi verilmez.</p>
        </template>
        <template v-else>
          <p class="gate-lead"><strong>{{ blockers.length }} kritik madde acik.</strong> Bunlar kapanmadan yayinlama.</p>
          <ul class="gate-list">
            <li v-for="b in blockers" :key="b.code">
              <span class="mono gcode">{{ b.code }}</span>
              <span class="glabel">{{ b.label }}</span>
              <span v-if="findings[b.code]?.message" class="gwhy">{{ findings[b.code].message }}</span>
              <span v-else-if="b.mode === 'manual'" class="gwhy">kontrol edip isaretlemedin</span>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <!-- ───────── filtre ───────── -->
    <div class="filters">
      <button class="pill" :class="{ on: showOnly === 'all' }" @click="showOnly = 'all'">
        Tumu <span>{{ items.length }}</span>
      </button>
      <button class="pill" :class="{ on: showOnly === 'problems' }" @click="showOnly = 'problems'">
        Sorunlular <span>{{ summary.fail + summary.warn }}</span>
      </button>
      <button class="pill" :class="{ on: showOnly === 'manual' }" @click="showOnly = 'manual'">
        Elle isaretlenecek <span>{{ summary.manual }}</span>
      </button>
    </div>

    <!-- ───────── liste ───────── -->
    <div v-if="!grouped.length" class="empty"><div class="h2">Bu filtrede madde yok</div></div>

    <section v-for="(cat, ci) in grouped" :key="cat.key" class="cat rise" :style="{ animationDelay: ci * 45 + 'ms' }">
      <header class="cat-head">
        <h2 class="h3"><span class="cat-icon">{{ cat.icon }}</span>{{ cat.label }}</h2>
        <div class="cat-stat">
          <span class="cat-count">{{ catStat(cat).done }}/{{ catStat(cat).total }}</span>
          <span v-if="catStat(cat).bad" class="cat-bad">{{ catStat(cat).bad }} hata</span>
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

    <p v-if="lastRun && !lastRun.ai.used" class="ai-note">
      Yapay zeka degerlendirmesi calismadi &mdash; {{ lastRun.ai.reason }}
    </p>
  </div>
</template>

<style scoped>
.back {
  display: inline-block; margin-bottom: 22px;
  font-size: 13.5px; color: var(--muted); text-decoration: none;
  transition: color 0.16s ease;
}
.back:hover { color: var(--ink); }

/* ───── kontrol paneli ───── */
.panel {
  display: flex; gap: 40px;
  padding: 30px 32px;
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  margin-bottom: 26px;
}
.panel-main { flex: 1; min-width: 0; }

.title-input {
  width: 100%;
  font-family: inherit;
  font-size: clamp(24px, 3.4vw, 36px);
  font-weight: 600; letter-spacing: -0.04em; line-height: 1.1;
  color: var(--ink); background: transparent;
  border: 0; border-bottom: 1px solid var(--line);
  padding: 0 0 12px; margin: 0 0 24px;
  transition: border-color 0.16s ease;
}
.title-input:focus { outline: none; border-bottom-color: var(--accent); }

.fields { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
.fields .field { min-width: 155px; }
.fields .grow { flex: 1; min-width: 270px; }

.actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.saved { font-size: 13px; color: var(--muted); }

/* skor halkasi */
.panel-score { flex: none; display: flex; flex-direction: column; align-items: center; gap: 18px; }
.ring {
  --pct: 0%;
  width: 128px; height: 128px; border-radius: 50%;
  display: grid; place-items: center;
  background: conic-gradient(currentColor var(--pct), var(--surface-2) 0);
  transition: background 0.6s cubic-bezier(0.16, 0.8, 0.3, 1);
}
.ring-in {
  width: 106px; height: 106px; border-radius: 50%;
  background: var(--bg);
  display: grid; place-items: center; align-content: center;
}
.ring-num { font-size: 38px; font-weight: 600; letter-spacing: -0.05em; line-height: 1; color: var(--ink); }
.ring-num.dim { color: var(--muted); }
.ring-cap { font-size: 11px; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); margin-top: 5px; }
.ring.good { color: var(--pass); }
.ring.mid  { color: var(--warn); }
.ring.bad  { color: var(--fail); }
.ring.none { color: var(--line-2); }

.tallies { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; font-size: 12.5px; color: var(--ink-2); }
.tallies li { display: flex; align-items: center; gap: 8px; }
.d { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.d-pass { background: var(--pass); }
.d-warn { background: var(--warn); }
.d-fail { background: var(--fail); }
.d-wait { background: var(--info); }

@media (max-width: 820px) {
  .panel { flex-direction: column-reverse; gap: 26px; padding: 24px 20px; }
  .panel-score { flex-direction: row; justify-content: flex-start; gap: 24px; }
}

/* ───── yayin kapisi ───── */
.gate {
  display: flex; gap: 26px; align-items: flex-start;
  padding: 24px 28px; margin-bottom: 44px;
  border: 1px solid; border-radius: var(--r-card);
}
.gate-ok { background: var(--pass-soft); border-color: var(--pass-line); }
.gate-block { background: var(--fail-soft); border-color: var(--fail-line); }

.gate-tag {
  flex: none; display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 16px; border-radius: var(--r-pill);
  background: var(--bg); border: 1px solid;
  font-size: 13px; font-weight: 500; letter-spacing: -0.015em; white-space: nowrap;
}
.gate-ok .gate-tag { color: var(--pass); border-color: var(--pass-line); }
.gate-block .gate-tag { color: var(--fail); border-color: var(--fail-line); }
.gate-led { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: none; }
.gate-block .gate-led { animation: pulse 1.9s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.28; } }

.gate-body { flex: 1; min-width: 0; }
.gate-lead { margin: 3px 0 0; font-size: 14.5px; color: var(--ink); }
.gate-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 1px; }
.gate-list li {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  padding: 9px 0; border-top: 1px solid rgba(0, 0, 0, 0.07);
  font-size: 13.5px;
}
.gcode { flex: none; font-size: 11px; color: var(--muted); }
.glabel { font-weight: 500; }
.gwhy { color: var(--ink-2); }
@media (max-width: 640px) { .gate { flex-direction: column; padding: 20px; } }

/* ───── filtre ───── */
.filters { display: flex; gap: 9px; margin-bottom: 30px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 17px;
  border: 1px solid var(--line); border-radius: var(--r-pill);
  background: var(--bg); color: var(--ink-2);
  font-size: 13.5px; font-weight: 500; letter-spacing: -0.015em;
  transition: all 0.16s ease;
}
.pill span { color: var(--muted); font-size: 12px; }
.pill:hover { border-color: var(--ink); color: var(--ink); }
.pill.on { background: var(--dark); border-color: var(--dark); color: #fff; }
.pill.on span { color: rgba(255, 255, 255, 0.55); }

/* ───── kategoriler ───── */
.cat { margin-bottom: 34px; }
.cat-head {
  display: flex; align-items: center; justify-content: space-between; gap: 18px;
  margin-bottom: 14px;
}
.cat-head .h3 { display: flex; align-items: center; gap: 11px; }
.cat-icon { font-size: 17px; }
.cat-stat { display: flex; align-items: center; gap: 10px; font-size: 12.5px; }
.cat-count { color: var(--muted); }
.cat-bad {
  padding: 3px 11px; border-radius: var(--r-pill);
  background: var(--fail-soft); border: 1px solid var(--fail-line); color: var(--fail);
  font-size: 11.5px;
}
.cat-items {
  list-style: none; margin: 0; padding: 0;
  border: 1px solid var(--line); border-radius: var(--r-card);
  overflow: hidden;
}

.ai-note {
  margin-top: 34px; padding: 14px 18px;
  background: var(--surface); border: 1px solid var(--line-2);
  border-radius: var(--r-input);
  font-size: 13px; color: var(--muted);
}
</style>