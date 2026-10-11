<template>
  <div class="tree-view">
    <div class="tree-header">
      <h2>Árbol Genealógico</h2>
      <span class="tree-summary">
        {{ store.treeName }} · {{ store.totalMembers }} miembros
      </span>
    </div>

    <div class="tree-layout">
      <div class="tree-canvas-wrap">
        <TreeCanvas />
      </div>

      <aside class="detail-panel">
        <template v-if="store.selectedPerson">
          <h3>Persona seleccionada</h3>
          <dl class="person-detail">
            <dt>ID</dt>
            <dd>{{ store.selectedPerson.id }}</dd>
            <dt>Nombre</dt>
            <dd>{{ store.selectedPerson.firstName }} {{ store.selectedPerson.lastName }}</dd>
            <dt>Género</dt>
            <dd>{{ genderLabel(store.selectedPerson.gender) }}</dd>
            <dt>Nacimiento</dt>
            <dd>{{ store.selectedPerson.birthDate || '—' }}</dd>
            <dt>Lugar</dt>
            <dd>{{ store.selectedPerson.birthPlace || '—' }}</dd>
            <dt>Fallecimiento</dt>
            <dd>{{ store.selectedPerson.deathDate || '—' }}</dd>
            <dt>Lugar deceso</dt>
            <dd>{{ store.selectedPerson.deathPlace || '—' }}</dd>
            <dt>Generación</dt>
            <dd>{{ store.selectedPerson.generation ?? '—' }}</dd>
          </dl>

          <div class="relations">
            <p><strong>Padres:</strong> {{ formatRelated(parents, 'parent') }}</p>
            <p><strong>Hijos:</strong> {{ formatRelated(children, 'child') }}</p>
            <p><strong>Parejas:</strong> {{ formatList(spouses) }}</p>
          </div>
        </template>
        <p v-else class="empty">Seleccioná una persona en el directorio.</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TreeCanvas from '@/components/tree/TreeCanvas.vue';
import { useFamilyTreeStore } from '@/stores/familyTree';
import {
  childRoleLabel,
  genderLabel,
  isBiological,
  parentRoleLabel,
} from '@/utils/labels';
import { isParentType } from '@/utils/relationships';
import type { Person, RelationshipType } from '@/types/genealogy';

const store = useFamilyTreeStore();

interface RelatedPerson {
  person: Person;
  type: RelationshipType;
}

const parents = computed<RelatedPerson[]>(() => {
  const id = store.selectedPersonId;
  if (!id) return [];
  return store.relationships
    .filter((r) => isParentType(r.type) && r.personId2 === id)
    .map((r) => ({ person: store.persons[r.personId1], type: r.type }))
    .filter((r) => r.person) as RelatedPerson[];
});

const children = computed<RelatedPerson[]>(() => {
  const id = store.selectedPersonId;
  if (!id) return [];
  return store.relationships
    .filter((r) => isParentType(r.type) && r.personId1 === id)
    .map((r) => ({ person: store.persons[r.personId2], type: r.type }))
    .filter((r) => r.person) as RelatedPerson[];
});

const spouses = computed<Person[]>(() =>
  store.selectedPersonId ? store.getSpouses(store.selectedPersonId) : [],
);

function formatList(list: Person[]): string {
  if (!list.length) return '—';
  return list.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
}

type Perspective = 'parent' | 'child';

function formatRelated(list: RelatedPerson[], perspective: Perspective): string {
  if (!list.length) return '—';
  return list
    .map(({ person, type }) => {
      const name = `${person.firstName} ${person.lastName}`.trim();
      if (isBiological(type)) return name;
      const label =
        perspective === 'parent' ? parentRoleLabel(type) : childRoleLabel(type);
      return `${name} (${label})`;
    })
    .join(', ');
}
</script>

<style scoped>
.tree-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.tree-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
}

.tree-summary {
  color: var(--muted);
  font-size: 0.9em;
}

.tree-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;
}

.detail-panel {
  padding: 20px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 12px;
  position: sticky;
  top: 20px;
}

.detail-panel h3 {
  margin-bottom: 14px;
}

.person-detail {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  margin-bottom: 16px;
}

.person-detail dt {
  color: var(--muted);
  font-size: 0.85em;
}

.person-detail dd {
  margin: 0;
  font-size: 0.9em;
}

.relations {
  border-top: 1px solid var(--border);
  padding-top: 12px;
  font-size: 0.88em;
  line-height: 1.8;
}

.empty {
  color: var(--muted);
}

@media (max-width: 1000px) {
  .tree-layout {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    position: relative;
    top: auto;
  }
}
</style>
