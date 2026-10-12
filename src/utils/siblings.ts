import type { Person, Relationship } from '@/types/genealogy';
import { isParentType } from '@/utils/relationships';

export type SiblingRank = 'mayor' | 'menor' | 'mellizo' | 'unknown';

export interface Sibling {
  person: Person;
  rank: SiblingRank;
  sharedParentIds: string[];
}

// Clave de orden de una hermandad: se prefiere la fecha de concepción (para
// incluir a los no nacidos, que a veces no tienen fecha de nacimiento) y se cae
// a la de nacimiento.
export function siblingOrderKey(person: Person): string {
  return person.conceptionDate || person.birthDate || '';
}

export function parentIdsOf(personId: string, relationships: Relationship[]): string[] {
  return relationships
    .filter((r) => isParentType(r.type) && r.personId2 === personId)
    .map((r) => r.personId1);
}

// Mellizos/gemelos: comparten la fecha exacta de nacimiento o de concepción.
export function isTwin(a: Person, b: Person): boolean {
  if (a.birthDate && b.birthDate && a.birthDate === b.birthDate) return true;
  if (a.conceptionDate && b.conceptionDate && a.conceptionDate === b.conceptionDate) {
    return true;
  }
  return false;
}

function rankBetween(self: Person, other: Person): SiblingRank {
  if (isTwin(self, other)) return 'mellizo';
  const selfKey = siblingOrderKey(self);
  const otherKey = siblingOrderKey(other);
  if (!selfKey || !otherKey || selfKey === otherKey) return 'unknown';
  return otherKey < selfKey ? 'mayor' : 'menor';
}

// Hermanos de una persona: quienes comparten al menos un progenitor. Se ordenan
// del mayor al menor por fecha de concepción/nacimiento.
export function getSiblings(
  personId: string,
  persons: Record<string, Person>,
  relationships: Relationship[],
): Sibling[] {
  const self = persons[personId];
  if (!self) return [];
  const parentIds = new Set(parentIdsOf(personId, relationships));
  if (parentIds.size === 0) return [];

  const siblings: Sibling[] = [];
  for (const person of Object.values(persons)) {
    if (person.id === personId) continue;
    const shared = parentIdsOf(person.id, relationships).filter((p) =>
      parentIds.has(p),
    );
    if (shared.length === 0) continue;
    siblings.push({
      person,
      rank: rankBetween(self, person),
      sharedParentIds: shared,
    });
  }

  siblings.sort((a, b) =>
    siblingOrderKey(a.person).localeCompare(siblingOrderKey(b.person)),
  );
  return siblings;
}

// Pares de mellizos/gemelos que comparten una hermandad (sin repetir pares).
export function getTwinPairs(
  persons: Record<string, Person>,
  relationships: Relationship[],
): [Person, Person][] {
  const list = Object.values(persons);
  const pairs: [Person, Person][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = list[i];
      const b = list[j];
      if (!isTwin(a, b)) continue;
      const parentsA = parentIdsOf(a.id, relationships);
      const parentsB = parentIdsOf(b.id, relationships);
      if (!parentsA.some((p) => parentsB.includes(p))) continue;
      const key = [a.id, b.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([a, b]);
    }
  }
  return pairs;
}
