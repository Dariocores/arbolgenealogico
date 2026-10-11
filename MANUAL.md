# Manual de uso — Árbol Genealógico

Aplicación web para crear, editar y visualizar tu árbol genealógico de forma
interactiva. Los datos se guardan automáticamente en tu navegador.

---

## 1. Cómo iniciar la aplicación

Necesitás tener instalado [Node.js](https://nodejs.org) (versión 18 o superior).

```bash
npm install     # instala las dependencias (solo la primera vez)
npm run dev     # inicia la aplicación en modo desarrollo
```

Luego abrí en el navegador la dirección que muestra la consola, normalmente:

```
http://localhost:5173
```

Para generar la versión de producción:

```bash
npm run build     # crea la carpeta dist/ lista para publicar
npm run preview   # sirve localmente la versión generada
```

Para ejecutar las pruebas automáticas:

```bash
npm test
```

---

## 2. Navegación

En la barra superior encontrás estas secciones:

| Sección | Para qué sirve |
| --- | --- |
| **Inicio** | Pantalla de bienvenida con estadísticas del árbol. |
| **Árbol** | Visualización gráfica del árbol y detalle de la persona seleccionada. |
| **Personas** | Listado, alta, edición, borrado de personas y gestión de relaciones. |
| **Configuración** | Exportar/Importar (JSON, GEDCOM, PNG, SVG) y limpiar el árbol. |

A la derecha de la barra hay un botón **☾ / ☀** para cambiar entre modo claro y
modo oscuro. Al lado está el botón **Temas** (ícono de paleta), que despliega
cuatro colores de acento: **Verde azulado**, **Azul petróleo**, **Naranja** y
**Claro**. El color elegido se aplica a la barra, los botones y las líneas del
árbol. Ambas preferencias se recuerdan en tu navegador.

> **Cuenta y licencia.** Si la aplicación está publicada en **modo nube**, vas a
> necesitar **crear una cuenta** e **iniciar sesión**. Cada cuenta tiene una
> **licencia mensual** que habilita el administrador: si no está activa, vas a ver
> una pantalla para solicitar la activación. En **modo local** (sin cuenta) no
> hace falta iniciar sesión y los datos quedan solo en tu navegador.

---

## 3. Gestión de personas

Andá a **Personas**. Arriba del listado:

- **Buscar por nombre o apellido**: filtra el listado mientras escribís.
- **+ Agregar persona**: abre el formulario de alta.

### 3.1 Agregar o editar una persona

El formulario tiene los siguientes campos:

| Campo | Descripción |
| --- | --- |
| **Nombre** | Obligatorio si no completás apellido. |
| **Apellido** | Opcional. |
| **Género** | Masculino, Femenino, Otro o Desconocido. Define el símbolo en el árbol. |
| **Generación** | Número orientativo (1, 2, 3…). El dibujo igual calcula las generaciones por las relaciones. |
| **Nacimiento** | Fecha (se usa para ordenar hermanos por edad). |
| **Lugar de nacimiento** | Texto libre. |
| **Fallecimiento** | Si completás este campo, la persona se marca como fallecida en el árbol. |
| **Lugar de fallecimiento** | Texto libre. |
| **Ocupación** | Texto libre. |
| **Religión** | Texto libre. |
| **URL de foto** | Enlace a una imagen (opcional). |
| **Notas / Biografía** | Texto libre. |

> Se debe ingresar **al menos un nombre o apellido** para guardar.

- Para **editar** una persona, tocá el botón **Editar** de su tarjeta.
- Para **eliminar**, tocá **Eliminar**. Se borra la persona **y todas sus
  relaciones**. La acción pide confirmación.

Al hacer clic sobre el nombre de una persona, queda **seleccionada** y se abre
abajo el panel de **Relaciones**.

---

## 4. Cómo definir relaciones familiares

Las relaciones se cargan desde el panel **Relaciones de …** (en Personas),
siempre partiendo de la persona **seleccionada**.

1. Seleccioná a la persona tocando su nombre.
2. En **Agregar relación**, elegí el **rol de la persona que vas a agregar**
   respecto de la seleccionada.
3. Elegí la persona en la segunda lista y tocá **Agregar**.

### 4.1 Opciones de relación

| Opción | Significado |
| --- | --- |
| **Hijo/a** | La persona elegida es hija/o de la seleccionada. |
| **Padre/Madre** | La persona elegida es padre/madre de la seleccionada. |
| **Padre/Madre adoptivo/a** | Vínculo adoptivo (se muestra como “adoptivo/a”). |
| **Padrastro/Madrastra** | Vínculo de padrastro/madrastra. |
| **Pareja** | Relación de pareja entre ambas personas. |

> La aplicación ordena automáticamente quién es progenitor y quién es hijo,
> aunque la cargues al revés, y evita relaciones duplicadas.

Cada grupo (**Padres**, **Hijos**, **Parejas**) lista las relaciones existentes
con un botón **quitar** para eliminarlas.

---

## 5. La vista Árbol

En **Árbol** ves el dibujo del árbol y, a la derecha, el detalle de la persona
seleccionada.

### 5.1 Símbolos y líneas

| Elemento | Significado |
| --- | --- |
| **Cuadrado** | Varón. |
| **Círculo** | Mujer. |
| **Rombo** | Género desconocido u otro. |
| **Línea diagonal** sobre el símbolo | Persona fallecida. |
| **Línea verde punteada** | Matrimonio o pareja. |
| **Línea gris continua** | Descendencia (padres → hijos). |

Además:

- **Números romanos (I, II, III…)** a la izquierda indican la generación.
- **Número chico** junto a cada símbolo indica el orden dentro de su generación
  (de izquierda a derecha).
- Los **hermanos** se ordenan por edad: el mayor a la izquierda.
- La **pareja que se integra** a la familia aparece a la izquierda de quien
  pertenece al linaje.
- Las líneas de descendencia bajan desde el punto medio de la pareja, para
  evitar cruces y “zigzags”.

### 5.2 Controles

En la esquina inferior derecha:

- **+** acercar
- **−** alejar
- **⊙** centrar y ajustar a la pantalla

También podés hacer **zoom con la rueda** del mouse y **arrastrar** para
desplazarte. Al **hacer clic en una persona** se selecciona y se muestra su
detalle (nombre, género, fechas, lugares y sus relaciones) en el panel derecho.

La **leyenda** (arriba a la izquierda del dibujo) repite esta referencia.

---

## 6. Guardado automático

No hace falta “guardar”: cada cambio (persona, relación, selección) se guarda
solo en el navegador mediante `localStorage`.

- La información queda en **este navegador y equipo**. Si cambiás de navegador,
  usás modo incógnito o borrás los datos del sitio, no la vas a ver.
- Por eso conviene hacer **copias de seguridad** con la exportación (ver
  sección 7).

---

## 7. Exportar e importar

Andá a **Configuración → Exportar / Importar**.

### 7.1 Formatos disponibles

| Formato | Qué es | ¿Se puede volver a cargar y editar? |
| --- | --- | --- |
| **JSON** | Copia de seguridad completa del árbol. | **Sí** — con “Importar JSON”. |
| **GEDCOM (.ged)** | Formato estándar de genealogía para intercambiar con otros programas (Gramps, MyHeritage, Ancestry, etc.). | Sí, con “Importar GEDCOM”. |
| **árbol (PNG)** | Imagen del dibujo del árbol (como se ve en la vista Árbol). |
| **Árbol (SVG)** | Imagen vectorial del árbol (se puede ampliar sin perder calidad). |

> **Importante:** las imágenes **PNG y SVG son solo imágenes**: sirven para
> compartir o imprimir, pero **no se pueden volver a cargar** en la aplicación
> para seguir editando. Para respaldar y seguir trabajando usá **JSON** o
> **GEDCOM**.

### 7.2 Exportar

- **Exportar JSON**: descarga un archivo `.json` con toda la información.
- **Exportar GEDCOM (.ged)**: genera un archivo estándar para intercambiar con
  otros programas de genealogía.
- **Exportar árbol (PNG)**: genera una **imagen** del árbol tal como se ve.
  Ideal para compartir por WhatsApp, imprimir o adjuntar.
- **Exportar árbol (SVG)**: genera una **imagen vectorial** (no pierde calidad
  al ampliar), útil para diseño o impresión grande.

### 7.3 Importar

- **Importar JSON**: vuelve a cargar una copia de seguridad.
- **Importar GEDCOM (.ged)**: carga un archivo de otro programa de genealogía.

> ⚠️ **Importante:** importar **reemplaza** el árbol actual por el contenido del
> archivo. Antes de importar, exportá el actual si querés conservarlo.

---

## 8. Limpiar el árbol

En **Configuración → Limpiar todo el árbol** se eliminan **todas** las personas
y relaciones. La acción pide confirmación y **no se puede deshacer**.
Exportá una copia (JSON) antes de hacerlo.

---

## 9. Preguntas frecuentes

**¿Se pierde todo si cierro el navegador?**
No. Se guarda automáticamente en el navegador. Pero si borrás los datos del
sitio o usás otro navegador, no vas a verlo. Usá exportar/importar para moverlo.

**¿Puedo usarlo en varios equipos?**
Sí, exportando el **JSON** en un equipo e importándolo en el otro.

**El árbol no se reacomoda al asignar un parentesco.**
Se reubica solo. Si no lo ves, recargá la página con `Ctrl + Shift + R`.

Al cargar el proyecto por primera vez vas a ver un **árbol de ejemplo** (la
familia Cores). Podés editarlo o limpiarlo y empezar de cero.

---

## 10. Resumen de atajos

| Acción | Cómo |
| --- | --- |
| Acercar / alejar | Rueda del mouse o botones **+ / −** |
| Mover el árbol | Arrastrar con el mouse |
| Centrar | Botón **⊙** |
| Seleccionar persona | Clic sobre su símbolo en el árbol o sobre su tarjeta en Personas |
| Cambiar tema | Botón **☾ / ☀** en la barra superior |
| Cambiar color de acento | Botón **Temas** (paleta) en la barra superior |
