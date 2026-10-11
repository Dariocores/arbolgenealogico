import {
  computeLayout,
  NODE_W,
  SYMBOL,
  SYMBOL_TOP,
  SYMBOL_CY,
} from '@/utils/layout';
import {
  genderClass,
  symbolPath,
  deceasedLine,
  lifeSpan,
  toRoman,
  fullName,
  escapeXml,
} from '@/utils/treeRender';
import type { Person, Relationship } from '@/types/genealogy';

export interface TreeExportOptions {
  title?: string;
}

interface Theme {
  bg: string;
  text: string;
  muted: string;
  card: string;
  border: string;
  male: string;
  female: string;
  other: string;
  nodeText: string;
  marriage: string;
  descent: string;
}

const FALLBACK_THEME: Theme = {
  bg: '#f8fafc',
  text: '#1e2a30',
  muted: '#5a7a88',
  card: '#ffffff',
  border: '#cbd5e1',
  male: '#a8d5f5',
  female: '#f7c8dc',
  other: '#d8dce0',
  nodeText: '#1f2937',
  marriage: '#00897b',
  descent: '#94a3b8',
};

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function readTheme(): Theme {
  return {
    bg: cssVar('--tree-bg', FALLBACK_THEME.bg),
    text: cssVar('--text', FALLBACK_THEME.text),
    muted: cssVar('--muted', FALLBACK_THEME.muted),
    card: cssVar('--card', FALLBACK_THEME.card),
    border: cssVar('--border', FALLBACK_THEME.border),
    male: cssVar('--tree-node-male', FALLBACK_THEME.male),
    female: cssVar('--tree-node-female', FALLBACK_THEME.female),
    other: cssVar('--tree-node-other', FALLBACK_THEME.other),
    nodeText: cssVar('--tree-node-text', FALLBACK_THEME.nodeText),
    marriage: cssVar('--tree-line-marriage', FALLBACK_THEME.marriage),
    descent: cssVar('--tree-line-descent', FALLBACK_THEME.descent),
  };
}

function genderFill(theme: Theme, gender: string): string {
  const cls = genderClass(gender);
  if (cls === 'male') return theme.male;
  if (cls === 'female') return theme.female;
  return theme.other;
}

function legendGroup(theme: Theme, x: number, y: number): string {
  const items: [string, string][] = [
    [
      `<rect x="0" y="0" width="12" height="12" fill="${theme.male}" stroke="#ffffff" stroke-width="1"/>`,
      'Varón',
    ],
    [
      `<circle cx="6" cy="6" r="6" fill="${theme.female}" stroke="#ffffff" stroke-width="1"/>`,
      'Mujer',
    ],
    [
      `<path d="M6 0 L12 6 L6 12 L0 6 Z" fill="${theme.other}" stroke="#ffffff" stroke-width="1"/>`,
      'Desconocido',
    ],
    [
      `<rect x="0" y="0" width="12" height="12" fill="${theme.other}" stroke="#ffffff" stroke-width="1"/>` +
        `<line x1="0" y1="12" x2="12" y2="0" stroke="${theme.nodeText}" stroke-width="1.5"/>`,
      'Fallecido',
    ],
  ];

  const parts: string[] = [];
  let cx = 0;
  for (const [markup, label] of items) {
    parts.push(
      `<g transform="translate(${cx}, 0)">${markup}` +
        `<text x="20" y="12" fill="${theme.text}" font-size="11">${escapeXml(label)}</text></g>`,
    );
    cx += 20 + label.length * 6.4 + 16;
  }
  parts.push(
    `<text x="${cx}" y="12" fill="${theme.muted}" font-size="11">I, II, III · generación</text>`,
  );
  cx += 132;
  parts.push(
    `<text x="${cx}" y="12" fill="${theme.muted}" font-size="11">1, 2, 3 · orden</text>`,
  );

  return `<g transform="translate(${x}, ${y})">${parts.join('')}</g>`;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function symbolMarkup(theme: Theme, gender: string): string {
  return `<path d="${symbolPath(gender)}" fill="${genderFill(theme, gender)}" stroke="#ffffff" stroke-width="2" filter="url(#nodeShadow)"/>`;
}

function buildSvg(
  persons: Record<string, Person>,
  relationships: Relationship[],
  options: TreeExportOptions,
): { svg: string; box: Box } {
  const theme = readTheme();
  const layout = computeLayout(persons, relationships);
  const padding = 32;
  const titleH = options.title ? 46 : 16;
  const legendH = 48;

  if (layout.nodes.length === 0) {
    const width = 480;
    const height = 160;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="${theme.bg}"/>` +
      `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${theme.muted}" font-family="sans-serif" font-size="14">No hay miembros para mostrar.</text>` +
      `</svg>`;
    return { svg, box: { x: 0, y: 0, width, height } };
  }

  const width = Math.max(layout.width + padding * 2, 360);
  const height = titleH + layout.height + legendH + padding;

  const byGeneration = new Map<number, typeof layout.nodes>();
  for (const n of layout.nodes) {
    if (!byGeneration.has(n.generation)) byGeneration.set(n.generation, []);
    (byGeneration.get(n.generation) as typeof layout.nodes).push(n);
  }
  const numberById = new Map<string, number>();
  for (const row of byGeneration.values()) {
    row.sort((a, b) => a.x - b.x);
    row.forEach((n, i) => numberById.set(n.id, i + 1));
  }
  const generations = [...byGeneration.keys()].sort((a, b) => a - b);

  const parts: string[] = [];
  parts.push(`<g transform="translate(${padding}, ${titleH})">`);

  for (const link of layout.links) {
    if (link.type === 'spouse') {
      parts.push(
        `<path d="${link.path}" fill="none" stroke="${theme.marriage}" stroke-width="2" stroke-dasharray="6 4"/>`,
      );
    } else {
      parts.push(
        `<path d="${link.path}" fill="none" stroke="${theme.descent}" stroke-width="2"/>`,
      );
    }
  }

  const rowY = new Map<number, number>();
  for (const n of layout.nodes) rowY.set(n.generation, n.y + SYMBOL_CY);
  generations.forEach((g, i) => {
    parts.push(
      `<text x="8" y="${rowY.get(g)}" fill="${theme.muted}" font-size="15" font-weight="700">${toRoman(i + 1)}</text>`,
    );
  });

  for (const node of layout.nodes) {
    const p = node.person;
    const span = lifeSpan(p);
    const d = deceasedLine(p.gender);
    const nameY = span
      ? SYMBOL_TOP + SYMBOL + 20
      : SYMBOL_TOP + SYMBOL + 26;
    const death = p.deathDate
      ? `<line x1="${d[0]}" y1="${d[1]}" x2="${d[2]}" y2="${d[3]}" stroke="${theme.nodeText}" stroke-width="2" stroke-linecap="round"/>`
      : '';
    const dates = span
      ? `<text x="${NODE_W / 2}" y="${SYMBOL_TOP + SYMBOL + 36}" text-anchor="middle" fill="${theme.muted}" font-size="10">${escapeXml(span)}</text>`
      : '';

    parts.push(
      `<g transform="translate(${node.x}, ${node.y})">` +
        `<g transform="translate(${NODE_W / 2}, ${SYMBOL_CY})">` +
        symbolMarkup(theme, p.gender) +
        death +
        `</g>` +
        `<text x="${NODE_W / 2 - SYMBOL / 2 - 4}" y="${SYMBOL_CY - SYMBOL / 2 + 4}" text-anchor="end" fill="${theme.muted}" font-size="10" font-weight="700">${numberById.get(node.id)}</text>` +
        `<text x="${NODE_W / 2}" y="${nameY}" text-anchor="middle" fill="${theme.text}" font-size="12" font-weight="600">${escapeXml(fullName(p))}</text>` +
        dates +
        `</g>`,
    );
  }

  parts.push(`</g>`);

  const header = options.title
    ? `<text x="${width / 2}" y="30" text-anchor="middle" fill="${theme.text}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="700">${escapeXml(options.title)}</text>`
    : '';

  const legend = legendGroup(theme, padding, titleH + layout.height + 22);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">` +
    `<defs><filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000000" flood-opacity="0.18"/></filter></defs>` +
    `<rect width="${width}" height="${height}" fill="${theme.bg}"/>` +
    header +
    parts.join('') +
    legend +
    `</svg>`;

  return { svg, box: { x: 0, y: 0, width, height } };
}

export function buildTreeSvg(
  persons: Record<string, Person>,
  relationships: Relationship[],
  options: TreeExportOptions = {},
): string {
  return buildSvg(persons, relationships, options).svg;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string,
): void {
  downloadBlob(filename, new Blob([content], { type: `${mime};charset=utf-8` }));
}

export async function svgToPngBlob(
  svg: string,
  scale = 2,
): Promise<Blob> {
  const match = svg.match(/width="(\d+)"\s+height="(\d+)"/);
  const width = match ? Number(match[1]) : 1200;
  const height = match ? Number(match[2]) : 800;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo renderizar el SVG'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No hay contexto 2D');
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo generar el PNG'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
