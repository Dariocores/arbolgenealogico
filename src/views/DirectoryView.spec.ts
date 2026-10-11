import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import DirectoryView from '@/views/DirectoryView.vue';
import { useFamilyTreeStore } from '@/stores/familyTree';

function setup() {
  localStorage.clear();
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useFamilyTreeStore();
  store.clearTree();

  const mother = store.addPerson({
    firstName: 'Ana',
    lastName: 'X',
    gender: 'female',
  });
  const child = store.addPerson({
    firstName: 'Beto',
    lastName: 'Y',
    gender: 'male',
  });
  store.selectPerson(mother);

  return { pinia, store, mother, child };
}

describe('DirectoryView', () => {
  it('agrega un hijo/a: la persona seleccionada es el progenitor', async () => {
    const { pinia, store, mother, child } = setup();
    render(DirectoryView, { global: { plugins: [pinia] } });

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    await fireEvent.update(selects[0], 'child');
    await fireEvent.update(selects[1], child);
    await fireEvent.click(screen.getByText('Agregar'));

    const rel = store.relationships.find((r) => r.personId1 === mother);
    expect(rel?.personId2).toBe(child);
    expect(rel?.type).toBe('parent_child');
  });

  it('agrega un padre/madre: la persona seleccionada es el hijo/a', async () => {
    const { pinia, store, mother, child } = setup();
    store.selectPerson(child);
    render(DirectoryView, { global: { plugins: [pinia] } });

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    await fireEvent.update(selects[0], 'parent');
    await fireEvent.update(selects[1], mother);
    await fireEvent.click(screen.getByText('Agregar'));

    const rel = store.relationships[0];
    expect(rel?.personId1).toBe(mother);
    expect(rel?.personId2).toBe(child);
  });
});
