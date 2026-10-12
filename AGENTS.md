# AGENTS.md

Árbol genealógico / genograma web (Vue 3 + TypeScript + Vite + Pinia + D3).
Desplegado en Netlify: https://arbolgeneal.netlify.app (auto-deploy desde `main`).
Backend Supabase (modo nube): https://gnbwgxjiqdrahslxhlwu.supabase.co

## Comandos

- Dev: `npm run dev` (Vite, puerto 5173)
- Tests: `npx vitest run` (o `npm test` en watch)
- Tipos: `npx tsc --noEmit` (NO usar `vue-tsc`: roto en este entorno)
- Build: `npx vite build`

Antes de commitear: `npx vitest run` + `npx tsc --noEmit` + `npx vite build`.
Luego push a `update` y fast-forward a `main` (Netlify publica desde `main`).

## Convenciones

- Sin comentarios en el código salvo que se pidan.
- Textos de UI en español.
- Utilidades puras en `src/utils/*.ts` con test `*.spec.ts` al lado.
- Los cambios en datos opcionales deben mantener compatibilidad con árboles viejos.
- Al agregar renders al genograma, replicar en TRES lugares: `layout.ts`
  (geometría), `components/tree/TreeCanvas.vue` (D3) y `utils/svgExport.ts`
  (export SVG/PNG) + leyenda en ambos.

## Arquitectura

- `src/types/genealogy.ts`: modelo (`Gender` incluye `nonbinary`; `NonBornStatus`;
  `Person.nonBorn/deathCause/abuse/conceptionDate`).
- `src/utils/labels.ts`: etiquetas (género, roles, no nacido, rango de hermano).
- `src/utils/layout.ts`: layout generacional; regla hombre-IZQUIERDA por pareja;
  orden de hermanos por `siblingOrderKey`; genera links `spouse|descent|twin`.
- `src/utils/siblings.ts`: hermanos/medio hermanos, rango mayor/menor/mellizo, `getTwinPairs`, `isTwin`.
- `src/utils/treeRender.ts`: símbolos, marcadores (C.A/S/A), no nacidos (A.E/A.P/N.N), edad.
- `src/utils/analysis.ts`: análisis de fechas (dobles, maestro, espejo, heredero universal).
- `src/utils/svgExport.ts`: `buildTreeSvg`, `svgDimensions`, `svgToPngBlob`, `downloadBlob`.
- `src/utils/gedcom.ts`: import/export (nonbinary ↔ `SEX X`).
- `src/stores/familyTree.ts`: Pinia; persistencia localStorage prefijo `familyTree_v2_`.
- `src/views/TreeView.vue`: panel de detalle (Padres/Hermanos/Hijos/Parejas).

## Reglas de negocio del genograma (PDF "decálogo de la madre")

- Dobles: fecha de nacimiento ±10 días del año; y +3/+6/+9 meses (±10 días).
  `maestro` = ventana de +6 meses; `espejo` = fecha invertida exacta.
  `heredero universal` = día/mes de nacimiento == día/mes de fallecimiento.
- No nacidos: A.E (aborto espontáneo), A.P (aborto provocado), N.N (mortinato).
- Adopción: 4 padres a la misma altura (verificado).

## Estado actual (2026-10)

Ramas `main` == `update` en `b353943`. Todo verde: 97 tests, tsc limpio, build OK.
Últimos cambios desplegados y verificados en producción:
- `b2a5a07` parámetros de genograma (no binario, no nacidos, adopción, consultante, marcadores, análisis).
- `8405968` vínculo de hermanos (rango mayor/menor/mellizo) + línea de mellizos.
- `b353943` fix: el PNG exportado salía en blanco (se leía mal width/height del SVG).

## Próximos pasos (pendientes / ideas)

- Análisis de fechas: incluir fecha de fallecimiento y de concepción en los "dobles"
  (hoy solo usa nacimiento). Falta "rango de hermandad" (n.º hijos + 3) y dobles
  por orden de nacimiento/profesión.
- Supabase → Authentication → URL Configuration: Site URL sigue en `http://localhost:3000`.
  Cambiar a `https://arbolgeneal.netlify.app` y Redirect URLs
  `https://arbolgeneal.netlify.app/**` + `http://localhost:5173/**`.
- Conceder licencia de admin: `select public.grant_license('<email>', 12);`
  (ver `/home/darioc/Imágenes/arbolg/admin-usuarios.txt`).
- Sin service worker/PWA; caché por hash de bundle → usar Ctrl+Shift+R tras deploy.
