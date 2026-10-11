import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Person, Relationship, TreeData } from '@/types/genealogy';
import {
  exportGEDCOM as serializeGEDCOM,
  importGEDCOM as parseGEDCOM,
} from '@/utils/gedcom';
import { migrateFromStorage } from '@/utils/migrate';
import { normalizeRelationshipDirection, normalizeRelationships } from '@/utils/relationships';

const STORAGE_PREFIX = 'familyTree_v2_';

let idSeq = 0;

function generateId(prefix: string): string {
  idSeq += 1;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${time}-${idSeq.toString(36)}${rand}`;
}

export const useFamilyTreeStore = defineStore('familyTree', () => {
  const activeTreeId = ref<string>('default');
  const treeName = ref<string>('Linaje Cores-Romero');
  const rootPersonId = ref<string>('PERS-0001');
  const createdAt = ref<string>(new Date().toISOString());
  const persons = ref<Record<string, Person>>({
    'PERS-0001': {
      id: 'PERS-0001',
      firstName: 'Eduardo',
      lastName: 'Cores',
      gender: 'male',
      birthDate: '1938-05-12',
      birthPlace: 'Galicia, España',
      generation: 1,
      notes: 'Miembro raíz fundacional.',
    },
    'PERS-0002': {
      id: 'PERS-0002',
      firstName: 'Ema',
      lastName: 'Ledesma',
      gender: 'female',
      birthDate: '1941-09-20',
      birthPlace: 'Buenos Aires, Argentina',
      generation: 1,
    },
    'PERS-0003': {
      id: 'PERS-0003',
      firstName: 'Dario',
      lastName: 'Cores',
      gender: 'male',
      birthDate: '1987-07-06',
      birthPlace: 'Buenos Aires, Argentina',
      generation: 2,
    },
    'PERS-0004': {
      id: 'PERS-0004',
      firstName: 'Vanesa',
      lastName: 'Romero',
      gender: 'female',
      birthDate: '1987-11-09',
      generation: 2,
    },
    'PERS-0005': {
      id: 'PERS-0005',
      firstName: 'Alvaro',
      lastName: 'Cores',
      gender: 'male',
      birthDate: '2022-01-27',
      generation: 3,
    },
  });
  const relationships = ref<Relationship[]>([
    { id: 'rel-1', personId1: 'PERS-0001', personId2: 'PERS-0002', type: 'spouse' },
    { id: 'rel-2', personId1: 'PERS-0001', personId2: 'PERS-0003', type: 'parent_child' },
    { id: 'rel-3', personId1: 'PERS-0002', personId2: 'PERS-0003', type: 'parent_child' },
    { id: 'rel-4', personId1: 'PERS-0003', personId2: 'PERS-0004', type: 'spouse' },
    { id: 'rel-5', personId1: 'PERS-0003', personId2: 'PERS-0005', type: 'parent_child' },
    { id: 'rel-6', personId1: 'PERS-0004', personId2: 'PERS-0005', type: 'parent_child' },
  ]);
  const selectedPersonId = ref<string>('PERS-0003');

  const totalMembers = computed(() => Object.keys(persons.value).length);
  const selectedPerson = computed(
    () => persons.value[selectedPersonId.value] || null,
  );

  const getParents = (personId: string): Person[] =>
    relationships.value
      .filter((r) => r.personId2 === personId && r.type !== 'spouse' && r.type !== 'partner')
      .map((r) => persons.value[r.personId1])
      .filter(Boolean) as Person[];

  const getChildren = (personId: string): Person[] =>
    relationships.value
      .filter((r) => r.personId1 === personId && r.type !== 'spouse' && r.type !== 'partner')
      .map((r) => persons.value[r.personId2])
      .filter(Boolean) as Person[];

  const getSpouses = (personId: string): Person[] =>
    relationships.value
      .filter(
        (r) =>
          (r.personId1 === personId || r.personId2 === personId) &&
          (r.type === 'spouse' || r.type === 'partner'),
      )
      .map((r) => {
        const spouseId = r.personId1 === personId ? r.personId2 : r.personId1;
        return persons.value[spouseId];
      })
      .filter(Boolean) as Person[];

  function storageKey(): string {
    return STORAGE_PREFIX + activeTreeId.value;
  }

  function toTreeData(): TreeData {
    return {
      id: activeTreeId.value,
      name: treeName.value,
      rootPersonId: rootPersonId.value,
      members: persons.value,
      relationships: relationships.value,
      createdAt: createdAt.value,
      selectedPersonId: selectedPersonId.value,
    };
  }

  function applyTreeData(data: Partial<TreeData>): void {
    if (data.members) persons.value = data.members;
    if (data.relationships) {
      relationships.value = normalizeRelationships(
        data.relationships,
        persons.value,
      );
    }
    if (data.rootPersonId) rootPersonId.value = data.rootPersonId;
    if (data.name) treeName.value = data.name;
    if (data.createdAt) createdAt.value = data.createdAt;

    if (data.selectedPersonId && persons.value[data.selectedPersonId]) {
      selectedPersonId.value = data.selectedPersonId;
      return;
    }
    if (!persons.value[selectedPersonId.value]) {
      selectedPersonId.value = persons.value[rootPersonId.value]
        ? rootPersonId.value
        : Object.keys(persons.value)[0] || '';
    }
  }

  function saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storageKey(), JSON.stringify(toTreeData()));
  }

  function loadFromStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(storageKey());
    if (!raw) return false;
    try {
      applyTreeData(JSON.parse(raw) as Partial<TreeData>);
      return true;
    } catch {
      return false;
    }
  }

  function init(): void {
    if (loadFromStorage()) {
      saveToStorage();
      return;
    }
    const migrated = migrateFromStorage();
    if (migrated) {
      persons.value = migrated.persons;
      relationships.value = migrated.relationships;
      const ids = Object.keys(migrated.persons);
      rootPersonId.value = ids[0] || '';
      selectedPersonId.value = rootPersonId.value;
      saveToStorage();
    }
  }

  function addPerson(person: Omit<Person, 'id'>): string {
    const newId = generateId('PERS');
    const now = new Date().toISOString();
    persons.value[newId] = {
      ...person,
      id: newId,
      metadata: person.metadata ?? { createdAt: now, updatedAt: now },
    };
    if (!rootPersonId.value || !persons.value[rootPersonId.value]) {
      rootPersonId.value = newId;
    }
    selectedPersonId.value = newId;
    saveToStorage();
    return newId;
  }

  function updatePerson(id: string, changes: Partial<Person>): void {
    const existing = persons.value[id];
    if (!existing) return;
    const now = new Date().toISOString();
    persons.value[id] = {
      ...existing,
      ...changes,
      id,
      metadata: {
        createdAt: existing.metadata?.createdAt ?? now,
        updatedAt: now,
        certifications: existing.metadata?.certifications,
      },
    };
    saveToStorage();
  }

  function removePerson(id: string): void {
    delete persons.value[id];
    relationships.value = relationships.value.filter(
      (r) => r.personId1 !== id && r.personId2 !== id,
    );
    if (selectedPersonId.value === id) {
      selectedPersonId.value = Object.keys(persons.value)[0] || '';
    }
    if (rootPersonId.value === id) {
      rootPersonId.value = Object.keys(persons.value)[0] || '';
    }
    saveToStorage();
  }

  function addRelationship(rel: Omit<Relationship, 'id'>): string | null {
    if (!persons.value[rel.personId1] || !persons.value[rel.personId2]) {
      return null;
    }
    if (rel.personId1 === rel.personId2) return null;

    const normalized = normalizeRelationshipDirection(
      { ...rel, id: '' },
      persons.value,
    );
    rel = normalized;

    const isSpouseType = rel.type === 'spouse' || rel.type === 'partner';
    const duplicate = relationships.value.some((r) => {
      if (r.type !== rel.type) return false;
      if (isSpouseType) {
        return (
          (r.personId1 === rel.personId1 && r.personId2 === rel.personId2) ||
          (r.personId1 === rel.personId2 && r.personId2 === rel.personId1)
        );
      }
      return r.personId1 === rel.personId1 && r.personId2 === rel.personId2;
    });
    if (duplicate) return null;

    const id = generateId('rel');
    relationships.value.push({ ...rel, id });
    saveToStorage();
    return id;
  }

  function removeRelationship(id: string): void {
    relationships.value = relationships.value.filter((r) => r.id !== id);
    saveToStorage();
  }

  function selectPerson(id: string): void {
    selectedPersonId.value = id;
    saveToStorage();
  }

  function exportGEDCOM(): string {
    return serializeGEDCOM(persons.value, relationships.value, treeName.value);
  }

  function importGEDCOM(text: string): void {
    const parsed = parseGEDCOM(text);
    persons.value = parsed.persons;
    relationships.value = normalizeRelationships(parsed.relationships, parsed.persons);
    const ids = Object.keys(parsed.persons);
    rootPersonId.value = ids[0] || '';
    selectedPersonId.value = rootPersonId.value;
    saveToStorage();
  }

  function importJSON(data: Partial<TreeData>): void {
    applyTreeData(data);
    saveToStorage();
  }

  function clearTree(): void {
    persons.value = {};
    relationships.value = [];
    rootPersonId.value = '';
    selectedPersonId.value = '';
    saveToStorage();
  }

  init();

  return {
    activeTreeId,
    treeName,
    rootPersonId,
    persons,
    relationships,
    selectedPersonId,
    selectedPerson,
    totalMembers,
    getParents,
    getChildren,
    getSpouses,
    addPerson,
    updatePerson,
    removePerson,
    addRelationship,
    removeRelationship,
    selectPerson,
    exportGEDCOM,
    importGEDCOM,
    importJSON,
    toTreeData,
    saveToStorage,
    clearTree,
  };
});
