import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import TreeView from '@/views/TreeView.vue';
import DirectoryView from '@/views/DirectoryView.vue';
import SettingsView from '@/views/SettingsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/inicio' },
    { path: '/inicio', name: 'inicio', component: HomeView },
    { path: '/arbol', name: 'arbol', component: TreeView },
    { path: '/personas', name: 'personas', component: DirectoryView },
    { path: '/configuracion', name: 'configuracion', component: SettingsView },
  ],
});

export default router;
