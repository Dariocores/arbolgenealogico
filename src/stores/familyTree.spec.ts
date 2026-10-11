import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFamilyTreeStore } from '@/stores/familyTree';
import type { Person } from '@/types/genealogy';

function makePerson(firstName: string, lastName: string): Omit<Person, 'id'> {
  return { firstName, lastName, gender: 'unknown' };
}

describe('familyTree store', () => {
  let store: ReturnType<typeof useFamilyTreeStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useFamilyTreeStore();
    store.clearTree();
  });

  it('agrega una persona, la selecciona y la vuelve raíz si el árbol está vacío', () => {
    const id = store.addPerson(makePerson('Ana', 'Perez'));

    expect(store.persons[id]).toBeDefined();
    expect(store.selectedPersonId).toBe(id);
    expect(store.rootPersonId).toBe(id);
    expect(store.totalMembers).toBe(1);
  });

  it('conserva rootPersonId al agregar más personas', () => {
    const first = store.addPerson(makePerson('Ana', 'Perez'));
    const second = store.addPerson(makePerson('Bruno', 'Perez'));

    expect(store.rootPersonId).toBe(first);
    expect(store.selectedPersonId).toBe(second);
    expect(store.totalMembers).toBe(2);
  });

  it('genera ids únicos para cada persona', () => {
    const ids = new Set(
      Array.from({ length: 50 }, (_, i) => store.addPerson(makePerson(`P${i}`, 'X'))),
    );
    expect(ids.size).toBe(50);
  });

  it('actualiza una persona preservando su id y createdAt', () => {
    const id = store.addPerson(makePerson('Ana', 'Perez'));
    const createdAt = store.persons[id].metadata?.createdAt;

    store.updatePerson(id, { lastName: 'Gomez', gender: 'female' });

    expect(store.persons[id].lastName).toBe('Gomez');
    expect(store.persons[id].gender).toBe('female');
    expect(store.persons[id].id).toBe(id);
    expect(store.persons[id].metadata?.createdAt).toBe(createdAt);
  });

  it('elimina una persona junto con sus relaciones', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    const b = store.addPerson(makePerson('Bruno', 'Perez'));
    store.addRelationship({ personId1: a, personId2: b, type: 'spouse' });

    expect(store.relationships).toHaveLength(1);
    store.removePerson(a);

    expect(store.persons[a]).toBeUndefined();
    expect(store.relationships).toHaveLength(0);
    expect(store.totalMembers).toBe(1);
  });

  it('reubica la selección y la raíz al eliminar la persona activa', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    const b = store.addPerson(makePerson('Bruno', 'Perez'));
    store.removePerson(b);

    expect(store.selectedPersonId).toBe(a);
    expect(store.rootPersonId).toBe(a);
  });

  it('crea relaciones válidas', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    const b = store.addPerson(makePerson('Bruno', 'Perez'));

    const id = store.addRelationship({
      personId1: a,
      personId2: b,
      type: 'parent_child',
    });

    expect(id).toBeTruthy();
    expect(store.relationships).toHaveLength(1);
  });

  it('rechaza relaciones duplicadas, self y con personas inexistentes', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    const b = store.addPerson(makePerson('Bruno', 'Perez'));
    store.addRelationship({ personId1: a, personId2: b, type: 'spouse' });

    expect(
      store.addRelationship({ personId1: a, personId2: b, type: 'spouse' }),
    ).toBeNull();
    expect(
      store.addRelationship({ personId1: b, personId2: a, type: 'spouse' }),
    ).toBeNull();
    expect(
      store.addRelationship({ personId1: a, personId2: a, type: 'spouse' }),
    ).toBeNull();
    expect(
      store.addRelationship({ personId1: a, personId2: 'ghost', type: 'spouse' }),
    ).toBeNull();

    expect(store.relationships).toHaveLength(1);
  });

  it('elimina relaciones por id', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    const b = store.addPerson(makePerson('Bruno', 'Perez'));
    const id = store.addRelationship({
      personId1: a,
      personId2: b,
      type: 'spouse',
    }) as string;

    store.removeRelationship(id);
    expect(store.relationships).toHaveLength(0);
  });

  it('toTreeData incluye selectedPersonId y mantiene createdAt estable', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    store.selectPerson(a);

    const first = store.toTreeData();
    const second = store.toTreeData();

    expect(first.selectedPersonId).toBe(a);
    expect(first.createdAt).toBe(second.createdAt);
  });

  it('importJSON restaura la persona seleccionada', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    store.addPerson(makePerson('Bruno', 'Perez'));
    const data = store.toTreeData();

    store.clearTree();
    store.importJSON({ ...data, selectedPersonId: a });

    expect(store.selectedPersonId).toBe(a);
  });

  it('resuelve getParents, getChildren y getSpouses', () => {
    const a = store.addPerson(makePerson('Ana', 'Perez'));
    const b = store.addPerson(makePerson('Bruno', 'Perez'));
    const c = store.addPerson(makePerson('Carla', 'Perez'));
    store.addRelationship({ personId1: a, personId2: b, type: 'spouse' });
    store.addRelationship({ personId1: a, personId2: c, type: 'parent_child' });

    expect(store.getSpouses(a).map((p) => p.id)).toEqual([b]);
    expect(store.getChildren(a).map((p) => p.id)).toEqual([c]);
    expect(store.getParents(c).map((p) => p.id)).toEqual([a]);
  });
});
