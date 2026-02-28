<template>
  <form @submit.prevent="add" aria-label="Formulario de miembro" style="width:100%">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <label for="input-nombre" class="sr-only">Nombre</label>
      <input id="input-nombre" v-model="name" placeholder="Nombre" :class="{ error: errorMsg }" @input="validateName" aria-required="true" aria-label="Nombre" />
      <label for="select-genero" class="sr-only">Género</label>
      <select id="select-genero" v-model="gender" aria-label="Género">
        <option value="male">Masculino</option>
        <option value="female">Femenino</option>
        <option value="other">Otro</option>
      </select>
      <label for="input-avatar" class="sr-only">Avatar</label>
      <input id="input-avatar" type="url" v-model="avatar" placeholder="URL Avatar (opcional)" aria-label="Avatar" style="max-width:140px" />
      <button type="submit" :disabled="!!errorMsg">{{ editing ? 'Actualizar' : 'Añadir' }}</button>
    </div>
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FamilyTree from '@/utils/familyLogic'


const name = ref('')
const gender = ref('other')
const avatar = ref('')
const editing = ref(false)
const originalName = ref('')
const errorMsg = ref('')
const successMsg = ref('')

function validateName() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!name.value.trim()) {
    errorMsg.value = 'El nombre es obligatorio.'
    return
  }
  if (!window.__FAMILY_TREE__) return
  const exists = window.__FAMILY_TREE__.members && window.__FAMILY_TREE__.members[name.value.trim()]
  if (exists && (!editing.value || originalName.value !== name.value.trim())) {
    errorMsg.value = 'Ya existe un miembro con ese nombre.'
  }
}

function add() {
  errorMsg.value = ''
  successMsg.value = ''
  validateName()
  if (errorMsg.value) return
  if (!window.__FAMILY_TREE__) window.__FAMILY_TREE__ = new FamilyTree()
  try {
    if (editing.value) {
      if (originalName.value && originalName.value !== name.value.trim()) {
        window.__FAMILY_TREE__.removeMember(originalName.value)
      }
      window.__FAMILY_TREE__.addMember(name.value.trim(), gender.value)
      // Guardar avatar en localStorage
      if (avatar.value) {
        window.localStorage.setItem('avatar_' + name.value.trim(), avatar.value)
      }
      editing.value = false
      originalName.value = ''
      successMsg.value = 'Miembro actualizado correctamente.'
    } else {
      window.__FAMILY_TREE__.addMember(name.value.trim(), gender.value)
      if (avatar.value) {
        window.localStorage.setItem('avatar_' + name.value.trim(), avatar.value)
      }
      successMsg.value = 'Miembro añadido correctamente.'
    }
    name.value = ''
    gender.value = 'other'
    avatar.value = ''
    setTimeout(() => { successMsg.value = '' }, 1500)
  } catch (e) {
    errorMsg.value = e.message || 'Error desconocido.'
    console.error(e)
  }
}

function startEdit(member) {
  name.value = member.name
  gender.value = member.gender || 'other'
  avatar.value = window.localStorage.getItem('avatar_' + member.name) || ''
  editing.value = true
  originalName.value = member.name
}

onMounted(() => {
  window.addEventListener('edit-member', (e) => {
    if (e.detail) startEdit(e.detail)
  })
})
</script>

      if (editing.value) {
        // Si el nombre cambió, eliminar el anterior y crear el nuevo
        if (originalName.value && originalName.value !== name.value.trim()) {
          window.__FAMILY_TREE__.removeMember(originalName.value)
        }
        window.__FAMILY_TREE__.addMember(name.value.trim(), gender.value)
        editing.value = false
        originalName.value = ''
      } else {
        window.__FAMILY_TREE__.addMember(name.value.trim(), gender.value)
      }
<style scoped>
input { padding:6px; }
select { padding:6px }
button { padding:6px 10px }
.error { border: 1px solid #e00; background: #fee; }
.error-msg { color: #e00; margin-top: 4px; font-size: 0.95em; }
.success-msg { color: #080; margin-top: 4px; font-size: 0.95em; }
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
</style>


  function startEdit(member) {
    name.value = member.name
    gender.value = member.gender || 'other'
    editing.value = true
    originalName.value = member.name
  }

  onMounted(() => {
    window.addEventListener('edit-member', (e) => {
      if (e.detail) startEdit(e.detail)
    })
  })
