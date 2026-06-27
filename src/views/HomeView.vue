<template>
  <div class="home-view">
    <section class="hero">
      <h2>Bienvenido al Árbol Genealógico</h2>
      <p>Crea y visualiza tu árbol genealógico interactivo</p>
      <div class="hero-actions">
        <router-link to="/tree" class="btn btn-primary btn-large">
          🌳 Ver Mi Árbol
        </router-link>
        <router-link to="/settings" class="btn btn-secondary">
          ⚙️ Configuración
        </router-link>
      </div>
    </section>

    <section class="info-grid">
      <div class="info-card">
        <h3>📊 Estadísticas</h3>
        <ul class="stats">
          <li><strong>Miembros:</strong> {{ memberCount }}</li>
          <li v-if="rootMember"><strong>Raíz:</strong> {{ rootMember.nombre }}</li>
          <li v-else><strong>Estado:</strong> Vacío</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>✨ Características</h3>
        <ul>
          <li>✓ Agregar miembros familiares</li>
          <li>✓ Definir relaciones complejas</li>
          <li>✓ Visualizar árbol interactivo</li>
          <li>✓ Guardar automáticamente</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>🎯 Tipos de Relación</h3>
        <ul>
          <li>👨‍👩‍👧‍👦 Padres e Hijos</li>
          <li>👶 Abuelos y Bisabuelos</li>
          <li>🤝 Hermanos</li>
          <li>💑 Parejas</li>
        </ul>
      </div>
    </section>

    <section class="quick-start">
      <h3>🚀 Inicio Rápido</h3>
      <ol>
        <li>Ve a la sección "Árbol Genealógico"</li>
        <li>Agrega tu primer miembro</li>
        <li>Conecta relaciones con otros miembros</li>
        <li>¡Visualiza tu árbol genealógico!</li>
      </ol>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFamilyStore } from '../stores/pinia';

const store = useFamilyStore();
const memberCount = computed(() => store.memberCount);
const rootMember = computed(() => store.rootMember);
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, rgba(0, 137, 123, 0.12), rgba(0, 0, 0, 0.05));
  border-radius: 15px;
  margin-bottom: 40px;
}

.hero h2 {
  font-size: 44px;
  margin-bottom: 15px;
  color: var(--text, #222);
}

.hero p {
  font-size: 18px;
  color: var(--muted, #666);
  margin-bottom: 30px;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.info-card {
  background: var(--card, #fff);
  border-left: 4px solid var(--primary, #2e7d32);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s;
}

.info-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--card-text, #222);
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  padding: 8px 0;
  color: var(--muted, #666);
}

.stats li {
  padding: 10px 0;
  border-bottom: 1px solid var(--border, #eee);
}

.stats li:last-child {
  border-bottom: none;
}

.quick-start {
  background: var(--bg, #f5f5f5);
  padding: 30px;
  border-radius: 10px;
  transition: background 0.3s;
}

.quick-start h3 {
  margin-top: 0;
  color: var(--card-text, #222);
}

.quick-start ol {
  margin: 0;
  padding-left: 25px;
}

.quick-start li {
  padding: 8px 0;
  color: var(--muted, #666);
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary, #2e7d32);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover, #1b5e20);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--muted, #6e6e6e);
  color: white;
}

.btn-secondary:hover {
  background: #555;
}

.btn-large {
  padding: 15px 32px;
  font-size: 16px;
}
</style>
