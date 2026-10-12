import { describe, it, expect } from 'vitest';
import type { Person } from '@/types/genealogy';
import {
  analyzeDates,
  findDoubleDates,
  findMaestroDates,
  findMirrorDates,
  findUniversalHeirs,
} from '@/utils/analysis';

function person(
  id: string,
  firstName: string,
  birthDate?: string,
  deathDate?: string,
): Person {
  return { id, firstName, lastName: '', gender: 'unknown', birthDate, deathDate };
}

describe('análisis de fechas', () => {
  it('detecta nacimientos en la misma fecha (±10 días)', () => {
    const persons = {
      a: person('a', 'Ana', '1980-05-10'),
      b: person('b', 'Bea', '1985-05-15'),
    };
    const matches = findDoubleDates(persons);
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe('dobles-anio');
  });

  it('no marca coincidencias fuera de la ventana', () => {
    const persons = {
      a: person('a', 'Ana', '1980-05-10'),
      b: person('b', 'Bea', '1985-08-27'),
    };
    expect(findDoubleDates(persons)).toHaveLength(0);
  });

  it('detecta desplazamientos de 6 meses como maestro', () => {
    const persons = {
      a: person('a', 'Ana', '1980-01-15'),
      b: person('b', 'Bea', '1985-07-15'),
    };
    const matches = findMaestroDates(persons);
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe('maestro');
  });

  it('detecta fechas espejo (día y mes intercambiados)', () => {
    const persons = {
      a: person('a', 'Ana', '1980-03-12'),
      b: person('b', 'Bea', '1985-12-03'),
    };
    const matches = findMirrorDates(persons);
    expect(matches).toHaveLength(1);
    expect(matches[0].aName).toBe('Ana');
  });

  it('detecta heredero universal (nacimiento el día del fallecimiento)', () => {
    const persons = {
      a: person('a', 'Ana', '1940-02-20', '2005-11-09'),
      b: person('b', 'Bea', '1987-11-09'),
    };
    const matches = findUniversalHeirs(persons);
    expect(matches).toHaveLength(1);
    expect(matches[0].bName).toBe('Bea');
  });

  it('analyzeDates combina todos los tipos', () => {
    const persons = {
      a: person('a', 'Ana', '1980-05-10'),
      b: person('b', 'Bea', '1985-05-15'),
      c: person('c', 'Ciro', '1990-12-03'),
      d: person('d', 'Dora', '1991-03-12'),
    };
    const kinds = new Set(analyzeDates(persons).map((m) => m.kind));
    expect(kinds.has('dobles-anio')).toBe(true);
    expect(kinds.has('espejo')).toBe(true);
  });
});
