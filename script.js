const arbol = {};

// Cargar árbol desde localStorage al iniciar
window.onload = function () {
  const data = localStorage.getItem("arbolGenealogico");
  if (data) {
    const obj = JSON.parse(data);
    Object.keys(obj).forEach((k) => (arbol[k] = obj[k]));
    actualizarListaPersonas();
    dibujarArbol();
  }
};

function guardarEnLocalStorage() {
  localStorage.setItem("arbolGenealogico", JSON.stringify(arbol));
}

function agregarMiembro() {
  const nombre = document.getElementById("nombre").value.trim();
  const personaRelacionada = document.getElementById("relacion").value.trim();
  const tipoRelacion = document.getElementById("tipoRelacion").value;
  const genero = document.getElementById("genero").value; // Nuevo campo para género

  if (!nombre) {
    alert("Por favor, ingresa un nombre.");
    return;
  }

  // Si es el primer nodo, posición central
  if (!arbol[nombre]) {
    arbol[nombre] = {
      nombre,
      padres: [],
      hijos: [],
      hermanos: [],
      esposos: [],
      nivel: 0,
      x: 0,
      y: 0,
      genero: genero || "hombre", // por defecto hombre
    };
  } else {
    arbol[nombre].genero = genero || arbol[nombre].genero || "hombre";
  }

  if (personaRelacionada && personaRelacionada !== nombre) {
    if (!arbol[personaRelacionada]) {
      arbol[personaRelacionada] = {
        nombre: personaRelacionada,
        padres: [],
        hijos: [],
        hermanos: [],
        esposos: [],
        nivel: 0,
        x: 0,
        y: 0,
        genero: "hombre", // por defecto
      };
    }

    switch (tipoRelacion) {
      case "padre":
        if (!arbol[nombre].padres.includes(personaRelacionada)) {
          arbol[nombre].padres.push(personaRelacionada);
        }
        if (!arbol[personaRelacionada].hijos.includes(nombre)) {
          arbol[personaRelacionada].hijos.push(nombre);
        }
        // Si el padre tiene más de un hijo, todos deben ser hermanos entre sí
        arbol[personaRelacionada].hijos.forEach((hijo1) => {
          arbol[personaRelacionada].hijos.forEach((hijo2) => {
            if (hijo1 !== hijo2 && !arbol[hijo1].hermanos.includes(hijo2)) {
              arbol[hijo1].hermanos.push(hijo2);
            }
          });
        });
        break;
      case "hijo":
        if (!arbol[nombre].hijos.includes(personaRelacionada)) {
          arbol[nombre].hijos.push(personaRelacionada);
        }
        if (!arbol[personaRelacionada].padres.includes(nombre)) {
          arbol[personaRelacionada].padres.push(nombre);
        }
        // Si el padre (nombre) tiene más de un hijo, todos deben ser hermanos entre sí
        arbol[nombre].hijos.forEach((hijo1) => {
          arbol[nombre].hijos.forEach((hijo2) => {
            if (hijo1 !== hijo2 && !arbol[hijo1].hermanos.includes(hijo2)) {
              arbol[hijo1].hermanos.push(hijo2);
            }
          });
        });
        break;
      case "hermano":
        if (!arbol[nombre].hermanos.includes(personaRelacionada)) {
          arbol[nombre].hermanos.push(personaRelacionada);
        }
        if (!arbol[personaRelacionada].hermanos.includes(nombre)) {
          arbol[personaRelacionada].hermanos.push(nombre);
        }
        // Todos los hermanos deben tenerse entre sí
        const todosHermanos = Array.from(
          new Set([
            ...arbol[nombre].hermanos,
            nombre,
            ...arbol[personaRelacionada].hermanos,
            personaRelacionada,
          ])
        );
        todosHermanos.forEach((h1) => {
          todosHermanos.forEach((h2) => {
            if (h1 !== h2 && !arbol[h1].hermanos.includes(h2)) {
              arbol[h1].hermanos.push(h2);
            }
          });
        });
        break;
      case "esposo":
      case "esposa":
        if (!arbol[nombre].esposos.includes(personaRelacionada)) {
          arbol[nombre].esposos.push(personaRelacionada);
        }
        if (!arbol[personaRelacionada].esposos.includes(nombre)) {
          arbol[personaRelacionada].esposos.push(nombre);
        }
        break;
    }
  }

  actualizarListaPersonas();
  dibujarArbol();
  guardarEnLocalStorage();

  // Limpiar campos tras agregar
  document.getElementById("nombre").value = "";
  document.getElementById("relacion").value = "";
  document.getElementById("tipoRelacion").selectedIndex = 0;
  document.getElementById("genero").selectedIndex = 0;
  document.getElementById("nombre").focus();
}

function actualizarListaPersonas() {
  const lista = document.getElementById("listaPersonas");
  if (lista) {
    lista.innerHTML = "";
    const mostrados = new Set(); // Para evitar duplicados
    let hayPersonas = false;
    Object.values(arbol).forEach((persona) => {
      if (!mostrados.has(persona.nombre)) {
        hayPersonas = true;
        let texto = persona.nombre;
        if (persona.esposos && persona.esposos.length > 0) {
          // Mostrar todos los esposos/as juntos, primero los esposos y luego la persona
          const espososNoMostrados = persona.esposos.filter(
            (e) => !mostrados.has(e)
          );
          if (espososNoMostrados.length > 0) {
            // Esposos/as delante del nombre principal
            texto = espososNoMostrados.join(" y ") + " y " + persona.nombre;
            espososNoMostrados.forEach((e) => mostrados.add(e));
          }
        }
        const li = document.createElement("li");
        li.textContent = texto;
        lista.appendChild(li);
        mostrados.add(persona.nombre);
      }
    });
    if (!hayPersonas) {
      const li = document.createElement("li");
      li.textContent =
        "No hay personas en el árbol. Agrega un miembro para comenzar.";
      li.style.color = "#888";
      lista.appendChild(li);
    }
  }

  // Actualiza el datalist para autocompletar
  const datalist = document.getElementById("datalistPersonas");
  if (datalist) {
    datalist.innerHTML = "";
    Object.values(arbol).forEach((persona) => {
      const option = document.createElement("option");
      option.value = persona.nombre;
      datalist.appendChild(option);
    });
  }
}

function limpiarArbol() {
  for (const key in arbol) delete arbol[key];
  localStorage.removeItem("arbolGenealogico");
  actualizarListaPersonas();
  dibujarArbol();
}

function calcularPosicionesArbol() {
  // Encuentra el nodo raíz (el que no tiene padres)
  let raiz = null;
  for (const nombre in arbol) {
    if (arbol[nombre].padres.length === 0) {
      raiz = arbol[nombre];
      break;
    }
  }
  if (!raiz) return;

  // Obtén el canvas y su ancho para centrar el árbol
  const canvas = document.getElementById("canvasArbol");
  const canvasWidth = canvas ? canvas.width : 1200;

  // Posición inicial del nodo raíz (centrado)
  raiz.x = canvasWidth / 2;
  raiz.y = 80;

  // Recursivo para ubicar hijos, hermanos y cónyuges
  function ubicar(persona, x, y, nivel = 0, visitados = new Set()) {
    if (visitados.has(persona.nombre)) return;
    visitados.add(persona.nombre);
    persona.x = x;
    persona.y = y;

    // Cónyuge a la izquierda (misma altura, no arriba)
    if (persona.esposos && persona.esposos.length > 0) {
      persona.esposos.forEach((conyugeNombre, idx) => {
        const conyuge = arbol[conyugeNombre];
        if (conyuge) {
          ubicar(conyuge, x - 150 - idx * 100, y, nivel, visitados);
        }
      });
    }

    // Hijos debajo
    if (persona.hijos && persona.hijos.length > 0) {
      const totalHijos = persona.hijos.length;
      const hijosOffset = 150;
      const inicioX = x - ((totalHijos - 1) * hijosOffset) / 2;
      persona.hijos.forEach((hijoNombre, idx) => {
        const hijo = arbol[hijoNombre];
        if (hijo) {
          ubicar(
            hijo,
            inicioX + idx * hijosOffset,
            y + 120,
            nivel + 1,
            visitados
          );
        }
      });
    }

    // Hermanos a la derecha
    if (persona.hermanos && persona.hermanos.length > 0) {
      persona.hermanos.forEach((hermanoNombre, idx) => {
        const hermano = arbol[hermanoNombre];
        if (hermano) {
          ubicar(hermano, x + 150 + idx * 100, y, nivel, visitados);
        }
      });
    }
  }

  ubicar(raiz, raiz.x, raiz.y);
}

function dibujarArbol() {
  calcularPosicionesArbol();
  const canvas = document.getElementById("canvasArbol");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;

  // Dibuja líneas y nodos
  Object.values(arbol).forEach((persona) => {
    // Línea con padres
    persona.padres.forEach((padreNombre) => {
      const padre = arbol[padreNombre];
      if (padre) {
        ctx.beginPath();
        ctx.moveTo(persona.x, persona.y - 20);
        ctx.lineTo(padre.x, padre.y + 20);
        ctx.stroke();
      }
    });
    // Línea con hermanos
    persona.hermanos.forEach((hermanoNombre) => {
      const hermano = arbol[hermanoNombre];
      if (hermano) {
        ctx.beginPath();
        ctx.moveTo(persona.x + 50, persona.y);
        ctx.lineTo(hermano.x - 50, hermano.y);
        ctx.stroke();
      }
    });
    // Línea con cónyuge
    persona.esposos.forEach((conyugeNombre) => {
      const conyuge = arbol[conyugeNombre];
      if (conyuge) {
        ctx.beginPath();
        ctx.moveTo(persona.x - 50, persona.y);
        ctx.lineTo(conyuge.x + 50, conyuge.y);
        ctx.stroke();
      }
    });
  });

  // Dibuja los nodos (cuadrado para hombre, círculo para mujer)
  Object.values(arbol).forEach((persona) => {
    if (persona.genero === "mujer") {
      ctx.beginPath();
      ctx.arc(persona.x, persona.y - 5, 25, 0, 2 * Math.PI);
      ctx.fillStyle = "#e91e63";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fillText(persona.nombre, persona.x, persona.y + 30);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(persona.x - 25, persona.y - 30, 50, 50);
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(persona.x - 25, persona.y - 30, 50, 50);
      ctx.fillStyle = "#fff";
      ctx.fillText(persona.nombre, persona.x, persona.y + 30);
    }
  });
}
