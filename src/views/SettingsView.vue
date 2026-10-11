<template>
  <div class="settings-view">
    <h2>Configuración</h2>

    <section class="settings-section">
      <h3>Información del árbol</h3>
      <div class="info-grid">
        <div><span class="label">Árbol:</span> {{ store.treeName }}</div>
        <div><span class="label">ID activo:</span> {{ store.activeTreeId }}</div>
        <div><span class="label">Raíz:</span> {{ store.rootPersonId || '—' }}</div>
        <div><span class="label">Miembros:</span> {{ store.totalMembers }}</div>
        <div><span class="label">Relaciones:</span> {{ store.relationships.length }}</div>
      </div>
    </section>

    <section class="settings-section">
      <h3>Exportar / Importar</h3>
      <div class="button-group">
        <button class="btn btn-primary" @click="exportJSON">Exportar JSON</button>
        <button class="btn btn-secondary" @click="exportGEDCOMFile">
          Exportar GEDCOM (.ged)
        </button>
        <button class="btn btn-primary" :disabled="exporting" @click="exportTreePNG">
          {{ exporting ? 'Generando…' : 'Exportar árbol (PNG)' }}
        </button>
        <button class="btn btn-secondary" @click="exportTreeSVG">
          Exportar árbol (SVG)
        </button>
        <button class="btn btn-secondary" @click="jsonInput?.click()">
          Importar JSON
        </button>
        <button class="btn btn-secondary" @click="gedcomInput?.click()">
          Importar GEDCOM (.ged)
        </button>
      </div>
      <p class="settings-hint">
        Las imágenes muestran el árbol tal como se ve en la vista Árbol.
      </p>
      <input
        ref="jsonInput"
        type="file"
        accept=".json,application/json"
        class="hidden-input"
        @change="importJSON"
      />
      <input
        ref="gedcomInput"
        type="file"
        accept=".ged,text/plain"
        class="hidden-input"
        @change="importGEDCOM"
      />
      <p v-if="message" class="feedback">{{ message }}</p>
    </section>

    <section class="settings-section">
      <h3>Modelo de datos</h3>
      <p class="settings-note">
        Arquitectura basada en tipos <code>Person</code> y
        <code>Relationship</code> con el store <code>familyTree</code>
        (ID-based). Migra automáticamente datos antiguos de localStorage y
        soporta GEDCOM 5.5.5.
      </p>
    </section>

    <section class="settings-section danger">
      <h3>Zona peligrosa</h3>
      <p class="settings-note">Esta acción no se puede deshacer.</p>
      <button class="btn btn-danger" @click="confirmClear">
        Limpiar todo el árbol
      </button>
    </section>

    <section class="settings-section">
      <h3>Personas registradas</h3>
      <ul class="person-preview">
        <li v-for="p in people" :key="p.id">
          <span class="mono">{{ p.id }}</span> — {{ p.firstName }} {{ p.lastName }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFamilyTreeStore } from '@/stores/familyTree';
import {
  buildTreeSvg,
  svgToPngBlob,
  downloadBlob,
  downloadTextFile,
} from '@/utils/svgExport';

const store = useFamilyTreeStore();
const people = computed(() => Object.values(store.persons));

const jsonInput = ref<HTMLInputElement | null>(null);
const gedcomInput = ref<HTMLInputElement | null>(null);
const message = ref('');
const exporting = ref(false);

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(): void {
  download(
    `${store.activeTreeId}.json`,
    JSON.stringify(store.toTreeData(), null, 2),
    'application/json',
  );
  message.value = 'JSON exportado.';
}

function exportGEDCOMFile(): void {
  download(`${store.activeTreeId}.ged`, store.exportGEDCOM(), 'text/plain');
  message.value = 'GEDCOM exportado.';
}

function treeSvgMarkup(): string {
  return buildTreeSvg(store.persons, store.relationships, {
    title: store.treeName,
  });
}

function exportTreeSVG(): void {
  downloadTextFile(
    `${store.activeTreeId}-arbol.svg`,
    buildTreeSvg(store.persons, store.relationships, { title: store.treeName }),
    'image/svg+xml',
  );
  message.value = 'Árbol exportado como SVG.';
}

async function exportTreePNG(): Promise<void> {
  exporting.value = true;
  try {
    const svg = buildTreeSvg(store.persons, store.relationships, {
      title: store.treeName,
    });
    const blob = await svgToPngBlob(svg);
    downloadBlob(`${store.activeTreeId}.png`, blob);
    message.value = 'Árbol exportado como PNG.';
  } catch {
    message.value = 'No se pudo generar la imagen del árbol.';
  } finally {
    exporting.value = false;
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function importJSON(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await readFile(file));
    store.importJSON(data);
    message.value = `Importado: ${store.totalMembers} personas.`;
  } catch {
    message.value = 'Error al importar el JSON.';
  } finally {
    input.value = '';
  }
}

async function importGEDCOM(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    store.importGEDCOM(await readFile(file));
    message.value = `Importado: ${store.totalMembers} personas.`;
  } catch {
    message.value = 'Error al importar el GEDCOM.';
  } finally {
    input.value = '';
  }
}

function confirmClear(): void {
  if (confirm('¿Limpiar todo el árbol? Esta acción no se puede deshacer.')) {
    store.clearTree();
    message.value = 'Árbol limpiado.';
  }
}
</script>

<style scoped>
.settings-view {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.settings-view h2 {
  margin-bottom: 20px;
}

.settings-section {
  padding: 20px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 18px;
}

.settings-section h3 {
  margin-bottom: 14px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  font-size: 0.92em;
}

.label {
  color: var(--muted);
}

.settings-note {
  color: var(--muted);
  line-height: 1.7;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: var(--on-primary, #fff);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.hidden-input {
  display: none;
}

.feedback {
  margin-top: 12px;
  font-size: 0.9em;
  color: var(--primary);
}

.danger {
  border-color: var(--danger);
}

code {
  background: var(--input-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.person-preview {
  list-style: none;
  padding: 0;
  font-size: 0.9em;
  line-height: 2;
}

.mono {
  font-family: ui-monospace, monospace;
  color: var(--muted);
}
</style>
