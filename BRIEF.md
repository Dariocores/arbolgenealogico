# Brief Técnico — Proyecto Árbol Genealógico

## Resumen
Aplicación web desarrollada en Vue 3 y TypeScript para modelar, visualizar y gestionar árboles genealógicos de manera interactiva. Permite agregar miembros, definir relaciones familiares y visualizar el árbol en tiempo real.

## Objetivo
Facilitar la creación y visualización de árboles genealógicos, permitiendo a los usuarios gestionar miembros y relaciones familiares de forma sencilla e intuitiva.

## Tecnologías principales
- **Framework:** Vue 3
- **Lenguaje:** javasScript (con soporte para JavaScript)
- **Bundler:** Vite
- **Testing:** Vitest, @testing-library/vue
- **Estilos:** CSS
- **Persistencia:** localStorage (según SettingsView.vue)

## Estructura del Proyecto
- **index.html:** Entrada principal de la app.
- **src/main.js:** Inicializa la app y monta el componente principal.
- **src/views/**
  - **TreeView.vue:** Vista principal del árbol, integra formulario, lista y visualización.
  - **HomeView.vue:** Pantalla de bienvenida y resumen de funcionalidades.
  - **SettingsView.vue:** Configuración, exportación/importación y opciones de datos.
- **src/components/**
  - **FamilyForm.vue:** Formulario para añadir miembros.
  - **PersonList.vue:** Lista de personas añadidas.
  - **FamilyTree.vue:** Visualización SVG del árbol genealógico.
- **src/utils/familyLogic.ts:** Lógica de gestión de miembros y relaciones (no detallado aquí, pero referenciado).
- **test-arbolgenealogico.js, familyLogic.spec.ts:** Pruebas unitarias.

## Principales funcionalidades
- Agregar miembros familiares con nombre y género.
- Visualizar miembros y relaciones en un árbol SVG.
- Listar personas añadidas.
- Exportar/importar datos en JSON.
- Guardado automático en localStorage.

## Scripts útiles
- `npm install` — Instala dependencias.
- `npm run dev` — Inicia servidor de desarrollo.
- `npm test` — Ejecuta pruebas.

## Notas
- El proyecto es una demo, ideal para aprendizaje o prototipado rápido.
- La lógica principal de árbol está en `src/utils/familyLogic.ts`.
- El diseño es modular y fácilmente extensible.

---
Este brief resume la arquitectura, propósito y componentes clave del proyecto Árbol Genealógico.