import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import TreeView from '@/views/TreeView.vue';
import DirectoryView from '@/views/DirectoryView.vue';
import SettingsView from '@/views/SettingsView.vue';
import AuthView from '@/views/AuthView.vue';
import LicenseView from '@/views/LicenseView.vue';
import { useAuthStore } from '@/stores/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/inicio' },
    { path: '/ingresar', name: 'ingresar', component: AuthView },
    {
      path: '/licencia',
      name: 'licencia',
      component: LicenseView,
      meta: { requiresAuth: true },
    },
    {
      path: '/inicio',
      name: 'inicio',
      component: HomeView,
      meta: { requiresAuth: true, requiresLicense: true },
    },
    {
      path: '/arbol',
      name: 'arbol',
      component: TreeView,
      meta: { requiresAuth: true, requiresLicense: true },
    },
    {
      path: '/personas',
      name: 'personas',
      component: DirectoryView,
      meta: { requiresAuth: true, requiresLicense: true },
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: SettingsView,
      meta: { requiresAuth: true, requiresLicense: true },
    },
  ],
});

router.beforeEach(async (to) => {
  // Sin claves de Supabase, la app corre en modo local (sin login).
  if (!isSupabaseConfigured) return true;

  const auth = useAuthStore();
  await auth.ensureInit();

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'ingresar', query: { redirect: to.fullPath } };
  }

  if (auth.isLoggedIn && !auth.hasActiveLicense && to.name !== 'licencia') {
    return { name: 'licencia' };
  }

  if (auth.isLoggedIn && auth.hasActiveLicense && to.name === 'ingresar') {
    return { name: 'inicio' };
  }

  if (auth.isLoggedIn && auth.hasActiveLicense && to.name === 'licencia') {
    return { name: 'inicio' };
  }

  return true;
});

export default router;
