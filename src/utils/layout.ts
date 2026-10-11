import type { Person, Relationship } from '@/types/genealogy';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  generation: number;
  person: Person;
}

export interface LayoutLink {
  id: string;
  type: 'spouse' | 'descent';
  path: string;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
}

export const NODE_W = 170;
export const NODE_H = 100;
export const SYMBOL = 52;
export const SYMBOL_TOP = 8;
export const SYMBOL_CY = SYMBOL_TOP + SYMBOL / 2;
const H_GAP = 40;
const V_GAP = 70;
const MARGIN = 40;

function addTo(map: Map<string, string[]>, key: string, value: string): void {
  const arr = map.get(key);
  if (arr) {
    if (!arr.includes(value)) arr.push(value);
  } else {
    map.set(key, [value]);
  }
}

function isotonic(values: number[]): number[] {
  const means: number[] = [];
  const weights: number[] = [];
  for (const value of values) {
    let v = value;
    let w = 1;
    while (means.length && means[means.length - 1] > v) {
      const pm = means.pop() as number;
      const pw = weights.pop() as number;
      v = (pm * pw + v * w) / (pw + w);
      w += pw;
    }
    means.push(v);
    weights.push(w);
  }
  const out: number[] = [];
  for (let i = 0; i < means.length; i += 1) {
    for (let j = 0; j < weights[i]; j += 1) out.push(means[i]);
  }
  return out;
}

export function computeLayout(
  persons: Record<string, Person>,
  relationships: Relationship[],
): TreeLayout {
  const people = Object.values(persons);
  if (people.length === 0) {
    return {
      nodes: [],
      links: [],
      width: 0,
      height: 0,
      nodeWidth: NODE_W,
      nodeHeight: NODE_H,
    };
  }

  const spouseMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  const childMap = new Map<string, string[]>();
  const spouseRels: Relationship[] = [];
  const parentRels: Relationship[] = [];

  for (const rel of relationships) {
    if (!persons[rel.personId1] || !persons[rel.personId2]) continue;
    if (rel.type === 'spouse' || rel.type === 'partner') {
      spouseRels.push(rel);
      addTo(spouseMap, rel.personId1, rel.personId2);
      addTo(spouseMap, rel.personId2, rel.personId1);
    } else {
      parentRels.push(rel);
      addTo(parentMap, rel.personId2, rel.personId1);
      addTo(childMap, rel.personId1, rel.personId2);
    }
  }

  const gen = new Map<string, number>();
  for (const p of people) {
    if (!(parentMap.get(p.id)?.length)) gen.set(p.id, 0);
  }
  let changed = true;
  let guard = 0;
  while (changed && guard < 10000) {
    changed = false;
    guard += 1;
    for (const rel of parentRels) {
      const pg = gen.get(rel.personId1);
      if (pg === undefined) continue;
      const cur = gen.get(rel.personId2);
      if (cur === undefined || cur < pg + 1) {
        gen.set(rel.personId2, pg + 1);
        changed = true;
      }
    }
    for (const rel of spouseRels) {
      const g1 = gen.get(rel.personId1);
      const g2 = gen.get(rel.personId2);
      if (g1 === undefined && g2 === undefined) continue;
      const target = Math.max(g1 ?? 0, g2 ?? 0);
      if (g1 !== target) {
        gen.set(rel.personId1, target);
        changed = true;
      }
      if (g2 !== target) {
        gen.set(rel.personId2, target);
        changed = true;
      }
    }
  }
  for (const p of people) if (!gen.has(p.id)) gen.set(p.id, 0);

  const rowMap = new Map<number, string[]>();
  for (const p of people) {
    const g = gen.get(p.id) as number;
    if (!rowMap.has(g)) rowMap.set(g, []);
    (rowMap.get(g) as string[]).push(p.id);
  }
  const order = new Map<string, number>();
  let counter = 0;
  const visit = (start: string): void => {
    const stack: string[] = [start];
    while (stack.length) {
      const id = stack.pop() as string;
      if (order.has(id)) continue;
      order.set(id, counter++);
      for (const spouse of spouseMap.get(id) || []) {
        if (!order.has(spouse)) order.set(spouse, counter++);
      }
      const kids = (childMap.get(id) || [])
        .slice()
        .sort((a, b) =>
          (persons[a].birthDate || '').localeCompare(persons[b].birthDate || ''),
        );
      for (let i = kids.length - 1; i >= 0; i -= 1) {
        if (!order.has(kids[i])) stack.push(kids[i]);
      }
    }
  };

  const rootIds = people
    .filter((p) => !(parentMap.get(p.id)?.length))
    .map((p) => p.id)
    .sort((a, b) =>
      `${persons[a].lastName}${persons[a].firstName}`.localeCompare(
        `${persons[b].lastName}${persons[b].firstName}`,
      ),
    );
  for (const id of rootIds) visit(id);
  for (const p of people) if (!order.has(p.id)) visit(p.id);

  for (const g of rowMap.keys()) {
    rowMap.get(g)!.sort((a, b) => (order.get(a) || 0) - (order.get(b) || 0));
  }

  const indexInRow = new Map<string, number>();
  for (const row of rowMap.values()) {
    row.forEach((id, i) => indexInRow.set(id, i));
  }

  const rowBarycenter = (id: string, dir: 'down' | 'up'): number | null => {
    // Sólo se consideran vecinos de la generación contigua (padres hacia
    // abajo, hijos hacia arriba). Incluir a la pareja, que está en la misma
    // fila, provoca inversiones (p. ej. que el marido quede del otro lado).
    const neighbors =
      dir === 'down' ? parentMap.get(id) || [] : childMap.get(id) || [];
    let sum = 0;
    let count = 0;
    for (const n of neighbors) {
      const idx = indexInRow.get(n);
      if (idx !== undefined) {
        sum += idx;
        count += 1;
      }
    }
    return count ? sum / count : null;
  };

  const gensSorted = [...rowMap.keys()].sort((a, b) => a - b);
  for (let it = 0; it < 8; it += 1) {
    const dir: 'down' | 'up' = it % 2 === 0 ? 'down' : 'up';
    const seq = dir === 'down' ? gensSorted : [...gensSorted].reverse();
    for (const g of seq) {
      const row = rowMap.get(g)!;
      const bc = new Map<string, number>();
      for (const id of row) {
        const b = rowBarycenter(id, dir);
        if (b !== null) bc.set(id, b);
      }
      row.sort((a, b) => {
        const ba = bc.get(a) ?? (indexInRow.get(a) as number);
        const bb = bc.get(b) ?? (indexInRow.get(b) as number);
        return (
          ba - bb ||
          (indexInRow.get(a) as number) - (indexInRow.get(b) as number)
        );
      });
      row.forEach((id, i) => indexInRow.set(id, i));
    }
  }

  // Regla de genograma: entre hermanos (que comparten al menos un
  // progenitor) el mayor va a la izquierda. El baricentro puede invertirlos
  // al alinearlos con sus parejas/hijos, así que se reordena respetando el
  // orden de nacimiento mediante un orden topológico estable.
  for (const g of gensSorted) {
    const row = rowMap.get(g)!;
    if (row.length < 2) continue;

    const parentSets = new Map<string, Set<string>>();
    for (const id of row) {
      parentSets.set(id, new Set(parentMap.get(id) || []));
    }

    const baseIndex = new Map(row.map((id, i) => [id, i]));
    const edges = new Map<string, string[]>();
    const indegree = new Map<string, number>();
    for (const id of row) {
      edges.set(id, []);
      indegree.set(id, 0);
    }

    for (let i = 0; i < row.length; i += 1) {
      for (let j = i + 1; j < row.length; j += 1) {
        const a = row[i];
        const b = row[j];
        const sa = parentSets.get(a)!;
        const sb = parentSets.get(b)!;
        let sharesParent = false;
        for (const parent of sa) {
          if (sb.has(parent)) {
            sharesParent = true;
            break;
          }
        }
        if (!sharesParent) continue;
        const da = persons[a].birthDate || '';
        const db = persons[b].birthDate || '';
        if (!da || !db || da === db) continue;
        const older = da < db ? a : b;
        const younger = da < db ? b : a;
        edges.get(older)!.push(younger);
        indegree.set(younger, (indegree.get(younger) as number) + 1);
      }
    }

    const ready = row.filter((id) => (indegree.get(id) as number) === 0);
    ready.sort(
      (a, b) => (baseIndex.get(a) as number) - (baseIndex.get(b) as number),
    );
    const sorted: string[] = [];
    while (ready.length) {
      const id = ready.shift() as string;
      sorted.push(id);
      for (const next of edges.get(id)!) {
        const remaining = (indegree.get(next) as number) - 1;
        indegree.set(next, remaining);
        if (remaining === 0) {
          const pos = ready.findIndex(
            (r) => (baseIndex.get(r) as number) > (baseIndex.get(next) as number),
          );
          if (pos === -1) ready.push(next);
          else ready.splice(pos, 0, next);
        }
      }
    }

    if (sorted.length === row.length) {
      row.length = 0;
      row.push(...sorted);
      row.forEach((id, i) => indexInRow.set(id, i));
    }
  }

  // Regla de genograma: en una pareja, quien se incorpora al linaje (no tiene
  // progenitores registrados en el árbol) se ubica a la izquierda; el
  // descendiente del linaje queda a la derecha, de modo que las líneas
  // familiares desemboquen directamente sobre él/ella.
  for (const rel of spouseRels) {
    const a = rel.personId1;
    const b = rel.personId2;
    const g = gen.get(a);
    if (g === undefined || gen.get(b) !== g) continue;
    const row = rowMap.get(g);
    if (!row) continue;

    const aHasParents = (parentMap.get(a)?.length ?? 0) > 0;
    const bHasParents = (parentMap.get(b)?.length ?? 0) > 0;
    if (aHasParents === bHasParents) continue;

    const enters = aHasParents ? b : a;
    const bloodline = aHasParents ? a : b;
    const entersIndex = row.indexOf(enters);
    const bloodIndex = row.indexOf(bloodline);
    if (entersIndex === -1 || bloodIndex === -1) continue;

    // Se reubica al integrante que "entra" inmediatamente a la izquierda de su
    // pareja, sin intercambiar posiciones con terceros (así no se rompe el
    // orden de nacimiento de los hermanos del linaje).
    row.splice(entersIndex, 1);
    const target = row.indexOf(bloodline);
    row.splice(target, 0, enters);
    row.forEach((id, i) => indexInRow.set(id, i));
  }

  for (let gi = 1; gi < gensSorted.length; gi += 1) {
    const g = gensSorted[gi];
    const row = rowMap.get(g)!;
    if (row.length < 2) continue;

    const blocks: string[][] = [];
    let i = 0;
    while (i < row.length) {
      const block = [row[i]];
      let j = i + 1;
      while (j < row.length) {
        const cand = row[j];
        const candSpouses = spouseMap.get(cand) || [];
        if (!candSpouses.some((s) => block.includes(s))) break;
        block.push(cand);
        j += 1;
      }
      blocks.push(block);
      i = j;
    }

    const blockParents = blocks.map((block) => {
      const set = new Set<string>();
      for (const id of block) {
        for (const p of parentMap.get(id) || []) set.add(p);
      }
      return set;
    });

    const su = blocks.map((_, k) => k);
    const find = (k: number): number => {
      while (su[k] !== k) {
        su[k] = su[su[k]];
        k = su[k];
      }
      return k;
    };
    for (let a = 0; a < blocks.length; a += 1) {
      for (let b = a + 1; b < blocks.length; b += 1) {
        for (const p of blockParents[a]) {
          if (blockParents[b].has(p)) {
            su[find(a)] = find(b);
            break;
          }
        }
      }
    }

    const groupIndex = new Map<number, number>();
    const grouped: number[][] = [];
    blocks.forEach((_, k) => {
      const root = find(k);
      let gi2 = groupIndex.get(root);
      if (gi2 === undefined) {
        gi2 = grouped.length;
        groupIndex.set(root, gi2);
        grouped.push([]);
      }
      grouped[gi2].push(k);
    });

    const groupBc = grouped.map((blockIdx, k) => {
      let sum = 0;
      let count = 0;
      for (const bi of blockIdx) {
        for (const id of blocks[bi]) {
          for (const p of parentMap.get(id) || []) {
            const idx = indexInRow.get(p);
            if (idx !== undefined) {
              sum += idx;
              count += 1;
            }
          }
        }
      }
      return count ? sum / count : k;
    });

    const order = grouped.map((_, k) => k);
    order.sort((a, b) => groupBc[a] - groupBc[b] || a - b);
    const reordered = order.flatMap((k) => grouped[k].flatMap((bi) => blocks[bi]));
    rowMap.set(g, reordered);
    reordered.forEach((id, idx) => indexInRow.set(id, idx));
  }

  const minGap = NODE_W + H_GAP;
  const x = new Map<string, number>();
  for (const g of gensSorted) {
    rowMap.get(g)!.forEach((id, i) => x.set(id, i * minGap));
  }

  const assignPositions = (dir: 'down' | 'up'): void => {
    const snapshot = new Map(x);
    const seq = dir === 'down' ? gensSorted : [...gensSorted].reverse();
    for (const g of seq) {
      const row = rowMap.get(g)!;
      const desired = row.map((id) => {
        const neighbors: string[] = [...(spouseMap.get(id) || [])];
        if (dir === 'down') neighbors.push(...(parentMap.get(id) || []));
        else neighbors.push(...(childMap.get(id) || []));
        let sum = 0;
        let count = 0;
        for (const n of neighbors) {
          const v = snapshot.get(n);
          if (v !== undefined) {
            sum += v;
            count += 1;
          }
        }
        return count ? sum / count : (snapshot.get(id) as number);
      });
      const transformed = desired.map((d, i) => d - i * minGap);
      const fitted = isotonic(transformed);
      row.forEach((id, i) => x.set(id, fitted[i] + i * minGap));
    }
  };

  for (let it = 0; it < 12; it += 1) {
    assignPositions(it % 2 === 0 ? 'down' : 'up');
  }

  // Pasada final descendente usando las posiciones ya actualizadas: los hijos
  // se centran bajo sus padres (línea de descendencia vertical, sin zigzag)
  // sin perder la cercanía con su pareja.
  for (const g of gensSorted) {
    const row = rowMap.get(g)!;
    const desired = row.map((id) => {
      const neighbors: string[] = [
        ...(spouseMap.get(id) || []),
        ...(parentMap.get(id) || []),
      ];
      let sum = 0;
      let count = 0;
      for (const n of neighbors) {
        const v = x.get(n);
        if (v !== undefined) {
          sum += v;
          count += 1;
        }
      }
      return count ? sum / count : (x.get(id) as number);
    });
    const transformed = desired.map((d, i) => d - i * minGap);
    const fitted = isotonic(transformed);
    row.forEach((id, i) => x.set(id, fitted[i] + i * minGap));
  }

  let minX = Infinity;
  for (const id of x.keys()) {
    const v = x.get(id) as number;
    if (v < minX) minX = v;
  }

  const genIndex = new Map<number, number>();
  gensSorted.forEach((g, i) => genIndex.set(g, i));

  const nodes: LayoutNode[] = people.map((p) => {
    const g = gen.get(p.id) as number;
    return {
      id: p.id,
      x: (x.get(p.id) as number) - minX + MARGIN,
      y: MARGIN + (genIndex.get(g) as number) * (NODE_H + V_GAP),
      generation: g,
      person: p,
    };
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const links: LayoutLink[] = [];

  for (const rel of spouseRels) {
    const a = nodeById.get(rel.personId1);
    const b = nodeById.get(rel.personId2);
    if (!a || !b) continue;
    const [left, right] = a.x <= b.x ? [a, b] : [b, a];
    const y = left.y + SYMBOL_CY;
    const x1 = left.x + NODE_W / 2 + SYMBOL / 2;
    const x2 = right.x + NODE_W / 2 - SYMBOL / 2;
    links.push({
      id: rel.id,
      type: 'spouse',
      path: `M ${x1} ${y} L ${x2} ${y}`,
    });
  }

  for (const child of people) {
    const childNode = nodeById.get(child.id);
    if (!childNode) continue;
    const parentIds = parentMap.get(child.id) || [];
    const anchors = parentIds
      .map((id) => nodeById.get(id))
      .filter((n): n is LayoutNode => !!n);
    if (anchors.length === 0) continue;

    const ax =
      anchors.reduce((sum, n) => sum + n.x + NODE_W / 2, 0) / anchors.length;
    const parentsAreSpouses =
      anchors.length === 2 &&
      (spouseMap.get(anchors[0].id) || []).includes(anchors[1].id);
    const ay =
      Math.max(...anchors.map((n) => n.y)) +
      (parentsAreSpouses ? SYMBOL_CY : SYMBOL_TOP + SYMBOL);
    const cx = childNode.x + NODE_W / 2;
    const cy = childNode.y + SYMBOL_TOP;
    const midY = ay + (cy - ay) / 2;

    links.push({
      id: `descent-${child.id}`,
      type: 'descent',
      path: `M ${ax} ${ay} V ${midY} H ${cx} V ${cy}`,
    });
  }

  let maxX = -Infinity;
  for (const n of nodes) if (n.x > maxX) maxX = n.x;

  const width = maxX + NODE_W + MARGIN;
  const height =
    MARGIN * 2 +
    Math.max(gensSorted.length * (NODE_H + V_GAP) - V_GAP, NODE_H);

  return { nodes, links, width, height, nodeWidth: NODE_W, nodeHeight: NODE_H };
}
