import type { Person } from '@/types/genealogy';
import { fullName } from '@/utils/treeRender';

// Ventana por defecto (±10 días) según el material de enfoque sistémico.
export const DEFAULT_WINDOW_DAYS = 10;

export type DateMatchKind =
  | 'dobles-anio'
  | 'dobles-meses'
  | 'maestro'
  | 'espejo'
  | 'heredero';

export interface DateMatch {
  id: string;
  kind: DateMatchKind;
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  detail: string;
}

export interface AnalysisOptions {
  windowDays?: number;
}

interface Parts {
  y: number;
  m: number;
  d: number;
}

function parse(iso?: string): Parts | null {
  if (!iso) return null;
  const match = iso.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y: Number(match[1]), m, d };
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function dayOfYear(m: number, d: number): number {
  let total = 0;
  for (let i = 0; i < m - 1; i += 1) total += DAYS_IN_MONTH[i];
  return total + d;
}

function circularDayDiff(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 365 - raw);
}

function pname(p: Person): string {
  return fullName(p) || '(sin nombre)';
}

// "Dobles" por fecha: mismo día (± ventana) o desplazados exactamente 3, 6 o 9
// meses con el mismo día del mes (± ventana). Cuando el desplazamiento es de 6
// meses se etiqueta como "maestro".
export function findDoubleDates(
  persons: Record<string, Person>,
  options: AnalysisOptions = {},
): DateMatch[] {
  const window = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const list = Object.values(persons);
  const out: DateMatch[] = [];

  for (let i = 0; i < list.length; i += 1) {
    const a = parse(list[i].birthDate);
    if (!a) continue;
    for (let j = i + 1; j < list.length; j += 1) {
      const b = parse(list[j].birthDate);
      if (!b) continue;

      const dayDiff = circularDayDiff(dayOfYear(a.m, a.d), dayOfYear(b.m, b.d));
      if (dayDiff <= window) {
        out.push({
          id: `dobles-anio-${list[i].id}-${list[j].id}`,
          kind: 'dobles-anio',
          aId: list[i].id,
          bId: list[j].id,
          aName: pname(list[i]),
          bName: pname(list[j]),
          detail: `Nacimientos a ${dayDiff} día(s) de distancia`,
        });
        continue;
      }

      const monthShift = (((b.m - a.m) % 12) + 12) % 12;
      const monthShiftBack = (((a.m - b.m) % 12) + 12) % 12;
      const dayGap = Math.abs(a.d - b.d);
      const shift = [3, 6, 9].find(
        (s) => (monthShift === s || monthShiftBack === s) && dayGap <= window,
      );
      if (shift) {
        out.push({
          id: `dobles-meses-${list[i].id}-${list[j].id}`,
          kind: shift === 6 ? 'maestro' : 'dobles-meses',
          aId: list[i].id,
          bId: list[j].id,
          aName: pname(list[i]),
          bName: pname(list[j]),
          detail: `Nacimientos desplazados ${shift} meses (±${dayGap} día/s)`,
        });
      }
    }
  }

  return out;
}

export function findMaestroDates(
  persons: Record<string, Person>,
  options: AnalysisOptions = {},
): DateMatch[] {
  return findDoubleDates(persons, options).filter((m) => m.kind === 'maestro');
}

// Fechas "espejo": el día de uno coincide con el mes del otro y viceversa.
export function findMirrorDates(persons: Record<string, Person>): DateMatch[] {
  const list = Object.values(persons);
  const out: DateMatch[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const a = parse(list[i].birthDate);
    if (!a) continue;
    for (let j = i + 1; j < list.length; j += 1) {
      const b = parse(list[j].birthDate);
      if (!b) continue;
      if (a.d === b.m && a.m === b.d && a.d !== a.m) {
        out.push({
          id: `espejo-${list[i].id}-${list[j].id}`,
          kind: 'espejo',
          aId: list[i].id,
          bId: list[j].id,
          aName: pname(list[i]),
          bName: pname(list[j]),
          detail: `Fechas espejo (${a.d}/${a.m} ↔ ${b.d}/${b.m})`,
        });
      }
    }
  }
  return out;
}

// "Heredero universal": coincide el día y mes de un fallecimiento con el
// nacimiento de otra persona (o con otro fallecimiento).
export function findUniversalHeirs(persons: Record<string, Person>): DateMatch[] {
  const list = Object.values(persons);
  const out: DateMatch[] = [];
  for (const deceased of list) {
    const death = parse(deceased.deathDate);
    if (!death) continue;
    for (const other of list) {
      if (other.id === deceased.id) continue;
      const birth = parse(other.birthDate);
      if (!birth) continue;
      if (birth.m === death.m && birth.d === death.d) {
        out.push({
          id: `heredero-${deceased.id}-${other.id}`,
          kind: 'heredero',
          aId: deceased.id,
          bId: other.id,
          aName: pname(deceased),
          bName: pname(other),
          detail: `Nace el mismo día/mes en que falleció ${pname(deceased)}`,
        });
      }
    }
  }
  return out;
}

export function analyzeDates(
  persons: Record<string, Person>,
  options: AnalysisOptions = {},
): DateMatch[] {
  return [
    ...findDoubleDates(persons, options),
    ...findMirrorDates(persons),
    ...findUniversalHeirs(persons),
  ];
}

const KIND_LABELS: Record<DateMatchKind, string> = {
  'dobles-anio': 'Dobles (anual)',
  'dobles-meses': 'Dobles (meses)',
  maestro: 'Maestro',
  espejo: 'Espejo',
  heredero: 'Heredero universal',
};

export function matchKindLabel(kind: DateMatchKind): string {
  return KIND_LABELS[kind] ?? kind;
}
