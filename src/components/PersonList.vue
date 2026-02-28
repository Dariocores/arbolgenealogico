<template>
  <div>
    <h3 id="personas-heading">Personas</h3>
    <label for="search-input" class="sr-only">Buscar miembro</label>
    <input id="search-input" v-model="search" placeholder="Buscar miembro..." style="margin-bottom:10px;width:100%" aria-label="Buscar miembro" />
    <label for="sort-select" class="sr-only">Ordenar por</label>
    <select id="sort-select" v-model="sortKey" style="margin-bottom:10px" aria-label="Ordenar por">
      <option value="name">Nombre</option>
      <option value="gender">Género</option>
    </select>
    <ul role="list" aria-labelledby="personas-heading">
      <li v-for="p of sortedPeople" :key="p.name" tabindex="0" style="outline:none;display:flex;align-items:center;gap:8px">
        <img v-if="getAvatar(p.name)" :src="getAvatar(p.name)" alt="Avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />
        <span>{{ p.name }} <small>({{ p.gender }})</small></span>
        <button @click="openEditModal(p)" aria-label="Editar {{p.name}}">Editar</button>
        <button @click="deleteMember(p)" aria-label="Eliminar {{p.name}}">Eliminar</button>
      </li>
    </ul>
    <div v-if="saveFeedback" class="save-feedback">
      {{ saveFeedback }}
      <button v-if="window.lastDeleteSnapshot" @click="undoDelete">Deshacer</button>
    </div>
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true" aria-label="Editar miembro">
      <div class="modal">
        <h4>Editar miembro</h4>
        <FamilyForm :member="editingMember" @close="closeModal" />
        <button @click="closeModal" style="margin-top:10px">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
function getAvatar(name) {
  return window.localStorage.getItem('avatar_' + name) || ''
}
import { ref, onMounted, computed } from 'vue'
import FamilyForm from './FamilyForm.vue'

const people = ref([])
const search = ref('')
const sortKey = ref('name')
const showModal = ref(false)
const editingMember = ref(null)
const saveFeedback = ref('')

function refresh() {
  const tree = window.__FAMILY_TREE__
  people.value = tree ? Object.values(tree.members || {}) : []
}

const filteredPeople = computed(() => {
  if (!search.value) return people.value
  return people.value.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
})

const sortedPeople = computed(() => {
  const arr = [...filteredPeople.value]
  if (sortKey.value === 'name') {
    arr.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortKey.value === 'gender') {
    arr.sort((a, b) => a.gender.localeCompare(b.gender))
  }
  return arr
})

function openEditModal(member) {
  editingMember.value = { ...member }
  showModal.value = true
}
function closeModal() {
  showModal.value = false
  editingMember.value = null
}

function deleteMember(member) {
  if (confirm(`¿Eliminar a ${member.name}?`)) {
    const tree = window.__FAMILY_TREE__
    if (tree && tree.removeMember) {
      // Guardar snapshot antes de borrar
      window.lastDeleteSnapshot = JSON.stringify(tree.toJSON())
      tree.removeMember(member.name)
      refresh()
      saveFeedback.value = 'Miembro eliminado. '
      setTimeout(() => { saveFeedback.value = '' }, 2000)
    }
  }
}

function undoDelete() {
  if (window.lastDeleteSnapshot && window.__FAMILY_TREE__) {
    window.__FAMILY_TREE__.fromJSON(JSON.parse(window.lastDeleteSnapshot))
    saveFeedback.value = '¡Eliminación deshecha!'
    setTimeout(() => { saveFeedback.value = '' }, 1500)
    window.lastDeleteSnapshot = null
    refresh()
  }
}

onMounted(() => {
  refresh()
  setInterval(refresh, 500)
})
</script>

<style scoped>
ul { list-style: none; padding:0 }
li { padding:4px 0 }
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 24px 20px;
  border-radius: 10px;
  min-width: 320px;
  box-shadow: 0 2px 16px #0002;
 }
@media (max-width: 600px) {
  .modal {
    min-width: 90vw;
    padding: 12px 4px;
  }
  input, select {
    font-size: 1.1em;
    width: 100%;
  }
  ul[role="list"] li {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}
+.save-feedback {
+  margin-top: 10px;
+  background: #e0ffe0;
+  border: 1px solid #0c0;
+  color: #080;
+  padding: 8px 12px;
+  border-radius: 6px;
+  display: flex;
+  align-items: center;
+  gap: 10px;
+}
</style>
