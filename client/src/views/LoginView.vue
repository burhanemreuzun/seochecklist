<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../lib/api.js';
import { session } from '../lib/session.js';

const router = useRouter();
const route = useRoute();

const password = ref('');
const busy = ref(false);
const error = ref('');
const input = ref(null);

onMounted(() => nextTick(() => input.value?.focus()));

async function submit() {
  if (!password.value || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await api.login(password.value);
    password.value = '';
    session.set(true);          // önbelleği tazele, yoksa koruma bizi geri atar
    router.replace(route.query.redirect || '/');
  } catch (err) {
    error.value = err.message;
    password.value = '';
    nextTick(() => input.value?.focus());
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card-login rise">
      <div class="brand">SEO Kontrol<span class="dot">.</span></div>
      <h1 class="h2 title">Yayın öncesi<br /><span class="soft">kontrol paneli</span></h1>
      <p class="lead sub">Devam etmek için parolayı gir.</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="pw">Parola</label>
          <input
            id="pw"
            ref="input"
            v-model="password"
            class="input"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="busy"
          />
        </div>

        <p v-if="error" class="notice login-error">{{ error }}</p>

        <button class="btn btn-primary full" type="submit" :disabled="busy || !password">
          {{ busy ? 'Kontrol ediliyor…' : 'Giriş yap' }}
          <span class="btn-arrow" aria-hidden="true">&#8594;</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  display: grid; place-items: center;
  padding: 24px;
}
.card-login {
  width: 100%; max-width: 420px;
  padding: 40px 38px;
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  background: var(--bg);
  position: relative; overflow: hidden;
}
.card-login::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 3px;
  background: linear-gradient(90deg, var(--c-url), var(--c-title), var(--c-content), var(--c-publish));
}
.brand { font-size: 16px; font-weight: 600; letter-spacing: -0.035em; margin-bottom: 30px; }
.brand .dot { color: var(--accent); }
.title { margin: 0 0 12px; }
.title .soft {
  background: linear-gradient(96deg, var(--accent), #6b3ff0 55%, #d63a6a);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
@supports not (background-clip: text) { .title .soft { color: var(--accent); } }
.sub { margin: 0 0 26px; font-size: 15px; }
.login-error { margin: 16px 0 0; }
.full { width: 100%; justify-content: center; margin-top: 22px; }
</style>
