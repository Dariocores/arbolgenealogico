import { describe, it, expect } from 'vitest';
import {
  normalizeRelationshipDirection,
  normalizeRelationships,
} from '@/utils/relationships';
import type { Person, Relationship } from '@/types/genealogy';

function person(id: string, birthDate?: string, gender: Person['gender'] = 'other'): Person {
  return { id, firstName: id, lastName: '', gender, birthDate };
}

describe('normalizeRelationshipDirection', () => {
  it('invierte la relación cuando el supuesto hijo nació antes que el padre', () => {
    const persons = {
      hijo: person('hijo', '2019-10-16'),
      padre: person('padre', '1974-04-14'),
    };
    const rel: Relationship = {
      id: 'r',
      personId1: 'hijo',
      personId2: 'padre',
      type: 'parent_child',
    };
    const fixed = normalizeRelationshipDirection(rel, persons);
    expect(fixed.personId1).toBe('padre');
    expect(fixed.personId2).toBe('hijo');
  });

  it('no cambia una relación ya correcta', () => {
    const persons = {
      padre: person('padre', '1974-04-14'),
      hijo: person('hijo', '2019-10-16'),
    };
    const rel: Relationship = {
      id: 'r',
      personId1: 'padre',
      personId2: 'hijo',
      type: 'parent_child',
    };
    const fixed = normalizeRelationshipDirection(rel, persons);
    expect(fixed.personId1).toBe('padre');
    expect(fixed.personId2).toBe('hijo');
  });

  it('no adivina cuando falta alguna fecha', () => {
    const persons = { a: person('a'), b: person('b', '2000-01-01') };
    const rel: Relationship = {
      id: 'r',
      personId1: 'a',
      personId2: 'b',
      type: 'parent_child',
    };
    const fixed = normalizeRelationshipDirection(rel, persons);
    expect(fixed.personId1).toBe('a');
    expect(fixed.personId2).toBe('b');
  });

  it('ignora las relaciones de pareja', () => {
    const persons = {
      a: person('a', '2019-01-01'),
      b: person('b', '1970-01-01'),
    };
    const rel: Relationship = {
      id: 'r',
      personId1: 'a',
      personId2: 'b',
      type: 'spouse',
    };
    const fixed = normalizeRelationshipDirection(rel, persons);
    expect(fixed.personId1).toBe('a');
    expect(fixed.personId2).toBe('b');
  });
});

describe('normalizeRelationships', () => {
  it('corrige y elimina duplicados resultantes', () => {
    const persons = {
      padre: person('padre', '1974-01-01'),
      hijo: person('hijo', '2019-01-01'),
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'hijo', personId2: 'padre', type: 'parent_child' },
      { id: '2', personId1: 'padre', personId2: 'hijo', type: 'parent_child' },
    ];
    const out = normalizeRelationships(relationships, persons);
    expect(out).toHaveLength(1);
    expect(out[0].personId1).toBe('padre');
    expect(out[0].personId2).toBe('hijo');
  });
});
