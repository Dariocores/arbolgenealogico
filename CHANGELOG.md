# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Agregado
- Selector de **color de acento** ("Temas") junto al cambio de modo claro/oscuro,
  con cuatro paletas (Verde azulado, Azul petróleo, Naranja y Claro) y preferencia
  persistida en el navegador.
- **Exportación del árbol** a imagen **PNG** y **SVG** desde Configuración.
- `MANUAL.md` con el manual de uso para la persona usuaria.
- Módulos de utilidades y tipos: `layout`, `relationships`, `svgExport`,
  `treeRender`, `gedcom`, `labels`, `migrate` y `types/genealogy`.

### Cambiado
- Migración de la aplicación de **JavaScript a TypeScript** (stores, router,
  vistas, componentes y utilidades).
- Reorganización de vistas y componentes (`DirectoryView`, `PersonForm`,
  `components/tree/`).

### Corregido
- Orden de las personas por generación en el layout, evitando cruces de líneas
  entre ramas y alineando a cada hijo bajo sus progenitores.

## [0.2.0] - 2026-06-28

### Agregado
- Validación de fechas.
- Estado de matrimonio.
- Soporte multiparental.
- Acción para desvincular personas.
- Fotografía de la persona.
- Tooltips en el árbol.
- Importación/exportación GEDCOM avanzada.
- Soporte de múltiples árboles.

### Cambiado
- Tema primario en verde azulado (`#00897b`).

## [0.1.0] - 2026-06-27

### Agregado
- Primera versión funcional: carga y edición de personas, layout genealógico por
  generaciones con parejas e hijos, y tema oscuro.
- Soporte básico de importación/exportación GEDCOM.
- Colores por variables CSS.

[No publicado]: https://github.com/Dariocores/arbolgenealogico/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Dariocores/arbolgenealogico/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Dariocores/arbolgenealogico/releases/tag/v0.1.0
