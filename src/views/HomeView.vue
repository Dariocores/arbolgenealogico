<template>
  <div class="home-view">
    <section class="hero">
      <h2>Bienvenido al Árbol Genealógico</h2>
      <p class="hero-sub">Crea y visualiza tu árbol genealógico interactivo</p>
      <div class="hero-actions">
        <router-link to="/arbol" class="btn btn-primary">Ver Mi Árbol</router-link>
        <router-link to="/configuracion" class="btn btn-secondary">
          Configuración
        </router-link>
      </div>
    </section>

    <section class="info-grid">
      <div class="info-card">
        <h3>Estadísticas</h3>
        <ul>
          <li><strong>Miembros:</strong> {{ store.totalMembers }}</li>
          <li><strong>Árbol:</strong> {{ store.treeName }}</li>
          <li><strong>Raíz:</strong> {{ rootName }}</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>Características</h3>
        <ul>
          <li>✓ Agregar miembros familiares</li>
          <li>✓ Definir relaciones</li>
          <li>✓ Visualizar árbol (D3.js)</li>
          <li>✓ Arquitectura lista para GEDCOM</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>Modelo de datos</h3>
        <ul>
          <li>• IDs únicos por persona</li>
          <li>✓ Relaciones normalizadas</li>
          <li>✓ Tipado con TypeScript</li>
          <li>✓ Store basado en Pinia</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFamilyTreeStore } from '@/stores/familyTree';

const store = useFamilyTreeStore();

const rootName = computed(() => {
  const person = store.persons[store.rootPersonId];
  return person ? `${person.firstName} ${person.lastName}`.trim() : '—';
});
</script>

<style scoped>
.home-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;
}

.hero {
  text-align: center;
  padding: 56px 24px;
  background: linear-gradient(135deg, rgba(0, 137, 123, 0.12), rgba(0, 0, 0, 0.04));
  border-radius: 16px;
  margin-bottom: 32px;
}

.hero h2 {
  font-size: 1.9em;
  margin-bottom: 10px;
}

.hero p {
  color: var(--muted);
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.info-card {
  padding: 20px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.info-card h3 {
  margin-bottom: 12px;
}

.info-card ul {
  list-style: none;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.9;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary, #00897b);
  color: var(--on-primary, #fff);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}
</style>
