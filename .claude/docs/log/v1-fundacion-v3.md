# V1 — Fundación de la dirección de arte v3

> Registro de la tarea V1. Una entrada por bloque (A–F).
> Encargo: `.claude/docs/DIRECCION-ARTE-v3.md`. Rama `mejora-diseno`.
> Alcance: `src/styles/**`, `src/app/globals.css`, `src/components/ui/**`,
> `src/components/shell/**`, `src/lib/shared/motion.ts`, `CLAUDE.md`.
> **No se tocó ninguna pantalla** (`src/app/miembros`, `admin`, `comercios`,
> `(publico)`): esta tanda es fundación, no rediseño.

---

## Bloque B — La escala de sombra (se hizo ANTES que A, a propósito)

El orden del encargo es A→B, pero se invirtió: si se quita el trazo antes de que
exista la sombra que lo sustituye, hay un estado intermedio en el que ninguna
superficie se ve. Se montó primero el suelo.

### Hecho

- `src/styles/tokens.css` §6 reescrita entera. La escala de la v2 —desplazada,
  `0 Npx 0`, canto duro de hoja sobre hoja— se sustituye por la de §2.2 del
  encargo, **literal**, dos capas por escalón (contacto corto y oscuro + halo
  amplio y suave) en rgb 20/20/28.
- `--shadow-0` (lo que queda bajo el dedo al pulsar) se redefine como
  `0 1px 2px rgba(20,20,28,.05)`: **solo el contacto, sin halo**. El objeto no
  desaparece, baja hasta tocar el fondo.
- `--shadow-hundida` (nuevo): `inset 0 1px 3px rgba(20,20,28,.07)`. Un hundido
  no es un escalón negativo de la escala —no existe tal cosa—: es la misma luz
  entrando al revés. Hacía falta porque `Card.sunk` se definía con trazo.
- `--edge-light` pasa de chaflán superior a **anillo completo**
  (`inset 0 0 0 1px rgba(255,255,255,.08)` + el chaflán). Sin esto, en tema
  oscuro un menú `--surface` sobre una tarjeta `--surface` se queda literalmente
  sin límite al retirarle el borde.
- `globals.css`: peldaños semánticos completados con **`--shadow-flotante`**
  (escalón 3, menú/toast/popover). Antes `Menu` y `Toast` pedían `--shadow-3`
  **crudo**, que el tema oscuro no remapea: en oscuro no tenían sombra alguna.
  Ahora los cuatro peldaños existen y los cuatro están remapeados en oscuro
  conservando la gramática de dos capas, con opacidades mucho mayores.

### Comprobación del `none`

El aviso del encargo se verificó a mano: no hay ni un `none` dentro de una lista
separada por comas. Los dos `box-shadow: none` que sobreviven (`data-list` en
móvil, `qr-code` al imprimir) son el valor **completo** de su declaración, que es
legal. Los «sin sombra» dentro de una lista siguen siendo `0 0 rgba(0,0,0,0)`.

### Fuera, y por qué

- No se tocó `--shadow-press` en oscuro: sigue transparente. Allí no hay sombra
  que perder y el acuse lo da el `scale` global. Es correcto y no cambia.

---

## Bloque A — Fuera el trazo de las superficies

### El mecanismo, que es lo importante de este bloque

No se puso `border: none` en ningún sitio. Se añadió **un token**,
`--border-superficie`, que vale `transparent`, y cada superficie declara
`border: 1px solid var(--border-superficie)`.

Dos cosas se ganan con eso y ninguna es cosmética:

1. La caja **mide lo mismo** con filo y sin él, así que devolver el borde no
   desplaza un solo píxel de maquetación.
2. `@media (prefers-contrast: more)` devuelve los bordes **cambiando un token en
   un sitio**, y alcanza también a los componentes que se escriban mañana. La
   alternativa —una media query por módulo CSS— se rompe el día que alguien la
   olvida, y el fallo es invisible para quien no usa ese modo.

### Superficies que perdieron el borde, y qué las define ahora

| Superficie | Antes | Ahora |
|---|---|---|
| `Card.card` | 1px `--border-strong` | `--shadow-card` (escalón 1) |
| `Card.principal` | **2px** `--border-strong` | `--shadow-raised` (escalón 2) |
| `Card.sunk` | 1px `--border` | hairline + `--shadow-hundida` (inset) |
| `Modal.dialog` | 1px `--border-strong` | `--shadow-overlay` (escalón 4) + velo |
| `Sheet.panel` | 1px `--border-strong` | `--shadow-overlay` + `--edge` |
| `Menu.menu` | 1px `--border-strong` | `--shadow-flotante` (escalón 3) |
| `Toast.toast` | 1px `--border-strong` | `--shadow-flotante` |
| `DataList.envoltorio` | 1px `--border-strong` | `--shadow-card` |
| `DataList.fila` (móvil) | 1px `--border-strong` | `--shadow-card` |
| `CommandPalette.dialog` | 1px `--border-strong` | `--shadow-overlay` |
| `Segmented.indicator` | 1px `--border-strong` | `--filo-activo` + `--shadow-1` |
| `PantallaAuth.tarjeta` | **2px** `--border-strong` | `--shadow-overlay` + `--edge` + filo dorado |
| `formulario.credencial` | 1px `--border-strong` | hairline + `--shadow-hundida` |

Con esto **`--border-strong` deja de tener un solo consumidor en
`src/components/**` y `src/styles/**`**. Sobrevive como token porque es el valor
al que `prefers-contrast: more` devuelve `--border-superficie`, y porque siete
archivos de pantalla fuera de alcance todavía lo usan.

También desaparece el **grosor de 2px de superficie**. El único 2px que queda en
el sistema es el de `:focus-visible`, que es justo el que sostiene 1.4.11.

### Las dos excepciones de §2.5, que NO se tocaron

1. **Los controles de entrada conservan borde en reposo.** `Input`, `Select`,
   `Textarea` y la casilla de `Checkbox`/`Radio` siguen con filo. Lo único que
   cambió es la **presencia**: de tinta plena (21,0:1, que se lee como formulario
   impreso) a tinta al 55 %, que da **4,42:1** sobre papel — muy por encima del
   3:1 de WCAG 1.4.11. El borde no se quitó ni se debilitó por debajo del
   umbral; se le quitó el aire de papelería. Lo mismo con `Button.secondary`,
   que es un control, no una superficie.
2. **Todo control que recibe foco conserva su filo en `:focus-visible`.** No se
   suprimió ni un anillo de foco. El único `outline: none` que había
   —`Input.control`— ya estaba sustituido por un anillo de `box-shadow`, y se le
   añadió el comentario que explica por qué ahí es legal.

### Alto contraste

`@media (prefers-contrast: more)` en `globals.css` ahora sube
`--border-superficie` a `--border-strong`, `--border` a `--border-strong` y
`--border-subtle` a `--border`. Las sombras **se quedan**: el usuario pidió más
señal, no menos.

### Fuera, y por qué

- **`QrCode`** conserva su borde y su sombra. §4 del encargo lo declara
  intocable, y su trazo es parte del contrato de escaneo, no decoración.
- **El cromo fijo del shell** (barra lateral, barra superior, barra de pestañas)
  conserva sus `--border`. No son superficies flotantes sobre papel: son los
  límites del contenedor de la aplicación, con `backdrop-filter` detrás.
  Quitarlos dejaría el contenido desangrándose por debajo del cromo translúcido.
- **Divisiones internas** (`.header`, `.footer`, `.pie`, `.th`, separadores de
  menú, hairlines de fila) intactas. §2.1 las conserva explícitamente.
- **`Badge`, `Alert`, `Avatar`, `Carril`, `EmptyState`** no se tocaron: ya
  llevaban `--border` o borde de color, ya no llevaban sombra, y son exactamente
  las piezas que §5 prohíbe hacer flotar.

---

## Bloque C — El oro como respuesta al toque

### Hecho

Token nuevo en `globals.css`: **`--filo-activo: 0 0 0 1px var(--brand-edge)`**.
Va en `box-shadow` y no en `border` a propósito: no toca la caja, así que puede
aparecer y desaparecer sin mover el contenido, y se compone en lista con la
sombra (`var(--filo-activo), var(--shadow-raised), var(--edge)`).

Dónde se enciende el oro ahora, y con qué estado de §2.3:

| Componente | Estado | Señal |
|---|---|---|
| `Card.interactive` | señalado | `--filo-activo` + sombra sube a escalón 2 |
| `Input` / `Select` / `Textarea` | señalado | el filo existente cambia a `--brand-edge` |
| `Checkbox` / `Radio` | señalado | filo a `--brand-edge` (antes `--text-3`) |
| `Button.secondary` | señalado | filo a `--brand-edge` + escalón 1 |
| `DataList.fila` | señalado | filo izquierdo de 2px a `--brand-edge` |
| `Menu.item` | señalado / enfocado | anillo `inset` a `--brand-edge` |
| `CommandPalette.opcion` | seleccionada | anillo `inset` a `--brand-edge` |
| `Segmented.indicator` | seleccionado | `--filo-activo` permanente |
| `AppShell.indicador` | ruta activa | filo a `--brand-edge` |
| `AppShell.masItem` | ruta activa | anillo `inset` a `--brand-edge` |
| `Sheet.tirador` | **arrastrado** | el tirador pasa a `--brand-edge` |

### El presupuesto, que es donde esto se puede torcer

El oro sigue en **≤5 %** y sigue **sin codificar datos**. Tres razones por las que
este bloque no lo sube:

1. Casi todo lo de la tabla es un filo de **1px**. Un anillo de 1px alrededor de
   una tarjeta de 320×180 es el 1,1 % de su área, y la tarjeta no es la pantalla.
2. Salvo `Segmented.indicator` y el indicador de ruta activa, **ninguno existe en
   reposo**: solo mientras el puntero está encima o el dedo arrastra. En una
   captura estática de la pantalla en reposo el oro de este bloque es **cero**.
3. Lo que se retiró es mayor que lo que se añadió: el filo dorado sustituye a
   tinta que ya estaba pintada, no se suma a ella.

Lo que **sí** hay que medir sobre captura real es el CTA dorado de ancho completo
del Portal de Miembros, que ya venía advertido en `CLAUDE.md` y que esta tanda no
toca.

### Fuera, y por qué

- **`Toast` no recibe filo dorado.** Aparece solo, no responde a un toque: el oro
  ahí mentiría sobre quién causó qué.
- **`DataList.fila` en móvil no recibe filo dorado**: en móvil la fila es una
  tarjeta y su acuse es el de §5 (opacidad), no un filo.
- El **corazón de favorito en rojo** de §2.3 no se implementó: no existe todavía
  un componente de favorito en `src/components/ui/`. Es trabajo de la tanda que
  construya esa función.

---

## Bloque D — Botones

### Hallazgo: el mecanismo ya existía, y está bien

El encargo pedía comprobarlo antes de tocar nada, y la comprobación cambia el
trabajo. `Button` ya tiene **`variant="brand"`**: relleno dorado **plano**
(`--action-gold` = `--gold-600`) con texto en tinta (`--action-gold-fg` =
`--n-1000`), que es **exactamente el par firmado** por `accessibility-auditor` en
T5 — 5,40:1 de texto y 3,66:1 de filo.

Y ya está aplicado donde §2.4 lo pide. Verificado uno por uno:

- `src/app/login/login-form.tsx`
- `src/app/miembros/login/_components/login-form.tsx`
- `src/app/comercios/login/_components/login-form.tsx`
- `src/app/activar-cuenta/_components/activar-form.tsx`
- Portal de Miembros: ficha de comercio, pantalla de membresía inactiva, carnet

Administración y la Herramienta de Comercios siguen en `variant="primary"`, que
es tinta. **La diferencia que §2.4 pide ya está resuelta por el `variant`**, no
por una condición en cada pantalla, que es la forma correcta.

### Hecho

- `.primary`, `.danger`, `.brand`, `.gold` pasan de sombras **crudas**
  (`--shadow-1/2/3`) a las **semánticas** (`--shadow-card/raised/flotante`). No
  es cosmético: las crudas no se remapean por tema, así que en oscuro los botones
  llevaban la sombra calibrada para papel blanco.
- `.secondary` baja de tinta plena a `--border` y gana el par de §2.3 al
  señalarlo (filo dorado + escalón 1).
- Comentarios de `.primary` reescritos para que digan **dónde** manda cada
  variante. El texto anterior («el oro es marca, no acción») describía la v2 y
  contradecía a §2.4 en la cara del siguiente que lo leyera.

### Fuera, y por qué

- **No se cambió `--action` (`#141418`)**. El encargo dice que el primario actual
  «es demasiado oscuro y se pierde», y la corrección que §2.4 prescribe es
  **cambiar de variante en el recorrido del cliente**, no aclarar la tinta.
  Aclarar `--action` afectaría al primario de Administración, que §2.4 y §4
  declaran intocable, y además bajaría el contraste del texto blanco encima.
- **No se cambió ninguna pantalla.** Si alguna del Portal de Miembros conserva un
  `variant="primary"` que debería ser `brand`, es trabajo de la tanda de
  rediseño: está fuera del alcance de V1 y cambiarlo aquí ensuciaría el diff.

---

## Bloque E — Movimiento estilo Apple

### Hecho en `src/lib/shared/motion.ts`

La cabecera del módulo pasa a listar **las siete reglas de §3** completas, no
solo una referencia. El preset correcto aplicado mal no sirve de nada, y quien
abre este archivo lo abre para elegir un preset.

Presets y utilidades nuevos:

| Nombre | Para qué |
|---|---|
| `SPRING_MATERIAL` | Materializar (§3.5). `bounce: 0`, 0,42 s — más lento que `SPRING_UI` a propósito: el desenfoque necesita recorrido para leerse |
| `SPRING_PRESS` | El acuse de presión cuando convive con otra animación y CSS no puede componerlas |
| `TWEEN_REDUCIDO` / `EASE_OUT` | El fundido de 0,15 s del equivalente no vestibular |
| `transicionSegunPreferencia(preset, reducido?)` | Elige resorte o fundido. El segundo parámetro se inyecta para poder probarla sin DOM |
| `sinRebote(preset)` | Quita el sobreimpulso conservando el viaje, para gestos donde el dedo manda |
| `origenDesde(origen, superficie)` | **Anclar al origen (§3.4).** Pura: recibe cajas, no elementos. Devuelve el `transform-origin` |
| `leerTransformEnPantalla(el)` | **Interrumpible (§3.3).** Lee lo que hay PINTADO. Degrada a identidad si no hay DOM o `DOMMatrix`; nunca lanza |
| `pasosMaterial(desenfoque?, reducido?)` | Los fotogramas de entrada de una superficie translúcida |

Lo que **no** se tocó: `SPRING_UI`, `SPRING_MOVE`, `SPRING_FLICK`, `SPRING_POP`,
`proyectarMomento`, `amortiguarBorde`, `velocidadRelativa`. Ya cumplían §3.

`SPRING_SHEET` conserva su `bounce: 0.2`. No es rebote gratuito: §3.2 lo permite
«tras un gesto con momento **o en algo que aparece encima**», y una hoja inferior
es las dos cosas.

### Hecho fuera del módulo, para que las utilidades no sean código muerto

- **`Modal`** arranca su entrada desde la escala **en pantalla** y no desde un
  0.96 fijo: si el diálogo se reabre mientras todavía se encogía al cerrarse,
  partir del valor lógico lo hacía saltar a 0.96 antes de crecer. Y sus dos ramas
  de `animate` duplicadas (normal / movimiento reducido) colapsan en una, con
  `transicionSegunPreferencia`.
- **Velo del modal** (`modal.module.css`): materializa. El desenfoque y la
  opacidad se animan a la vez en `@keyframes entrarFondo`, y con movimiento
  reducido cae a un fundido plano (`entrarFondoPlano`).
- **Tarjeta de acceso** (`pantalla-auth.module.css`): materializa igual.
  Desenfoque + escala + viaje a la vez.
- **`--dur-press` / `:active`** ya cubría §3.1 en toda la interfaz desde
  `globals.css` §4b. Se documentó en `tokens.css` §8 que `:active` **es** el
  equivalente CSS de `pointerdown`, que era lo que faltaba: la regla estaba
  implementada pero no explicada, y eso es lo que la hace desaparecer en la
  siguiente refactorización.

### La excepción a «solo transform y opacity», y por qué se admite aquí

Materializar exige animar `filter` / `backdrop-filter`, que **no corren en el
compositor**. Se admite en exactamente dos sitios y los dos están comentados en
su archivo: son **UNA capa**, ocurre **UNA vez** al abrir, y las dos superficies
ya están promocionadas por el `backdrop-filter` que llevan en reposo. En filas de
lista sigue prohibido sin matices, y el comentario lo dice para que nadie lo
copie desde ahí.

### Fuera, y por qué

- **§3.1 (el overlay de la ficha) y §3.2 (el carrusel que se mueve) no se
  implementaron.** Son rediseño de pantallas del Portal de Miembros, fuera del
  alcance de V1. Lo que V1 deja listo es la herramienta: `origenDesde` para
  anclar el overlay a la tarjeta que lo abrió, `leerTransformEnPantalla` para que
  el arrastre de cierre sea interrumpible, y `proyectarMomento` /
  `amortiguarBorde`, que ya existían.
- **`Sheet` y `Toast` no se refactorizaron** para usar los helpers nuevos.
  Funcionan y ya respetan §3; tocar la máquina de gestos de la hoja en una tanda
  de fundación es riesgo sin beneficio, y `Sheet` ya lee su posición real del DOM
  (`panel.offsetHeight`), que es §3.3 resuelto a mano.

---

## Bloque F — `CLAUDE.md`

### Hecho

- **Cabecera**: la dirección vigente pasa a ser la v3 y apunta a
  `.claude/docs/DIRECCION-ARTE-v3.md`. Se deja escrito que es una corrección de
  rumbo, no una vuelta atrás.
- **Prohibiciones duras**: cuatro filas de la v2 (superficie sin trazo, tercer
  grosor, más de un 2px por pantalla) se sustituyen por las cuatro de la v3:
  trazo en superficie en reposo, sombra en chip/píldora/fila, quitar borde sin
  dejar foco, y quitarle el borde a un campo. La fila del `none` en listas de
  sombras **se conserva** y ahora es más crítica.
- **«Papel, tinta y sombra» → «Papel, luz y sombra»**, reescrita entera: el
  mecanismo de `--border-superficie`, la tabla nueva de los cuatro tokens de
  trazo, las dos excepciones de §2.5, la tabla de peldaños semánticos con la
  regla de grosor, y la sección del riesgo invertida (de «cuadrícula de cajas» a
  «sopa de objetos levitando»).
- **«El oro»**: apartado nuevo, *El oro es la respuesta al toque*, con la tabla
  de estados de §2.3, el token `--filo-activo` y las tres razones por las que el
  presupuesto no sube.
- **«Movimiento»**: las siete reglas de §3 escritas como reglas ejecutables, con
  el nombre de la utilidad que resuelve cada una. «Presionar hunde» actualizado
  al vocabulario de sombra nuevo y al filo dorado del hover.
- **«Componentes»**: `<Card principal>` deja de describirse como el trazo de 2px;
  se documenta `<Card sunk>`.

### Lo que NO se tocó, porque el encargo lo prohíbe expresamente

- **«Estado de membresía»** — intacta, palabra por palabra.
- **La tabla de contrastes firmados** — intacta, incluida la nota del
  presupuesto del CTA de ancho completo.
- **La regla del `QrCode`** — intacta.
- **«Transiciones de elemento compartido»** (View Transitions) — intacta. Es de
  otra tanda y sigue vigente.

### Fuera, y por qué

- **No se actualizó `.claude/docs/DIRECCION-ARTE-claro.md`.** Es el documento de
  la v2 y su valor es histórico: la v3 declara que lo sustituye «en lo que esta
  diga, y solo en eso». Reescribirlo borraría el porqué de las decisiones que la
  v3 conserva.
- **No se tocó la sección «Deuda conocida»** más allá de lo que ya decía. Los
  cuatro puntos siguen siendo ciertos después de esta tanda.
