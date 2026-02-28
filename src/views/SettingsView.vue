<template>
  <div class="settings-view">
    <div class="settings-container">
      <h2>⚙️ Configuración</h2>

      <section class="settings-section">
        <h3>📊 Información del Árbol</h3>
        <div class="info-block">
          <p><strong>Total de miembros:</strong> {{ memberCount }}</p>
          <p v-if="rootMember"><strong>Miembro raíz:</strong> {{ rootMember.nombre }}</p>
          <p v-else><strong>Estado:</strong> No hay miembros</p>
          <p><strong>Almacenamiento:</strong> localStorage</p>
        </div>
      </section>

      <section class="settings-section">
        <h3>💾 Datos</h3>
        <div class="button-group">
          <button @click="exportData" class="btn btn-primary">
            📥 Descargar Datos (JSON)
          </button>
          <button @click="showImport" class="btn btn-secondary">
            📤 Cargar Desde Archivo
          </button>
          <input
            v-if="showImportInput"
            ref="fileInput"
            type="file"
            accept=".json"
            @change="importData"
            style="display: none"
          />
        </div>
      </section>

      <section class="settings-section">
        <h3>🗑️ Opciones Peligrosas</h3>
        <div class="warning-box">
          <p>⚠️ Estas acciones no se pueden deshacer</p>
          <button @click="confirmClear" class="btn btn-danger">
            🗑️ Limpiar Todo el Árbol
          </button>
        </div>
      </section>

      <section class="settings-section">
        <h3>ℹ️ Información</h3>
        <div class="info-block">
          <p><strong>Versión:</strong> 2.0.0</p>
          <p><strong>Framework:</strong> Vue.js 3</p>
          <p><strong>Build Tool:</strong> Vite</p>
          <p><strong>Visualización:</strong> D3.js</p>
          <p><strong>State Management:</strong> Pinia</p>
        </div>
      </section>

      <section class="settings-section">
        <h3>🎨 Tema</h3>
        <div class="theme-options">
          <label>
            <input v-model="theme" type="radio" value="light" />
            Claro
          </label>
          <label>
            <input v-model="theme" type="radio" value="dark" />
            Oscuro
          </label>
          <label>
            <input v-model="theme" type="radio" value="auto" />
            Automático
          </label>
        </div>
      </section>

      <router-link to="/tree" class="btn btn-primary" style="display: block; text-align: center; margin-top: 30px;">
        ← Volver al Árbol
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFamilyStore } from '../stores/pinia';

const store = useFamilyStore();
const memberCount = computed(() => store.memberCount);
const rootMember = computed(() => store.rootMember);

const showImportInput = ref(false);
const fileInput = ref(null);
const theme = ref(localStorage.getItem('theme') || 'light');

const exportData = () => {
  const data = store.tree.toJSON();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arbol-genealogico-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const showImport = () => {
  showImportInput.value = true;
  setTimeout(() => fileInput.value?.click(), 0);
};

const importData = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      store.tree.fromJSON(data);
      store.saveToStorage();
      alert('✅ Datos importados correctamente');
    } catch (err) {
      alert(`❌ Error al importar: ${err.message}`);
    }
    showImportInput.value = false;
  };
  reader.readAsText(file);
};

const confirmClear = () => {
  if (confirm('¿Estás seguro de que quieres eliminar TODO el árbol genealógico? Esta acción no se puede deshacer.')) {
    if (confirm('⚠️ Última confirmación: ¿Deseas continuar?')) {
      store.clearTree();
      alert('✅ Árbol limpiado');
    }
  }
};
</script>

<style scoped>
.settings-view {
  padding: 20px;
}

.settings-container {
  max-width: 600px;
  margin: 0 auto;
}

.settings-container h2 {
  font-size: 32px;
  color: #222;
  margin-bottom: 30px;
}

.settings-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.info-block {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
}

.info-block p {
  margin: 8px 0;
  color: #666;
}

.warning-box {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.warning-box p {
  margin: 0 0 15px 0;
  color: #856404;
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #e91e63;
  color: white;
}

.btn-primary:hover {
  background: #c2185b;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #999;
  color: white;
}

.btn-secondary:hover {
  background: #777;
}

.btn-danger {
  background: #d32f2f;
  color: white;
  width: 100%;
}

.btn-danger:hover {
  background: #b71c1c;
  transform: translateY(-2px);
}

.theme-options {
  display: flex;
  gap: 20px;
}

.theme-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
}

.theme-options input[type="radio"] {
  cursor: pointer;
}
</style>
