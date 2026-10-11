import type { Person, Relationship, RelationshipType } from '@/types/genealogy';

export function isParentType(type: RelationshipType): boolean {
  return type === 'parent_child' || type === 'adoptive' || type === 'step_parent';
}

export function isSpouseType(type: RelationshipType): boolean {
  return type === 'spouse' || type === 'partner';
}

// Convención: en las relaciones de filiación `personId1` es el progenitor y
// `personId2` el descendiente. Si por error quedó al revés (el supuesto
// descendiente nació antes que el supuesto progenitor) se corrige el orden.
// Sólo se aplica cuando ambos tienen fecha de nacimiento, para no adivinar.
export function normalizeRelationshipDirection(
  rel: Relationship,
  persons: Record<string, Person>,
): Relationship {
  if (!isParentType(rel.type)) return rel;
  const parentDate = persons[rel.personId1]?.birthDate;
  const childDate = persons[rel.personId2]?.birthDate;
  if (!parentDate || !childDate) return rel;
  if (childDate >= parentDate) return rel;
  return { ...rel, personId1: rel.personId2, personId2: rel.personId1 };
}

function relationshipKey(rel: Relationship): string {
  if (isSpouseType(rel.type)) {
    return `${[rel.personId1, rel.personId2].sort().join('|')}|${rel.type}`;
  }
  return `${rel.personId1}|${rel.personId2}|${rel.type}`;
}

export function normalizeRelationships(
  relationships: Relationship[],
  persons: Record<string, Person>,
): Relationship[] {
  const seen = new Set<string>();
  const out: Relationship[] = [];
  for (const rel of relationships) {
    const normalized = normalizeRelationshipDirection(rel, persons);
    const key = relationshipKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}
