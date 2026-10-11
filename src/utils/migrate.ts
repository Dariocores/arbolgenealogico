import type {
  Gender,
  Person,
  Relationship,
  RelationshipType,
} from '@/types/genealogy';

export type LegacyGender = 'hombre' | 'mujer' | 'otro';
export type LegacyParentType =
  | 'biologico'
  | 'adoptivo'
  | 'padrastro'
  | 'madrastra';

export interface LegacyMember {
  id?: string;
  nombre: string;
  genero: LegacyGender;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  biography?: string;
  photo?: string;
  ocupacion?: string;
  religion?: string;
  notas?: string;
  padres?: string[];
  hijos?: string[];
  hermanos?: string[];
  esposos?: string[];
  abuelos?: string[];
  bisabuelos?: string[];
  tipoPadre?: Record<string, LegacyParentType>;
  estadoMatrimonio?: Record<string, string>;
  divorceDate?: Record<string, string>;
}

export interface MigratedTree {
  persons: Record<string, Person>;
  relationships: Relationship[];
}

function mapGender(genero: LegacyGender): Gender {
  if (genero === 'hombre') return 'male';
  if (genero === 'mujer') return 'female';
  return 'other';
}

function splitName(nombre: string): { firstName: string; lastName: string } {
  const clean = nombre.trim();
  if (!clean) return { firstName: '', lastName: '' };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const lastName = parts.pop() as string;
  return { firstName: parts.join(' '), lastName };
}

function mapParentType(type: LegacyParentType | undefined): RelationshipType {
  if (type === 'adoptivo') return 'adoptive';
  if (type === 'padrastro' || type === 'madrastra') return 'step_parent';
  return 'parent_child';
}

export function migrateLegacyMembers(
  members: Record<string, LegacyMember>,
): MigratedTree {
  const now = new Date().toISOString();
  const persons: Record<string, Person> = {};
  const idByName = new Map<string, string>();

  let index = 0;
  for (const [key, member] of Object.entries(members)) {
    index += 1;
    const id = member.id || `PERS-${String(index).padStart(4, '0')}`;
    idByName.set(member.nombre, id);
    idByName.set(key, id);
    const { firstName, lastName } = splitName(member.nombre);
    persons[id] = {
      id,
      firstName,
      lastName,
      gender: mapGender(member.genero),
      birthDate: member.birthDate || undefined,
      birthPlace: member.birthPlace || undefined,
      deathDate: member.deathDate || undefined,
      deathPlace: member.deathPlace || undefined,
      occupation: member.ocupacion || undefined,
      religion: member.religion || undefined,
      photoUrl: member.photo || undefined,
      notes: member.notas || member.biography || undefined,
      metadata: { createdAt: now, updatedAt: now },
    };
  }

  const relationships: Relationship[] = [];
  let relIndex = 0;
  const pushRelationship = (rel: Omit<Relationship, 'id'>) => {
    relIndex += 1;
    relationships.push({ ...rel, id: `rel-${relIndex}` });
  };

  const spouseSeen = new Set<string>();

  for (const [key, member] of Object.entries(members)) {
    const selfId = idByName.get(member.nombre) || idByName.get(key);
    if (!selfId) continue;

    for (const parentName of member.padres || []) {
      const parentId = idByName.get(parentName);
      if (!parentId) continue;
      const type = mapParentType(member.tipoPadre?.[parentName]);
      pushRelationship({
        personId1: parentId,
        personId2: selfId,
        type,
        isBiological: type === 'parent_child',
      });
    }

    for (const spouseName of member.esposos || []) {
      const spouseId = idByName.get(spouseName);
      if (!spouseId) continue;
      const key = [selfId, spouseId].sort().join('|');
      if (spouseSeen.has(key)) continue;
      spouseSeen.add(key);
      const status = member.estadoMatrimonio?.[spouseName];
      const divorce = member.divorceDate?.[spouseName];
      const notes =
        status && status !== 'casado'
          ? `${status}${divorce ? ` (${divorce})` : ''}`
          : undefined;
      pushRelationship({
        personId1: selfId,
        personId2: spouseId,
        type: 'spouse',
        divorceDate: divorce || undefined,
        notes,
      });
    }
  }

  return { persons, relationships };
}

export function migrateFromStorage(): MigratedTree | null {
  if (typeof localStorage === 'undefined') return null;

  const treeName = localStorage.getItem('familyTree_current') || 'default';
  const raw =
    localStorage.getItem(`familyTree_${treeName}`) ||
    localStorage.getItem('familyTree');

  if (!raw) return null;

  try {
    const members = JSON.parse(raw) as Record<string, LegacyMember>;
    if (!members || typeof members !== 'object') return null;
    if (!Object.keys(members).length) return null;
    return migrateLegacyMembers(members);
  } catch {
    return null;
  }
}
