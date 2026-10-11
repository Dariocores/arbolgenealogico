<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import { useFamilyTreeStore } from '@/stores/familyTree';
import {
  computeLayout,
  NODE_W,
  SYMBOL,
  SYMBOL_TOP,
  SYMBOL_CY,
  type TreeLayout,
} from '@/utils/layout';
import {
  genderClass,
  symbolPath,
  deceasedLine,
  lifeSpan,
  toRoman,
} from '@/utils/treeRender';

const store = useFamilyTreeStore();
const svgRef = ref<SVGSVGElement | null>(null);

let group: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let layout: TreeLayout | null = null;
let lastSignature = '';

const zoom = d3
  .zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.2, 3])
  .on('zoom', (event) => {
    group?.attr('transform', event.transform);
  });

function render(): void {
  if (!svgRef.value || !group) return;

  group.selectAll('*').remove();
  layout = computeLayout(store.persons, store.relationships);

  const signature = `${layout.nodes.length}:${layout.links.length}`;
  const structureChanged = signature !== lastSignature;
  lastSignature = signature;

  if (layout.nodes.length === 0) {
    group
      .append('text')
      .attr('x', 40)
      .attr('y', 60)
      .attr('class', 'empty-text')
      .text('No hay miembros. Agregá personas para ver el árbol.');
    return;
  }

  group
    .selectAll('path.link')
    .data(layout.links, (d) => (d as { id: string }).id)
    .enter()
    .append('path')
    .attr('class', (d) => `tree-link ${d.type}`)
    .attr('d', (d) => d.path);

  const numberById = new Map<string, number>();
  const byGeneration = new Map<number, typeof layout.nodes>();
  for (const n of layout.nodes) {
    if (!byGeneration.has(n.generation)) byGeneration.set(n.generation, []);
    (byGeneration.get(n.generation) as typeof layout.nodes).push(n);
  }
  for (const row of byGeneration.values()) {
    row.sort((a, b) => a.x - b.x);
    row.forEach((n, i) => numberById.set(n.id, i + 1));
  }

  const generations = [...byGeneration.keys()].sort((a, b) => a - b);
  const rowY = new Map<number, number>();
  for (const n of layout.nodes) rowY.set(n.generation, n.y + SYMBOL_CY);
  for (let i = 0; i < generations.length; i += 1) {
    group
      .append('text')
      .attr('x', 14)
      .attr('y', rowY.get(generations[i]) as number)
      .attr('class', 'generation-label')
      .text(toRoman(i + 1));
  }

  const node = group
    .selectAll('g.node')
    .data(layout.nodes, (d) => d.id)
    .enter()
    .append('g')
    .attr('class', (d) => `node${d.id === store.selectedPersonId ? ' selected' : ''}`)
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr(
      'aria-label',
      (d) => `${d.person.firstName} ${d.person.lastName}`.trim(),
    )
    .on('click', (_event, d) => store.selectPerson(d.id))
    .on('keydown', (event: KeyboardEvent, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        store.selectPerson(d.id);
      }
    });

  const symbol = node
    .append('g')
    .attr('transform', `translate(${NODE_W / 2},${SYMBOL_CY})`);

  symbol
    .append('path')
    .attr('d', (d) => symbolPath(d.person.gender))
    .attr('class', (d) => `node-symbol ${genderClass(d.person.gender)}`);

  symbol
    .filter((d) => !!d.person.deathDate)
    .append('line')
    .attr('class', 'death-mark')
    .attr('x1', (d) => deceasedLine(d.person.gender)[0])
    .attr('y1', (d) => deceasedLine(d.person.gender)[1])
    .attr('x2', (d) => deceasedLine(d.person.gender)[2])
    .attr('y2', (d) => deceasedLine(d.person.gender)[3]);

  node
    .append('text')
    .attr('x', NODE_W / 2 - SYMBOL / 2 - 4)
    .attr('y', SYMBOL_CY - SYMBOL / 2 + 4)
    .attr('text-anchor', 'end')
    .attr('class', 'node-number')
    .text((d) => numberById.get(d.id) as number);

  node
    .append('text')
    .attr('x', NODE_W / 2)
    .attr('y', (d) => (lifeSpan(d.person) ? SYMBOL_TOP + SYMBOL + 20 : SYMBOL_TOP + SYMBOL + 26))
    .attr('text-anchor', 'middle')
    .attr('class', 'node-name')
    .text((d) => `${d.person.firstName} ${d.person.lastName}`.trim());

  node
    .filter((d) => !!lifeSpan(d.person))
    .append('text')
    .attr('x', NODE_W / 2)
    .attr('y', SYMBOL_TOP + SYMBOL + 36)
    .attr('text-anchor', 'middle')
    .attr('class', 'node-dates')
    .text((d) => lifeSpan(d.person));

  if (structureChanged) fitToView();
}

function fitToView(): void {
  if (!svgRef.value || !layout || layout.nodes.length === 0) return;
  const width = svgRef.value.clientWidth || 800;
  const height = svgRef.value.clientHeight || 550;
  const scale = Math.min(
    width / layout.width,
    height / layout.height,
    1,
  );
  const tx = (width - layout.width * scale) / 2;
  const ty = (height - layout.height * scale) / 2;
  d3.select(svgRef.value)
    .transition()
    .duration(300)
    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

function zoomBy(factor: number): void {
  if (!svgRef.value) return;
  d3.select(svgRef.value)
    .transition()
    .duration(200)
    .call(zoom.scaleBy, factor);
}

onMounted(() => {
  if (!svgRef.value) return;
  const svg = d3.select(svgRef.value);
  group = svg.append('g').attr('class', 'tree-viewport');
  svg.call(zoom);
  render();
});

watch(
  () => [store.persons, store.relationships, store.selectedPersonId],
  () => render(),
  { deep: true },
);
</script>

<template>
  <div class="tree-canvas">
    <div class="tree-controls">
      <button title="Acercar" @click="zoomBy(1.3)">+</button>
      <button title="Alejar" @click="zoomBy(0.77)">−</button>
      <button title="Centrar" @click="fitToView">⊙</button>
    </div>

    <div class="tree-legend" aria-hidden="true">
      <span class="legend-item">
        <svg viewBox="0 0 18 18" class="legend-svg">
          <rect x="3" y="3" width="12" height="12" class="legend-male" />
        </svg>
        Varón
      </span>
      <span class="legend-item">
        <svg viewBox="0 0 18 18" class="legend-svg">
          <circle cx="9" cy="9" r="6" class="legend-female" />
        </svg>
        Mujer
      </span>
      <span class="legend-item">
        <svg viewBox="0 0 18 18" class="legend-svg">
          <path d="M9 3 L15 9 L9 15 L3 9 Z" class="legend-other" />
        </svg>
        Desconocido
      </span>
      <span class="legend-item">
        <svg viewBox="0 0 18 18" class="legend-svg">
          <rect x="3" y="3" width="12" height="12" class="legend-other" />
          <line x1="3" y1="15" x2="15" y2="3" class="legend-death" />
        </svg>
        Fallecido
      </span>
      <span class="legend-item">I, II, III · generación</span>
      <span class="legend-item">1, 2, 3 · orden</span>
    </div>

    <svg ref="svgRef" class="tree-svg"></svg>
  </div>
</template>

<style scoped>
.tree-canvas {
  position: relative;
  width: 100%;
  height: 550px;
  background: var(--tree-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.tree-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.tree-svg:active {
  cursor: grabbing;
}

.tree-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.tree-controls button {
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--text);
  font-weight: 700;
  cursor: pointer;
}

.tree-controls button:hover {
  background: rgba(128, 128, 128, 0.18);
}

:deep(.empty-text) {
  fill: var(--muted);
  font-size: 14px;
}

:deep(.tree-link) {
  fill: none;
  stroke-width: 2;
}

:deep(.tree-link.spouse) {
  stroke: var(--tree-line-marriage);
  stroke-dasharray: 6 4;
}

:deep(.tree-link.descent) {
  stroke: var(--tree-line-descent);
}

:deep(.node) {
  cursor: pointer;
}

:deep(.node .node-symbol) {
  stroke: #ffffff;
  stroke-width: 2;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

:deep(.node.selected .node-symbol) {
  stroke: #f59e0b;
  stroke-width: 3;
}

:deep(.node:focus-visible) {
  outline: none;
}

:deep(.node:focus-visible .node-symbol) {
  stroke: var(--primary);
  stroke-width: 3;
}

:deep(.node .node-symbol.male) {
  fill: var(--tree-node-male);
}

:deep(.node .node-symbol.female) {
  fill: var(--tree-node-female);
}

:deep(.node .node-symbol.other) {
  fill: var(--tree-node-other);
}

:deep(.node .death-mark) {
  stroke: var(--tree-node-text);
  stroke-width: 2;
  stroke-linecap: round;
}

:deep(.node .node-name) {
  fill: var(--text);
  font-size: 12px;
  font-weight: 600;
}

:deep(.node .node-dates) {
  fill: var(--muted);
  font-size: 10px;
}

:deep(.node .node-number) {
  fill: var(--muted);
  font-size: 10px;
  font-weight: 700;
}

:deep(.generation-label) {
  fill: var(--muted);
  font-size: 15px;
  font-weight: 700;
}

.tree-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  max-width: calc(100% - 24px);
  padding: 8px 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-size: 11px;
  color: var(--text);
  z-index: 10;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.legend-svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.legend-male {
  fill: var(--tree-node-male);
  stroke: #ffffff;
  stroke-width: 1;
}

.legend-female {
  fill: var(--tree-node-female);
  stroke: #ffffff;
  stroke-width: 1;
}

.legend-other {
  fill: var(--tree-node-other);
  stroke: #ffffff;
  stroke-width: 1;
}

.legend-death {
  stroke: var(--tree-node-text);
  stroke-width: 1.5;
}
</style>
