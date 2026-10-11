import type {
  Gender,
  Person,
  Relationship,
  RelationshipType,
} from '@/types/genealogy';

export interface ParsedGEDCOM {
  persons: Record<string, Person>;
  relationships: Relationship[];
}

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const MONTH_INDEX: Record<string, string> = MONTHS.reduce(
  (acc, m, i) => {
    acc[m] = String(i + 1).padStart(2, '0');
    return acc;
  },
  {} as Record<string, string>,
);

const PARENT_TYPES: RelationshipType[] = [
  'parent_child',
  'adoptive',
  'step_parent',
];

export function genderToSex(gender: Gender): string {
  if (gender === 'male') return 'M';
  if (gender === 'female') return 'F';
  return 'U';
}

export function sexToGender(sex: string): Gender {
  const value = sex.trim().toUpperCase();
  if (value === 'M') return 'male';
  if (value === 'F') return 'female';
  return 'unknown';
}

export function isoToGedcomDate(iso?: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const month = MONTHS[parseInt(m[2], 10) - 1];
  if (!month) return iso;
  return `${parseInt(m[3], 10)} ${month} ${m[1]}`;
}

export function gedcomToIsoDate(value: string): string {
  const clean = value.trim().toUpperCase();
  if (!clean) return '';
  const m = clean.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/);
  if (m) {
    const month = MONTH_INDEX[m[2]] || '01';
    return `${m[3]}-${month}-${m[1].padStart(2, '0')}`;
  }
  if (/^\d{4}$/.test(clean)) return `${clean}-01-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return '';
}

function pediFor(type: RelationshipType): string | null {
  if (type === 'adoptive') return 'adopted';
  if (type === 'step_parent') return 'foster';
  return null;
}

function typeFromPedi(pedi?: string): RelationshipType {
  if (pedi === 'adopted') return 'adoptive';
  if (pedi === 'foster') return 'step_parent';
  return 'parent_child';
}

function parseName(value: string): { firstName: string; lastName: string } {
  const slash = value.match(/^(.*?)\s*\/([^/]*)\//);
  if (slash) {
    return { firstName: slash[1].trim(), lastName: slash[2].trim() };
  }
  const clean = value.trim();
  return { firstName: clean, lastName: '' };
}

function pushTextValue(
  lines: string[],
  level: number,
  tag: string,
  value: string,
): void {
  const parts = value.split(/\r?\n/);
  lines.push(`${level} ${tag} ${parts[0]}`);
  for (let i = 1; i < parts.length; i += 1) {
    lines.push(`${level + 1} CONT ${parts[i]}`);
  }
}

export function exportGEDCOM(
  persons: Record<string, Person>,
  relationships: Relationship[],
  treeName = 'Árbol Genealógico',
): string {
  const lines: string[] = [];
  const now = new Date();
  const today = `${now.getDate().toString().padStart(2, '0')} ${
    MONTHS[now.getMonth()]
  } ${now.getFullYear()}`;

  lines.push('0 HEAD');
  lines.push('1 SOUR ARBOLGENEALOGICO');
  lines.push(`2 NAME ${treeName}`);
  lines.push('2 VERS 2.0.0');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.5');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');
  lines.push(`1 DATE ${today}`);

  const idMap = new Map<string, string>();
  Object.values(persons).forEach((person, index) => {
    const gid = `I${index + 1}`;
    idMap.set(person.id, gid);
    lines.push(`0 @${gid}@ INDI`);
    lines.push(`1 NAME ${person.firstName} /${person.lastName}/`);
    lines.push(`1 SEX ${genderToSex(person.gender)}`);
    if (person.occupation) pushTextValue(lines, 1, 'OCCU', person.occupation);
    if (person.religion) pushTextValue(lines, 1, 'RELI', person.religion);
    if (person.notes) pushTextValue(lines, 1, 'NOTE', person.notes);
    if (person.birthDate || person.birthPlace) {
      lines.push('1 BIRT');
      if (person.birthDate) lines.push(`2 DATE ${isoToGedcomDate(person.birthDate)}`);
      if (person.birthPlace) pushTextValue(lines, 2, 'PLAC', person.birthPlace);
    }
    if (person.deathDate || person.deathPlace) {
      lines.push('1 DEAT');
      if (person.deathDate) lines.push(`2 DATE ${isoToGedcomDate(person.deathDate)}`);
      if (person.deathPlace) pushTextValue(lines, 2, 'PLAC', person.deathPlace);
    }
  });

  const parentRels = relationships.filter((r) =>
    (PARENT_TYPES as string[]).includes(r.type),
  );

  const childrenByParent = new Map<string, Relationship[]>();
  for (const rel of parentRels) {
    const arr = childrenByParent.get(rel.personId1) || [];
    arr.push(rel);
    childrenByParent.set(rel.personId1, arr);
  }

  const coupleSeen = new Set<string>();
  const couples: Relationship[] = [];
  for (const rel of relationships) {
    if (rel.type !== 'spouse' && rel.type !== 'partner') continue;
    const key = [rel.personId1, rel.personId2].sort().join('|');
    if (coupleSeen.has(key)) continue;
    coupleSeen.add(key);
    couples.push(rel);
  }

  const coveredChildRels = new Set<string>();
  let famIndex = 0;

  for (const rel of couples) {
    const a = persons[rel.personId1];
    const b = persons[rel.personId2];
    if (!a || !b) continue;
    const husband = a.gender === 'female' ? b : a;
    const wife = a.gender === 'female' ? a : b;
    const hid = idMap.get(husband.id);
    const wid = idMap.get(wife.id);

    const hChildren = new Map(
      (childrenByParent.get(husband.id) || []).map((r) => [r.personId2, r]),
    );
    const wChildren = new Map(
      (childrenByParent.get(wife.id) || []).map((r) => [r.personId2, r]),
    );
    const shared = [...hChildren.keys()].filter((id) => wChildren.has(id));

    famIndex++;
    const fid = `F${famIndex}`;
    lines.push(`0 @${fid}@ FAM`);
    if (hid) lines.push(`1 HUSB @${hid}@`);
    if (wid) lines.push(`1 WIFE @${wid}@`);

    for (const childId of shared) {
      const cid = idMap.get(childId);
      if (!cid) continue;
      lines.push(`1 CHIL @${cid}@`);
      const hRel = hChildren.get(childId)!;
      const wRel = wChildren.get(childId)!;
      coveredChildRels.add(hRel.id);
      coveredChildRels.add(wRel.id);
      const pedi =
        pediFor(hRel.type) ||
        pediFor(wRel.type) ||
        (hRel.isBiological === false || wRel.isBiological === false
          ? 'adopted'
          : null);
      if (pedi) lines.push(`2 PEDI ${pedi}`);
    }
  }

  const orphanByParent = new Map<string, Relationship[]>();
  for (const rel of parentRels) {
    if (coveredChildRels.has(rel.id)) continue;
    const arr = orphanByParent.get(rel.personId1) || [];
    arr.push(rel);
    orphanByParent.set(rel.personId1, arr);
  }

  for (const [parentId, rels] of orphanByParent) {
    const parent = persons[parentId];
    const pid = idMap.get(parentId);
    if (!parent || !pid) continue;
    famIndex++;
    const fid = `F${famIndex}`;
    lines.push(`0 @${fid}@ FAM`);
    lines.push(
      parent.gender === 'female' ? `1 WIFE @${pid}@` : `1 HUSB @${pid}@`,
    );
    for (const rel of rels) {
      const cid = idMap.get(rel.personId2);
      if (!cid) continue;
      lines.push(`1 CHIL @${cid}@`);
      const pedi = pediFor(rel.type) ||
        (rel.isBiological === false ? 'adopted' : null);
      if (pedi) lines.push(`2 PEDI ${pedi}`);
    }
  }

  lines.push('0 TRLR');
  return lines.join('\n') + '\n';
}

interface IndiTemp {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  birthPlace: string;
  deathDate: string;
  deathPlace: string;
  occupation: string;
  religion: string;
  notes: string;
}

interface FamChild {
  id: string;
  pedi?: string;
}

interface FamTemp {
  id: string;
  husb?: string;
  wife?: string;
  children: FamChild[];
}

export function importGEDCOM(gedcom: string): ParsedGEDCOM {
  const indis = new Map<string, IndiTemp>();
  const fams: FamTemp[] = [];

  let currentType: 'INDI' | 'FAM' | '' = '';
  let currentId = '';
  let currentEvent = '';
  let lastLine1 = '';
  let lastLine2 = '';

  for (const rawLine of gedcom.split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, '');
    const match = line.match(/^(\d+)\s+(?:@([^@]+)@\s+)?(\w+)(?:\s+(.*))?$/);
    if (!match) continue;
    const level = parseInt(match[1], 10);
    const xref = match[2] || '';
    const tag = match[3];
    const value = match[4] || '';

    if (level === 0) {
      currentEvent = '';
      if (tag === 'INDI' && xref) {
        currentType = 'INDI';
        currentId = xref;
        indis.set(xref, {
          id: xref,
          firstName: '',
          lastName: '',
          gender: 'unknown',
          birthDate: '',
          birthPlace: '',
          deathDate: '',
          deathPlace: '',
          occupation: '',
          religion: '',
          notes: '',
        });
      } else if (tag === 'FAM' && xref) {
        currentType = 'FAM';
        currentId = xref;
        fams.push({ id: xref, children: [] });
      } else {
        currentType = '';
      }
      continue;
    }

    if (level === 1 && currentType === 'INDI') {
      const indi = indis.get(currentId);
      if (!indi) continue;
      currentEvent = tag === 'BIRT' || tag === 'DEAT' ? tag : '';
      lastLine1 = tag;
      lastLine2 = '';
      if (tag === 'NAME') {
        const parsed = parseName(value);
        indi.firstName = parsed.firstName;
        indi.lastName = parsed.lastName;
      } else if (tag === 'SEX') {
        indi.gender = sexToGender(value);
      } else if (tag === 'OCCU') {
        indi.occupation = value;
      } else if (tag === 'RELI') {
        indi.religion = value;
      } else if (tag === 'NOTE') {
        indi.notes = value;
      }
      continue;
    }

    if (level === 1 && currentType === 'FAM') {
      const fam = fams[fams.length - 1];
      if (!fam || fam.id !== currentId) continue;
      if (tag === 'HUSB') fam.husb = value.replace(/@/g, '').trim();
      else if (tag === 'WIFE') fam.wife = value.replace(/@/g, '').trim();
      else if (tag === 'CHIL') {
        fam.children.push({ id: value.replace(/@/g, '').trim() });
      }
      continue;
    }

    if (
      currentType === 'INDI' &&
      tag === 'CONT' &&
      (lastLine2 === 'PLAC' || lastLine1)
    ) {
      const indi = indis.get(currentId);
      if (indi) {
        if (lastLine2 === 'PLAC' && currentEvent) {
          if (currentEvent === 'BIRT') indi.birthPlace += `\n${value}`;
          else if (currentEvent === 'DEAT') indi.deathPlace += `\n${value}`;
        } else if (lastLine1 === 'NOTE') {
          indi.notes += `\n${value}`;
        } else if (lastLine1 === 'OCCU') {
          indi.occupation += `\n${value}`;
        } else if (lastLine1 === 'RELI') {
          indi.religion += `\n${value}`;
        }
      }
      continue;
    }

    if (level === 2 && currentType === 'INDI' && currentEvent) {
      const indi = indis.get(currentId);
      if (!indi) continue;
      lastLine2 = tag;
      if (tag === 'DATE') {
        if (currentEvent === 'BIRT') indi.birthDate = gedcomToIsoDate(value);
        else if (currentEvent === 'DEAT') indi.deathDate = gedcomToIsoDate(value);
      } else if (tag === 'PLAC') {
        if (currentEvent === 'BIRT') indi.birthPlace = value;
        else if (currentEvent === 'DEAT') indi.deathPlace = value;
      }
      continue;
    }

    if (level === 2 && currentType === 'FAM') {
      const fam = fams[fams.length - 1];
      if (!fam || fam.id !== currentId) continue;
      if (tag === 'PEDI' && fam.children.length > 0) {
        fam.children[fam.children.length - 1].pedi = value.trim().toLowerCase();
      }
    }
  }

  const now = new Date().toISOString();
  const persons: Record<string, Person> = {};
  for (const indi of indis.values()) {
    persons[indi.id] = {
      id: indi.id,
      firstName: indi.firstName,
      lastName: indi.lastName,
      gender: indi.gender,
      birthDate: indi.birthDate || undefined,
      birthPlace: indi.birthPlace || undefined,
      deathDate: indi.deathDate || undefined,
      deathPlace: indi.deathPlace || undefined,
      occupation: indi.occupation || undefined,
      religion: indi.religion || undefined,
      notes: indi.notes || undefined,
      metadata: { createdAt: now, updatedAt: now },
    };
  }

  const relationships: Relationship[] = [];
  let relIndex = 0;
  const pushRelationship = (rel: Omit<Relationship, 'id'>) => {
    relIndex += 1;
    relationships.push({ ...rel, id: `rel-${relIndex}` });
  };

  for (const fam of fams) {
    const husbExists = fam.husb ? !!persons[fam.husb] : false;
    const wifeExists = fam.wife ? !!persons[fam.wife] : false;

    if (fam.husb && fam.wife && husbExists && wifeExists) {
      pushRelationship({
        personId1: fam.husb,
        personId2: fam.wife,
        type: 'spouse',
      });
    }

    for (const child of fam.children) {
      if (!persons[child.id]) continue;
      const type = typeFromPedi(child.pedi);
      if (fam.husb && husbExists) {
        pushRelationship({
          personId1: fam.husb,
          personId2: child.id,
          type,
          isBiological: type === 'parent_child',
        });
      }
      if (fam.wife && wifeExists) {
        pushRelationship({
          personId1: fam.wife,
          personId2: child.id,
          type,
          isBiological: type === 'parent_child',
        });
      }
    }
  }

  return { persons, relationships };
}
