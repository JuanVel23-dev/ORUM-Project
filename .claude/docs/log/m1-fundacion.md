# Log · m1-fundacion

> Una entrada por tarea terminada. Formato: `## <tarea>` + qué se hizo, qué quedó fuera y por qué.


---

## A · Tokens (13/09/2026)

### Hecho

**`src/styles/tokens.css`**
- §6 sombras reescrita con la escala desplazada de §2.3, literal:
  `--shadow-1: 0 2px 0 …/.10` · `--shadow-2: 0 3px 0 …/.14 + 0 6px 16px …/.08` ·
  `--shadow-3: 0 6px 0 …/.16 + 0 12px 28px …/.10` ·
  `--shadow-4: 0 10px 0 …/.18 + 0 24px 56px …/.14`, todas en rgb 20/20/28
  (el susurro frío, no negro puro).
- Añadido `--shadow-0: 0 1px 0 rgba(20,20,28,.10)` — la mitad de `--shadow-1`.
  No estaba en el documento pero §4.3 exige «sombra a la mitad» al pulsar y
  sin token habría que escribir el literal en cada componente.
- Los cuatro grises `--w-100..400` quedan SIN consumidor y se anotan como tal
  en la rampa. Se conservan (es la capa cruda, no el mapeo) con la advertencia
  de que usarlos es volver a la dirección anterior.

**`src/app/globals.css`**
- §2.1 papel: `--bg` y `--surface-sunk` pasan a `--w-0`; `--surface` ya lo era;
  `--surface-hover` a `--w-50`.
- §2.2 tinta: `--border-strong: var(--n-1000)` · `--border: color-mix(…55%…)`
  · `--border-subtle: color-mix(…22%…)`. Se usa `color-mix` sobre `--n-1000`
  y no un rgba literal, para que los tres sigan siendo EL MISMO color si la
  tinta cambia.
- Nuevo `--shadow-press` (claro `= --shadow-0`; oscuro `= 0 0 rgba(0,0,0,0)`).
- Nuevo `--surface-hueco` (claro: tinta al 7 %; oscuro: `--n-850`). Ver abajo.
- §3: los tres bloques oscuros ([data-theme], fallback de
  `prefers-color-scheme`) conservan filo claro + `--edge` intactos. Se añadió
  el comentario que explica por qué §2 NO se traslada al oscuro.

### Verificación de la prohibición del `none`

Revisadas las 18 declaraciones `box-shadow` que consumen tokens. Ninguna
contiene `none` dentro de una lista. Los dos `box-shadow: none` que existen
(`card .sunk` y `data-list .envoltorio` en móvil) son el valor COMPLETO de la
declaración, que sí es legal. `--edge` sigue valiendo `0 0 rgba(0,0,0,0)` y
los `--shadow-*` del tema oscuro también usan sombra transparente, no `none`.

### Contrastes (tema claro, sobre papel #ffffff)

| Token | Valor efectivo | Ratio vs papel | Papel |
|---|---|---|---|
| `--border-strong` | #0a0a0c | 20,4:1 | define superficie ✓ 1.4.11 |
| `--border` | tinta 55 % ≈ #787879 | 4,42:1 | separa dentro ✓ 1.4.11 |
| `--border-subtle` | tinta 22 % ≈ #c9c9ca | 1,67:1 | hairline de fila (antes 1,17:1) |

`--border-subtle` no llega a 3:1 y no debe llevar él solo el peso de definir
una superficie: es división interna. Donde una superficie se definía con
`--border-subtle` y encima perdió su relleno distinto, se sube a `--border`
(bloque B).

### Fuera / no hecho

- `--surface-hover: var(--w-50)` se aplica LITERAL como pide el encargo, pero
  sobre papel blanco da 1,02:1: es imperceptible. Está señalado en el reporte
  como el punto de la dirección que falla al tocar el código. Mitigación en el
  bloque B: donde el hover era la única señal se le añade una segunda (trazo
  que aparece, acciones que se revelan), nunca se deja color solo.
- No se toca `--material`, `--scrim` ni la tabla de contrastes dorados.

---

## B · Primitivas (13/09/2026)

### Regla que se aplicó

Cada superficie se declara con trazo, porque ya no hay gris que la distinga
del fondo. El reparto sigue §2.2 al pie de la letra:

| Presencia | Dónde |
|---|---|
| `--border-strong` (tinta plena) | Lo que ES una superficie: `Card`, `Input`/`Select`/`Textarea`, `Button secondary`, `Modal`, `Sheet`, `Menu`, `Toast`, `DataList` (marco y tarjeta móvil), paleta de comandos, pastilla del `SegmentedControl` |
| `--border` (55 %) | Separadores dentro de una superficie ya definida: cabecera y pie de `Card`/`Modal`/`Sheet`/paleta, regla del encabezado de `DataList`, `Divider`, separador de `Menu`, carril del `SegmentedControl`, filo del `Avatar`, disco de `EmptyState`, placa del `QrCode`, cromo fijo del shell (barra lateral, superior, inferior) |
| `--border-subtle` (22 %) | Filas de lista y hairlines de hover |

### `--surface-sunk`: los 14 sitios de MI alcance y cómo se resolvió cada uno

| Sitio | Resolución |
|---|---|
| `card .sunk` | Trazo `--border` + sin sombra. Lo hunde la ausencia de sombra junto a tarjetas que sí la tienen |
| `card .footer` | `border-top` sube a `--border` |
| `modal .pie` | `border-top` sube a `--border` |
| `sheet .pie` | `border-top` sube a `--border` |
| `command-palette .pie` | `border-top` sube a `--border` |
| `command-palette .atajo` | Trazo `--border`: una tecla sin contorno no se lee como tecla |
| `data-list .encabezado` (+ `.th`) | Regla inferior sube a `--border`. Sigue siendo opaco, que es lo que necesita por ser `sticky` |
| `badge .neutral` | Ya tenía `--border`; ahora ese trazo es lo único que dibuja la píldora |
| `avatar` | Trazo sube de `--border-subtle` a `--border` |
| `segmented .group` | Trazo sube a `--border`; la pastilla gana `--border-strong` + sombra |
| `feedback .skeleton` | **Relleno**, no trazo: `--surface-hueco` |
| `feedback .progreso` | **Relleno**: `--surface-hueco` (3px no tienen sitio para un borde) |
| `feedback .estadoIcono` | Trazo `--border` (y `--danger` en la variante de error) |
| `input .control:disabled` | **Relleno**: `--surface-hueco`, porque aquí el color sí es información |

Los tres que se resolvieron con relleno y no con trazo son deliberados y están
comentados en el código: perfilar un esqueleto dibujaría el contorno exacto del
contenido que todavía no ha llegado, y un esqueleto no debe prometer una forma
que puede no cumplirse.

### Fuera de mi alcance: `--surface-sunk` sin resolver (18 sitios)

Estos archivos los tienen otros agentes en paralelo. **Todos se han quedado
blancos sobre blanco y necesitan ganar su trazo:**

```
src/styles/formulario.module.css:68            <- hoja COMPARTIDA por varias rutas
src/app/(publico)/landing.module.css:19,68
src/app/(publico)/_components/como-funciona.module.css:80
src/app/(publico)/_components/hero-publico.module.css:154
src/app/(publico)/_components/pie-publico.module.css:11
src/app/(publico)/_components/vitrina-publica.module.css:158
src/app/admin/comercios/[id]/ficha.module.css:51
src/app/admin/cuenta/password/_components/password-form.module.css:30
src/app/admin/inicio.module.css:102
src/app/comercios/(portal)/_components/verificar.module.css:180,209,275
src/app/miembros/(portal)/_components/carrusel-destacados.module.css:288,316
```

### §4.3 · Levantar y hundir

- **Hunde al pulsar**: `Button` (todas las variantes) y `Card interactive`:
  `translate: 0 2px` + `--shadow-press`. Sustituye al `scale` anterior; se
  repone `scale: 1` para no acumular las dos propiedades y para desactivar la
  regla global de `globals.css` §4b sin necesidad de `data-sin-press`.
- **Levanta al apuntar**: `primary`, `danger`, `brand`, `gold` y
  `Card interactive`: `translate: 0 -2px` + escalón siguiente de sombra,
  **todo dentro de `@media (hover: hover)`**.
- `secondary` y `ghost` NO se levantan: no tienen sombra que perder, y darles
  una al pulsar los haría subir justo cuando se les empuja.
- **Filas de lista: opacidad, nunca sombra**: `DataList .fila`, `Menu .item` y
  `.masItem` de la hoja «Más». `Menu .item` perdió su `scale: 0.985`, que
  deformaba una fila de ancho casi completo.
- `prefers-reduced-motion` retira SOLO el desplazamiento; la sombra, el color y
  la opacidad siguen acusando el toque. En `Button` hace falta `!important`
  porque las variantes tienen más especificidad que el guardián.

### El hover invisible, y cómo se tapó

`--surface-hover` da 1,02:1 sobre papel (ver bloque A). Donde era la ÚNICA
señal se le añadió un segundo canal, siempre con `box-shadow: inset` para no
alterar la caja ni desplazar nada: `Menu .item`,
`.opcion[data-seleccionada]` de la paleta —la señal del teclado, la más grave
de las tres—, `Button ghost`, `.perfilBoton`, `.colapsar`, `.masItem`,
`Copiar`, `AccionEstado` y los tres botones de cerrar (`Modal`, `Sheet`,
`Toast`).

`DataList .fila` no admite `box-shadow`: la tabla es `border-collapse:
collapse` y el navegador no lo pinta sobre una fila colapsada. La marca va en
`inset 2px 0 0` sobre la primera celda, sin transición.

`.masItem[data-activo]` ganó además `aria-current="page"` en `app-shell.tsx`:
no lo tenía, y es el mismo destino activo que la barra lateral sí anunciaba.

### Dos animaciones de `width` eliminadas

Son los dos sitios que §4.1 daba por encontrados:

- `sheet .tirador` animaba `width: 36px -> 48px` al agarrar, en un elemento
  centrado con `margin: 0 auto` (o sea recalculando también su margen en cada
  fotograma) y justo al empezar un arrastre. Ahora `scale: 1.333 1`.
- `toggle .pulgar` animaba `width: 20px -> 24px` al pulsar, en un elemento
  absoluto al que `translate` estaba moviendo a la vez. Ahora `scale: 1.2 1`
  con `transform-origin` que cambia de lado según el estado, para que crezca
  hacia dentro de la pista. El `translate: 14px` de compensación desaparece.

También bajó la sombra de `toggle .pulgar` de `--shadow-2` a `--shadow-0`: la
escala nueva desplaza 3px y eso se salía de una pista de 26px con 3px de
holgura.

### Fuera / no hecho

- `app-shell.module.css:62` anima `width` de la barra lateral, y `:403`
  anima `padding-left` de la columna. **No se toca**: es un cambio estructural
  raro y a petición del usuario, no un gesto por fotograma, y reescribirlo con
  `transform` implica rehacer el mecanismo de `@property` que hoy mantiene
  barra y columna en el mismo fotograma. Queda anotado, no resuelto.
- `toggle .caja` tiene **dos** entradas `scale` en su `transition` (una con
  `--dur-instant` y otra con `--dur-rebote`); gana la segunda. Defecto
  preexistente ajeno a esta tarea: no se toca.

---

## C · Movimiento (13/09/2026)

### Hecho, todo en CSS

- **Escalonado de §4.2 como primitiva**: clase `.escalonado` en
  `layout.module.css` y prop `escalonado` en `Stack` y `Grid`. 35 ms de paso y
  **tope de 8** vía `:nth-child(n + 8)`, que es la parte que importa: sin tope,
  la pieza 25 llega 875 ms tarde y eso se percibe como lentitud, no como
  elegancia. Se resuelve con `nth-child` y no con un índice desde el TSX para
  que funcione con cualquier hijo sin clonar elementos.
- `DataList` alineado a §4.2: `PASO_MS` 20 -> 35 y `MAX_ESCALONADAS` 10 -> 8.
- Entrada y salida por el mismo camino, y `prefers-reduced-motion` con
  equivalente por opacidad en todo lo anterior.

### Fuera / no hecho

- **`src/lib/shared/motion.ts` NO se ha tocado** (es de otro agente). §4.2
  habilita `bounce: 0.2` en entradas de overlay, confirmaciones y aparición de
  tarjetas, y eso vive en los resortes, no en CSS. **Hace falta un preset nuevo
  con `bounce: 0.2`**, que sigue prohibido en navegación y en cambios de estado
  de datos. Entretanto se usan los presets existentes.
- **View Transitions (§4.2, deuda nº1) no se tocan**: hay un
  `m5-view-transitions.md` en este mismo directorio, así que son de otro
  agente. Cero `view-transition-name` en `src/` sigue siendo cierto.

---

## D · Disciplina del trazo (13/09/2026)

### Inventario completo de los 2px en `src/components/**`

| Sitio | Legítimo |
|---|---|
| `pantalla-auth .tarjeta` | Sí. Es EL elemento principal de esa pantalla y no hay otra superficie que pueda reclamarlo |
| `Card.principal` (prop nueva, opt-in) | Sí. Es el mecanismo. Documentado como «UNA por pantalla» en su propio JSDoc |
| `:focus-visible` (global, `Menu .item`, `DataList .enlace`, `SegmentedControl`, shell) | Sí. §2.2 lo admite explícitamente |
| `DataList .fila:hover .td:first-child` | Marca de hover, no trazo de superficie. No persiste |
| `badge .puntoHueco` | Es la FORMA del estado inactivo (anillo vs disco), no un borde de superficie. Intocable: lo exige `CLAUDE.md` |
| `app-shell .indicador::before` | Filo dorado de 2px de ancho: es una barra, no un borde |

**Ningún otro sitio lleva 2px.** Todo lo demás quedó en 1px.

`toggle .caja` estaba en **1.5px**, un tercer grosor. Bajado a 1px: §2.2 admite
exactamente dos, y el medio píxel además se redondeaba distinto según la
densidad de pantalla, así que la casilla se veía más gruesa en unos equipos que
en otros.

### El riesgo de §6, dicho en claro

Con la fundación puesta, una pantalla de `/admin` con tabla lleva: marco de
`DataList` (tinta plena) + botones secundarios (tinta plena) + campos (tinta
plena). **Son tres pesos iguales compitiendo por ser lo principal.** La
fundación no puede resolverlo sola —no sabe qué es lo principal de cada
pantalla—: lo resuelve quien rediseñe cada pantalla, poniendo `principal` en
UNA tarjeta y dejando el resto por debajo. Está escrito también en `CLAUDE.md`
para que no se descubra tarde.

### Fuera / no hecho

- No se ha aplicado `principal` a ninguna pantalla real: eso es rediseño de
  pantalla, no fundación, y son archivos de otros agentes.

---

## E · `CLAUDE.md` (13/09/2026)

### Hecho

- **Cabecera**: la dirección vigente pasa a ser la v2 y apunta a
  `.claude/docs/DIRECCION-ARTE-claro.md`. Se añade la regla de desempate: si
  `CLAUDE.md` y el documento de dirección se contradicen, **gana `CLAUDE.md`**,
  porque es donde la dirección se traduce a reglas y donde se arregla la
  contradicción. Sin esa frase, la próxima sesión tendría dos fuentes de verdad
  y ninguna forma de elegir — que es exactamente el accidente que este archivo
  existe para evitar.
- **Prohibiciones duras**: seis filas nuevas —superficie sin trazo, distinguir
  con un gris más claro, tercer grosor, más de un 2px por pantalla, sombra
  animada en filas de lista, `:hover` fuera de `@media (hover: hover)`—.
- **Sección nueva «Papel, tinta y sombra»**, colocada ANTES de «El oro»:
  el blanco sin escalones y por qué `--surface-hover` a 1,02:1 obliga a un
  segundo canal · la tabla de las tres presencias de tinta con sus ratios · la
  disciplina del trazo de §6, incluido el caso concreto que ya está sin
  resolver (tres pesos iguales en `/admin` con tabla) · la escala de sombra y
  por qué la prohibición del `none` importa más ahora · y que el tema oscuro no
  se retira y se audita por separado.
- **«El oro»**: se añade que la v2 **no habilita más oro** —donde antes hacía
  falta un filo de 2px ahora basta 1px— y que el fondo más blanco **empeora**
  `--gold-500`, no lo mejora.
- **«Movimiento»**: subsecciones nuevas «Presionar hunde, apuntar levanta»,
  «El rebote» (ahora `bounce: 0.2` permitido en overlays, confirmaciones y
  aparición de tarjetas; prohibido en navegación y en cambios de estado de
  datos) y «Entrada escalonada» con el tope de 8. Se retira la frase «el rebote
  se gana, no se regala», que ya contradecía a §4.2.
- **«Componentes: usa los que hay»**: se documentan `<Card principal>` y el
  prop `escalonado` de `Stack`/`Grid`, para que nadie los reimplemente.
- **«Antes de dar algo por hecho»**: `pnpm lint` -> `pnpm exec eslint .`, con
  la nota de que `next lint` no existe en Next 16 y de que el `.` no es
  opcional. Se añaden además los cuatro binarios de `node_modules` para cuando
  `pnpm` no está en el `PATH`, que es el caso de la máquina actual.

### Lo que NO se tocó, como estaba mandado

«Estado de membresía» · la tabla de contrastes dorados firmados por
`accessibility-auditor` (T5, 30/08/2026) · la regla del `QrCode` ·
«Formularios: overlay, no página» y todo lo de la ranura `@modal`.

### Fuera / no hecho

- «Deuda conocida» se deja intacta. El punto 1 (transiciones de elemento
  compartido habilitadas pero sin aplicar) sigue siendo cierto y es tarea de
  otro agente (`m5-view-transitions.md`): tacharlo desde aquí sería anunciar
  un trabajo que no he hecho.
- No se ha añadido nada sobre el preset de `bounce: 0.2` en
  `src/lib/shared/motion.ts` **más allá de la regla**, porque el archivo es de
  otro agente y el preset todavía no existe. Si no llega, la regla de
  `CLAUDE.md` describirá algo que el código no ofrece.
