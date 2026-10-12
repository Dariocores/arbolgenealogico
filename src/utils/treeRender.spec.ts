import { describe, it, expect } from 'vitest';
import {
  genderClass,
  symbolPath,
  nonBornCode,
  ageAt,
  ageText,
  deathMarkers,
} from '@/utils/treeRender';

describe('treeRender', () => {
  it('clasifica el género no binario por separado', () => {
    expect(genderClass('male')).toBe('male');
    expect(genderClass('female')).toBe('female');
    expect(genderClass('nonbinary')).toBe('nonbinary');
    expect(genderClass('unknown')).toBe('other');
  });

  it('dibuja un triángulo para el género no binario', () => {
    const nonbinary = symbolPath('nonbinary');
    expect(nonbinary).not.toBe(symbolPath('male'));
    expect(nonbinary).not.toBe(symbolPath('unknown'));
    // El triángulo tiene tres vértices.
    expect((nonbinary.match(/[ML]/g) || [])).toHaveLength(3);
  });

  it('devuelve el código de no nacido correcto', () => {
    expect(nonBornCode('miscarriage')).toBe('A.E');
    expect(nonBornCode('abortion')).toBe('A.P');
    expect(nonBornCode('stillborn')).toBe('N.N');
  });

  it('deriva marcadores de la causa de muerte y de abuso', () => {
    expect(deathMarkers({ deathCause: 'Cáncer de pulmón' })).toContain('C.A');
    expect(deathMarkers({ deathCause: 'suicidio' })).toContain('S');
    expect(deathMarkers({ abuse: true })).toContain('A');
    expect(deathMarkers({})).toEqual([]);
  });

  it('calcula la edad a la fecha de fallecimiento', () => {
    expect(ageAt({ birthDate: '1980-01-01', deathDate: '2010-06-01' })).toBe(30);
    expect(ageText({ birthDate: '1980-01-01', deathDate: '2010-06-01' })).toBe(
      '30 años',
    );
  });

  it('no calcula edad sin fecha de nacimiento', () => {
    expect(ageAt({ deathDate: '2010-06-01' })).toBeNull();
    expect(ageText({})).toBe('');
  });
});
