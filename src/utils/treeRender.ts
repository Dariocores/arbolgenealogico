import { SYMBOL } from '@/utils/layout';
import type { Person } from '@/types/genealogy';

export function genderClass(gender: string): string {
  if (gender === 'male') return 'male';
  if (gender === 'female') return 'female';
  return 'other';
}

export function symbolPath(gender: string): string {
  const r = SYMBOL / 2;
  if (gender === 'female') {
    return `M ${-r} 0 a ${r} ${r} 0 1 0 ${SYMBOL} 0 a ${r} ${r} 0 1 0 ${-SYMBOL} 0 Z`;
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
