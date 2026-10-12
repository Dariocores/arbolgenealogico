<template>
  <form class="person-form" @submit.prevent="submit">
    <div class="field-row">
      <div class="field">
        <label for="pf-first">Nombre *</label>
        <input id="pf-first" v-model="form.firstName" placeholder="Ej: Juan" />
      </div>
      <div class="field">
        <label for="pf-last">Apellido</label>
        <input id="pf-last" v-model="form.lastName" placeholder="Ej: Pérez" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="pf-gender">Género</label>
        <select id="pf-gender" v-model="form.gender">
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="nonbinary">No binario</option>
          <option value="unknown">Desconocido</option>
        </select>
      </div>
      <div class="field">
        <label for="pf-generation">Generación</label>
        <input id="pf-generation" v-model.number="form.generation" type="number" min="0" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="pf-nonborn">No nacido/a</label>
        <select id="pf-nonborn" v-model="form.nonBorn">
          <option value="">— No aplica —</option>
          <option value="miscarriage">Aborto espontáneo (A.E)</option>
          <option value="abortion">Aborto provocado (A.P)</option>
          <option value="stillborn">No nacido/a (N.N)</option>
        </select>
      </div>
      <div class="field field-inline">
        <label for="pf-abuse">
          <input id="pf-abuse" v-model="form.abuse" type="checkbox" />
          Marcador de abuso (A)
        </label>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="pf-birth">Nacimiento</label>
        <input id="pf-birth" v-model="form.birthDate" type="date" />
      </div>
      <div class="field">
        <label for="pf-birthplace">Lugar de nacimiento</label>
        <input id="pf-birthplace" v-model="form.birthPlace" placeholder="Ej: Buenos Aires" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="pf-death">Fallecimiento</label>
        <input id="pf-death" v-model="form.deathDate" type="date" />
      </div>
      <div class="field">
        <label for="pf-deathplace">Lugar de fallecimiento</label>
        <input id="pf-deathplace" v-model="form.deathPlace" />
      </div>
    </div>

    <div class="field">
      <label for="pf-deathcause">Causa de muerte</label>
      <input id="pf-deathcause" v-model="form.deathCause" placeholder="Ej: cáncer, suicidio..." />
    </div>

    <div class="field">
      <label for="pf-conception">Fecha de concepción</label>
      <input id="pf-conception" v-model="form.conceptionDate" type="date" />
    </div>

    <div class="field-row">
      <div class="field">
        <label for="pf-occupation">Ocupación</label>
        <input id="pf-occupation" v-model="form.occupation" />
      </div>
      <div class="field">
        <label for="pf-religion">Religión</label>
        <input id="pf-religion" v-model="form.religion" />
      </div>
    </div>

    <div class="field">
      <label for="pf-photo">URL de foto</label>
      <input id="pf-photo" v-model="form.photoUrl" placeholder="https://..." />
    </div>

    <div class="field">
      <label for="pf-notes">Notas / Biografía</label>
      <textarea id="pf-notes" v-model="form.notes" rows="3"></textarea>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">
        {{ person ? 'Actualizar' : 'Guardar persona' }}
      </button>
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        Cancelar
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useFamilyTreeStore } from '@/stores/familyTree';
import type { Gender, NonBornStatus, Person } from '@/types/genealogy';

const props = defineProps<{ person?: Person | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useFamilyTreeStore();

interface FormState {
  firstName: string;
  lastName: string;
  gender: Gender;
  generation: number | null;
  nonBorn: NonBornStatus | '';
  abuse: boolean;
  birthDate: string;
  birthPlace: string;
  deathDate: string;
  deathPlace: string;
  deathCause: string;
  conceptionDate: string;
  occupation: string;
  religion: string;
  photoUrl: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    gender: 'unknown',
    generation: null,
    nonBorn: '',
    abuse: false,
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    deathCause: '',
    conceptionDate: '',
    occupation: '',
    religion: '',
    photoUrl: '',
    notes: '',
  };
}

const form = reactive<FormState>(emptyForm());
const error = ref('');

function fill(person: Person): void {
  form.firstName = person.firstName;
  form.lastName = person.lastName;
  form.gender = person.gender;
  form.generation = person.generation ?? null;
  form.nonBorn = person.nonBorn ?? '';
  form.abuse = person.abuse ?? false;
  form.birthDate = person.birthDate ?? '';
  form.birthPlace = person.birthPlace ?? '';
  form.deathDate = person.deathDate ?? '';
  form.deathPlace = person.deathPlace ?? '';
  form.deathCause = person.deathCause ?? '';
  form.conceptionDate = person.conceptionDate ?? '';
  form.occupation = person.occupation ?? '';
  form.religion = person.religion ?? '';
  form.photoUrl = person.photoUrl ?? '';
  form.notes = person.notes ?? '';
}

watch(
  () => props.person,
  (p) => {
    if (p) {
      fill(p);
    } else {
      Object.assign(form, emptyForm());
    }
    error.value = '';
  },
  { immediate: true },
);

function clean(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function submit(): void {
  if (!form.firstName.trim() && !form.lastName.trim()) {
    error.value = 'Ingresá al menos un nombre o apellido.';
    return;
  }

  const data = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    gender: form.gender,
    generation: form.generation ?? undefined,
    nonBorn: form.nonBorn || undefined,
    abuse: form.abuse || undefined,
    birthDate: clean(form.birthDate),
    birthPlace: clean(form.birthPlace),
    deathDate: clean(form.deathDate),
    deathPlace: clean(form.deathPlace),
    deathCause: clean(form.deathCause),
    conceptionDate: clean(form.conceptionDate),
    occupation: clean(form.occupation),
    religion: clean(form.religion),
    photoUrl: clean(form.photoUrl),
    notes: clean(form.notes),
  };

  if (props.person) {
    store.updatePerson(props.person.id, data);
  } else {
    store.addPerson(data);
  }
  emit('saved');
}
</script>

<style scoped>
.person-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.85em;
  color: var(--muted);
}

.field-inline {
  justify-content: flex-end;
}

.field-inline label {
  flex-direction: row;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95em;
  color: var(--text);
}

.field-inline input[type='checkbox'] {
  width: auto;
}

.field input,
.field select,
.field textarea {
  padding: 8px 10px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  border-radius: 8px;
  font-size: 0.95em;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: var(--on-primary, #fff);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.form-error {
  color: var(--danger);
  font-size: 0.85em;
}
</style>
