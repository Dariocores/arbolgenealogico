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
      <li v-for="p of sortedPeople" :key="p.nombre" tabindex="0" style="outline:none;display:flex;align-items:center;gap:8px">
        <img v-if="p.photo" :src="p.photo" alt="Avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />
        <span>{{ p.nombre }} <small>({{ p.genero }})</small></span>
        <button @click="openEditModal(p)" aria-label="Editar {{p.nombre}}">Editar</button>
        <button @click="showRelations(p)" aria-label="Relaciones {{p.nombre}}">Relaciones</button>
        <button @click="deleteMember(p)" aria-label="Eliminar {{p.nombre}}">Eliminar</button>
      </li>
    </ul>

    <div v-if="showRelationModal" class="modal-overlay" @click.self="closeRelationModal" role="dialog" aria-modal="true" aria-label="Relaciones">
      <div class="modal">
        <h4>Relaciones de {{ relationTarget?.nombre }}</h4>
        <div class="rel-group" v-if="relationTarget?.padres?.length">
          <strong>Hijo de:</strong>
          <span v-for="p in relationTarget.padres" :key="'pr-'+p" class="rel-tag">
            {{ p }} ({{ relationTarget.tipoPadre?.[p] || 'biológico' }})
            <button class="btn-unlink" @click="removeRel(relationTarget.nombre, p, 'padre')">x</button>
          </span>
        </div>
        <div class="rel-group" v-if="relationTarget?.hijos?.length">
          <strong>Padre de:</strong>
          <span v-for="h in relationTarget.hijos" :key="'ph-'+h" class="rel-tag">
            {{ h }}
            <button class="btn-unlink" @click="removeRel(relationTarget.nombre, h, 'hijo')">x</button>
          </span>
        </div>
        <div class="rel-group" v-if="relationTarget?.esposos?.length">
          <strong>Parejas:</strong>
          <span v-for="e in relationTarget.esposos" :key="'pe-'+e" class="rel-tag">
            {{ e }} ({{ relationTarget.estadoMatrimonio?.[e] || 'casado' }})
            <button class="btn-unlink" @click="removeRel(relationTarget.nombre, e, 'esposo')">x</button>
          </span>
        </div>
        <div class="rel-group" v-if="relationTarget?.hermanos?.length">
          <strong>Hermanos:</strong>
          <span v-for="h in relationTarget.hermanos" :key="'phh-'+h" class="rel-tag">
            {{ h }}
            <button class="btn-unlink" @click="removeRel(relationTarget.nombre, h, 'hermano')">x</button>
          </span>
        </div>
        <button @click="closeRelationModal" style="margin-top:10px">Cerrar</button>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true" aria-label="Editar miembro">
      <div class="modal">
        <h4>Editar miembro</h4>
        <FamilyForm :member="editingMember" @close="closeModal" @saved="closeModal" />
        <button @click="closeModal" style="margin-top:10px">Cerrar</button>
      </div>
    </div>

    <div v-if="saveFeedback" class="save-feedback">
      {{ saveFeedback }}
      <button v-if="window.lastDeleteSnapshot" @click="undoDelete">Deshacer</button>
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
const showRelationModal = ref(false)
const relationTarget = ref(null)

function refresh() {
  const tree = window.__FAMILY_TREE__
  people.value = tree ? Object.values(tree.members || {}) : []
}

const filteredPeople = computed(() => {
  if (!search.value) return people.value
  return people.value.filter(p => p.nombre.toLowerCase().includes(search.value.toLowerCase()))
})

const sortedPeople = computed(() => {
  const arr = [...filteredPeople.value]
  if (sortKey.value === 'name') {
    arr.sort((a, b) => a.nombre.localeCompare(b.nombre))
  } else if (sortKey.value === 'gender') {
    arr.sort((a, b) => a.genero.localeCompare(b.genero))
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

function showRelations(member) {
  relationTarget.value = member
  showRelationModal.value = true
}

function closeRelationModal() {
  showRelationModal.value = false
  relationTarget.value = null
}

function removeRel(persona, relacionada, tipo) {
  if (!confirm(`¿Desvincular "${persona}" de "${relacionada}"?`)) return
  const tree = window.__FAMILY_TREE__
  if (!tree) return
  try {
    tree.removeRelation(persona, relacionada, tipo)
    tree.saveToStorage()
    refresh()
    if (relationTarget.value) {
      relationTarget.value = tree.getMember(relationTarget.value.nombre)
    }
    saveFeedback.value = 'Relación eliminada.'
    setTimeout(() => { saveFeedback.value = '' }, 2000)
  } catch (e) {
    saveFeedback.value = 'Error: ' + e.message
    setTimeout(() => { saveFeedback.value = '' }, 3000)
  }
}

function deleteMember(member) {
  if (confirm(`¿Eliminar a ${member.nombre}?`)) {
    const tree = window.__FAMILY_TREE__
    if (tree && tree.removeMember) {
      window.lastDeleteSnapshot = JSON.stringify(tree.toJSON())
      tree.removeMember(member.nombre)
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
li { padding:4px 0; color: var(--text, #333); }
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
  background: var(--card, #fff);
  padding: 24px 20px;
  border-radius: 10px;
  min-width: 320px;
  max-width: 500px;
  box-shadow: 0 2px 16px #0002;
  transition: background 0.3s;
}
.rel-group {
  margin: 10px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.rel-tag {
  background: var(--bg, #f0f0f0);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  color: var(--muted, #555);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.btn-unlink {
  background: none;
  border: none;
  color: #c62828;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9em;
  padding: 0 2px;
  line-height: 1;
}
.btn-unlink:hover { color: #b71c1c; }
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
.save-feedback {
  margin-top: 10px;
  background: #e0ffe0;
  border: 1px solid #0c0;
  color: #080;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
