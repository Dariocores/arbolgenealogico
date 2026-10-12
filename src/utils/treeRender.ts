import { SYMBOL } from '@/utils/layout';
import type { NonBornStatus, Person } from '@/types/genealogy';

export function genderClass(gender: string): string {
  if (gender === 'male') return 'male';
  if (gender === 'female') return 'female';
  if (gender === 'nonbinary') return 'nonbinary';
  return 'other';
}

export function symbolPath(gender: string): string {
  const r = SYMBOL / 2;
  if (gender === 'female') {
    return `M ${-r} 0 a ${r} ${r} 0 1 0 ${SYMBOL} 0 a ${r} ${r} 0 1 0 ${-SYMBOL} 0 Z`;
  }
  if (gender === 'nonbinary') {
    return `M 0 ${-r} L ${r} ${r} L ${-r} ${r} Z`;
  }
  if (gender === 'other' || gender === 'unknown') {
    return `M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`;
  }
  return `M ${-r} ${-r} H ${r} V ${r} H ${-r} Z`;
}

export function deceasedLine(gender: string): [number, number, number, number] {
  const r = SYMBOL / 2;
  let d = r;
  if (gender === 'female') d = r / Math.SQRT2;
  else if (gender === 'other' || gender === 'unknown') d = r / 2;
  return [-d, d, d, -d];
}

// Código de "no nacido": A.E (aborto espontáneo), A.P (aborto provocado),
// N.N (no nacido / mortinato).
export function nonBornCode(status: NonBornStatus | undefined): string {
  if (status === 'miscarriage') return 'A.E';
  if (status === 'abortion') return 'A.P';
  return 'N.N';
}

export function nonBornLabel(status: NonBornStatus | undefined): string {
  if (status === 'miscarriage') return 'Aborto espontáneo';
  if (status === 'abortion') return 'Aborto provocado';
  return 'No nacido/a';
}

// Marcadores clínicos que se anotan junto al símbolo.
export function deathMarkers(person: {
  deathCause?: string;
  abuse?: boolean;
}): string[] {
  const out: string[] = [];
  const cause = (person.deathCause || '').toLowerCase();
  if (cancerWords.some((w) => cause.includes(w))) out.push('C.A');
  if (suicideWords.some((w) => cause.includes(w))) out.push('S');
  if (person.abuse) out.push('A');
  return out;
}

const cancerWords = ['cáncer', 'cancer', 'c.a', 'tumor', 'oncol'];
const suicideWords = ['suicid', 's.'];


export function lifeSpan(person: {
  birthDate?: string;
  deathDate?: string;
}): string {
  const birth = person.birthDate || '';
  const death = person.deathDate || '';
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return birth;
  if (death) return `† ${death}`;
  return '';
}

function parseDate(value: string | undefined): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
  if (!match) return null;
  return {
    y: Number(match[1]),
    m: match[2] ? Number(match[2]) : 1,
    d: match[3] ? Number(match[3]) : 1,
  };
}

// Edad en años a una fecha dada; por defecto, a la fecha de fallecimiento o,
// si vive, a hoy.
export function ageAt(
  person: { birthDate?: string; deathDate?: string },
  at: Date = new Date(),
): number | null {
  const birth = parseDate(person.birthDate);
  if (!birth) return null;
  const death = parseDate(person.deathDate);
  const ref = death ? new Date(death.y, death.m - 1, death.d) : at;
  let age = ref.getFullYear() - birth.y;
  const beforeBirthday =
    ref.getMonth() + 1 < birth.m ||
    (ref.getMonth() + 1 === birth.m && ref.getDate() < birth.d);
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

export function ageText(person: { birthDate?: string; deathDate?: string }): string {
  const age = ageAt(person);
  if (age === null) return '';
  return `${age} años`;
}

export function toRoman(value: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = value;
  let out = '';
  for (const [num, symbol] of table) {
    while (remaining >= num) {
      out += symbol;
      remaining -= num;
    }
  }
  return out;
}

export function fullName(person: Person): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
