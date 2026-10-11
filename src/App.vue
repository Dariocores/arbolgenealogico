<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/inicio" class="nav-brand">Árbol Genealógico</router-link>
      <div class="nav-links">
        <router-link to="/inicio" class="nav-link">Inicio</router-link>
        <router-link to="/arbol" class="nav-link">Árbol</router-link>
        <router-link to="/personas" class="nav-link">Personas</router-link>
        <router-link to="/configuracion" class="nav-link">Configuración</router-link>
        <div class="theme-controls">
          <div class="accent-picker">
            <button
              class="theme-toggle"
              title="Temas"
              aria-label="Cambiar tema de color"
              :aria-expanded="accentMenuOpen"
              @click="toggleAccentMenu"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M12 3a9 9 0 0 0 0 18 2 2 0 0 0 2-2 2 2 0 0 1 2-2h1.5A2.5 2.5 0 0 0 20 14.5 9 9 0 0 0 12 3Z"
                />
                <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
                <circle cx="12" cy="7.5" r="1" fill="currentColor" />
                <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
              </svg>
            </button>
            <div v-if="accentMenuOpen" class="accent-menu" role="menu">
              <button
                v-for="option in accents"
                :key="option.id"
                class="accent-option"
                role="menuitem"
                :class="{ active: option.id === accent }"
                @click="selectAccent(option.id)"
              >
                <span
                  class="accent-swatch"
                  :style="{ background: option.color }"
                ></span>
                <span class="accent-name">{{ option.name }}</span>
              </button>
            </div>
          </div>
          <button
            class="theme-toggle"
            :title="isDark ? 'Modo claro' : 'Modo oscuro'"
            :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
            @click="toggleTheme"
          >
            {{ isDark ? '☀' : '☾' }}
          </button>
        </div>
        <template v-if="auth.isConfigured">
          <router-link v-if="!auth.isLoggedIn" to="/ingresar" class="nav-link">
            Ingresar
          </router-link>
          <div v-else class="account">
            <span class="account-email" :title="auth.email ?? ''">
              {{ auth.email }}
            </span>
            <button class="logout-btn" type="button" @click="onLogout">
              Salir
            </button>
          </div>
        </template>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function onLogout(): Promise<void> {
  await auth.signOut();
  await router.push('/ingresar');
}

const THEME_KEY = 'familyTree_v2_theme';
const ACCENT_KEY = 'familyTree_v2_accent';

const accents = [
  { id: 'teal', name: 'Verde azulado', color: '#00897b' },
  { id: 'petrol', name: 'Azul petróleo', color: '#1b4d5c' },
  { id: 'orange', name: 'Naranja', color: '#d97736' },
  { id: 'light', name: 'Claro', color: '#ebf1f5' },
] as const;

type AccentId = (typeof accents)[number]['id'];

const isDark = ref(false);
const accent = ref<AccentId>('teal');
const accentMenuOpen = ref(false);

function applyTheme(): void {
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light';
}

function toggleTheme(): void {
  isDark.value = !isDark.value;
  applyTheme();
  try {
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light');
  } catch {
    /* almacenamiento no disponible */
  }
}

function applyAccent(): void {
  document.documentElement.dataset.accent = accent.value;
}

function toggleAccentMenu(): void {
  accentMenuOpen.value = !accentMenuOpen.value;
}

function selectAccent(id: AccentId): void {
  accent.value = id;
  accentMenuOpen.value = false;
  applyAccent();
  try {
    localStorage.setItem(ACCENT_KEY, id);
  } catch {
    /* almacenamiento no disponible */
  }
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.accent-picker')) accentMenuOpen.value = false;
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') accentMenuOpen.value = false;
}

onMounted(() => {
  let stored: string | null = null;
  try {
    stored =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(THEME_KEY)
        : null;
  } catch {
    stored = null;
  }

  if (stored === 'dark' || stored === 'light') {
    isDark.value = stored === 'dark';
  } else if (typeof window !== 'undefined' && window.matchMedia) {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme();

  let storedAccent: string | null = null;
  try {
    storedAccent =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(ACCENT_KEY)
        : null;
  } catch {
    storedAccent = null;
  }
  if (accents.some((a) => a.id === storedAccent)) {
    accent.value = storedAccent as AccentId;
  }
  applyAccent();

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<style>
@import './style.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary);
  padding: 12px 24px;
  color: var(--on-primary);
}

.nav-brand {
  color: var(--on-primary);
  text-decoration: none;
  font-size: 1.3em;
  font-weight: 700;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-link {
  color: var(--on-primary);
  opacity: 0.85;
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--on-primary-soft);
  color: var(--on-primary);
  opacity: 1;
}

.theme-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.account {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.account-email {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85em;
  color: var(--on-primary);
  opacity: 0.9;
}

.logout-btn {
  border: 1px solid var(--on-primary);
  background: transparent;
  color: var(--on-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font: inherit;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.9;
}

.logout-btn:hover {
  background: var(--on-primary-soft);
  opacity: 1;
}

.accent-picker {
  position: relative;
}

.theme-toggle {
  border: none;
  background: var(--on-primary-soft);
  color: var(--on-primary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.1em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.theme-toggle:hover {
  background: var(--on-primary-soft);
  filter: brightness(0.95);
}

.accent-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  padding: 6px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 100;
}

.accent-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.92em;
  text-align: left;
  cursor: pointer;
}

.accent-option:hover {
  background: rgba(128, 128, 128, 0.18);
}

.accent-option.active {
  background: rgba(128, 128, 128, 0.22);
  font-weight: 700;
}

.accent-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border);
  flex: 0 0 auto;
}

main {
  max-width: 1400px;
  margin: 0 auto;
}

#app {
  max-width: 100%;
  padding: 0;
  text-align: left;
}
</style>
