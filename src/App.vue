<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/" class="nav-brand">Árbol Genealógico</router-link>
      <div class="nav-links">
        <router-link to="/" class="nav-link">Inicio</router-link>
        <router-link to="/tree" class="nav-link">Árbol</router-link>
        <router-link to="/settings" class="nav-link">Configuración</router-link>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
@import './style.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  background: var(--bg, #c2c2c2);
  color: var(--text, #2a2a2a);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary, #2e7d32);
  padding: 12px 24px;
  color: white;
}

.nav-brand {
  color: white;
  text-decoration: none;
  font-size: 1.3em;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 16px;
}

.nav-link {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255,255,255,0.2);
  color: white;
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
