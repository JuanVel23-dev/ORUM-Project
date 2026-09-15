# X1 · Fundación de la dirección de arte v4

> Tonalidades cálidas, tipografía de impacto y movimiento.
> Rama `mejora-diseno` · 14/09/2026 · encargo en
> [`../DIRECCION-ARTE-v4.md`](../DIRECCION-ARTE-v4.md).
>
> Esto es la **capa de fundación**: tokens, familia tipográfica y vocabulario de
> movimiento. **Ninguna pantalla se tocó** — ni `miembros/`, ni `admin/`, ni
> `comercios/`, ni `(publico)/`. Lo que aquí se construye son las herramientas
> con las que esas pantallas resolverán el encargo real del propietario.

---

## A · La paleta cálida

### Qué se hizo

`src/styles/tokens.css` cambia de temperatura de raíz. La rampa neutra pasa de
matiz ~240° (frío) a ~20–30° (cálido), en **los dos temas**, y aparecen tres
familias nuevas de token.

| Familia | Tokens | Valores |
|---|---|---|
| Superficies claras | `--w-0` `--w-50` `--w-100` | `#FDFCFA` papel · `#FAF7F0` crema · `#F3EEE3` crema honda |
| Tinta cálida | `--tinta-1` `--tinta-2` `--tinta-3` | `#1B1A18` · `#5C5349` · `#7A7068` |
| Cacao | `--cacao-900` `--cacao-800` `--cacao-700` | `#2B1A15` · `#3A251E` · `#4C332A` |
| Oscuros | `--n-1000` … `--n-50` | `#14100E` … `#F5F0E8` |
| Oro | `--gold-200` … `--gold-800` | `#F2E3BE` · `#E6CD97` · `#D5AC5B` · `#C69A43` · `#A8812B` · `#8A6D2F` · `#6B5424` |

Los cuatro oros del encargo caen así: **display** `--gold-400`, **relleno de
acción y filo** `--gold-600`, **texto e iconos** `--gold-700`, y `--gold-500`
queda como oro de marca y relleno de acción en tema oscuro.

Además:

- **Sombras a rgb 28/22/18** (cálidas), conservando las dos capas por escalón y
  la amplitud que ganó la revisión W1. Ni un `none` dentro de una lista.
- `--edge-light` pasa de blanco puro a `rgba(255, 249, 240, …)`: un filo de luz
  frío sobre una superficie cálida se ve azul.
- `--scrim` y `--material` también se calientan, en los dos temas.
- `--gold-sheen` y `--gold-hairline` dejan de estar escritos con literales y se
  componen desde la rampa. El barrido **sigue acotado al wordmark**, que es la
  única pieza que todavía quiere frío.
- **Superficies tonales**: `--surface-alt` (crema) y `--surface-alt-2` (crema
  honda) en claro; `--n-950` y `--n-900` en oscuro. Es la herramienta que pedía
  «fondos que no sean solo blanco o negro».
- **Franja de cacao**: `--cacao-bg` `--cacao-surface` `--cacao-hover`
  `--cacao-fg` `--cacao-fg-2` `--cacao-fg-3` `--cacao-brand` `--cacao-edge`.
  Se declaran **fuera** de los bloques de tema: una franja de cacao es cacao en
  claro y en oscuro, igual que el `QrCode`. Si siguiera al tema, en oscuro sería
  una mancha negra sobre negro y el recurso desaparecería justo donde más falta.
- **Radios +1 escalón** (v4 §4): 8 / 12 / 18 / 24 / 32px.

### Ratios verificados al aplicar

Se recalcularon con el método WCAG 2.1, no a ojo. **Todos los valores medidos
del encargo se confirmaron exactamente**:

| Par | Medido aquí | Encargo |
|---|---|---|
| papel vs crema | 1,04:1 | 1,04:1 ✓ |
| papel sobre cacao | 16,24:1 | 16,24:1 ✓ |
| tinta 1 sobre papel / crema | 16,96 / 16,25 | 16,96 / 16,25 ✓ |
| tinta 2 sobre papel | 7,34:1 | 7,34:1 ✓ |
| tinta 3 sobre papel | 4,71:1 | 4,71:1 ✓ |
| `--gold-400` sobre cacao | 7,83:1 | 7,83:1 ✓ |
| `--gold-400` sobre crema | 1,99:1 ⛔ | 1,99:1 ⛔ ✓ |
| tinta sobre `--gold-600` | 4,84:1 | 4,84:1 ✓ |
| filo `--gold-600` sobre papel | 3,51:1 | 3,51:1 ✓ |
| `--gold-700` sobre papel / crema | 4,75 / 4,55 | 4,75 / 4,55 ✓ |

Tema oscuro, auditado **por separado** como exige la norma:

| Par | Ratio |
|---|---|
| `--n-50` sobre `--n-1000` / `--n-900` | 16,67 / 15,12 |
| `--n-300` (texto 2) sobre `--n-1000` | 9,73 |
| `--n-400` (texto 3) sobre `--n-1000` / `--n-900` / `--n-850` | 6,56 / 5,95 / 5,42 |
| `--gold-300` sobre `--n-1000` | 12,20 |
| `--gold-400` (focus) sobre `--n-1000` | 8,90 |
| `--gold-500` sobre `--n-1000`, y `--n-1000` sobre `--gold-500` | 7,30 |
| filo `--gold-500` vs `--n-900` / `--n-950` | 6,62 / 6,99 |
| semánticos sobre `--n-1000` | success 10,05 · warning 7,92 · danger 6,16 · info 6,95 |

Semánticos en claro, sobre papel y sobre crema: success 5,29 / 5,07 · warning
5,16 / 4,95 · danger 6,07 / 5,82 · info 5,67 / 5,44. **Ninguno se cambió**: el
papel cálido es un punto más oscuro que el blanco, así que todos bajaron una
décima y ninguno se acercó al límite.

### Los dos sitios donde el cambio de temperatura ROMPIÓ algo

Esto es exactamente lo que el encargo advertía —«cambiar la temperatura cambia
la luminancia y los ratios firmados dejan de valer»— y pasó de verdad dos veces:

1. **El filo de la placa de logo.** Era `--n-400`, que con la rampa fría daba
   3,33:1 contra el blanco. El `--n-400` cálido (`#A3968A`) es más claro y cae a
   **2,81:1**: reprueba WCAG 1.4.11. Se añadió **`--n-450` (`#8E8177`)**, que
   vuelve a cumplir contra las cuatro superficies donde vive la placa, en los
   dos temas: 3,69 papel · 3,53 crema · 4,54 tarjeta oscura · 5,01 fondo oscuro.
   `--placa-logo-borde` apunta ahora ahí.

2. **Crema honda no admite los dos tonos más tenues.** `--tinta-3` da 4,18:1 y
   `--gold-700` 4,21:1 sobre `#F3EEE3`: los dos reprueban AA. No se arregla
   aclarando `--tinta-3` —sus 4,71:1 sobre papel ya son el mínimo, y el encargo
   lo prohíbe explícitamente— ni oscureciendo crema honda, que la alejaría de su
   papel. **Se acota el uso**: crema honda es superficie de RELLENO (hueco,
   carril, esqueleto, franja decorativa), y el texto tenue que vaya ahí sube a
   `--text-2` (6,51:1) o a `--gold-800` (6,22:1). Está escrito en `tokens.css`
   §1, en `globals.css`, en el propio `.tonoHonda` y en `CLAUDE.md`.

### Lo que se estrechó y conviene vigilar

El par ceremonial de acción pierde holgura: **1.4.3 pasa de 5,40 a 4,84** y
**1.4.11 de 3,66 a 3,51**. Cumplen los dos, pero ya no hay margen para
«oscurecer un poco el papel». Queda anotado en `globals.css` junto al token.

---

## B · Tipografía

### El serif elegido: **Fraunces**, y el eje óptico se descartó

Se barajaron las tres del encargo. Fraunces gana por dos razones y **pierde una
que importaba**, así que la decisión completa es esta:

- **Cormorant Garamond** queda fuera: por debajo de 40px se vuelve esmirriada.
  Su contraste alto adelgaza las astas hasta que dejan de cubrir el píxel, y
  sobre crema —que es papel, no blanco— eso se paga en legibilidad.
- **Playfair Display** habría servido, es robusta y tiene x-height grande. Pero
  cuesta **37,5 KB** (más que la elegida) y es la serif de display más vista de
  Google Fonts: arrastra lectura de «invitación de boda». ORUM tiene que parecer
  ORUM, no una papelería.
- **Fraunces** entra por sus formas de estilo antiguo y ligeramente cálidas, que
  es la misma decisión que toma la paleta, y por ser variable en peso: un solo
  archivo cubre todo el rango sin riesgo de bold sintético.

**El eje `opsz` se midió y se descartó**, que es el punto interesante. Era la
razón original para elegirla —habría hecho por su cuenta la mitad del «tracking
específico del tamaño»— pero cuesta 30 KB medidos:

| Variante (subconjunto `latin`) | Tamaño |
|---|---|
| Fraunces variable `opsz` + `wght` | 65,7 KB |
| **Fraunces variable solo `wght`** | **35,8 KB** ← la que se carga |
| Fraunces estática 400 + 600 (dos archivos) | 35,8 KB |
| Fraunces estática 400 sola | 17,5 KB |
| Playfair Display variable (referencia) | 37,5 KB |

Casi el doble del archivo, para servir a los titulares de unas pocas pantallas,
en el teléfono de gama media que el encargo pone como criterio. **El ajuste por
tamaño se hace a mano** en los tres peldaños `hero`: es trabajo que se paga una
vez y no en cada carga. `SOFT` y `WONK` quedan en 0 (la forma sobria).

Configuración: `subsets: ['latin']`, `display: 'swap'`, fallback **Georgia** —la
serif con métricas más parecidas presente en Windows, macOS, Android e iOS, así
que el intercambio desplaza poco—.

### La frontera: dónde entra el serif y dónde no

| Familia | Token | Dónde |
|---|---|---|
| Fraunces | `--font-display` | **Solo** `h1` y cifras grandes |
| Inter | `--font-sans` | Todo lo demás |

**El serif NO cuelga de `.t-display-*`**, y esa es la decisión estructural del
bloque. `--t-display-*` lo consumen hoy los encabezados de página del panel: si
el serif y los 72px se hubieran colgado de ahí, Administración se los habría
llevado de golpe, que es exactamente lo prohibido. En su lugar hay un peldaño
nuevo, **`hero`, que es opt-in**:

- `.t-hero-1` · 44 → 72px · tracking −0,032em
- `.t-hero-2` · 32 → 48px · tracking −0,024em
- `.t-hero-cifra` · 36 → 52px · tracking −0,018em · `tabular-nums` obligatorio
- `<PageHeader display>` y `<Cifra size="display">` como API de componente

### El rango sube

Era el encargo: «falta impacto, el salto entre el titular y el cuerpo es corto».

| | Antes | Ahora |
|---|---|---|
| Extremo superior | 40px (`display-1`) | **72px** (`hero-1`) |
| Cuerpo | 15px | 15px |
| Razón | 2,7x | **4,8x** |

Y la escala sans también sube un escalón, para que las pantallas de trabajo
—donde el serif no entra— ganen jerarquía igual: `display-1` 36→48px,
`display-2` 28→36px, `title-1` 26px, `title-2` 21px.

### Tracking específico del tamaño, en los dos extremos

Negativo al crecer (−0,032em a 72px, −0,011em a 21px) y **positivo al encoger**:
`--t-overline-tracking` sube de 0,06 a **0,09em** y `--t-caption-tracking` de
0,010 a 0,012em. Las mayúsculas a 11px comparten demasiada masa vertical y sin
aire se leen como una mancha. Es el mismo principio aplicado al otro extremo de
la escala, y es por lo que un `letter-spacing` único está mal siempre.

---

## C · Movimiento

### `transition: all` encontrados: **cero**

Se barrió `src/components/ui/**` y `src/components/shell/**`. La única aparición
de la cadena en todo `src/` es **un comentario** en `globals.css` que advierte
contra ella. La regla ya estaba interiorizada; queda escrita en las
prohibiciones duras de `CLAUDE.md` para que siga estándolo.

Lo que sí apareció barriendo fue un fallo del mismo tipo: **`.punto` de
`toggle.module.css` declaraba `scale` DOS VECES** en la misma lista de
transiciones, una con `--dur-base` y otra con `--dur-rebote`. En una lista
separada por comas gana la última, así que la primera no se aplicaba nunca — sin
error, sin aviso, y sin forma de verlo salvo leyendo la línea. Se dejó una sola.

### Curvas

```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
--ease-hero:   cubic-bezier(0.645, 0.045, 0.355, 1)   ← nueva
```

**`--ease-in` se eliminó**, no se dejó «por si acaso». No tenía consumidores en
CSS… pero sí uno escondido: `modal.tsx` animaba la SALIDA del diálogo con
`ease: [0.7, 0, 0.84, 0]` escrito a mano, que es esa misma curva. Se sustituyó
por `salidaDe(SPRING_UI)`.

Gemelas en JS: `EASE_OUT`, `EASE_IN_OUT`, `EASE_HERO` en `motion.ts`.

### Duraciones

| Token | Antes | Ahora | Banda |
|---|---|---|---|
| `--dur-fast` | 180 | **140** | pulsación 100–160 |
| `--dur-rebote` | 320 | **200** | pulsación |
| `--dur-base` | 260 | **220** | desplegable 150–250 |
| `--dur-slow` | 400 | **320** | overlay 200–500 |
| `--dur-page` | 500 | **420** | overlay |
| `--dur-theme` | 220 | **180** | — |
| `--dur-salida` | — | **150** | nuevo |
| `--escalonado` | — | **40** | nuevo, banda 30–80 |
| `--dur-giro` / `--dur-bucle` / `--dur-barrido` | literales | 720 / 1200 / 1400 | nuevos |

Resortes: `SPRING_UI` 0,35→0,30 · `SPRING_MOVE` 0,40→0,34 · `SPRING_SHEET`
0,35→0,32 · `SPRING_POP` 0,30→0,26 · `SPRING_MATERIAL` 0,42→0,38.

### Las cinco correcciones

1. **Nada entra desde `scale(0)`.** El punto del `Radio` entraba desde 0 —un
   globo inflándose— y ahora entra desde `0.8` con `opacity: 0` haciendo el
   trabajo de ocultarlo en reposo. El icono de `Copiar` entraba desde `0.7`
   (30 % de salto en un icono de 15px) y ahora desde `0.92`.
2. **`transition: all`**: cero, ver arriba.
3. **La salida más rápida que la entrada.** Token `--dur-salida` en CSS y
   **`salidaDe(preset)`** en JS (0,65x, y **sin rebote**: un sobreimpulso al
   salir deja el objeto pasándose de su destino justo antes de desaparecer, y el
   ojo lo lee como un tirón). Aplicado al velo del modal, al panel de la hoja,
   al descarte del toast y al velo de la hoja.
4. **Escalonado 30–80 ms.** `--escalonado` = 40. Estaba escrito a mano **siete
   veces** en `layout.module.css` (35 ms) y otra vez, **distinto**, en el menú
   (22 ms, que queda por debajo de la banda: con ocho opciones la secuencia
   entera duraba 176 ms y se leía como un parpadeo, no como ritmo). Añadida
   `retardoEscalonado(indice, paso, maximo)` en `motion.ts`, con el tope —que
   importa más que el paso— incluido.
5. **Transiciones, no `@keyframes`, en lo que se dispara rápido.** Revisado uno
   por uno. Se documenta la **excepción legítima**: cuando React **intercambia**
   el elemento (el icono de `Copiar`, que pasa de `Copy` a `Check`) no existe un
   valor de partida en el mismo nodo, así que una transición no tiene de dónde
   arrancar y el keyframe es lo correcto.

Y de paso, todas las duraciones literales que quedaban en CSS pasan a token:
`1400ms ease-in-out` del esqueleto, `1200ms` de la barra indeterminada, `720ms`
del spinner, `280ms` de la sacudida del campo, `180ms`/`120ms` de la salida del
velo del modal.

---

## D · `CLAUDE.md`

Actualizado a la v4. Lo relevante:

- **La regla de los neutrales fríos se borró**, que era el encargo explícito, y
  en su lugar hay un aviso en la cabecera de que **queda derogada** — porque el
  riesgo no es que falte, es que alguien la encuentre en otro archivo sin
  actualizar y construya contra ella.
- Sección nueva **«Tonalidades: papel, crema, cacao»**, con la tabla de las
  cuatro superficies, la advertencia de que una franja no es una tarjeta, y el
  caso real del `--n-450` como ejemplo de por qué ningún valor entra sin
  recalcular.
- Sección nueva **«Tipografía: dos familias, y la frontera importa»**.
- **«El oro»** se reescribe con los cuatro trabajos y sus prohibiciones.
- **«Movimiento»** gana la regla cero (la frecuencia), la tabla de bandas, las
  tres curvas y las cinco correcciones.
- Cuatro prohibiciones duras nuevas: `transition: all`, `ease-in`, entrar desde
  `scale(0)`, y serif de display en pantallas de trabajo.
- **Intactas**, como se pidió: «Estado de membresía», la regla del `QrCode` y
  todo lo de View Transitions.

---

## Verificación

```
.\node_modules\.bin\tsc.cmd --noEmit          sin salida
.\node_modules\.bin\eslint.cmd .              sin salida
.\node_modules\.bin\vitest.cmd run            249 pruebas · 20 archivos
.\node_modules\.bin\next.cmd build            compila
```

**No se miró renderizado.** La automatización de navegador de esta máquina no
puede redimensionar la ventana (deuda conocida n.º 3), y una medición con
`getComputedStyle` durante una transición da falsos negativos. Todo lo de arriba
es cálculo y compilación, no observación.

---

## Pendiente, y por qué no se hizo aquí

Tres archivos conservan literales de la paleta anterior (`#0A0A0C`, `#BFA063`).
**Están fuera del alcance declarado de X1**, así que no se tocaron:

| Archivo | Qué tiene | Qué necesita |
|---|---|---|
| `src/app/manifest.ts` | `background_color` y `theme_color` en `#0A0A0C` | `#14100E` |
| `src/app/apple-icon.tsx` | fondo `#0A0A0C`, anillo `#BFA063` | `#14100E` y `#C69A43` |
| `src/app/icon.svg` | fondo `#0A0A0C`, gradiente con los cuatro oros fríos | fondo cálido y las paradas nuevas |

Se ven en la PWA instalada y en el favicon: hasta que se cambien, la aplicación
instalada arranca con una franja del color de la dirección anterior. Son cinco
líneas en total.
