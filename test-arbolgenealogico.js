// Script de pruebas automáticas para el árbol genealógico
// Ejecuta pruebas agregando familiares de cada tipo y verifica la estructura

function testArbolGenealogico() {
  // Limpia el árbol
  if (typeof limpiarArbol === 'function') limpiarArbol();

  // 1. Agrega padre (hombre)
  document.getElementById('nombre').value = 'Juan';
  document.getElementById('genero').value = 'hombre';
  document.getElementById('relacion').value = '';
  document.getElementById('tipoRelacion').value = 'padre';
  agregarMiembro();

  // 2. Agrega hija (mujer)
  document.getElementById('nombre').value = 'Ana';
  document.getElementById('genero').value = 'mujer';
  document.getElementById('relacion').value = 'Juan';
  document.getElementById('tipoRelacion').value = 'hijo';
  agregarMiembro();

  // 3. Agrega hermano (hombre) de Ana
  document.getElementById('nombre').value = 'Pedro';
  document.getElementById('genero').value = 'hombre';
  document.getElementById('relacion').value = 'Ana';
  document.getElementById('tipoRelacion').value = 'hermano';
  agregarMiembro();

  // 4. Agrega esposo (hombre) de Ana
  document.getElementById('nombre').value = 'Carlos';
  document.getElementById('genero').value = 'hombre';
  document.getElementById('relacion').value = 'Ana';
  document.getElementById('tipoRelacion').value = 'esposo';
  agregarMiembro();

  // 5. Agrega esposa (mujer) de Juan
  document.getElementById('nombre').value = 'Maria';
  document.getElementById('genero').value = 'mujer';
  document.getElementById('relacion').value = 'Juan';
  document.getElementById('tipoRelacion').value = 'esposa';
  agregarMiembro();

  // Muestra el resultado en consola
  console.log('Árbol generado:', arbol);
}

// Para ejecutar manualmente desde la consola del navegador:
// testArbolGenealogico();
