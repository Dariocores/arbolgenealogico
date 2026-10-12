import { describe, it, expect } from 'vitest';
import {
  exportGEDCOM,
  importGEDCOM,
  gedcomToIsoDate,
  isoToGedcomDate,
  genderToSex,
  sexToGender,
} from '@/utils/gedcom';
import type { Person, Relationship } from '@/types/genealogy';

const persons: Record<string, Person> = {
  'PERS-0001': {
    id: 'PERS-0001',
    firstName: 'Eduardo',
    lastName: 'Cores',
    gender: 'male',
    birthDate: '1938-05-12',
    birthPlace: 'Galicia, España',
  },
  'PERS-0002': {
    id: 'PERS-0002',
    firstName: 'Ema',
    lastName: 'Ledesma',
    gender: 'female',
    birthDate: '1941-09-20',
  },
  'PERS-0003': {
    id: 'PERS-0003',
    firstName: 'Dario',
    lastName: 'Cores',
    gender: 'male',
    birthDate: '1987-07-06',
  },
};

const relationships: Relationship[] = [
  { id: 'rel-1', personId1: 'PERS-0001', personId2: 'PERS-0002', type: 'spouse' },
  { id: 'rel-2', personId1: 'PERS-0001', personId2: 'PERS-0003', type: 'parent_child' },
  { id: 'rel-3', personId1: 'PERS-0002', personId2: 'PERS-0003', type: 'parent_child' },
];

describe('gedcom date helpers', () => {
  it('convierte ISO a GEDCOM', () => {
    expect(isoToGedcomDate('1938-05-12')).toBe('12 MAY 1938');
  });

  it('convierte GEDCOM a ISO', () => {
    expect(gedcomToIsoDate('12 MAY 1938')).toBe('1938-05-12');
  });

  it('convierte solo año a ISO', () => {
    expect(gedcomToIsoDate('1938')).toBe('1938-01-01');
  });

  it('maneja fechas vacías o inválidas', () => {
    expect(gedcomToIsoDate('')).toBe('');
    expect(gedcomToIsoDate('desconocido')).toBe('');
  });
});

describe('gedcom gender helpers', () => {
  it('mapea género a sexo', () => {
    expect(genderToSex('male')).toBe('M');
    expect(genderToSex('female')).toBe('F');
    expect(genderToSex('nonbinary')).toBe('X');
    expect(genderToSex('other')).toBe('U');
  });

  it('mapea sexo a género', () => {
    expect(sexToGender('M')).toBe('male');
    expect(sexToGender('F')).toBe('female');
    expect(sexToGender('X')).toBe('nonbinary');
    expect(sexToGender('U')).toBe('unknown');
  });
});

describe('exportGEDCOM', () => {
  it('genera cabecera GEDCOM 5.5.5', () => {
    const output = exportGEDCOM(persons, relationships);
    expect(output).toContain('0 HEAD');
    expect(output).toContain('2 VERS 5.5.5');
    expect(output).toContain('0 TRLR');
  });

  it('incluye registros INDI con nombre y sexo', () => {
    const output = exportGEDCOM(persons, relationships);
    expect(output).toMatch(/0 @I\d+@ INDI/);
    expect(output).toContain('1 NAME Eduardo /Cores/');
    expect(output).toContain('1 SEX M');
    expect(output).toContain('2 DATE 12 MAY 1938');
  });

  it('genera una familia con HUSB, WIFE y CHIL', () => {
    const output = exportGEDCOM(persons, relationships);
    expect(output).toContain('0 @F1@ FAM');
    expect(output).toContain('1 HUSB @');
    expect(output).toContain('1 WIFE @');
    expect(output).toContain('1 CHIL @');
  });

  it('genera un FAM para parejas sin hijos', () => {
    const couplePersons: Record<string, Person> = {
      a: { id: 'a', firstName: 'Ana', lastName: 'X', gender: 'female' },
      b: { id: 'b', firstName: 'Bruno', lastName: 'Y', gender: 'male' },
    };
    const coupleRels: Relationship[] = [
      { id: 'r', personId1: 'a', personId2: 'b', type: 'spouse' },
    ];

    const output = exportGEDCOM(couplePersons, coupleRels);
    expect(output).toMatch(/0 @F\d+@ FAM/);
    expect(output).toContain('1 HUSB @');
    expect(output).toContain('1 WIFE @');
  });

  it('exporta notas multilínea con CONT', () => {
    const noted: Record<string, Person> = {
      a: {
        id: 'a',
        firstName: 'Ana',
        lastName: 'X',
        gender: 'female',
        notes: 'linea1\nlinea2\nlinea3',
      },
    };

    const output = exportGEDCOM(noted, []);
    expect(output).toContain('1 NOTE linea1');
    expect(output).toContain('2 CONT linea2');
    expect(output).toContain('2 CONT linea3');
  });
});

describe('importGEDCOM', () => {
  it('hace round-trip de personas y relaciones', () => {
    const gedcom = exportGEDCOM(persons, relationships);
    const parsed = importGEDCOM(gedcom);

    expect(Object.keys(parsed.persons)).toHaveLength(3);
    const dario = Object.values(parsed.persons).find(
      (p) => p.firstName === 'Dario',
    );
    expect(dario).toBeDefined();
    expect(dario?.lastName).toBe('Cores');
    expect(dario?.gender).toBe('male');
    expect(dario?.birthDate).toBe('1987-07-06');

    const eduardo = Object.values(parsed.persons).find(
      (p) => p.firstName === 'Eduardo',
    );
    const ema = Object.values(parsed.persons).find(
      (p) => p.firstName === 'Ema',
    );
    const spouseRel = parsed.relationships.find((r) => r.type === 'spouse');
    expect(spouseRel).toBeDefined();
    expect([spouseRel?.personId1, spouseRel?.personId2].sort()).toEqual(
      [eduardo?.id, ema?.id].sort(),
    );

    const childRel = parsed.relationships.find(
      (r) => r.personId2 === dario?.id && r.type === 'parent_child',
    );
    expect(childRel).toBeDefined();
  });

  it('importa un GEDCOM mínimo', () => {
    const gedcom = [
      '0 HEAD',
      '1 GEDC',
      '2 VERS 5.5.5',
      '0 @I1@ INDI',
      '1 NAME Juan /Perez/',
      '1 SEX M',
      '1 BIRT',
      '2 DATE 01 JAN 2000',
      '0 TRLR',
    ].join('\n');

    const parsed = importGEDCOM(gedcom);
    const juan = Object.values(parsed.persons)[0];
    expect(juan.firstName).toBe('Juan');
    expect(juan.lastName).toBe('Perez');
    expect(juan.gender).toBe('male');
    expect(juan.birthDate).toBe('2000-01-01');
  });

  it('conserva parejas sin hijos en el round-trip', () => {
    const couplePersons: Record<string, Person> = {
      a: { id: 'a', firstName: 'Ana', lastName: 'X', gender: 'female' },
      b: { id: 'b', firstName: 'Bruno', lastName: 'Y', gender: 'male' },
    };
    const coupleRels: Relationship[] = [
      { id: 'r', personId1: 'a', personId2: 'b', type: 'spouse' },
    ];

    const parsed = importGEDCOM(exportGEDCOM(couplePersons, coupleRels));
    const spouses = parsed.relationships.filter((r) => r.type === 'spouse');
    expect(spouses).toHaveLength(1);
  });

  it('hace round-trip de notas multilínea', () => {
    const noted: Record<string, Person> = {
      a: {
        id: 'a',
        firstName: 'Ana',
        lastName: 'X',
        gender: 'unknown',
        notes: 'linea1\nlinea2\nlinea3',
      },
    };

    const parsed = importGEDCOM(exportGEDCOM(noted, []));
    const person = Object.values(parsed.persons)[0];
    expect(person.notes).toBe('linea1\nlinea2\nlinea3');
  });

  it('mapea PEDI adopted a relación adoptive', () => {
    const gedcom = [
      '0 HEAD',
      '0 @I1@ INDI',
      '1 NAME Padre /Uno/',
      '1 SEX M',
      '0 @I2@ INDI',
      '1 NAME Hijo /Dos/',
      '1 SEX M',
      '0 @F1@ FAM',
      '1 HUSB @I1@',
      '1 CHIL @I2@',
      '2 PEDI adopted',
      '0 TRLR',
    ].join('\n');

    const parsed = importGEDCOM(gedcom);
    const parentRel = parsed.relationships.find(
      (r) => r.personId2 === 'I2',
    );
    expect(parentRel?.type).toBe('adoptive');
    expect(parentRel?.isBiological).toBe(false);
  });
});
