import { describe, it, expect } from 'vitest';
import { buildTreeSvg, svgDimensions } from '@/utils/svgExport';
import type { Person, Relationship } from '@/types/genealogy';

function person(id: string, firstName: string, lastName: string): Person {
  return { id, firstName, lastName, gender: 'unknown' };
}

describe('buildTreeSvg', () => {
  it('incluye el título, los nombres y las generaciones', () => {
    const persons: Record<string, Person> = {
      a: { ...person('a', 'Ana', 'Perez'), gender: 'female', birthDate: '1950-01-01' },
      b: { ...person('b', 'Bruno', 'Perez'), gender: 'male', deathDate: '2010-05-05' },
      c: { ...person('c', 'Carla', 'Perez'), gender: 'female' },
    };
    const relationships: Relationship[] = [
      { id: 'r1', personId1: 'a', personId2: 'b', type: 'spouse' },
      { id: 'r2', personId1: 'a', personId2: 'c', type: 'parent_child' },
    ];

    const svg = buildTreeSvg(persons, relationships, { title: 'Mi familia' });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Mi familia');
    expect(svg).toContain('Ana Perez');
    expect(svg).toContain('Bruno Perez');
    expect(svg).toContain('Carla Perez');
    expect(svg).toContain('1950-01-01');
    expect(svg).toContain('2010-05-05');
    expect(svg).toContain('stroke-dasharray="6 4"');
    expect(svg).toContain('>I<');
    expect(svg).toContain('>II<');
  });

  it('devuelve un mensaje cuando no hay personas', () => {
    const svg = buildTreeSvg({}, []);
    expect(svg).toContain('No hay miembros para mostrar.');
  });

  it('escapa caracteres especiales de los nombres', () => {
    const persons: Record<string, Person> = {
      a: { ...person('a', 'Ana & <Luz>', 'Pérez "la"') },
    };
    const svg = buildTreeSvg(persons, []);
    expect(svg).toContain('Ana &amp; &lt;Luz&gt;');
    expect(svg).not.toContain('<Luz>');
  });

  it('svgDimensions lee el tamaño real del root y no el de la leyenda', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1080.567" height="700.25" viewBox="0 0 1080.567 700.25">' +
      '<rect width="12" height="12" fill="#000"/></svg>';
    expect(svgDimensions(svg)).toEqual({ width: 1081, height: 701 });
  });

  it('svgDimensions usa el fallback si no hay medidas', () => {
    expect(svgDimensions('<svg/>')).toEqual({ width: 1200, height: 800 });
  });
});
