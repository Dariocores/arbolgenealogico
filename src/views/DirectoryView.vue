<template>
  <div class="directory-view">
    <div class="directory-header">
      <h2>Personas</h2>
      <button class="btn btn-primary" @click="openAdd">+ Agregar persona</button>
    </div>

    <input
      v-model="search"
      class="search"
      placeholder="Buscar por nombre o apellido..."
    />

    <div class="directory-list">
      <div
        v-for="p in filtered"
        :key="p.id"
        class="person-card"
        :class="{ selected: p.id === store.selectedPersonId }"
      >
        <div class="person-info" @click="store.selectPerson(p.id)">
          <strong>{{ fullName(p) }}</strong>
          <span class="person-meta">
            {{ genderLabel(p.gender) }} · {{ p.birthDate || 'sin fecha' }}
          </span>
        </div>
        <div class="person-actions">
          <button class="btn btn-small" @click="openEdit(p)">Editar</button>
          <button class="btn btn-small btn-danger" @click="removePerson(p)">
            Eliminar
          </button>
        </div>
      </div>
      <p v-if="!filtered.length" class="empty">
        {{ search ? 'Sin resultados.' : 'No hay personas registradas.' }}
      </p>
    </div>

    <section v-if="store.selectedPerson" class="relations-panel">
      <h3>Relaciones de {{ fullName(store.selectedPerson) }}</h3>

      <div class="rel-group">
        <h4>Padres</h4>
        <ul v-if="parentsOfSelected.length" class="rel-list">
          <li v-for="r in parentsOfSelected" :key="r.id">
            <span>{{ fullName(store.persons[r.personId1]) }} ({{ parentRoleLabel(r.type) }})</span>
            <button class="btn-link" @click="store.removeRelationship(r.id)">quitar</button>
          </li>
        </ul>
        <p v-else class="muted">—</p>
      </div>

      <div class="rel-group">
        <h4>Hijos</h4>
        <ul v-if="childrenOfSelected.length" class="rel-list">
          <li v-for="r in childrenOfSelected" :key="r.id">
            <span>{{ fullName(store.persons[r.personId2]) }} ({{ childRoleLabel(r.type) }})</span>
            <button class="btn-link" @click="store.removeRelationship(r.id)">quitar</button>
          </li>
        </ul>
        <p v-else class="muted">—</p>
      </div>

      <div class="rel-group">
        <h4>Parejas</h4>
        <ul v-if="couplesOfSelected.length" class="rel-list">
          <li v-for="r in couplesOfSelected" :key="r.id">
            <span>{{ fullName(store.persons[otherId(r)]) }}</span>
            <button class="btn-link" @click="store.removeRelationship(r.id)">quitar</button>
          </li>
        </ul>
        <p v-else class="muted">—</p>
      </div>

      <div class="add-relation">
        <h4>Agregar relación</h4>
        <p class="muted">
          La opción elegida indica el rol de la persona que agregás respecto de
          la seleccionada.
        </p>
        <div class="rel-form">
          <select v-model="relKind" aria-label="Rol de la persona a agregar">
            <option value="child">Hijo/a</option>
            <option value="parent">Padre/Madre</option>
            <option value="adoptive">Padre/Madre adoptivo/a</option>
            <option value="step_parent">Padrastro/Madrastra</option>
            <option value="spouse">Pareja</option>
          </select>
          <select v-model="relTarget">
            <option value="">-- Seleccionar persona —</option>
            <option v-for="p in otherPeople" :key="p.id" :value="p.id">
              {{ fullName(p) }}
            </option>
          </select>
          <button
            class="btn btn-primary"
            :disabled="!relTarget"
            @click="addRelationship"
          >
            Agregar
          </button>
        </div>
        <p v-if="relError" class="form-error">{{ relError }}</p>
      </div>
    </section>

    <div v-if="formOpen" class="modal-overlay" @click.self="closeForm">
      <div
        ref="modalRef"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="editing ? 'Editar persona' : 'Nueva persona'"
        tabindex="-1"
      >
        <h3>{{ editing ? 'Editar persona' : 'Nueva persona' }}</h3>
        <PersonForm :person="editing" @saved="closeForm" @cancel="closeForm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useFamilyTreeStore } from '@/stores/familyTree';
import PersonForm from '@/components/PersonForm.vue';
import { childRoleLabel, genderLabel, parentRoleLabel } from '@/utils/labels';
import { isParentType, isSpouseType } from '@/utils/relationships';
import type { Person, Relationship } from '@/types/genealogy';

const store = useFamilyTreeStore();

const search = ref('');
const formOpen = ref(false);
const editing = ref<Person | null>(null);
const modalRef = ref<HTMLElement | null>(null);
const relTarget = ref('');
const relKind = ref<RelationKind>('child');
const relError = ref('');

type RelationKind = 'parent' | 'child' | 'adoptive' | 'step_parent' | 'spouse';

function relationPayload(
  kind: RelationKind,
  selectedId: string,
  otherId: string,
): Omit<Relationship, 'id'> {
  switch (kind) {
    case 'parent':
      return {
        personId1: otherId,
        personId2: selectedId,
        type: 'parent_child',
        isBiological: true,
      };
    case 'adoptive':
      return {
        personId1: otherId,
        personId2: selectedId,
        type: 'adoptive',
        isBiological: false,
      };
    case 'step_parent':
      return {
        personId1: otherId,
        personId2: selectedId,
        type: 'step_parent',
        isBiological: false,
      };
    case 'spouse':
      return { personId1: selectedId, personId2: otherId, type: 'spouse' };
    case 'child':
    default:
      return {
        personId1: selectedId,
        personId2: otherId,
        type: 'parent_child',
        isBiological: true,
      };
  }
}

const people = computed(() =>
  Object.values(store.persons).sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
  ),
);

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return people.value;
  return people.value.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(term),
  );
});

function fullName(person?: Person): string {
  if (!person) return '(desconocido)';
  return `${person.firstName} ${person.lastName}`.trim() || '(sin nombre)';
}


const parentsOfSelected = computed<Relationship[]>(() =>
  store.selectedPersonId
    ? store.relationships.filter(
        (r) => isParentType(r.type) && r.personId2 === store.selectedPersonId,
      )
    : [],
);

const childrenOfSelected = computed<Relationship[]>(() =>
  store.selectedPersonId
    ? store.relationships.filter(
        (r) => isParentType(r.type) && r.personId1 === store.selectedPersonId,
      )
    : [],
);

const couplesOfSelected = computed<Relationship[]>(() =>
  store.selectedPersonId
    ? store.relationships.filter(
        (r) =>
          isSpouseType(r.type) &&
          (r.personId1 === store.selectedPersonId ||
            r.personId2 === store.selectedPersonId),
      )
    : [],
);

function otherId(rel: Relationship): string {
  return rel.personId1 === store.selectedPersonId ? rel.personId2 : rel.personId1;
}

const otherPeople = computed(() =>
  people.value.filter((p) => p.id !== store.selectedPersonId),
);

function openAdd(): void {
  editing.value = null;
  relError.value = '';
  formOpen.value = true;
}

function openEdit(person: Person): void {
  editing.value = person;
  relError.value = '';
  formOpen.value = true;
}

function closeForm(): void {
  formOpen.value = false;
  editing.value = null;
}

function onModalKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeForm();
}

watch(formOpen, async (open) => {
  if (open) {
    window.addEventListener('keydown', onModalKeydown);
    await nextTick();
    modalRef.value?.focus();
  } else {
    window.removeEventListener('keydown', onModalKeydown);
  }
});

onBeforeUnmount(() => window.removeEventListener('keydown', onModalKeydown));

function removePerson(person: Person): void {
  if (confirm(`¿Eliminar a ${fullName(person)} y sus relaciones?`)) {
    store.removePerson(person.id);
  }
}

function addRelationship(): void {
  relError.value = '';
  if (!store.selectedPersonId || !relTarget.value) {
    relError.value = 'Seleccioná una persona.';
    return;
  }
  const payload = relationPayload(
    relKind.value,
    store.selectedPersonId,
    relTarget.value,
  );
  const id = store.addRelationship(payload);
  if (!id) {
    relError.value = 'Esa relación ya existe o no es válida.';
    return;
  }
  relTarget.value = '';
}
</script>

<style scoped>
.directory-view {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.directory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.search {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.95em;
  font-family: inherit;
}

.directory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.person-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.person-card.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 137, 123, 0.15);
}

.person-info {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  flex: 1;
}

.person-meta {
  font-size: 0.85em;
  color: var(--muted);
}

.person-actions {
  display: flex;
  gap: 8px;
}

.rel-group {
  margin-bottom: 16px;
}

.rel-group h4 {
  margin-bottom: 6px;
  font-size: 0.9em;
  color: var(--text);
}

.rel-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rel-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9em;
  padding: 4px 0;
}

.relations-panel {
  margin-top: 28px;
  padding: 20px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.relations-panel h3 {
  margin-bottom: 16px;
}

.btn-link {
  border: none;
  background: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 0.85em;
}

.muted {
  color: var(--muted);
  font-size: 0.9em;
}

.empty {
  color: var(--muted);
}

.form-error {
  color: var(--danger);
  font-size: 0.85em;
  margin-top: 8px;
}

.rel-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.rel-form select {
  padding: 8px 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  border-radius: 8px;
  font-family: inherit;
}

.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: var(--on-primary, #fff);
  cursor: pointer;
  font-weight: 600;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85em;
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.btn:hover {
  opacity: 0.9;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal {
  background: var(--card);
  color: var(--card-text);
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: 16px;
}
</style>
