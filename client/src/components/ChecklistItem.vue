<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  item:    { type: Object, required: true },   // checklist_items satiri
  finding: { type: Object, default: null },    // son denetimin bu maddeye dair bulgusu
  check:   { type: Object, default: null },    // editorun elle isareti
  busy:    { type: Boolean, default: false },
});
const emit = defineEmits(['toggle']);

const open = ref(false);

const isManual = computed(() => props.item.mode === 'manual');
const isChecked = computed(() => !!props.check?.is_checked);

/** Otomatik maddelerde karar denetimden gelir; manuel maddelerde editorden. */
const status = computed(() => {
  if (isManual.value) return isChecked.value ? 'pass' : 'manual';
  if (!props.finding) return 'pending';
  return props.finding.status;
});

const STATUS_TEXT = {
  pass: 'Gecti', warn: 'Uyari', fail: 'Hata',
  skip: 'Atlandi', manual: 'Sende', pending: 'Denetlenmedi',
};
const SEVERITY_TEXT = { critical: 'Kritik', high: 'Onemli', medium: 'Orta' };
const MODE_TEXT = { rule: 'otomatik olculur', ai: 'yapay zeka degerlendirir', manual: 'elle isaretlenir' };

const badgeClass = computed(() =>
  status.value === 'pending' ? 'badge-skip' : `badge-${status.value}`
);

const isBlocker = computed(
  () => props.item.severity === 'critical' && (status.value === 'fail' || status.value === 'manual')
);
</script>

<template>
  <li class="item" :class="{ blocker: isBlocker, done: status === 'pass' }">
    <div class="item-head">
      <!-- Kontrol: yalnizca elle isaretlenen maddelerde kutucuk cikar.
           Makinenin olcebildigi maddede editor 'yaptim' diyemez. -->
      <div class="control">
        <label v-if="isManual" class="chk" :class="{ on: isChecked }">
          <input
            type="checkbox"
            :checked="isChecked"
            :disabled="busy"
            @change="emit('toggle', item.code, $event.target.checked)"
          />
          <span class="tick" aria-hidden="true">&#10003;</span>
        </label>
        <span v-else class="auto" :class="'auto-' + status" :title="MODE_TEXT[item.mode]"></span>
      </div>

      <button class="item-body" type="button" :aria-expanded="open" @click="open = !open">
        <span class="label">{{ item.label }}</span>
        <span class="sub">
          <span class="code mono">{{ item.code }}</span>
          <span class="sep">&middot;</span>
          <span class="sev" :class="'sev-' + item.severity">{{ SEVERITY_TEXT[item.severity] }}</span>
          <span class="sep">&middot;</span>
          <span>{{ MODE_TEXT[item.mode] }}</span>
        </span>
      </button>

      <div class="right">
        <span class="badge" :class="badgeClass">{{ STATUS_TEXT[status] }}</span>
        <button class="chev" type="button" :aria-label="open ? 'Kapat' : 'Ayrintiyi ac'" @click="open = !open">
          <span :class="{ flip: open }">&#9662;</span>
        </button>
      </div>
    </div>

    <!-- denetim mesaji her zaman gorunur: en degerli bilgi bu -->
    <p v-if="finding?.message && status !== 'pass'" class="verdict" :class="'v-' + status">
      {{ finding.message }}
    </p>

    <Transition name="expand">
      <div v-if="open" class="detail">
        <div class="detail-grid">
          <div>
            <div class="eyebrow bare">Neden onemli</div>
            <p>{{ item.why }}</p>
          </div>
          <div>
            <div class="eyebrow bare">Nasil yapilir</div>
            <p>{{ item.how }}</p>
          </div>
        </div>

        <div v-if="finding?.message" class="detail-block">
          <div class="eyebrow bare">
            Denetim sonucu
            <span class="src">{{ finding.source === 'ai' ? 'yapay zeka' : 'kural motoru' }}</span>
          </div>
          <p>{{ finding.message }}</p>
        </div>

        <div v-if="finding?.evidence" class="detail-block">
          <div class="eyebrow bare">Sayfadaki kanit</div>
          <pre class="evidence mono">{{ finding.evidence }}</pre>
        </div>

        <div v-if="check?.checked_by" class="detail-block signoff">
          {{ check.checked_by }} tarafindan isaretlendi &middot; {{ String(check.checked_at || '').slice(0, 16) }}
          <template v-if="check.note"> &middot; &ldquo;{{ check.note }}&rdquo;</template>
        </div>
      </div>
    </Transition>
  </li>
</template>

<style scoped>
.item {
  position: relative;
  border-bottom: 1px solid var(--line);
  transition: background 0.16s ease;
}
.item:last-child { border-bottom: 0; }
.item.blocker { background: linear-gradient(90deg, var(--fail-soft), transparent 42%); }
.item.blocker::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 2px; background: var(--fail);
}
.item.done .label { color: var(--muted); }

.item-head { display: flex; align-items: flex-start; gap: 14px; padding: 15px 20px; }

.control { flex: none; width: 20px; display: grid; place-items: center; padding-top: 2px; }

/* Elle isaretleme kutusu */
.chk { position: relative; display: grid; place-items: center; cursor: pointer; }
.chk input { position: absolute; inset: 0; opacity: 0; width: 20px; height: 20px; margin: 0; cursor: pointer; }
.tick {
  width: 20px; height: 20px;
  border: 1.5px solid var(--line-2);
  border-radius: 7px;
  display: grid; place-items: center;
  font-size: 12px; color: transparent;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}
.chk:hover .tick { border-color: var(--accent); }
.chk.on .tick { background: var(--accent); border-color: var(--accent); color: #fff; }
.chk input:focus-visible + .tick { box-shadow: 0 0 0 3px var(--accent-soft); }

/* Otomatik madde gostergesi */
.auto {
  width: 8px; height: 8px; border-radius: 50%;
  border: 1.5px solid var(--line-2); background: transparent;
}
.auto-pass { background: var(--pass); border-color: var(--pass); }
.auto-warn { background: var(--warn); border-color: var(--warn); }
.auto-fail { background: var(--fail); border-color: var(--fail); }
.auto-skip { background: var(--line-2); }

.item-body {
  flex: 1; min-width: 0; text-align: left;
  background: none; border: 0; padding: 0; color: inherit; font: inherit;
  display: flex; flex-direction: column; gap: 4px;
}
.label { font-size: 15px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.45; }
.sub { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; font-size: 12px; color: var(--muted); }
.code { font-size: 11px; letter-spacing: 0; }
.sep { opacity: 0.45; }
.sev { font-weight: 500; }

.right { flex: none; display: flex; align-items: center; gap: 6px; }
.chev { background: none; border: 0; color: var(--muted); font-size: 11px; padding: 4px 2px; line-height: 1; }
.chev span { display: inline-block; transition: transform 0.22s ease; }
.chev .flip { transform: rotate(180deg); }

.verdict {
  margin: -6px 20px 15px 54px;
  padding: 10px 14px;
  border-radius: var(--r-input);
  background: var(--surface);
  border-left: 2px solid var(--line-2);
  font-size: 13.5px;
  color: var(--ink-2);
}
.verdict.v-fail { background: var(--fail-soft); border-color: var(--fail); }
.verdict.v-warn { background: var(--warn-soft); border-color: var(--warn); }
.verdict.v-manual { background: var(--info-soft); border-color: var(--info); }

.detail {
  margin: 0 20px 18px 54px;
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r-card);
}
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 720px) { .detail-grid { grid-template-columns: 1fr; gap: 18px; } }
.detail p { margin: 7px 0 0; font-size: 13.5px; color: var(--ink-2); line-height: 1.6; }
.detail-block { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line-2); }
.src {
  margin-left: 4px; padding: 2px 8px;
  border-radius: var(--r-pill); background: var(--bg);
  border: 1px solid var(--line); color: var(--muted);
  letter-spacing: 0.06em;
}
.signoff { font-size: 12.5px; color: var(--muted); }

.evidence {
  margin: 9px 0 0;
  padding: 12px 14px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-input);
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 230px;
  overflow: auto;
  color: var(--ink-2);
}

.expand-enter-active, .expand-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 720px) {
  .item-head { padding: 14px 16px; gap: 12px; }
  .verdict, .detail { margin-left: 16px; margin-right: 16px; }
}
</style>