# W2 · Terminar el portal público · 15/09/2026

> Rama `mejora-diseno`. Alcance exclusivo: `src/app/(publico)/**`.
> Continúa el trabajo parcial commiteado en `eec031f`.

---

## 1. El ritmo tonal, ya completo

| Sección | Tono | Quién lo pone |
|---|---|---|
| Héroe | **cacao** | `escaparate.tonoCacao` + `hero-publico` |
| Así funciona ORUM | **crema honda** | `escaparate.tonoHonda` + `como-funciona` |
| Conoce a tus futuros aliados (vitrina) | **crema** | `escaparate.tonoCrema` + `vitrina-publica` |
| El club, en números | **papel** | `escaparate.tonoPapel` + `landing.cifras` |
| Hazte socio hoy (cierre) | **cacao** | `escaparate.tonoCacao` + `landing.franjaCierre` |
| ¿Tienes un negocio? | **papel** | `escaparate.tonoPapel` + `landing.aliados` |
| Pie | **crema** | `pie-publico.module.css` ← **añadido en W2** |
| `/aliados` (cuerpo) | **papel** | decisión explícita, ver §3 |

Ninguna sección larga repite el tono de su vecina. Y se comprobó el caso
degradado: sin comercios la vitrina no se renderiza y la cadena queda
honda → papel → cacao; sin cifras queda crema → cacao. Alterna en los tres
recorridos.

### Por qué NO se usó `<Section tono>`

`Section` existe y hace lo correcto **dentro de la columna de contenido**: es
una superficie redondeada con `--radius-xl` y relleno propio. En la landing
eso sería una tarjeta gigante de color, que es justo lo que la v4 dice que una
franja no es —«no está levantada, está teñida»—.

El escaparate necesita **campo de color de borde a borde de la ventana**, y
para eso ya existía `escaparate.module.css` (`.franja` + los cuatro tonos), que
la tanda anterior escribió y que el héroe, «cómo funciona» y la vitrina ya
consumían. Cambiarlo a `Section` habría sido una regresión visual. El mecanismo
de `escaparate` es el `Section` sangrado de este portal.

---

## 2. Lo que ya estaba hecho (commit `eec031f`)

No se rehízo nada de esto; se leyó y se dio por bueno:

- `_components/revelar.tsx` + `.module.css` — `IntersectionObserver`, sin
  `useState`, `rootMargin -12%`, `disconnect()` al entrar, estado oculto dentro
  de `@media (scripting: enabled)` y `prefers-reduced-motion` resuelto en CSS.
- `_datos/portadas-publicas.ts` — `createAdminClient()`, `server-only`,
  `cache()`, filtra `activo`/`deleted_at`/vacíos.
- `escaparate.module.css` — `.franja`, los cuatro tonos (con el remapeo
  completo del ámbito de cacao), `.filoInferior`, `.tituloSeccion` con tracking
  interpolado, `.apoyoSeccion`.
- `hero-publico` — franja de cacao, `--t-hero-1` (hasta 72px) en Fraunces con
  tracking interpolado por tamaño, titular dorado en `--brand` (= `--gold-400`,
  7,83:1 sobre cacao), collage con `portada_url`.
- `cta-socio.tsx` — ya en `variant="brand"` (`--action-gold`).
- `vitrina-publica` — portadas, velo, placa en esquina, escalonado 60 ms con
  tope de 300 ms.
- `como-funciona` — franja honda, `<ol>`, numeral en serif.

---

## 3. Lo que W2 añadió

### 3.1 `landing.module.css` — reescrito entero

**Era el agujero real de la tanda anterior.** `page.tsx` se pasó a franjas y
esta hoja no se tocó, así que quedaron **tres clases citadas desde el TSX que
no existían**: `.franjaCierre`, `.bloqueCierre` y `.tarjetaCifra`. Es la trampa
nº 1 del log de Y1 — `estilos.franjaCierre` sale `undefined`, el `className`
acaba conteniendo la cadena literal `"undefined"`, y compila, tipa y pasa lint
sin una sola queja.

Y quedaban vivos los estilos de la versión anterior del cierre, que ahora se
aplicaban **encima** de la franja de cacao:

- `background: var(--surface-sunk)` + `border: 1px solid var(--border-strong)`
  + `border-radius: var(--radius-xl)` → la tarjeta hundida que la franja vino a
  sustituir, con un borde de tinta plena invisible sobre chocolate.
- **`padding: var(--space-9) var(--space-5)` en forma corta** — el más caro de
  los tres. La forma corta pisa el `padding-inline` de `.franja`, que es lo que
  devuelve el texto a su columna después del sangrado negativo. El cierre se
  habría pintado con el texto pegado al borde de la ventana.
- `.tituloCierre` redeclaraba `font-size` a `--t-title-1` (26px), empatando en
  especificidad con `.tituloSeccion` (48px): el ganador lo habría decidido el
  orden en que Next inyecta las dos hojas, que **cambia entre desarrollo y
  producción**. Ahora `.tituloCierre` solo declara `max-width`.

Además:

- `.bloqueCierre.bloqueCierre` y `.aliados.aliados` van con **clase duplicada**.
  Conviven en el mismo elemento con `.bloque` de `Revelar`, que declara
  `display: block`; sin duplicar, el `display: flex` de aquí dependía del orden
  de inyección. Mismo remedio que `.pista.pista` en `vitrina-publica`.
- `.aliados` pierde su `border-top`: lo que la separa del cacao anterior es el
  salto de campo de color. La línea decía dos veces lo mismo.
- `.cifras` pierde su `margin-top` (lo pone la franja) y pasa a `flex` con gap.
- `.puente` gana `:focus-visible` —**no lo tenía**— y su `:hover` se mete en
  `@media (hover: hover)`.

### 3.2 La entrada de la sección de cifras, que no existía

`page.tsx` envolvía las cifras en `<Revelar modo="contenedor">`, pero en ese
modo el envoltorio se queda en `display: contents` y **las reglas de entrada
las tiene que escribir el módulo del consumidor**, que es el único que sabe qué
hijos hay. No estaban escritas: el observador marcaba `data-visible` y no
pasaba nada.

Añadido en `landing.module.css`, con el mismo patrón que «cómo funciona»:
transición de `opacity` + `transform`, escalonado de `var(--escalonado)`
(40 ms, banda 30–80), estado oculto bajo `@media (scripting: enabled)` y
`prefers-reduced-motion` retirando el viaje al final del archivo.

El `h2` necesitó una **clase local** (`.tituloCifras`) además de la del módulo
compartido: desde `landing.module.css` no se puede escribir un selector contra
una clase de `escaparate.module.css`, porque el hash del módulo es distinto.

### 3.3 El pie cierra en crema

`pie-publico.module.css`: `background: var(--surface-alt)` y **fuera el
`border-top`**. El pie está fuera del `<main>`, así que se tiñe él mismo en vez
de pasar por `.franja`, que es un mecanismo de sangrado para lo que sí está
dentro de la columna centrada.

Sus dos `:hover` —`.puerta` y `.soporte`— estaban **fuera** de
`@media (hover: hover)`, que es prohibición dura: en táctil el hover se queda
pegado tras el toque y la fila parece seleccionada sin estarlo. Corregido.

El `border-top` de `.derechos` **se conserva**: es una división *dentro* de una
superficie, que es exactamente para lo que existe `--border-subtle`.

### 3.4 `/aliados` sube al peldaño ceremonial

El `h1` pasa de Inter a `--t-hero-2` en Fraunces **reutilizando
`escaparate.tituloSeccion`** en vez de copiar la escala. Esa clase lleva el
tracking interpolado por tamaño —cuatro números atados a dos anchos de ventana
concretos— y una tercera copia sería una tercera oportunidad de que una se
quede atrás. Es una ESCALA, no un nivel de encabezado: aquí viste un `h1` y en
la landing un `h2`.

El serif es legal: `/aliados` es fachada pública, no pantalla de trabajo.
48px queda muy por encima del suelo de ~28px.

**La página se queda en papel**, y es una decisión escrita en su hoja: la
columna es de 640px y solo contiene una tarjeta con un formulario. Teñir el
fondo de una sección única no separa nada de nada — la franja separa secciones
*entre sí*, y aquí no hay dos. El cambio de tono de la ruta lo da el pie.

### 3.5 El CTA en oro y el titular del cierre en tinta

El CTA ya venía en `variant="brand"` de la tanda anterior; se verificó el par.

**El titular del cierre («Hazte socio hoy») se deja en tinta, no en oro.** No es
contraste —el oro de display daría aquí los mismos 7,83:1 que en el héroe—, es
jerarquía: el acento dorado de esa franja es el CTA, que es lo que hay que
pulsar. Dos oros del mismo tamaño en la misma franja se anulan, y el que
perdería es el que importa. El titular dorado se gasta una vez, en el héroe.

---

## 4. Contraste · CALCULADO, no estimado

Método WCAG 2.1 (luminancia relativa sRGB, `(L1+0,05)/(L2+0,05)`), sobre los
valores literales de `tokens.css`. **Por tema, nunca una vez para los dos.**

### Pares nuevos que introdujo W2

| Par | Ratio | Criterio |
|---|---|---|
| **CLARO · pie sobre crema `#faf7f0`** | | |
| `--text` (`--tinta-1` `#1b1a18`) | **16,25:1** | 1.4.3 ✓ |
| `--text-2` (`--tinta-2` `#5c5349`) | **7,04:1** | 1.4.3 ✓ |
| `--text-3` (`--n-500` `#7a7068`) — `.puertaDestino`, `.derechos` | **4,52:1** | 1.4.3 ✓ **por 0,02** |
| `--brand` (`--gold-700` `#8a6d2f`) — wordmark del pie | **4,55:1** | 1.4.3 ✓ |
| **OSCURO · pie sobre `--surface-alt` = `--n-950` `#1a1512`** | | |
| `--text` (`--n-50`) | **15,96:1** | 1.4.3 ✓ |
| `--text-2` (`--n-300`) | **9,31:1** | 1.4.3 ✓ |
| `--text-3` (`--n-400`) | **6,28:1** | 1.4.3 ✓ |
| `--brand` (`--gold-300`) | **11,68:1** | 1.4.3 ✓ |

⚠️ **`--text-3` sobre crema pasa por 0,02 puntos.** `CLAUDE.md` ya marca
`--tinta-3` como «el MÍNIMO, no aclarar»; lo que este log añade es que
**oscurecer la crema también lo rompe**. Si alguien toca `--w-50`, este es el
par que hay que recalcular antes que ningún otro.

### Pares heredados, recalculados para firmarlos

| Par | Ratio | Criterio |
|---|---|---|
| `--gold-400` sobre `--cacao-bg` — titular del héroe | **7,83:1** | 1.4.3 ✓ |
| `--gold-400` sobre crema (lo PROHIBIDO) | **1,99:1** | ✗ ni el 3:1 |
| `--cacao-fg` (papel) sobre cacao — titular del cierre | **16,24:1** | 1.4.3 ✓ |
| `--cacao-fg-2` (`--n-300`) sobre cacao — lede, texto del cierre | **8,56:1** | 1.4.3 ✓ |
| `--action-gold` (`--gold-600`) + `--tinta-1` — el CTA | **4,84:1** | 1.4.3 ✓ |
| filo `--gold-600` sobre cacao | **4,63:1** | 1.4.11 ✓ |
| filo `--gold-600` sobre papel / crema | **3,51 / 3,36** | 1.4.11 ✓ |
| OSCURO: `--gold-500` + `--tinta-1` (el CTA) | **6,71:1** | 1.4.3 ✓ |
| OSCURO: filo `--gold-500` sobre `--n-950` / cacao | **6,99 / 6,43** | 1.4.11 ✓ |
| `--text-2` sobre papel — `.textoAliados`, `.bajada` | **7,34:1** | 1.4.3 ✓ |
| `--text-2` sobre crema honda — «cómo funciona» | **6,51:1** | 1.4.3 ✓ |
| `--text-3` sobre crema honda (lo PROHIBIDO) | **4,18:1** | ✗ |

Ningún texto del portal público se apoya sobre una fotografía: las portadas van
en la cubierta y todo el texto vive en el pie de la tarjeta. Es lo que convierte
un riesgo abierto —el contraste dependería de lo que suba cada comercio— en un
número que se puede firmar sin ver las fotos.

---

## 5. Verificación

```
.\node_modules\.bin\tsc.cmd --noEmit          →  sin salida, exit 0
.\node_modules\.bin\eslint.cmd .              →  sin salida, exit 0
.\node_modules\.bin\vitest.cmd run --reporter=dot
                                              →  Test Files 20 passed (20)
                                                 Tests 249 passed (249)
.\node_modules\.bin\next.cmd build            →  ✓ Compiled successfully in 19,8s
                                                 ┌ ƒ /        (dinámica, intacta)
                                                 ├ ƒ /aliados (dinámica, intacta)
```

Base de 249 pruebas en 20 archivos, conservada. Cero avisos en el build.

**No se arrancó ningún servidor.**

---

## 6. Lo que NO se rompió, comprobado por lectura

- `createAdminClient()` en las tres lecturas públicas (`datos-publicos.ts` y
  `_datos/portadas-publicas.ts`). No se tocó ninguna.
- `/` y `/aliados` siguen con `export const dynamic = 'force-dynamic'` y el
  build lo confirma con la `ƒ`.
- `aliados/actions.ts` **no se tocó**: es Server Action, zona de solo lectura
  por `SCOPE.md` §5. El formulario sigue sin ser «best-effort».
- El campo trampa y el tiempo mínimo del anti-robot siguen donde estaban:
  `formulario-aliado.tsx` no entró en esta tanda.

---

## 7. HAY QUE MIRARLO A OJO — no hay navegador en esta sesión

La automatización de Chrome está desconectada. Lo de abajo es lo que el
cálculo y la lectura **no** pueden decidir:

1. **El cierre de cacao, ahora que por fin tiene estilos.** Es el cambio con más
   superficie de esta tanda y nunca se ha pintado con las clases correctas.
   Comprobar que el texto queda en su columna centrada y no pegado al borde.
2. **El salto héroe (cacao) → «cómo funciona» (crema honda).** Dos franjas
   contiguas de tono muy distinto: verificar que la costura se lee como cambio
   de sección y no como un corte.
3. **Papel → crema entre «¿Tienes un negocio?» y el pie.** Son 1,04:1: hay que
   confirmar que el escalón se percibe y no parece un artefacto de render.
4. **`100vw` y la barra de desplazamiento.** `.franja` sangra con
   `calc(50% - 50vw)`, y en escritorio con barra clásica `100vw` incluye su
   ancho: la franja se pasa ~7-8px por lado. `globals.css` lo recorta con
   `overflow-x: hidden`, así que no debería aparecer barra horizontal — pero el
   `padding-inline` simétrico desplaza el texto esos mismos píxeles. **Medir en
   Windows/Chrome a 1280 y 1920.** Si molesta, el arreglo es
   `scrollbar-gutter: stable` en `html`, que está en `globals.css` y es
   compartido con los otros portales: no se tocó por eso.
5. **El escalonado de las cifras**, que se estrena en esta tanda.
6. **Las portadas reales.** Aquí no hay datos: no se ha visto ni una
   `portada_url` pintada. Verificar recorte (`object-fit: cover`) y el velo bajo
   la placa en el collage del héroe y en la vitrina.
7. **Las dos franjas de cacao en TEMA OSCURO.** El cacao no sigue al tema, así
   que en oscuro el contraste entre la franja `#2b1a15` y el fondo `#14100e` es
   de **1,14:1** — prácticamente nulo. Calculado, no visto: puede que en oscuro las dos
   franjas ceremoniales no se distingan del resto de la página. Si es así, el
   arreglo no es aclarar el cacao (rompería el 7,83:1 del oro) sino darles el
   `.filoInferior` dorado que el héroe ya lleva.
8. **Móvil real**: el CTA a ancho completo, el carril de la vitrina con
   `scroll-snap: x mandatory`, y que el titular de 72px no se parta mal a 360px.
9. **`prefers-reduced-motion`** en el sistema, comprobando que nada queda
   invisible: el estado oculto vive en `@media (scripting: enabled)`, pero eso
   solo se ve de verdad desactivando JavaScript.

---

## 8. Observaciones, no tocadas

- **`.franja:first-child` come el relleno superior del `<main>`.** Funciona hoy
  porque el puente del socio va antes. Si alguien inserta cualquier cosa al
  principio de `page.tsx`, el héroe deja de pegarse a la cabecera **en
  silencio**.
- **La cabecera translúcida sobre la franja de cacao.** `--material` en claro es
  papel al 70 %, así que sobre el chocolate del héroe la cabecera se ve clara y
  su texto sigue siendo tinta. Es coherente, pero es cromo fijo compartido con
  `/aliados` y no se tocó.
- **`--text-3` a 4,52:1 sobre crema** ya está dicho arriba, pero merece repetirse
  aquí: es el par más frágil de todo el portal público.

---

## PROPUESTAS PARA BACKEND

1. **Plegar `obtenerPortadasPublicas` dentro de `obtenerVitrinaPublica`.**
   `src/lib/publico/datos-publicos.ts:180` devuelve `portadaUrl: null` en duro,
   con un comentario que dice que la columna no está aplicada. **Eso dejó de ser
   cierto**: `comercios.portada_url` existe en `database.types.ts` y la usan la
   ficha de comercio y el gestor de imágenes del panel.

   *Qué se necesita*: añadir `portada_url` al `select` de `obtenerVitrinaPublica`
   y mapearlo a `portadaUrl`. Cuatro líneas.

   *Por qué la alternativa solo-frontend es peor*: hoy el escaparate hace una
   **segunda consulta** (`_datos/portadas-publicas.ts`) solo para completar el
   modelo, y el tipo `ComercioVitrina.portadaUrl` es opcional para que quepan las
   dos formas. Dos consultas donde bastaba una, y un dato que la capa de acceso
   sabe y decide no devolver.

   *Qué se hizo entretanto*: la consulta suplementaria, con `createAdminClient()`
   y `server-only`, **en paralelo** con las otras cuatro lecturas de la landing
   (`Promise.all` en `page.tsx`), así que no suma latencia al camino crítico.
   Está documentada en la cabecera de su archivo para que se borre el día que
   esto se aplique.
