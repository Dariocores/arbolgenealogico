<template>
  <div class="settings-view" :class="theme">
    <div class="settings-container">
      <h2>Configuración</h2>

      <section class="settings-section">
        <h3>Árboles</h3>
        <div class="tree-list">
          <div v-for="t in store.treeList" :key="t" class="tree-item" :class="{ active: t === store.treeName }">
            <span class="tree-name" @click="switchTree(t)">{{ t }}</span>
            <button v-if="t !== 'default'" class="btn-small" @click="deleteTree(t)">Eliminar</button>
          </div>
        </div>
        <div class="tree-create">
          <input v-model="newTreeName" placeholder="Nombre del nuevo árbol" @keyup.enter="createTree" />
          <button @click="createTree" class="btn btn-primary">Crear Árbol</button>
        </div>
      </section>

      <section class="settings-section">
        <h3>Información del Árbol</h3>
        <div class="info-block">
          <p><strong>Árbol actual:</strong> {{ store.treeName }}</p>
          <p><strong>Total de miembros:</strong> {{ memberCount }}</p>
          <p v-if="rootMember"><strong>Miembro raíz:</strong> {{ rootMember.nombre }}</p>
          <p v-else><strong>Estado:</strong> No hay miembros</p>
          <p><strong>Almacenamiento:</strong> localStorage</p>
        </div>
      </section>

      <section class="settings-section">
        <h3>Exportar / Importar</h3>
        <div class="button-group">
          <button @click="exportJSON" class="btn btn-primary">Exportar JSON</button>
          <button @click="exportGEDCOM" class="btn btn-secondary">Exportar GEDCOM (.ged)</button>
          <button @click="showImportJSON" class="btn btn-secondary">Importar JSON</button>
          <button @click="showImportGEDCOM" class="btn btn-secondary">Importar GEDCOM (.ged)</button>
          <input ref="jsonInput" type="file" accept=".json" @change="importJSON" style="display:none" />
          <input ref="gedcomInput" type="file" accept=".ged" @change="importGEDCOM" style="display:none" />
        </div>
      </section>

      <section class="settings-section">
        <h3>Opción Peligrosa</h3>
        <div class="warning-box">
          <p>Estas acciones no se pueden deshacer</p>
          <button @click="confirmClear" class="btn btn-danger">Limpiar Todo el Árbol</button>
        </div>
      </section>

      <section class="settings-section">
        <h3>Información</h3>
        <div class="info-block">
          <p><strong>Versión:</strong> 2.0.0</p>
          <p><strong>Framework:</strong> Vue.js 3</p>
          <p><strong>Build Tool:</strong> Vite</p>
          <p><strong>Formato:</strong> JSON nativo + GEDCOM 5.5.5</p>
        </div>
      </section>

      <section class="settings-section">
        <h3>Tema</h3>
        <div class="theme-options">
          <label><input v-model="theme" type="radio" value="light" @change="applyTheme" /> Claro</label>
          <label><input v-model="theme" type="radio" value="dark" @change="applyTheme" /> Oscuro</label>
          <label><input v-model="theme" type="radio" value="auto" @change="applyTheme" /> Automático</label>
        </div>
      </section>

      <router-link to="/tree" class="btn btn-primary" style="display:block;text-align:center;margin-top:30px;">
        Volver al Árbol
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFamilyStore } from '../stores/pinia'

const store = useFamilyStore()
const memberCount = computed(() => store.memberCount)
const rootMember = computed(() => store.rootMember)

const jsonInput = ref(null)
const gedcomInput = ref(null)
const theme = ref(localStorage.getItem('theme') || 'light')
const newTreeName = ref('')

function applyTheme() {
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

function switchTree(name) {
  store.switchTree(name)
  localStorage.setItem('familyTree_current', name)
}

function createTree() {
  const name = newTreeName.value.trim()
  if (!name) return
  if (store.createTree(name)) {
    localStorage.setItem('familyTree_current', name)
    newTreeName.value = ''
  } else {
    alert('Ese nombre ya existe')
  }
}

function deleteTree(name) {
  if (confirm(`¿Eliminar el árbol "${name}"?`)) {
    store.deleteTree(name)
    localStorage.setItem('familyTree_current', 'default')
  }
}

function exportJSON() {
  const data = store.tree.toJSON()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `arbol-${store.treeName}-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportGEDCOM() {
  const ged = store.tree.toGEDCOM()
  const blob = new Blob([ged], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `arbol-${store.treeName}-${new Date().toISOString().split('T')[0]}.ged`
  a.click()
  URL.revokeObjectURL(url)
}

function showImportJSON() {
  jsonInput.value?.click()
}

function showImportGEDCOM() {
  gedcomInput.value?.click()
}

function importJSON(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      store.tree.fromJSON(data)
      store.saveToStorage()
      alert('Datos JSON importados correctamente')
    } catch (err) {
      alert('Error al importar JSON: ' + err.message)
    }
  }
  reader.readAsText(file)
}

function importGEDCOM(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      store.tree.fromGEDCOM(e.target.result)
      alert('Datos GEDCOM importados correctamente')
    } catch (err) {
      alert('Error al importar GEDCOM: ' + err.message)
    }
  }
  reader.readAsText(file)
}

function confirmClear() {
  if (confirm('Confirmación: eliminar TODO el árbol genealógico?')) {
    if (confirm('Ultima confirmación: Deseas continuar?')) {
      store.clearTree()
      alert('Árbol limpiado')
    }
  }
}

if (localStorage.getItem('theme')) {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('theme'))
}
</script>

<style scoped>
.settings-view { padding: 20px; }
.settings-container { max-width: 600px; margin: 0 auto; }
.settings-container h2 { font-size: 32px; color: var(--card-text, #222); margin-bottom: 30px; }
.settings-section { background: var(--card, #fff); padding: 20px; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: background 0.3s; }
.settings-section h3 { margin-top: 0; margin-bottom: 15px; color: var(--card-text, #333); }
.info-block { background: var(--bg, #f5f5f5); padding: 15px; border-radius: 6px; transition: background 0.3s; }
.info-block p { margin: 8px 0; color: var(--muted, #666); }
.warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
.warning-box p { margin: 0 0 15px 0; color: #856404; font-weight: 600; }
.button-group { display: flex; gap: 10px; flex-wrap: wrap; }
.btn { padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-primary { background: var(--primary, #00897b); color: white; }
.btn-primary:hover { background: var(--primary-hover, #00695c); transform: translateY(-2px); }
.btn-secondary { background: var(--muted, #6e6e6e); color: white; }
.btn-secondary:hover { background: #555; }
.btn-danger { background: #d32f2f; color: white; width: 100%; }
.btn-danger:hover { background: #b71c1c; transform: translateY(-2px); }
.theme-options { display: flex; gap: 20px; }
.theme-options label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text, #666); }
.theme-options input[type="radio"] { cursor: pointer; }
.tree-list { margin-bottom: 12px; }
.tree-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
.tree-item:hover { background: var(--bg, #f0f0f0); }
.tree-item.active { background: var(--primary, #00897b); color: #fff; }
.tree-item.active .btn-small { color: #fff; border-color: #fff; }
.tree-name { font-weight: 600; }
.btn-small { padding: 2px 8px; font-size: 0.85em; border: 1px solid var(--border, #ccc); border-radius: 4px; background: transparent; cursor: pointer; color: var(--muted, #666); }
.tree-create { display: flex; gap: 8px; }
.tree-create input { flex: 1; padding: 8px 10px; border: 1px solid var(--border, #ccc); border-radius: 6px; font-size: 0.95em; }
</style>
