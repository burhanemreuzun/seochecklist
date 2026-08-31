import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LoginView from './views/LoginView.vue';
import PostsView from './views/PostsView.vue';
import PostView from './views/PostView.vue';
import { setUnauthorizedHandler } from './lib/api.js';
import { session } from './lib/session.js';
import './assets/main.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/giris', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'posts', component: PostsView },
    { path: '/yazi/:id', name: 'post', component: PostView, props: true },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  if (await session.check()) return true;
  return { name: 'login', query: to.path === '/' ? {} : { redirect: to.fullPath } };
});

// Sunucu 401 döndüğünde (çerez süresi dolmuş olabilir) giriş ekranına dön.
setUnauthorizedHandler(() => {
  session.set(false);
  const current = router.currentRoute.value;
  if (current.name !== 'login') {
    router.replace({ name: 'login', query: { redirect: current.fullPath } });
  }
});

createApp(App).use(router).mount('#app');
