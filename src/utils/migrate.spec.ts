import { describe, it, expect } from 'vitest';
import { migrateLegacyMembers, type LegacyMember } from '@/utils/migrate';

function legacy(): Record<string, LegacyMember> {
  return {
    Eduardo: {
      id: 'legacy-1',
      nombre: 'Eduardo Cores',
      genero: 'hombre',
      hijos: ['Dario'],
      esposos: ['Ema'],
      estadoMatrimonio: { Ema: 'casado' },
    },
    Ema: {
      id: 'legacy-2',
      nombre: 'Ema Ledesma',
      genero: 'mujer',
      hijos: ['Dario'],
      esposos: ['Eduardo'],
      estadoMatrimonio: { Eduardo: 'casado' },
    },
    Dario: {
      id: 'legacy-3',
      nombre: 'Dario Cores',
      genero: 'hombre',
      padres: ['Eduardo', 'Ema'],
      tipoPadre: { Eduardo: 'biologico', Ema: 'biologico' },
    },
  };
}

describe('migrateLegacyMembers', () => {
  it('convierte cada miembro en una Person con id', () => {
    const { persons } = migrateLegacyMembers(legacy());
    expect(Object.keys(persons)).toHaveLength(3);
    expect(persons['legacy-1'].firstName).toBe('Eduardo');
    expect(persons['legacy-1'].lastName).toBe('Cores');
    expect(persons['legacy-1'].gender).toBe('male');
    expect(persons['legacy-2'].gender).toBe('female');
  });

  it('genera ID cuando el miembro no lo tiene', () => {
    const { persons } = migrateLegacyMembers({
      solo: { nombre: 'Solo Apellido', genero: 'otro' },
    });
    const person = Object.values(persons)[0];
    expect(person.id).toBe('PERS-0001');
    expect(person.firstName).toBe('Solo');
    expect(person.lastName).toBe('Apellido');
    expect(person.gender).toBe('other');
  });

  it('crea relaciones padre-hijo desde los padres', () => {
    const { relationships } = migrateLegacyMembers(legacy());
    const parentChild = relationships.filter((r) => r.type === 'parent_child');
    expect(parentChild).toHaveLength(2);
    const parentIds = parentChild.map((r) => r.personId1).sort();
    expect(parentIds).toEqual(['legacy-1', 'legacy-2']);
    expect(parentChild.every((r) => r.personId2 === 'legacy-3')).toBe(true);
  });

  it('crea relación de esposos sin duplicar', () => {
    const { relationships } = migrateLegacyMembers(legacy());
    const spouses = relationships.filter((r) => r.type === 'spouse');
    expect(spouses).toHaveLength(1);
  });

  it('mapea tipo de padre adoptivo', () => {
    const { relationships } = migrateLegacyMembers({
      Padre: { nombre: 'Padre X', genero: 'hombre' },
      Hijo: {
        nombre: 'Hijo Y',
        genero: 'hombre',
        padres: ['Padre X'],
        tipoPadre: { 'Padre X': 'adoptivo' },
      },
    });
    const rel = relationships.find((r) => r.type === 'adoptive');
    expect(rel).toBeDefined();
    expect(rel?.isBiological).toBe(false);
  });
});
