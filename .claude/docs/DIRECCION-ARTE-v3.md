# Dirección de arte v3 — luz, no trazo · 14/09/2026

> **Encargo del propietario.** Sustituye a [`DIRECCION-ARTE-claro.md`](./DIRECCION-ARTE-claro.md)
> en lo que esta diga, y solo en eso. Lo que no se nombre aquí sigue vigente.
>
> Es una corrección de rumbo sobre la v2, no una vuelta atrás: el papel blanco se
> queda, el oro se queda, la disciplina se queda. Lo que cambia es **qué separa
> una superficie de otra**.

---

## 1. Por qué cambia, en una frase

La v2 separó superficies con **trazo de tinta**. Sobre papel funcionaba, pero el
resultado se lee como documento impreso, y el encargo es otro: **atractivo y
tecnológico**. Un trazo negro es papelería. Una sombra bien hecha es una
pantalla.

**La frase nueva: papel blanco, ninguna línea, luz y sombra — y el oro aparece
cuando tocas algo.**

## 2. Lo que cambia, y el token exacto

### 2.1 Fuera el trazo por defecto

| Token | v2 | v3 | Por qué |
|---|---|---|---|
| `--border-strong` | tinta plena | **no se usa en superficies** | Lo que definía la tarjeta pasa a ser la sombra |
| `--border` | tinta 55 % | se conserva, **solo para divisiones internas** | Separar dentro de una tarjeta sigue haciendo falta |
| `--border-subtle` | tinta 22 % | se conserva, hairlines | Igual |
| `--brand-edge` | filos dorados | **el filo del estado activo** | Es el que aparece al señalar, enfocar o marcar |

**Regla nueva:** una superficie **no lleva borde en reposo**. Si necesita que se
la vea, sube de sombra, no de trazo.

### 2.2 La sombra hace todo el trabajo, así que tiene que poder

La escala de la v2 desplaza y casi no desenfoca — es el canto duro de una hoja
sobre otra, que es exactamente el lenguaje de papel del que hay que salir.

La v3 la reescribe en dos capas por escalón: **un contacto corto y oscuro** que
ancla el objeto al fondo, y **un halo amplio y muy suave** que le da volumen.
Sigue en rgb 20/20/28 —el susurro frío de los neutrales— porque con negro puro
el conjunto envejece.

```
--shadow-1: 0 1px 2px rgba(20,20,28,.06),  0 2px 8px rgba(20,20,28,.05)
--shadow-2: 0 2px 4px rgba(20,20,28,.07),  0 8px 20px rgba(20,20,28,.07)
--shadow-3: 0 4px 8px rgba(20,20,28,.08),  0 16px 40px rgba(20,20,28,.10)
--shadow-4: 0 8px 16px rgba(20,20,28,.10), 0 32px 72px rgba(20,20,28,.14)
```

Regla de Apple que aplica aquí: **la superficie grande se lee más gruesa.** Una
tarjeta sube un escalón respecto a un chip; un overlay va dos por encima de todo.

⚠️ **La prohibición de `none` dentro de una lista de sombras sigue viva y ahora
es crítica**: cada escalón tiene dos entradas. Un `none` entre comas invalida la
declaración ENTERA en silencio y la pantalla se queda sin una sola sombra.
`--edge` sigue valiendo `0 0 rgba(0,0,0,0)`.

### 2.3 El oro es la respuesta al toque

Aquí es donde el oro gana su sitio, y es un cambio de papel importante: deja de
ser solo marca y pasa a ser **la señal de que el sistema te está respondiendo**.

| Estado | Qué pasa |
|---|---|
| Reposo | Sin borde. Solo sombra |
| **Señalado / enfocado / arrastrado** | Aparece un filo de 1px en `--brand-edge`, y la sombra sube un escalón |
| **Favorito marcado** | El corazón se llena de rojo. **El rojo aquí sí es dato** y por eso va en rojo y no en oro: es el único sitio donde el color dice algo que el oro no puede decir |
| Activo / seleccionado | Filo dorado + relleno de `--surface-hover` |

**El presupuesto del oro no sube.** Sigue en **≤5 % del área visible**, y sigue
sin codificar datos. Que el filo aparezca solo al señalar significa que en
reposo el oro ocupa **menos** que en la v2, no más.

⛔ `--gold-500` sobre blanco sigue prohibido (2,49:1). `--gold-600` sigue siendo
el único tono que cumple los dos criterios en claro.

### 2.4 Los botones: más cálidos y con vida

El encargo dice que el botón primario actual es **demasiado oscuro y se pierde**.
Es cierto: `--action` es `#141418` sobre papel blanco, y a tamaño grande lee como
un bloque de tinta muerto.

- **Portal de Miembros y pantallas de acceso** → el primario pasa a **relleno
  dorado plano** (`--gold-600` + texto `--n-1000`, el par ya firmado: 5,40:1 de
  texto y 3,66:1 de filo). Es el recorrido del cliente, que es donde la norma ya
  lo permitía.
- **Administración y Herramienta de Comercios** → **siguen en tinta**. No cambia.
  Son herramientas de trabajo, y el oro ahí sería ruido.
- **Todos** ganan respuesta al pulsar (§3).

### 2.5 Sin bordes, la accesibilidad hay que sostenerla por otro lado

Quitar el trazo tiene un coste real y hay que pagarlo, no ignorarlo:

- **WCAG 1.4.11 pide 3:1 en el límite de un control interactivo.** Una sombra
  suave **no cumple** ese criterio. Por eso todo control que reciba foco lleva
  su filo dorado en `:focus-visible`, sin excepción — el foco no es decorativo,
  es lo que sostiene el criterio.
- **Un campo de formulario sí conserva borde en reposo.** Sin él, un `<input>`
  vacío sobre papel blanco es invisible: no hay forma de saber dónde se escribe.
  La regla «sin bordes» es para **superficies**, no para controles de entrada.
- **`prefers-contrast: more`** devuelve los bordes. Es el mecanismo que la
  plataforma ofrece para justo este caso.

---

## 3. Movimiento: el toque Apple

El encargo pide explícitamente elementos y animaciones de estilo Apple. Traducido
a reglas ejecutables, y todo esto sale de *Designing Fluid Interfaces*:

1. **Responder en `pointerdown`, no en `click`.** En el momento en que aparece
   latencia, la sensación de manipulación directa se cae por un precipicio.
2. **Resortes, no duraciones.** Por defecto **críticamente amortiguado**
   (`bounce: 0`, respuesta 0,3–0,4 s). El rebote (`bounce: 0.2`) **solo tras un
   gesto con momento** o en algo que aparece encima.
3. **Interrumpible siempre.** Una animación en curso se puede agarrar y revertir.
   Se anima desde el valor **en pantalla**, nunca desde el valor lógico, o se ve
   un salto.
4. **Entrada y salida por el mismo camino**, y **anclada a su origen**: un
   overlay que nace de una tarjeta crece **desde esa tarjeta**
   (`transform-origin`), no desde el centro de la pantalla.
5. **Materializar, no fundir.** Una superficie translúcida entra animando
   **desenfoque y escala a la vez**, para que se lea como un material que llega
   y no como una opacidad que sube.
6. **Solo `transform` y `opacity`.** Única excepción: las View Transitions, que
   el navegador ejecuta sobre instantáneas en el compositor.
7. **`prefers-reduced-motion` no es «sin feedback»**: es el equivalente no
   vestibular. Fundido corto en vez de viaje, sin rebote, sin paralaje.

### 3.1 El overlay de la ficha

La ficha deja de empujar y pasa a abrirse **encima**, con el catálogo detrás
oscurecido. Es el patrón de Apple para una tarea modal: **atenuar para enfocar**,
y empujar la capa de atrás hacia el fondo.

- Fondo: scrim oscuro + la capa de atrás baja de escala muy poco (~0,98) y
  pierde algo de luz. No desaparece: el socio tiene que seguir viendo de dónde
  salió.
- El overlay **nace de la tarjeta que se tocó**.
- Cerrar: botón, tecla de escape, tocar el scrim y —en móvil— arrastrar hacia
  abajo con seguimiento 1:1, resistencia elástica en el borde, y decisión por
  **dónde iba el gesto**, no por dónde se soltó.

### 3.2 El carrusel se mueve

El encargo lo pide y se concede, **con la salvaguarda que exige WCAG 2.2.2**: un
contenido que se mueve solo más de cinco segundos necesita un mecanismo de
pausa. Sin eso es un fallo de accesibilidad conocido, y fue la razón de que no
lo tuviera.

- Desplazamiento continuo y lento, sin tirones.
- **Se detiene** al pasar el ratón, al enfocar con teclado, al tocarlo, y con un
  botón de pausa visible.
- **No se mueve** bajo `prefers-reduced-motion`.

---

## 4. Lo que NO cambia

- `QrCode` negro sobre blanco en los dos temas.
- El primario de **Administración** y de la **Herramienta de Comercios** sigue en
  tinta.
- Contraste AA en todo texto · `:focus-visible` en **todo** interactivo · targets
  ≥44px · un `<h1>` por pantalla · el color nunca como único portador.
- `@container contenido`, nunca `@media`, para adaptación de ancho.
- Todo color, espaciado, radio y duración desde `var(--…)`.
- El tema oscuro sigue existiendo y siendo correcto. El claro es donde se diseña.

---

## 5. El riesgo de esta dirección

La v2 tenía el suyo —la cuadrícula de cajas— y esta tiene el opuesto: **que todo
flote y nada tenga peso.** Si cada tarjeta, cada chip y cada píldora lleva
sombra, la pantalla se convierte en una sopa de objetos levitando y se pierde la
jerarquía igual que se perdía con los bordes.

La disciplina: **la sombra es jerarquía, no decoración.** Un chip no lleva
sombra. Una fila de lista no lleva sombra. Lo que flota es lo que el dedo puede
levantar.
