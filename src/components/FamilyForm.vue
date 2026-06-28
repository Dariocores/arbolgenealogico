<template>
  <div class="family-form">
    <div class="tabs">
      <button :class="['tab', { active: tab === 'persona' }]" @click="tab = 'persona'">
        1. Agregar Persona
      </button>
      <button :class="['tab', { active: tab === 'relacion' }]" @click="tab = 'relacion'">
        2. Conectar Familiares
      </button>
    </div>

    <form v-show="tab === 'persona'" @submit.prevent="addPersona" class="section">
      <p class="section-desc">Completa los datos y presiona <strong>Guardar Persona</strong>.</p>

      <div class="field-row">
        <div class="field">
          <label for="input-nombre">Nombre completo *</label>
          <input id="input-nombre" v-model="name" placeholder="Ej: Juan Pérez" :class="{ error: errorMsg }" @input="clearMessages" />
        </div>
        <div class="field">
          <label for="select-genero">Género</label>
          <select id="select-genero" v-model="gender">
            <option value="hombre">Masculino</option>
            <option value="mujer">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="input-nacimiento">Fecha de nacimiento</label>
          <input id="input-nacimiento" v-model="birthDate" type="date" />
        </div>
        <div class="field">
          <label for="input-muerte">Fecha de muerte</label>
          <input id="input-muerte" v-model="deathDate" type="date" />
        </div>
        <div class="field">
          <label for="input-lugar">Lugar de nacimiento</label>
          <input id="input-lugar" v-model="birthPlace" placeholder="Ej: Buenos Aires" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="input-ocupacion">Ocupación</label>
          <input id="input-ocupacion" v-model="ocupacion" placeholder="Ej: Ingeniero" />
        </div>
        <div class="field">
          <label for="input-religion">Religión</label>
          <input id="input-religion" v-model="religion" placeholder="Ej: Católica" />
        </div>
      </div>

      <div class="field">
        <label for="input-foto">Foto</label>
        <div class="photo-upload">
          <input id="input-foto" type="file" accept="image/*" @change="onPhotoChange" />
          <img v-if="photoPreview" :src="photoPreview" class="photo-preview" alt="Vista previa" />
          <button v-if="photoPreview" type="button" class="btn-small" @click="removePhoto">Quitar foto</button>
        </div>
      </div>

      <div class="field">
        <label for="input-notas">Notas / Biografía</label>
        <textarea id="input-notas" v-model="notas" placeholder="Información adicional..." rows="3"></textarea>
      </div>

      <button type="submit" class="btn-primary" :disabled="!!errorMsg">
        {{ editing ? 'Actualizar Persona' : 'Guardar Persona' }}
      </button>
      <button v-if="editing" type="button" class="btn-cancel" @click="cancelEdit">Cancelar</button>

      <div v-if="successMsg" class="msg success">{{ successMsg }}</div>
      <div v-if="errorMsg" class="msg error">{{ errorMsg }}</div>
    </form>

    <div v-show="tab === 'relacion'" class="section">
      <p class="section-desc">
        Seleccioná dos personas ya registradas y elegí qué parentesco las une.
      </p>

      <div class="relacion-grid">
        <div class="field">
          <label for="select-persona-a">Persona A</label>
          <select id="select-persona-a" v-model="relPersonaA">
            <option value="">-- Seleccionar --</option>
            <option v-for="m in allMembers" :key="'a-'+m.nombre" :value="m.nombre">{{ m.nombre }}</option>
          </select>
        </div>

        <div class="field">
          <label for="select-parentesco">Es ... de Persona B</label>
          <select id="select-parentesco" v-model="relTipo">
            <option value="">-- Seleccionar --</option>
            <option value="padre">Padre / Madre</option>
            <option value="hijo">Hijo / Hija</option>
            <option value="hermano">Hermano / Hermana</option>
            <option value="esposo">Esposo / Esposa (pareja)</option>
            <option value="abuelo">Abuelo / Abuela</option>
          </select>
        </div>

        <div class="field">
          <label for="select-persona-b">Persona B</label>
          <select id="select-persona-b" v-model="relPersonaB">
            <option value="">-- Seleccionar --</option>
            <option v-for="m in allMembers" :key="'b-'+m.nombre" :value="m.nombre">{{ m.nombre }}</option>
          </select>
        </div>
      </div>

      <div v-if="relTipo === 'padre' || relTipo === 'hijo'" class="field" style="margin-bottom:12px">
        <label for="select-parent-type">Tipo de parentesco</label>
        <select id="select-parent-type" v-model="relParentType">
          <option value="biologico">Biológico</option>
          <option value="adoptivo">Adoptivo</option>
          <option value="padrastro">Padrastro / Madrastra</option>
        </select>
      </div>

      <div v-if="relTipo === 'esposo'" class="field" style="margin-bottom:12px">
        <label for="select-marriage-status">Estado civil</label>
        <select id="select-marriage-status" v-model="relMarriageStatus">
          <option value="casado">Casado</option>
          <option value="separado">Separado</option>
          <option value="divorciado">Divorciado</option>
          <option value="viudo">Viudo</option>
        </select>
      </div>

      <button type="button" class="btn-primary" :disabled="!relPersonaA || !relPersonaB || !relTipo" @click="addRelacion">
        Conectar Familiares
      </button>

      <div v-if="relSuccessMsg" class="msg success">{{ relSuccessMsg }}</div>
      <div v-if="relErrorMsg" class="msg error">{{ relErrorMsg }}</div>

      <hr />

      <h4>Relaciones existentes</h4>
      <p v-if="allMembers.length === 0" class="msg info">Aún no hay personas registradas.</p>
      <div v-for="m in allMembers" :key="'rel-'+m.nombre" class="relacion-list-item">
        <strong>{{ m.nombre }}</strong>
        <span v-if="m.padres.length" class="rel-tag" v-for="p in m.padres" :key="'pad-'+m.nombre+'-'+p">
          Hijo de {{ p }}
          <button class="btn-unlink" @click="removeRel(m.nombre, p, 'padre')" title="Desvincular">x</button>
        </span>
        <span v-if="m.hijos.length" class="rel-tag" v-for="h in m.hijos" :key="'hij-'+m.nombre+'-'+h">
          Padre de {{ h }}
          <button class="btn-unlink" @click="removeRel(m.nombre, h, 'hijo')" title="Desvincular">x</button>
        </span>
        <span v-if="m.hermanos.length" class="rel-tag" v-for="h in m.hermanos.slice(0,5)" :key="'her-'+m.nombre+'-'+h">
          Hermano de {{ h }}
          <button class="btn-unlink" @click="removeRel(m.nombre, h, 'hermano')" title="Desvincular">x</button>
        </span>
        <span v-if="m.hermanos.length > 5" class="rel-tag">+{{ m.hermanos.length - 5 }} más</span>
        <span v-if="m.esposos.length" class="rel-tag" v-for="e in m.esposos" :key="'esp-'+m.nombre+'-'+e">
          {{ getMarriageLabel(m, e) }}
          <button class="btn-unlink" @click="removeRel(m.nombre, e, 'esposo')" title="Desvincular">x</button>
        </span>
        <span v-if="m.abuelos.length" class="rel-tag">Nieto de: {{ m.abuelos.join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FamilyTree from '@/utils/familyLogic'

const props = defineProps({
  member: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const tab = ref('persona')

const name = ref('')
const gender = ref('otro')
const photo = ref('')
const photoPreview = ref('')
const birthDate = ref('')
const deathDate = ref('')
const birthPlace = ref('')
const ocupacion = ref('')
const religion = ref('')
const notas = ref('')
const editing = ref(false)
const originalName = ref('')

const relPersonaA = ref('')
const relPersonaB = ref('')
const relTipo = ref('')
const relParentType = ref('biologico')
const relMarriageStatus = ref('casado')

const errorMsg = ref('')
const successMsg = ref('')
const relErrorMsg = ref('')
const relSuccessMsg = ref('')

const allMembers = computed(() => {
  return window.__FAMILY_TREE__ ? Object.values(window.__FAMILY_TREE__.members) : []
})

function clearMessages() {
  errorMsg.value = ''
  successMsg.value = ''
}

function onPhotoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    photoPreview.value = ev.target.result
    photo.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

function removePhoto() {
  photo.value = ''
  photoPreview.value = ''
}

function addPersona() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!name.value.trim()) {
    errorMsg.value = 'El nombre es obligatorio.'
    return
  }
  if (!window.__FAMILY_TREE__) window.__FAMILY_TREE__ = new FamilyTree()
  const tree = window.__FAMILY_TREE__
  try {
    const data = {
      birthDate: birthDate.value,
      deathDate: deathDate.value,
      birthPlace: birthPlace.value,
      photo: photo.value,
      ocupacion: ocupacion.value,
      religion: religion.value,
      notas: notas.value
    }
    if (editing.value) {
      if (originalName.value && originalName.value !== name.value.trim()) {
        tree.removeMember(originalName.value)
      }
      tree.addMember(name.value.trim(), gender.value, data)
      tree.saveToStorage()
      editing.value = false
      originalName.value = ''
      successMsg.value = `"${name.value}" actualizado correctamente.`
      emit('saved')
    } else {
      if (tree.members[name.value.trim()]) {
        errorMsg.value = `Ya existe "${name.value}". Usá "Conectar Familiares" para relacionarlo.`
        return
      }
      tree.addMember(name.value.trim(), gender.value, data)
      tree.saveToStorage()
      successMsg.value = `"${name.value}" guardado. Ahora relacionalo en la pestaña "Conectar Familiares".`
    }
    resetForm()
  } catch (e) {
    errorMsg.value = e.message || 'Error desconocido.'
    console.error(e)
  }
}

function getMarriageLabel(m, esposo) {
  const estado = m.estadoMatrimonio?.[esposo] || 'casado'
  const labels = { casado: 'Pareja de', divorciado: 'Ex-pareja de', separado: 'Separado de', viudo: 'Viudo de' }
  return `${labels[estado] || 'Pareja de'} ${esposo}`
}

function addRelacion() {
  relErrorMsg.value = ''
  relSuccessMsg.value = ''
  if (!relPersonaA.value || !relPersonaB.value || !relTipo.value) return
  if (relPersonaA.value === relPersonaB.value) {
    relErrorMsg.value = 'No podés conectar a una persona consigo misma.'
    return
  }
  const tree = window.__FAMILY_TREE__
  if (!tree) return
  try {
    const parentType = relTipo.value === 'padre' || relTipo.value === 'hijo' ? relParentType.value : undefined
    tree.addRelation(relPersonaA.value, relPersonaB.value, relTipo.value, parentType)

    if (relTipo.value === 'esposo' && relMarriageStatus.value !== 'casado') {
      tree.setMarriageStatus(relPersonaA.value, relPersonaB.value, relMarriageStatus.value)
    }

    tree.saveToStorage()
    const tipoLabel = {
      padre: 'padre/madre de',
      hijo: 'hijo/hija de',
      hermano: 'hermano/hermana de',
      esposo: 'pareja de',
      abuelo: 'abuelo/abuela de'
    }
    relSuccessMsg.value = `"${relPersonaA.value}" es ${tipoLabel[relTipo.value] || relTipo.value} "${relPersonaB.value}".`
    relPersonaA.value = ''
    relPersonaB.value = ''
    relTipo.value = ''
    relParentType.value = 'biologico'
    relMarriageStatus.value = 'casado'
  } catch (e) {
    relErrorMsg.value = e.message || 'Error desconocido.'
    console.error(e)
  }
}

function removeRel(persona, relacionada, tipo) {
  if (!confirm(`¿Desvincular "${persona}" de "${relacionada}" (${tipo})?`)) return
  const tree = window.__FAMILY_TREE__
  if (!tree) return
  try {
    tree.removeRelation(persona, relacionada, tipo)
    tree.saveToStorage()
    relSuccessMsg.value = `Relación "${tipo}" eliminada entre "${persona}" y "${relacionada}".`
  } catch (e) {
    relErrorMsg.value = e.message || 'Error al desvincular.'
    console.error(e)
  }
}

function startEdit(member) {
  if (!member || !member.nombre) return
  name.value = member.nombre
  gender.value = member.genero || 'otro'
  photo.value = member.photo || ''
  photoPreview.value = member.photo || ''
  birthDate.value = member.birthDate || ''
  deathDate.value = member.deathDate || ''
  birthPlace.value = member.birthPlace || ''
  ocupacion.value = member.ocupacion || ''
  religion.value = member.religion || ''
  notas.value = member.notas || ''
  editing.value = true
  originalName.value = member.nombre
  tab.value = 'persona'
  errorMsg.value = ''
  successMsg.value = ''
}

function cancelEdit() {
  resetForm()
  editing.value = false
  originalName.value = ''
}

function resetForm() {
  name.value = ''
  gender.value = 'otro'
  photo.value = ''
  photoPreview.value = ''
  birthDate.value = ''
  deathDate.value = ''
  birthPlace.value = ''
  ocupacion.value = ''
  religion.value = ''
  notas.value = ''
}

watch(() => props.member, (m) => {
  if (m) startEdit(m)
}, { immediate: true })
</script>

<style scoped>
.family-form {
  background: var(--card, #fff);
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 10px;
  overflow: hidden;
  transition: background 0.3s, border-color 0.3s;
}

.tabs {
  display: flex;
  border-bottom: 2px solid var(--border, #e0e0e0);
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: var(--bg, #f5f5f5);
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  color: var(--muted, #666);
  transition: all 0.2s;
}

.tab.active {
  background: var(--card, #fff);
  color: var(--primary, #00897b);
  border-bottom: 3px solid var(--primary, #00897b);
  margin-bottom: -2px;
}

.tab:hover:not(.active) {
  background: var(--border, #eee);
}

.section {
  padding: 20px;
}

.section-desc {
  color: var(--muted, #666);
  font-size: 0.9em;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.field-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 140px;
}

.field label {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--text, #555);
}

.field input,
.field select,
.field textarea {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95em;
  background: var(--card, #fff);
  color: var(--text, #333);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--primary, #00897b);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 137, 123, 0.2);
}

.field input.error {
  border-color: #e00;
  background: #fee;
}

.photo-upload {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.photo-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border, #ccc);
}

.btn-small {
  padding: 4px 10px;
  font-size: 0.85em;
  border: 1px solid var(--border, #ccc);
  border-radius: 4px;
  background: var(--card, #fff);
  color: var(--muted, #666);
  cursor: pointer;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--primary, #00897b);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s, transform 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #00695c);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  color: var(--muted, #999);
  border: 1px solid var(--border, #ccc);
  border-radius: 6px;
  margin-left: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.relacion-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .relacion-grid {
    grid-template-columns: 1fr;
  }
}

hr {
  border: none;
  border-top: 1px solid var(--border, #e0e0e0);
  margin: 20px 0;
}

.relacion-list-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border, #f0f0f0);
  font-size: 0.9em;
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

.btn-unlink:hover {
  color: #b71c1c;
}

.msg {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.9em;
}

.msg.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.msg.error {
  background: #fce4ec;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.msg.info {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90caf9;
}

h4 {
  margin: 0 0 12px 0;
  color: var(--card-text, #333);
}
</style>
