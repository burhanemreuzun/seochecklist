import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import PostsView from './views/PostsView.vue';
import PostView from './views/PostView.vue';
import './assets/main.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'posts', component: PostsView },
    { path: '/yazi/:id', name: 'post', component: PostView, props: true },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

createApp(App).use(router).mount('#app');
