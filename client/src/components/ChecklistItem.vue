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
          <span class="tick" aria-hidden="true">✓</span>
        </label>
        <span v-else class="auto-dot" :class="'dot-' + status" :title="MODE_TEXT[item.mode]"></span>
      </div>

      <button class="item-body" type="button" :aria-expanded="open" @click="open = !open">
        <div class="label-line">
          <span class="code mono">{{ item.code }}</span>
          <span class="label">{{ item.label }}</span>
        </div>
        <div class="sub mono">
          <span class="sev" :class="'sev-' + item.severity">{{ SEVERITY_TEXT[item.severity] }}</span>
          <span class="muted">· {{ MODE_TEXT[item.mode] }}</span>
        </div>
      </button>

      <div class="right">
        <span class="badge" :class="badgeClass">{{ STATUS_TEXT[status] }}</span>
        <button class="chev" type="button" :aria-label="open ? 'Kapat' : 'Ayrintiyi ac'" @click="open = !open">
          <span :class="{ flip: open }">▾</span>
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
            <div class="eyebrow">Neden onemli</div>
            <p>{{ item.why }}</p>
          </div>
          <div>
            <div class="eyebrow">Nasil yapilir</div>
            <p>{{ item.how }}</p>
          </div>
        </div>

        <div v-if="finding?.message" class="detail-block">
          <div class="eyebrow">Denetim sonucu <span class="src">{{ finding.source === 'ai' ? '· yapay zeka' : '· kural motoru' }}</span></div>
          <p>{{ finding.message }}</p>
        </div>

        <div v-if="finding?.evidence" class="detail-block">
          <div class="eyebrow">Sayfadaki kanit</div>
          <pre class="evidence mono">{{ finding.evidence }}</pre>
        </div>

        <div v-if="check?.checked_by" class="detail-block muted mono tiny">
          {{ check.checked_by }} tarafindan isaretlendi · {{ String(check.checked_at || '').slice(0, 16) }}
          <template v-if="check.note"> · “{{ check.note }}”</template>
        </div>
      </div>
    </Transition>
  </li>
</template>

<style scoped>
.item { border-top: 1px solid var(--rule); position: relative; }
.item:last-child { border-bottom: 1px solid var(--rule); }
.item.blocker::before {
  content: ''; position: absolute; left: -24px; top: 0; bottom: 0;
  width: 3px; background: var(--red);
}
.item.done .label { color: var(--ink-3); }

.item-head { display: flex; align-items: flex-start; gap: 12px; padding: 11px 0; }

.control { flex: none; padding-top: 3px; width: 22px; display: grid; place-items: center; }

/* Elle isaretleme kutusu */
.chk { position: relative; display: grid; place-items: center; cursor: pointer; }
.chk input { position: absolute; opacity: 0; width: 20px; height: 20px; margin: 0; cursor: pointer; }
.tick {
  width: 20px; height: 20px;
  border: 1.5px solid var(--ink-3);
  border-radius: 2px;
  display: grid; place-items: center;
  font-size: 13px; color: transparent;
  transition: all 0.15s ease;
}
.chk.on .tick { background: var(--green); border-color: var(--green); color: #fff; }
.chk input:focus-visible + .tick { outline: 2px solid var(--red); outline-offset: 2px; }

/* Otomatik madde gostergesi */
.auto-dot {
  width: 9px; height: 9px; border-radius: 50%;
  border: 1.5px solid var(--rule-strong); background: transparent;
}
.dot-pass { background: var(--green); border-color: var(--green); }
.dot-warn { background: var(--amber); border-color: var(--amber); }
.dot-fail { background: var(--red); border-color: var(--red); }
.dot-skip { background: var(--rule-strong); }

.item-body {
  flex: 1; min-width: 0; text-align: left;
  background: none; border: 0; padding: 0; color: inherit; font: inherit;
}
.label-line { display: flex; gap: 9px; align-items: baseline; }
.code { flex: none; font-size: 10.5px; font-weight: 600; color: var(--ink-3); letter-spacing: 0.04em; padding-top: 2px; }
.label { font-size: 14.5px; font-weight: 500; line-height: 1.4; }
.sub { font-size: 10.5px; margin-top: 3px; letter-spacing: 0.05em; text-transform: uppercase; }
.sev { font-weight: 600; }

.right { flex: none; display: flex; align-items: center; gap: 8px; padding-top: 1px; }
.chev {
  background: none; border: 0; color: var(--ink-3); font-size: 12px;
  padding: 2px 4px; line-height: 1;
}
.chev span { display: inline-block; transition: transform 0.2s ease; }
.chev .flip { transform: rotate(180deg); }

.verdict {
  margin: -4px 0 10px 34px;
  padding-left: 11px;
  border-left: 2px solid var(--rule-strong);
  font-size: 13px;
  color: var(--ink-2);
}
.verdict.v-fail { border-color: var(--red); }
.verdict.v-warn { border-color: var(--amber); }
.verdict.v-manual { border-color: var(--blue); }

.detail {
  margin: 0 0 14px 34px;
  padding: 14px 16px;
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 2px;
}
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
@media (max-width: 700px) { .detail-grid { grid-template-columns: 1fr; } }
.detail p { margin: 5px 0 0; font-size: 13px; color: var(--ink-2); line-height: 1.55; }
.detail-block { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--rule); }
.src { color: var(--ink-3); font-weight: 400; letter-spacing: 0.08em; }
.tiny { font-size: 11px; }

.evidence {
  margin: 6px 0 0;
  padding: 9px 11px;
  background: var(--paper-3);
  border-radius: 2px;
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow: auto;
  color: var(--ink-2);
}

.expand-enter-active, .expand-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
