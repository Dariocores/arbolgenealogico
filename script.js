const arbol = {}; // Objeto para almacenar las relaciones familiares

function agregarMiembro() {
    const nombre = document.getElementById("nombre").value.trim();
    const personaRelacionada = document.getElementById("relacion").value.trim();
    const tipoRelacion = document.getElementById("tipoRelacion").value;

    if (!nombre) {
        alert("Por favor, ingresa un nombre.");
        return;
    }

    if (!arbol[nombre]) {
        arbol[nombre] = { nombre, padres: [], hijos: [], hermanos: [], esposos: [], nivel: 0 };
    }

    if (personaRelacionada && personaRelacionada !== nombre) {
        if (!arbol[personaRelacionada]) {
            arbol[personaRelacionada] = { nombre: personaRelacionada, padres: [], hijos: [], hermanos: [], esposos: [], nivel: 0 };
        }

        switch (tipoRelacion) {
            case "padre":
                arbol[nombre].padres.push(personaRelacionada);
                arbol[personaRelacionada].hijos.push(nombre);
                arbol[personaRelacionada].nivel = arbol[nombre].nivel - 1;
                break;

            case "abuelo":
                arbol[personaRelacionada].padres.forEach(padre => {
                    arbol[padre].padres.push(nombre);
                    arbol[nombre].hijos.push(padre);
                });
                arbol[nombre].nivel = arbol[personaRelacionada].nivel - 2;
                break;

            case "hijo":
                arbol[nombre].hijos.push(personaRelacionada);
                arbol[personaRelacionada].padres.push(nombre);
                arbol[personaRelacionada].nivel = arbol[nombre].nivel + 1;
                break;

            case "hermano":
                arbol[nombre].hermanos.push(personaRelacionada);
                arbol[personaRelacionada].hermanos.push(nombre);
                arbol[nombre].nivel = arbol[personaRelacionada].nivel;
                break;

            case "esposo":
            case "esposa":
                if (!arbol[nombre].esposos.includes(personaRelacionada)) {
                    arbol[nombre].esposos.push(personaRelacionada);
                    arbol[personaRelacionada].esposos.push(nombre);
                    arbol[nombre].nivel = arbol[personaRelacionada].nivel;
                }
                break;
        }
    }

    actualizarListaPersonas();
    dibujarArbol();
}

function eliminarMiembro(nombre) {
    if (!arbol[nombre]) return;

    // Eliminar referencias
    arbol[nombre].padres.forEach(padre => {
        arbol[padre].hijos = arbol[padre].hijos.filter(h => h !== nombre);
    });

    arbol[nombre].hijos.forEach(hijo => {
        arbol[hijo].padres = arbol[hijo].padres.filter(p => p !== nombre);
    });

    arbol[nombre].hermanos.forEach(hermano => {
        arbol[hermano].hermanos = arbol[hermano].hermanos.filter(h => h !== nombre);
    });

    arbol[nombre].esposos.forEach(esposo => {
        arbol[esposo].esposos = arbol[esposo].esposos.filter(e => e !== nombre);
    });

    delete arbol[nombre];

    actualizarListaPersonas();
    dibujarArbol();
}

function actualizarListaPersonas() {
    const lista = document.getElementById("listaPersonas");
    lista.innerHTML = "";

    Object.keys(arbol).forEach(nombre => {
        const option = document.createElement("option");
        option.value = nombre;
        lista.appendChild(option);
    });
}

function dibujarArbol() {
    const contenedor = document.getElementById("arbol");
    contenedor.innerHTML = "";

    const niveles = {};

    Object.values(arbol).forEach(persona => {
        if (!niveles[persona.nivel]) {
            niveles[persona.nivel] = [];
        }
        niveles[persona.nivel].push(persona);
    });

    Object.keys(niveles).sort((a, b) => a - b).forEach(nivel => {
        const fila = document.createElement("div");
        fila.classList.add("fila");

        niveles[nivel].forEach(persona => {
            const div = document.createElement("div");
            div.classList.add("nodo");
            div.innerHTML = `
                <button class="cerrar" onclick="eliminarMiembro('${persona.nombre}')">❌</button>
                <strong>${persona.nombre}</strong><br>
                Padres: ${persona.padres.join(", ") || "N/A"}<br>
                Hijos: ${persona.hijos.join(", ") || "N/A"}<br>
                Hermanos: ${persona.hermanos.join(", ") || "N/A"}<br>
                Esposos: ${persona.esposos.join(", ") || "N/A"}<br>
            `;
            fila.appendChild(div);
        });

        contenedor.appendChild(fila);
    });
}

// Inicializar la lista de personas disponibles
actualizarListaPersonas();
