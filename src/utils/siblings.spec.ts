import { describe, it, expect } from 'vitest';
import type { Person, Relationship } from '@/types/genealogy';
import { getSiblings, getTwinPairs, isTwin, siblingOrderKey } from '@/utils/siblings';

function person(id: string, overrides: Partial<Person> = {}): Person {
  return { id, firstName: id, lastName: '', gender: 'unknown', ...overrides };
}

function pc(parent: string, child: string, type: Relationship['type'] = 'parent_child'): Relationship {
  return { id: `${parent}-${child}`, personId1: parent, personId2: child, type };
}

describe('siblings', () => {
  it('detecta hermanos y su rango por edad', () => {
    const persons: Record<string, Person> = {
      p: person('p'),
      m: person('m'),
      mayor: person('mayor', { birthDate: '1980-01-01' }),
      menor: person('menor', { birthDate: '1990-01-01' }),
    };
    const relationships = [pc('p', 'mayor'), pc('m', 'mayor'), pc('p', 'menor'), pc('m', 'menor')];

    const deMenor = getSiblings('menor', persons, relationships);
    expect(deMenor).toHaveLength(1);
    expect(deMenor[0].person.id).toBe('mayor');
    expect(deMenor[0].rank).toBe('mayor');

    const deMayor = getSiblings('mayor', persons, relationships);
    expect(deMayor[0].rank).toBe('menor');
  });

  it('incluye medio hermanos (un solo progenitor en común)', () => {
    const persons: Record<string, Person> = {
      p: person('p'),
      m1: person('m1'),
      m2: person('m2'),
      h1: person('h1', { birthDate: '1985-01-01' }),
      h2: person('h2', { birthDate: '1992-01-01' }),
    };
    const relationships = [pc('p', 'h1'), pc('m1', 'h1'), pc('p', 'h2'), pc('m2', 'h2')];

    const sib = getSiblings('h2', persons, relationships);
    expect(sib.map((s) => s.person.id)).toEqual(['h1']);
    expect(sib[0].rank).toBe('mayor');
  });

  it('marca mellizos por fecha de nacimiento', () => {
    const persons: Record<string, Person> = {
      p: person('p'),
      t1: person('t1', { birthDate: '2000-05-05' }),
      t2: person('t2', { birthDate: '2000-05-05' }),
    };
    const relationships = [pc('p', 't1'), pc('p', 't2')];

    expect(isTwin(persons.t1, persons.t2)).toBe(true);
    const sib = getSiblings('t1', persons, relationships);
    expect(sib[0].rank).toBe('mellizo');
  });

  it('marca mellizos no nacidos por fecha de concepción', () => {
    const persons: Record<string, Person> = {
      p: person('p'),
      t1: person('t1', { conceptionDate: '2000-01-01', nonBorn: 'miscarriage' }),
      t2: person('t2', { conceptionDate: '2000-01-01', nonBorn: 'miscarriage' }),
    };
    const relationships = [pc('p', 't1'), pc('p', 't2')];

    const sib = getSiblings('t1', persons, relationships);
    expect(sib[0].rank).toBe('mellizo');
    expect(sib[0].person.nonBorn).toBe('miscarriage');
  });

  it('ordena por concepción cuando falta nacimiento', () => {
    const persons: Record<string, Person> = {
      p: person('p'),
      a: person('a', { conceptionDate: '1990-05-01' }),
      b: person('b', { birthDate: '1995-05-01' }),
    };
    const relationships = [pc('p', 'a'), pc('p', 'b')];
    const sib = getSiblings('b', persons, relationships);
    expect(sib[0].person.id).toBe('a');
    expect(sib[0].rank).toBe('mayor');
  });

  it('no devuelve hermanos a quien no tiene progenitores', () => {
    const persons: Record<string, Person> = { x: person('x'), y: person('y') };
    expect(getSiblings('x', persons, [])).toEqual([]);
  });

  it('agrupa los pares de mellizos de una hermandad', () => {
    const persons: Record<string, Person> = {
      p: person('p'),
      t1: person('t1', { birthDate: '2000-05-05' }),
      t2: person('t2', { birthDate: '2000-05-05' }),
      otro: person('otro', { birthDate: '2005-01-01' }),
    };
    const relationships = [pc('p', 't1'), pc('p', 't2'), pc('p', 'otro')];
    const pairs = getTwinPairs(persons, relationships);
    expect(pairs).toHaveLength(1);
    expect([pairs[0][0].id, pairs[0][1].id].sort()).toEqual(['t1', 't2']);
  });

  it('siblingOrderKey prefiere la concepción', () => {
    expect(siblingOrderKey(person('x', { conceptionDate: '1990-01-01', birthDate: '1990-09-01' }))).toBe('1990-01-01');
    expect(siblingOrderKey(person('x', { birthDate: '1990-09-01' }))).toBe('1990-09-01');
  });
});
