import { describe, it, expect } from 'vitest';
import { computeLayout, NODE_H, NODE_W, SYMBOL_CY } from '@/utils/layout';
import type { Person, Relationship } from '@/types/genealogy';

function person(id: string, firstName: string, lastName: string): Person {
  return { id, firstName, lastName, gender: 'unknown' };
}

describe('computeLayout', () => {
  it('devuelve un layout vacío sin personas', () => {
    const layout = computeLayout({}, []);
    expect(layout.nodes).toEqual([]);
    expect(layout.links).toEqual([]);
    expect(layout.width).toBe(0);
    expect(layout.height).toBe(0);
  });

  it('ubica a los hijos en una generación por debajo de los padres', () => {
    const persons: Record<string, Person> = {
      a: person('a', 'Ana', 'Perez'),
      b: person('b', 'Bruno', 'Perez'),
      c: person('c', 'Carla', 'Perez'),
    };
    const relationships: Relationship[] = [
      { id: 'r1', personId1: 'a', personId2: 'b', type: 'spouse' },
      { id: 'r2', personId1: 'a', personId2: 'c', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

    expect(layout.nodes).toHaveLength(3);
    expect(byId.c.generation).toBeGreaterThan(byId.a.generation);
    expect(byId.c.y).toBeGreaterThan(byId.a.y);
    expect(byId.c.y - byId.a.y).toBeGreaterThanOrEqual(NODE_H);
  });

  it('genera un link de tipo spouse por cada pareja', () => {
    const persons: Record<string, Person> = {
      a: person('a', 'Ana', 'Perez'),
      b: person('b', 'Bruno', 'Perez'),
    };
    const relationships: Relationship[] = [
      { id: 'r1', personId1: 'a', personId2: 'b', type: 'spouse' },
    ];

    const layout = computeLayout(persons, relationships);
    const spouseLinks = layout.links.filter((l) => l.type === 'spouse');
    expect(spouseLinks).toHaveLength(1);
    expect(spouseLinks[0].path.startsWith('M ')).toBe(true);
  });

  it('genera un link de descendencia por cada hijo', () => {
    const persons: Record<string, Person> = {
      a: person('a', 'Ana', 'Perez'),
      c: person('c', 'Carla', 'Perez'),
    };
    const relationships: Relationship[] = [
      { id: 'r2', personId1: 'a', personId2: 'c', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const descentLinks = layout.links.filter((l) => l.type === 'descent');
    expect(descentLinks).toHaveLength(1);
  });

  it('centra al hijo bajo el punto medio de los padres', () => {
    const persons: Record<string, Person> = {
      p1: person('p1', 'Pablo', 'Perez'),
      p2: person('p2', 'Paula', 'Perez'),
      c: person('c', 'Ciro', 'Perez'),
    };
    const relationships: Relationship[] = [
      { id: 'r1', personId1: 'p1', personId2: 'p2', type: 'spouse' },
      { id: 'r2', personId1: 'p1', personId2: 'c', type: 'parent_child' },
      { id: 'r3', personId1: 'p2', personId2: 'c', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

    const childCenter = byId.c.x + NODE_W / 2;
    const parentCenter = (byId.p1.x + byId.p2.x + NODE_W) / 2;
    expect(Math.abs(childCenter - parentCenter)).toBeLessThan(1);
  });

  it('mantiene separadas las ramas de familias distintas', () => {
    const persons: Record<string, Person> = {
      a1: person('a1', 'Ana', 'Alfa'),
      a2: person('a2', 'Aldo', 'Alfa'),
      ca: person('ca', 'Ciro', 'Alfa'),
      b1: person('b1', 'Bea', 'Beta'),
      b2: person('b2', 'Bruno', 'Beta'),
      cb: person('cb', 'Cora', 'Beta'),
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'a1', personId2: 'a2', type: 'spouse' },
      { id: '2', personId1: 'a1', personId2: 'ca', type: 'parent_child' },
      { id: '3', personId1: 'a2', personId2: 'ca', type: 'parent_child' },
      { id: '4', personId1: 'b1', personId2: 'b2', type: 'spouse' },
      { id: '5', personId1: 'b1', personId2: 'cb', type: 'parent_child' },
      { id: '6', personId1: 'b2', personId2: 'cb', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

    const avgA = (byId.a1.x + byId.a2.x) / 2;
    const avgB = (byId.b1.x + byId.b2.x) / 2;

    expect(Math.abs(byId.ca.x - avgA)).toBeLessThan(Math.abs(byId.ca.x - avgB));
    expect(Math.abs(byId.cb.x - avgB)).toBeLessThan(Math.abs(byId.cb.x - avgA));

    const aXs = ['a1', 'a2', 'ca'].map((id) => byId[id].x);
    const bXs = ['b1', 'b2', 'cb'].map((id) => byId[id].x);
    const separated =
      Math.max(...aXs) < Math.min(...bXs) ||
      Math.max(...bXs) < Math.min(...aXs);
    expect(separated).toBe(true);

    const childCenter = byId.ca.x + NODE_W / 2;
    const parentCenter = (byId.a1.x + byId.a2.x + NODE_W) / 2;
    expect(Math.abs(childCenter - parentCenter)).toBeLessThan(NODE_W);
  });

  it('distingue dos ramas que convergen en una pareja', () => {
    const persons: Record<string, Person> = {
      r: person('r', 'Rosendo', 'Gomez'),
      s: person('s', 'Segunda', 'Gomez'),
      m: person('m', 'Maria', 'Gomez'),
      l: person('l', 'Lidia', 'Lopez'),
      a: person('a', 'Andres', 'Lopez'),
      p: person('p', 'Pedro', 'Lopez'),
      n: person('n', 'Nico', 'Gomez'),
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'r', personId2: 's', type: 'spouse' },
      { id: '2', personId1: 'r', personId2: 'm', type: 'parent_child' },
      { id: '3', personId1: 's', personId2: 'm', type: 'parent_child' },
      { id: '4', personId1: 'l', personId2: 'a', type: 'spouse' },
      { id: '5', personId1: 'l', personId2: 'p', type: 'parent_child' },
      { id: '6', personId1: 'a', personId2: 'p', type: 'parent_child' },
      { id: '7', personId1: 'm', personId2: 'p', type: 'spouse' },
      { id: '8', personId1: 'm', personId2: 'n', type: 'parent_child' },
      { id: '9', personId1: 'p', personId2: 'n', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

    const couple = [byId.m, byId.p].sort((a, b) => a.x - b.x);
    expect(Math.abs(byId.m.x - byId.p.x)).toBeLessThanOrEqual(NODE_W * 2);

    const rosendoSide = (byId.r.x + byId.s.x) / 2;
    const lidiaSide = (byId.l.x + byId.a.x) / 2;
    expect(Math.sign(rosendoSide - byId.m.x)).not.toBe(
      Math.sign(lidiaSide - byId.p.x),
    );

    const firstParents = [byId.r.x, byId.s.x];
    const secondParents = [byId.l.x, byId.a.x];
    const separated =
      Math.max(...firstParents) < Math.min(...secondParents) ||
      Math.max(...secondParents) < Math.min(...firstParents);
    expect(separated).toBe(true);
    expect(byId.n.generation).toBeGreaterThan(couple[0].generation);
  });

  it('ordena a los hermanos del mayor al menor (izquierda a derecha)', () => {
    const persons: Record<string, Person> = {
      padre: { ...person('padre', 'Padre', 'Gomez'), gender: 'male' },
      madre: { ...person('madre', 'Madre', 'Gomez'), gender: 'female' },
      mayor: { ...person('mayor', 'Mayor', 'Gomez'), birthDate: '1980-01-01' },
      menor: { ...person('menor', 'Menor', 'Gomez'), birthDate: '1990-01-01' },
      pareja: { ...person('pareja', 'Pareja', 'Lopez'), gender: 'male' },
      nieto: { ...person('nieto', 'Nieto', 'Lopez'), birthDate: '2012-01-01' },
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'padre', personId2: 'madre', type: 'spouse' },
      { id: '2', personId1: 'padre', personId2: 'mayor', type: 'parent_child' },
      { id: '3', personId1: 'madre', personId2: 'mayor', type: 'parent_child' },
      { id: '4', personId1: 'padre', personId2: 'menor', type: 'parent_child' },
      { id: '5', personId1: 'madre', personId2: 'menor', type: 'parent_child' },
      { id: '6', personId1: 'menor', personId2: 'pareja', type: 'spouse' },
      { id: '7', personId1: 'menor', personId2: 'nieto', type: 'parent_child' },
      { id: '8', personId1: 'pareja', personId2: 'nieto', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    expect(byId.mayor.x).toBeLessThan(byId.menor.x);
  });

  it('ubica a la pareja que se incorpora a la izquierda del descendiente', () => {
    const persons: Record<string, Person> = {
      edu: person('edu', 'Eduardo', 'Cores'),
      ema: person('ema', 'Ema', 'Ledesma'),
      dar: person('dar', 'Dario', 'Cores'),
      van: person('van', 'Vanesa', 'Romero'),
      alv: person('alv', 'Alvaro', 'Cores'),
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'edu', personId2: 'ema', type: 'spouse' },
      { id: '2', personId1: 'edu', personId2: 'dar', type: 'parent_child' },
      { id: '3', personId1: 'ema', personId2: 'dar', type: 'parent_child' },
      { id: '4', personId1: 'dar', personId2: 'van', type: 'spouse' },
      { id: '5', personId1: 'dar', personId2: 'alv', type: 'parent_child' },
      { id: '6', personId1: 'van', personId2: 'alv', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    expect(byId.van.x).toBeLessThan(byId.dar.x);
  });

  it('arma Favio-Karina-Dario-Maria: hermana mayor a la izquierda y parejas a la izquierda', () => {
    const persons: Record<string, Person> = {
      rosendo: person('rosendo', 'Rosendo', 'Romero'),
      segunda: person('segunda', 'Segunda', 'Gomez'),
      karina: { ...person('karina', 'Karina', 'Romero'), birthDate: '1974-04-14' },
      maria: { ...person('maria', 'Maria Vanesa', 'Romero'), birthDate: '1987-11-09' },
      favio: person('favio', 'Favio', 'Giampicolo'),
      dario: person('dario', 'Dario', 'Cores'),
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'rosendo', personId2: 'karina', type: 'parent_child' },
      { id: '2', personId1: 'segunda', personId2: 'karina', type: 'parent_child' },
      { id: '3', personId1: 'rosendo', personId2: 'maria', type: 'parent_child' },
      { id: '4', personId1: 'segunda', personId2: 'maria', type: 'parent_child' },
      { id: '5', personId1: 'favio', personId2: 'karina', type: 'spouse' },
      { id: '5b', personId1: 'dario', personId2: 'maria', type: 'spouse' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    const row = [byId.favio, byId.karina, byId.dario, byId.maria].sort(
      (a, b) => a.x - b.x,
    );
    expect(row.map((n) => n.id)).toEqual([
      'favio',
      'karina',
      'dario',
      'maria',
    ]);
  });

  it('ordena medio-hermanos por edad aunque compartan un solo progenitor', () => {
    const persons: Record<string, Person> = {
      padre: { ...person('padre', 'Padre', 'Gomez'), gender: 'male' },
      m1: { ...person('m1', 'M1', 'Gomez'), gender: 'female' },
      m2: { ...person('m2', 'M2', 'Diaz'), gender: 'female' },
      hMayor: { ...person('hMayor', 'HMayor', 'Gomez'), birthDate: '1985-05-01' },
      hMenor: { ...person('hMenor', 'HMenor', 'Gomez'), birthDate: '1992-05-01' },
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'padre', personId2: 'm1', type: 'spouse' },
      { id: '2', personId1: 'padre', personId2: 'm2', type: 'spouse' },
      { id: '3', personId1: 'padre', personId2: 'hMayor', type: 'parent_child' },
      { id: '4', personId1: 'm1', personId2: 'hMayor', type: 'parent_child' },
      { id: '5', personId1: 'padre', personId2: 'hMenor', type: 'parent_child' },
      { id: '6', personId1: 'm2', personId2: 'hMenor', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    expect(byId.hMayor.x).toBeLessThan(byId.hMenor.x);
  });

  it('ignora relaciones que referencian personas inexistentes', () => {
    const persons: Record<string, Person> = { a: person('a', 'Ana', 'Perez') };
    const relationships: Relationship[] = [
      { id: 'r1', personId1: 'a', personId2: 'ghost', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.links).toHaveLength(0);
  });

  it('hace descender a los hijos de una pareja desde el punto medio del matrimonio', () => {
    const persons: Record<string, Person> = {
      padre: { ...person('padre', 'Favio', 'G'), gender: 'male', birthDate: '1975-02-04' },
      madre: { ...person('madre', 'Karina', 'G'), gender: 'female', birthDate: '1974-04-14' },
      hijo1: { ...person('hijo1', 'Fabricio', 'G'), gender: 'male', birthDate: '2004-08-22' },
      hijo2: { ...person('hijo2', 'Brunella', 'G'), gender: 'female', birthDate: '2012-03-16' },
      hijo3: { ...person('hijo3', 'Rafaella', 'G'), gender: 'unknown', birthDate: '2019-10-16' },
    };
    const relationships: Relationship[] = [
      { id: 'r1', personId1: 'padre', personId2: 'madre', type: 'spouse' },
      { id: 'r2', personId1: 'padre', personId2: 'hijo1', type: 'parent_child' },
      { id: 'r3', personId1: 'madre', personId2: 'hijo1', type: 'parent_child' },
      { id: 'r4', personId1: 'padre', personId2: 'hijo2', type: 'parent_child' },
      { id: 'r5', personId1: 'madre', personId2: 'hijo2', type: 'parent_child' },
      { id: 'r6', personId1: 'padre', personId2: 'hijo3', type: 'parent_child' },
      { id: 'r7', personId1: 'madre', personId2: 'hijo3', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

    const coupleMid = (byId.padre.x + byId.madre.x) / 2 + NODE_W / 2;
    const marriageY = byId.padre.y + SYMBOL_CY;
    const childGen = byId.padre.generation + 1;

    const order = [byId.hijo1, byId.hijo2, byId.hijo3]
      .sort((a, b) => a.x - b.x)
      .map((n) => n.id);
    expect(order).toEqual(['hijo1', 'hijo2', 'hijo3']);

    for (const id of ['hijo1', 'hijo2', 'hijo3']) {
      expect(byId[id].generation).toBe(childGen);
      const line = layout.links.find((l) => l.id === `descent-${id}`);
      expect(line?.path.startsWith(`M ${coupleMid} ${marriageY} `)).toBe(true);
    }
  });

  it('agrupa a los hijos bajo sus propios padres y no cruza líneas entre ramas', () => {
    const persons: Record<string, Person> = {
      segunda: { ...person('segunda', 'Segunda', 'Gomez'), gender: 'female' },
      rosendo: { ...person('rosendo', 'Rosendo', 'Romero'), gender: 'male' },
      karina: { ...person('karina', 'Karina', 'Romero'), gender: 'female', birthDate: '1974-04-14' },
      maria: { ...person('maria', 'Maria Vanesa', 'Romero'), gender: 'female', birthDate: '1987-11-09' },
      favio: { ...person('favio', 'Favio', 'Giampicolo'), gender: 'male', birthDate: '1975-02-04' },
      dario: { ...person('dario', 'Dario Andres', 'Cores'), gender: 'male' },
      fabricio: { ...person('fabricio', 'Fabricio', 'Giampicolo'), gender: 'male', birthDate: '2004-08-22' },
      brunella: { ...person('brunella', 'Brunella', 'Giampicolo'), gender: 'female', birthDate: '2012-03-16' },
      rafaella: { ...person('rafaella', 'Rafaella', 'Giampicolo'), gender: 'unknown', birthDate: '2019-10-16' },
      alvaro: { ...person('alvaro', 'Alvaro Gaspar', 'Cores'), gender: 'male' },
    };
    const relationships: Relationship[] = [
      { id: '1', personId1: 'segunda', personId2: 'karina', type: 'parent_child' },
      { id: '2', personId1: 'rosendo', personId2: 'karina', type: 'parent_child' },
      { id: '3', personId1: 'segunda', personId2: 'maria', type: 'parent_child' },
      { id: '4', personId1: 'rosendo', personId2: 'maria', type: 'parent_child' },
      { id: '5', personId1: 'favio', personId2: 'karina', type: 'spouse' },
      { id: '6', personId1: 'dario', personId2: 'maria', type: 'spouse' },
      { id: '7', personId1: 'favio', personId2: 'fabricio', type: 'parent_child' },
      { id: '8', personId1: 'karina', personId2: 'fabricio', type: 'parent_child' },
      { id: '9', personId1: 'favio', personId2: 'brunella', type: 'parent_child' },
      { id: '10', personId1: 'karina', personId2: 'brunella', type: 'parent_child' },
      { id: '11', personId1: 'favio', personId2: 'rafaella', type: 'parent_child' },
      { id: '12', personId1: 'karina', personId2: 'rafaella', type: 'parent_child' },
      { id: '13', personId1: 'dario', personId2: 'alvaro', type: 'parent_child' },
      { id: '14', personId1: 'maria', personId2: 'alvaro', type: 'parent_child' },
    ];

    const layout = computeLayout(persons, relationships);
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

    const gen2 = ['fabricio', 'brunella', 'rafaella', 'alvaro']
      .map((id) => byId[id])
      .sort((a, b) => a.x - b.x)
      .map((n) => n.id);
    expect(gen2).toEqual(['fabricio', 'brunella', 'rafaella', 'alvaro']);

    const alvaroLine = layout.links.find((l) => l.id === 'descent-alvaro');
    const match = alvaroLine?.path.match(/^M ([\d.]+) [\d.]+ V [\d.]+ H ([\d.]+) /);
    expect(match).toBeTruthy();
    expect(match?.[1]).toBe(match?.[2]);
  });
});
