# Plan de continuación: Portal de Miembros
> tech-lead · 03/09/2026 · rama `mejora-diseno` · HEAD `6072541` (merge de `origin/main`)
>
> **Este documento NO sustituye a `.claude/docs/PLAN-rediseno-miembros.md`. Lo continúa.**
> Conserva su numeración `T*` y solo añade lo que el estado real del árbol y el merge
> obligan a cambiar. Donde este plan calla, manda el plan original.
>
> Base de hechos: lectura directa de los archivos del árbol el 03/09/2026, más
> `CLAUDE.md`, `.claude/docs/{WORKFLOW,SCOPE,ARCHITECTURE,SPEC-pantallas-miembros,
> T4-direccion-arte,T5-validacion-contraste,REVISION-CLAUDE-MD}.md` y
> `.playwright-mcp/recorrido-3-portales/REPORTE.md`.
> `graphify-out/` no se ha leído (zona prohibida, `SCOPE.md` §3).
>
> **Limitación declarada de esta auditoría**: `tech-lead` no tiene shell. **No he podido
> ejecutar `git diff`, `tsc`, `lint`, `test` ni `build`.** Todo lo que sigue sale de leer
> el contenido actual de los archivos. Donde afirmo «modificado» me apoyo en el
> `git status` que aportó el orquestador; donde afirmo «hace X» he leído la línea.

---

## 0. Nota sobre la numeración

El plan original tiene una deriva de numeración entre su **lista de tareas**
(`### T1` … `### T28`) y algunas referencias en prosa: §4 dice «se corrige en **T29**»
(no existe; es T28), y «El criterio estético» dice «`ux-designer` la desarrolla en **T3**
… `design-system-architect` la traduce en **T5** … **T28** la verifica» (son T2, T4 y
T27). **Canónica es la lista de tareas.** Este documento usa esa.

Tareas nuevas que este plan añade, con prefijo `C` para que no colisionen:
`C0` (verde + commits), `T7-bis` (segundo diff de `CLAUDE.md`), `T14-bis` (punto de
control visual real). Todo lo demás conserva su `T*`.

---

## 1. Auditoría del estado real, T8 → T28

Leyenda: **HECHA** · **PARCIAL** (con lo que falta, enumerado) · **PENDIENTE**.

### FASE 1 — está cerrada, con una excepción de calado

| # | Estado | Evidencia |
|---|---|---|
| **T1** aprobación | HECHA (implícita) | Existe todo el entregable de FASE 1 y hay código de FASE 2 escrito. No hay registro escrito del «sí» ni de la respuesta a **Q1** (propuesta de imágenes al backend) |
| **T2** spec | **HECHA** | `.claude/docs/SPEC-pantallas-miembros.md`, v2, seis pantallas. §5 (`:650-786`) especifica la ficha completa: layout móvil `:660`, vuelta con filtros `:697`, escritorio dos columnas `:713`, ocho estados `:737` |
| **T3** auditoría de la spec | **HECHA** | La v2 lleva incorporados los nueve hallazgos de `mobile-ux` y `apple-hig` como registro de cambios (`SPEC:20-28`, N1–N9), cada uno con su sección de destino |
| **T4** dirección de arte | **HECHA** | `.claude/docs/T4-direccion-arte.md`: 8 tokens nuevos (§2), placa del logo (§4), carril (§5), presupuesto de oro reformulado (§3.2), jerarquía por pantalla (§7) |
| **T5** validación a11y | **HECHA y FIRMADA** | `T5-validacion-contraste.md:13-19`: «`--gold-600` como relleno con texto en tinta CUMPLE los dos criterios, en los dos temas». Real **5,40:1**, no los ~5,8:1 estimados. Bloqueantes: 0 |
| **T6** dictamen de movimiento | **PENDIENTE — no hay entregable** | No existe ningún `.claude/docs/T6-*`. Y el marcado ya se escribió sin él: **cero `view-transition-name` en todo `src/`**. La decisión que T6 debía tomar «antes del marcado» se tomó por omisión |
| **T7** revisión de `CLAUDE.md` | **PARCIAL** | Ver abajo |

#### T7 — PARCIAL, y es la puerta que sigue medio abierta

`REVISION-CLAUDE-MD.md` entregó **dos cambios de los seis** y lo dice explícitamente
(`REVISION-CLAUDE-MD.md:171-176`):

> «Otras rupturas que el plan lista (RUP-3 movimiento, RUP-5 carruseles, RUP-6 placa del
> logo) **no entran en este diff** porque dependen de entregables que todavía no existen
> … Se revisarán en un **segundo diff**.»

Ese segundo diff **no existe**, y los entregables de los que dependía (T2, T4, T5) **ya
existen desde el 30/08**. Aplicado en `CLAUDE.md` hoy:

| Ruptura | ¿En `CLAUDE.md`? | Evidencia |
|---|---|---|
| RUP-1 oro de acción condicionado | ✅ Sí | Sección «El oro», tabla con la fila `--gold-600` 5,40:1 firmada por T5 |
| §2b producto ≠ estado | ✅ Sí | Sección «Lo que ORUM es», los dos ejes separados |
| **RUP-2** excepciones de presupuesto (carnet ~15 %) | ❌ **No** | `CLAUDE.md` sigue diciendo «Presupuesto: ≤5 % del área visible por pantalla», sin excepciones. **T4 §3.2 lo sustituyó por otra regla («tres comprobaciones sobre captura») que la norma no recoge** |
| **RUP-3** View Transitions excluidas de la prohibición de animar layout | ❌ **No** | La sección «Movimiento» no la menciona |
| **RUP-5** «nada alcanzable solo deslizando» junto a la regla nº1 | ❌ **No** | «Las cuatro reglas que mandan» sin cambios |
| **RUP-6** la placa del logo como 2.ª superficie que no sigue el tema | ❌ **No** | «Componentes» solo sanciona `QrCode` |
| Deuda #1 `viewTransition` | Sin cambios — **y sigue siendo cierta** | Cero `<ViewTransition>` en `src/` |
| Deuda #4 «el portal solo se ha visto en su acceso» | ❌ **Falsa desde el 02/09** | `miembro-01/02/03.png` existen |

**Impacto**: `T19 code-reviewer` tiene mandato explícito de auditar «que la norma auditada
sea la de T7». Con la norma a medias reportará como violación (a) el oro del carnet cuando
supere el 5 %, (b) la placa de fondo constante, (c) los carriles sin «Ver todos». Es
exactamente el mecanismo de **R3**: el rediseño se revierte solo. **`T7-bis` es puerta
dura antes de FASE 3.**

---

### FASE 2 — implementación

#### T8 — Higiene · **PARCIAL (4 de 5)**

| Defecto | Estado | Evidencia |
|---|---|---|
| **D14** promociones caducadas | ✅ **HECHA, y en los dos sitios** | `(portal)/page.tsx:153` filtra la búsqueda por título con `esPromocionVigente`; `:243` filtra el mapa por comercio. La fecha es de negocio: `page.tsx:79` → `hoyISO()` → `America/Bogota` (`lib/shared/fecha.ts:7-9`) |
| **D1** guarda de `Grid` | ✅ HECHA | `components/ui/layout.module.css:31` → `minmax(min(var(--min, 240px), 100%), 1fr)`, con el porqué en `:23-25` |
| **D3** `scale` bajo movimiento reducido | ✅ HECHA | `(portal)/portal.module.css:348-352` anula `scale: 1` (no `transform`), y da color como equivalente no vestibular. El razonamiento en `:345-346` |
| **D4** acción duplicada | ✅ HECHA | `(portal)/layout.tsx:41-52`: fuera el botón de WhatsApp de la cabecera; el soporte vive solo en el menú (`:80-87`) |
| **D2** `<script dangerouslySetInnerHTML>` | ❌ **PENDIENTE** | `components/theme/theme-script.tsx:29` sigue igual. **Y hay contradicción de evidencia**: el plan afirma «error de React en cada carga» y `REPORTE.md:161` dice «**0 errores de consola** en todo el recorrido», con solo V3 (preload de fuente) abierto. Ver §2.3 |

**Lo que falta de T8**: D2, o el descarte razonado de D2 con la captura del overlay de Next
que exige su DoD #3.

#### T9 — Las seis pantallas de acceso · **HECHA (código), SIN VALIDAR (T10)**

- `components/ui/pantalla-auth.tsx` reescrito: `titular` es ahora un `<h1>` real
  (`:32-33` documenta que antes era un `<span>` y las pantallas no tenían encabezado),
  `apoyo`, `pie` fuera de la tarjeta, `marco`.
- `estilosAuth` conservado y ampliado con `pila` y `cargando` (`:20-25`) — la regla dura
  del plan («ambas clases del mismo módulo por `:has(.alerta)`») se respeta.
- Los seis formularios modificados: `login/login-form.tsx`, `miembros/login/_components/`,
  `comercios/login/_components/`, `activar-cuenta/_components/`, más sus `page.tsx`.
- **N2 cerrado**: `components/ui/input.module.css:21` usa `--t-control-size` en vez de
  `--t-body-size`, con el porqué del zoom de Safari iOS en `:14-20`.
- **D7 (halo literal `rgba(191,160,99,…)`)**: no verificado en esta auditoría. Va al DoD
  de C0.

**Lo que falta**: el hito **T10** (aprobación humana de la dirección de arte). No hay
constancia. Y **las capturas de Playwright no sirven para esto** — ver §3.

#### T10 — Hito de aprobación · **PENDIENTE (bloqueante humano)**

#### T11 — Cromo · **HECHA**

- `_components/menu-tema.tsx` **existe** y es el único componente de cliente del cromo.
  `layout.tsx:71-76` documenta la trampa resuelta: tres `MenuItem`, no un
  `SegmentedControl`, porque sus radios dentro del `<form action={cerrarSesionMiembro}>`
  hacían que **Enter cerrase la sesión** (R16).
- **N3 cerrado**: `portal.module.css:48` → `padding-top: max(var(--space-3),
  env(safe-area-inset-top, 0px))`.
- **N4 cerrado**: `portal.module.css:261` → `min-height: var(--tabbar-alto)`, nunca
  `height`, con el porqué de Dynamic Type en `:257-260`.
- **D6 cerrado y mejor que lo pedido**: `esDestinoActivo` extraída a
  `src/lib/miembros/navegacion-portal.ts` (función pura, testeable), consumida por
  `_components/portal-nav.tsx:6`. El plan lo situaba en T15; se adelantó.

**Falta**: `navegacion-portal.ts` **no tiene test** (es zona de `qa-tester`, T25).

#### T12 — `ComercioLogo`, placa y cadena de respaldo · **PARCIAL**

| Punto del plan | Estado | Evidencia |
|---|---|---|
| Cadena comercio → marca → inicial | ✅ | `src/lib/comercios/logo-comercio.ts` (`resolverLogoComercio`, normaliza cadena vacía y espacios); `(portal)/page.tsx:102` pide `logo_url` a `marcas`; `:227` mapa `logoMarca`; `:256` lo resuelve |
| D8 `contain` en placa de proporción fija | ✅ | Tokens `--placa-logo-ratio: 3 / 2` y `--placa-logo-w: 72px` (`tokens.css:382,386`). Comentario actualizado, no borrado (`comercio-logo.tsx:12-15`) |
| D10 + RUP-6 fondo constante | ✅ | `--placa-logo-bg: var(--w-0)` (`tokens.css:370`). **No se remapea en `globals.css`**: es constante en los dos temas, como exige RUP-6, y es token, no literal |
| D12 `alt` que no duplica el nombre | ✅ (por otra vía) | La placa entera va `aria-hidden="true"` (`comercio-logo.tsx:54`) y el `alt` **es la inicial** (`:59`). La prop `decorativo` que pedía el plan **no se creó**; el resultado a11y es el mismo o mejor |
| D13 fuera `style={{width,height}}` | ✅ | La firma ya no tiene `size`: `{ logoUrl, nombre, className }` (`:49`). El tamaño sale de `--placa-logo-w` |
| D11 `next/image` fuera | ✅ | `next.config.ts` sin bloque `images` (no tocado) |
| **D9 respaldo ante logo roto** | ❌ **PENDIENTE, y está escrito en el código** | `comercio-logo.tsx:40-43`: «**PENDIENTE DE VERIFICAR EN NAVEGADOR (T12)**: Chrome puede pintar un glifo de rotura JUNTO al texto alternativo cuando el `<img>` tiene dimensiones explícitas». Es el DoD #4 de T12 y sigue abierto |

**Nota de no-regresión (P1)**: `ComercioLogo` **ya no tiene ningún consumidor fuera de
`/miembros`** (grep: `comercio-card.tsx:93` y `:205`, nada más). El cambio de firma —quitar
`size`— no puede romper el panel. Verificado.

#### T13 — Catálogo · **HECHA, con dos desviaciones conscientes**

Implementado y visible en `(portal)/page.tsx`:

1. Consulta de `categorias` **dentro** del `Promise.all` existente (`page.tsx:104`), y la
   consulta que poblaba el desplegable «Comercio» **cambió de `select` en vez de
   duplicarse** (`:88-100`): coste neto de la fila de chips = **cero consultas**.
2. `created_at` en el `select` (`:124`), alimentando la estantería de novedades.
3. Chips como **enlaces** (`_components/chips-categoria.tsx:97-107`), con `aria-current`,
   check de `lucide` como portador no-cromático (`:102-104`) y la activa hoisteada a la
   segunda posición (`:57-59`).
4. `searchParams` normalizados con `primero()` (`page.tsx:28-30`) **y** `categoria_id`
   saneado con `numeroONulo` (`:38-42`); `escaparLike` (`:33-35`) protege el `ilike`.
5. Estanterías con umbrales en función pura: `src/lib/comercios/estanterias.ts`
   (`seleccionarNovedades`, `seleccionarBeneficiosDelMomento`), sin `Date.now()` dentro.
6. Rejilla intacta (`page.tsx:364-372`), `Grid min="290px"`.
7. **D5 cerrado**: la rejilla tiene su `h2` visible («Todos los comercios», `:365`) y cada
   `Carril` el suyo (`carril.tsx:85`), así que el `h3` de la tarjeta ya no salta
   (`comercio-card.tsx:96-108`).
8. Cuatro estados vacíos distintos, con copy propio (`page.tsx:392-447`).

**Desviación 1 — las estanterías NO llevan «Ver todos»**, contra la letra del DoD #5 de
T13 y de RUP-5. Está argumentada en `page.tsx:273-281` y `estanterias.ts:11-15`: son
estanterías **de duplicación**, no de enlace; todo lo que muestran está en la rejilla de
la misma página, así que un «Ver todos» apuntaría a esta misma URL. **El espíritu de RUP-5
—nada alcanzable solo deslizando— se cumple; la letra no.** Debe ratificarlo `T18` con
teclado y lector, y `T7-bis` debe redactar la regla como espíritu, no como «Ver todos»
obligatorio.

**Desviación 2 — se retiró el desplegable «Comercio»** y «Marca»/«Ciudad» bajaron a un
`<details>` con umbral de 2 opciones (`filtros-form.tsx:26,53-70,136`), y «Limpiar» salió
fuera del desplegable (`:168-186`, desviación declarada respecto de la spec, con motivo).
Es más agresivo que «un control más» pero coherente con el criterio estético («no cuatro
desplegables apilados»). Queda para `T27`.

#### T14 — Punto de control visual · **PENDIENTE**

No hay capturas del catálogo **rediseñado**. Las tres de Playwright son del deployment
anterior (§3).

#### T15 — Ficha de comercio · **PENDIENTE — y es una rotura viva, no solo un hueco**

**La ruta no existe.** `Glob src/app/miembros/(portal)/comercios/**` → *No files found*.

Y sin embargo **el catálogo ya publica enlaces hacia ella**:

- `_components/comercio-card.tsx:89` → `<Link href={hrefFicha(comercio.id, volver)}>`
  envuelve la tarjeta **entera** de la rejilla.
- `_components/comercio-card.tsx:200` → lo mismo en `ComercioCardCompacta`, la tarjeta de
  las dos estanterías.
- `hrefFicha` (`:55-63`) construye `/miembros/comercios/${id}`.

> 🔴 **En el estado actual del árbol, cada tarjeta del catálogo del socio es un enlace a un
> 404.** Es el peor defecto abierto del portal: peor que D14, porque D14 prometía un
> beneficio caducado y esto rompe **el único gesto que el catálogo invita a hacer**.

Peor: el comentario `comercio-card.tsx:42-46` afirma lo contrario —

> «Aquí decía "PENDIENTE (T15)" … **La ruta ya existe y la deuda queda saldada**»

— y es **falso**. El comentario se escribió por adelantado. Cualquier agente que lo lea
concluirá que T15 está hecho.

Infraestructura de T15 **ya escrita y hoy muerta**:

| Pieza | Estado |
|---|---|
| `src/lib/miembros/volver-catalogo.ts` (`resolverVolverAlCatalogo`, lista blanca contra redirección abierta) | **Cero consumidores** en todo `src/`. Código muerto hasta que exista la ficha |
| `src/lib/miembros/navegacion-portal.ts` con `HIJOS_DE_INICIO = ['/miembros/comercios']` (`:34`) | Ya apunta a una ruta inexistente |
| Prop `volver` de `ComercioCard` / `ComercioCardCompacta` (`comercio-card.tsx:82,187`) | **La página nunca la pasa**: `page.tsx:330`, `:338` y `:369` la omiten. El «volver conservando filtros» de `SPEC §5.4` no funcionaría aunque la ficha existiera |
| `comercios/[id]/loading.tsx` | No existe |

#### T16 — Carnet · **PENDIENTE. `perfil/page.tsx` y `perfil.module.css` sin tocar**

- `perfil.module.css:29-34`: `.cuerpo { grid-template-columns: 1fr auto }` **sin
  `max-width` propio**. Es la causa exacta del hueco muerto que el plan cita: el carnet se
  estira hasta `--content-max`.
- `perfil.module.css:124`: `border: 1px solid #000` — **literal de color**, deuda A ya
  catalogada en `ARCHITECTURE.md:514`, dentro de `@media print`.
- `perfil/page.tsx:62-65` sigue usando `PageHeader` (la cabecera del **panel**), mientras
  el catálogo ya migró a `EncabezadoCatalogo` con tres niveles de rampa. **Las dos
  pantallas del socio ya no comparten dirección de arte.**
- `plan?.nombre` sigue en `:72`. Correcto según `CLAUDE.md` — y objeto de la puerta **P1**
  (§6).
- Lo que **sí** está bien y no debe «simplificarse»: `:13-29`, fecha civil con `Date.UTC`
  + `timeZone: 'UTC'`; `:52-56`, estado derivado con `derivarEstadoMembresia` y
  `hoyBogota()`; `:99-102`, QR con `numero_membresia`.

**Anomalía a resolver en T16**: `perfil/loading.tsx` (nuevo, T17) **ya dibuja el carnet
rediseñado** — su comentario `:16-19` describe «filo dorado, datos a la izquierda y QR a
la derecha, que bajo 620px del contenedor pasa a columna centrada», y reserva **232px**
para el QR (`:56`). La spec `§6.3` especifica un QR de **160px + 2×32 de zona de
silencio** (N9). **El esqueleto y la spec ya no coinciden, y la página no coincide con
ninguno de los dos.** Es exactamente el salto que un `loading.tsx` existe para evitar.

#### T17 — Inactiva, carga y error · **PARCIAL (3 de 5 archivos)**

| Archivo | Estado |
|---|---|
| `src/app/miembros/error.tsx` + `error.module.css` | ✅ **HECHA**. `'use client'`, `console.error` con prefijo `[miembros]`, `digest` sin stack, dos salidas reales (`error.tsx:49-58`), marco propio porque la frontera sustituye al layout (`:18-22`) |
| `(portal)/loading.tsx` | ✅ **HECHA**, y ajustado a la forma nueva de los filtros (`:23-37` explica por qué dibuja **un** campo y no tres) |
| `perfil/loading.tsx` | ✅ Escrito — pero **describe una pantalla que aún no existe** (ver T16) |
| `comercios/[id]/loading.tsx` | ❌ PENDIENTE (depende de T15) |
| `inactiva/page.tsx` + `inactiva.module.css` | ❌ **PENDIENTE. Sin tocar.** `inactiva/page.tsx:22` sigue siendo un `Card` con icono, `h1` y `WhatsAppButton variant="primary"` — no `brand`. Es la pantalla del socio que dejó de pagar: hoy no invita a volver, informa |

`RouteProgress` en el portal: no montado. Correcto — el plan lo condiciona a T20.

---

### FASE 3 a FASE 6 — todas PENDIENTES

| # | Agente | Estado |
|---|---|---|
| T18 `accessibility-auditor` | PENDIENTE | Ningún entregable en `.claude/docs/` |
| T19 `code-reviewer` | PENDIENTE | **Bloqueado por T7-bis** |
| T20 `performance-engineer` | PENDIENTE | |
| T21 `security-auditor` | PENDIENTE | Y con **dos frentes nuevos**: §7 R-N2 y R-N3 |
| T22 `mobile-ux-specialist` | PENDIENTE | Auditó la spec (T3); falta auditar el resultado |
| T23 `apple-hig-specialist` | PENDIENTE | Ídem |
| T24 sobrefetching | PENDIENTE, condicional a T20 | |
| T25 `qa-tester` | **PENDIENTE, y hay deuda acumulada**: los cuatro módulos puros nuevos —`logo-comercio.ts`, `estanterias.ts`, `navegacion-portal.ts`, `volver-catalogo.ts`— **no tienen ni un test**. `volver-catalogo.ts` sanea una redirección abierta: es el que más lo necesita | |
| T26 `motion-ux-polish` | PENDIENTE | |
| T27 `design-system-architect` (AUDITAR) | PENDIENTE | |
| T28 `docs-handoff` | PENDIENTE | Con dos cabos añadidos: `ARCHITECTURE.md` está desactualizado en más sitios que D15 (§7 R-N5), y `estilosEncabezado` (`encabezado-catalogo.tsx:17`) es un export sin consumidor cuyo comentario `:13-14` afirma que lo usa `loading.tsx` — y no lo usa |

---

## 2. Impacto del merge `origin/main`

### 2.1 `822ea7c` — `useCerrarOverlay` / `useCerrarCuando`: **cero cambios obligados hoy, una norma que hay que fijar**

Verificado en `src/components/shell/overlay-ruta.tsx:36-68`. La norma nueva es:
**cerrar un overlay interceptado es siempre `router.back()`; nunca un `<Link>` hacia
adelante ni un `redirect()` de servidor.**

Impacto sobre Miembros, medido:

- **El Portal de Miembros no tiene ninguna ruta interceptada.** No hay ranura `@modal`
  fuera de `app/admin/layout.tsx`, y el plan lo prohíbe explícitamente («Ningún formulario
  nuevo · Cero gemelas `@modal`»). `useCerrarOverlay` devuelve un no-op fuera de un
  `OverlayRuta` (`overlay-ruta.tsx:46`), así que **nada de lo ya escrito hay que
  reescribirlo**.
- **Lo que sí cambia es una prohibición futura.** `SPEC §5` (ficha) y el plan resuelven la
  ficha como **navegación push**, no overlay. El fix refuerza esa decisión: montar la
  ficha en una ranura `@modal` nueva heredaría ahora una máquina de cierre con guardia
  `useRef` que este portal no necesita. **T15 no crea ranura. Se mantiene.**
- **Regla que este plan fija para cualquier overlay futuro del portal**: si algún día
  entra uno, el cierre viene de `useCerrarOverlay()`; los formularios no inventan
  navegación propia para «Cancelar». Va a `T7-bis` como línea, para que no se redescubra.

**Consecuencia operativa real**: el merge tocó 17 archivos del panel y esos cambios están
**ya commiteados**. Pero `git status` marca además `src/app/admin/page.tsx` y
`src/app/admin/miembros/[id]/page.tsx` como **modificados sin commitear**, dentro de una
rama cuyo P1 dice «el panel no se rediseña». **Hay que ver ese diff antes de nada** (C0).
Dato concreto: F2 **no** está corregido — `src/app/admin/page.tsx:152-157` sigue listando
«Mi contraseña» como tarjeta fija en «Accesos», además del menú del avatar.

### 2.2 Lo que las credenciales invalidan

`Usuarios Pruebas PlayWright.txt` existe en la raíz del repositorio y trae miembros
activos (`00031324`, `00044150`) y **vencido** (`00029417`).

- **`CLAUDE.md` §Deuda conocida punto 4 es falso** y hay que retirarlo en `T7-bis`.
- **B1 del REPORTE deja de estar bloqueado**: `/miembros/inactiva` **ya es verificable** con
  `00029417`. Eso convierte T17 de «pantalla a ciegas» en «pantalla verificable», y sube su
  prioridad: es la única del portal que nadie ha visto nunca renderizada.
- **Hallazgo de seguridad que el merge introdujo**: un archivo de credenciales de acceso
  en texto plano en la raíz del repositorio, versionado. Va a `T21` como hallazgo propio
  (§7 R-N3), no como tarea de este plan.

### 2.3 Lo que las capturas corrigen o contradicen del plan original

| Supuesto del plan | Qué dice la evidencia nueva | Veredicto |
|---|---|---|
| **D2** produce «un error de React en cada carga» y «2 Issues permanentes que tapan cualquier error nuevo» (`PLAN:210`, R13 «Alta — es un hecho») | `REPORTE.md:161`: «**0 errores de consola** en todo el recorrido», con V3 (preload de fuente) como único aviso abierto | **Contradicción real.** O el recorrido no abrió el overlay de Next (probable: se corrió contra un **deployment de producción**, donde ese overlay no existe), o D2 no se manifiesta. **No lo resuelvo: lo mando a verificar.** Es el DoD #3 de T8 y hoy no está cerrado ni descartado |
| **R5**: «D14 destapa que el catálogo se queda muy vacío» | `SPEC:536` fija el dato real: **0 promociones vigentes** y **4 comercios** en la base de prueba | **Confirmado, y peor de lo estimado.** Con 4 comercios ninguna estantería se renderiza (umbral ≥8, `estanterias.ts:22`) y **todas** las tarjetas caen al estado «Sin beneficio vigente hoy». El catálogo rediseñado, con los datos de hoy, es una rejilla de cuatro tarjetas sin oro. Eso condiciona T14-bis: **hay que sembrar datos antes de pedir juicio estético** |
| **V1** «botón circular recortado» | `REPORTE.md:137-144`: «muy probablemente la **Vercel Toolbar** del preview y no de la app» | **No es de Miembros.** Aparece en `admin-06` y `comercio-10`, ninguna captura del portal del socio. Se confirma barato en C0 y, si es de la app, va a T22 |
| **F1** overlays | Resuelto y verificado en `main` | No toca Miembros |

---

## 3. Lectura de las tres capturas del portal del cliente

> **Declaración de método, obligatoria**: `tech-lead` **no puede abrir archivos PNG**.
> Todo lo que sigue procede de las descripciones textuales de
> `.playwright-mcp/recorrido-3-portales/REPORTE.md` (índice `:248-250`, hallazgos
> `:120-133` y `:196-199`). **No he visto los píxeles y no invento lo que muestran.**

### 3.1 El hecho que cambia cómo hay que usarlas

`REPORTE.md:4-5` fija el entorno: **deployment de Vercel** `orum-project-test-…`, más
`pnpm dev` local solo para verificar el fix F1. Ese deployment sale del árbol de `main`.
**Los 61 archivos del rediseño están sin commitear y por tanto NO estaban desplegados.**

> **Las tres capturas documentan el portal ANTES del rediseño. Son la línea base, no la
> validación de T9/T11/T12/T13.**

Es una corrección importante al encargo: la evidencia visual existe, pero **no exime de
T10 ni de T14**. Sigue sin haber una sola captura del Portal de Miembros rediseñado.

Confirmación textual: `REPORTE.md:248` titula `miembro-01-inicio.png` como «Portal de
Miembros — **Comercios y beneficios**». El catálogo rediseñado no lleva ese titular: su
`<h1>` es **«Beneficios del club»** (`encabezado-catalogo.tsx:25`), con overline «Tu
membresía» y lede propio. «Comercios y beneficios» es el `metadata.title`
(`page.tsx:25`) y era el titular del `PageHeader` anterior.

### 3.2 Qué se puede afirmar de cada una, y contra qué

| Captura | Lo que el reporte afirma | Contra `T4-direccion-arte.md` / spec |
|---|---|---|
| `miembro-01-inicio.png` | Catálogo «Comercios y beneficios», sin más detalle | **No permite verificar nada del rediseño.** Sirve como *antes* para el criterio «no genérica»: es la pantalla de los cuatro desplegables que `T4 §7.2` y `SPEC §4.2` sustituyen |
| `miembro-02-perfil.png` | Carnet en claro; **muestra «Premium»** (`:133`) | **Es el carnet actual, que T16 no ha tocado.** Documenta el hueco muerto de `perfil.module.css:31` y el `plan?.nombre` de `perfil/page.tsx:72`. Es la evidencia del problema, no de la solución |
| `miembro-03-perfil-oscuro.png` | Carnet en oscuro; **el QR sigue negro sobre blanco** (`:250`, `:198`) | ✅ **Se cumplió, y es la única regla de `CLAUDE.md` que estas capturas verifican positivamente.** `QrCode` no se invierte en tema oscuro: el escaneo en la caja no se rompe. **T16 no puede tocarlo** |

### 3.3 Lo que el reporte verifica y sí es del portal del socio

`REPORTE.md:196-199`, sin captura del portal pero derivado del mismo dato:
- **Estado de membresía derivado correctamente**: «Activa» + «Vence en N días» ámbar
  secundario; «Inactiva · vencida» **con texto además del color**. La regla dura de
  `CLAUDE.md` §Estado de membresía se cumple hoy. **T16 no puede regresarla.**
- **Tema Auto/Claro/Oscuro funciona en los tres portales.** T11 no lo rompió (o no se
  probó sobre T11; el deployment es anterior).

### 3.4 Lo que NO se cumplió y las capturas no pueden decir

Ninguna captura cubre: la placa del logo con proporciones distintas (`T4 §4.4`), un
`logo_url` muerto (`T4 §4.5`, D9), un PNG transparente en oscuro (D10), la fila de chips,
las estanterías, `/miembros/inactiva`, ni **la ficha de comercio, que no existe**. Los
ocho DoD de T12 y los once de T13 siguen **sin una sola prueba visual**.

---

## 4. Ruta crítica hasta un Portal de Miembros presentable

Orden, con la justificación de por qué cada uno va donde va. **Miembros manda: nada del
panel ni de comercios entra en esta ruta salvo lo que la bloquea.**

```
C0  ██ ÁRBOL EN VERDE + CONSOLIDACIÓN EN COMMITS ██   ← nada empieza antes
      ↓
P1  ██ PUERTA: la contradicción del plan («Premium») ██  (una línea al propietario)
P2  ██ PUERTA: T10, dirección de arte del acceso ██
      ↓
T15  FICHA DE COMERCIO  ← cierra el 404 vivo. La tarea más urgente del portal
      ↓
T16  CARNET   ║  T17  INACTIVA + loading de la ficha      [paralelizables]
      ↓
T7-bis  ██ PUERTA DURA: segundo diff de CLAUDE.md ██  ← sin esto, T19 revierte el diseño
      ↓
T14-bis  punto de control visual, con datos sembrados
      ↓
FASE 3   T18 ║ T19 ║ T20 ║ T21 ║ T22 ║ T23   [seis en paralelo]
      ↓  corrección por severidad  →  T24 (condicional a T20)
FASE 4   T25 qa-tester  (+ los 4 módulos puros sin test)
FASE 5   T26 motion  (+ T6 pendiente se absorbe aquí)
FASE 6   T27 coherencia  →  T28 documentación
```

### Por qué este orden

1. **C0 primero, sin discusión.** 61 archivos sin commitear, sin una sola ejecución
   registrada de `tsc/lint/test/build`, en una rama que ya se fusionó con `main` una vez.
   Si algo de esto no compila, todo lo que se construya encima hereda el fallo y el diff
   se vuelve inatribuible. Además hay dos archivos del panel modificados que **P1 del plan
   prohíbe tocar**: o se justifican o se descartan, y eso solo se ve con `git diff`.
2. **T15 antes que T16.** El plan lo ordenaba igual, pero ahora la razón es otra y más
   dura: **el catálogo enlaza a un 404 en cada tarjeta**. Mientras eso viva, el portal no
   es «mejorable», está roto en su gesto principal. Y T15 consume tres piezas ya escritas
   que hoy son código muerto (`volver-catalogo.ts`, `HIJOS_DE_INICIO`, la prop `volver`):
   el coste marginal es el más bajo del plan.
3. **T16 y T17 en paralelo.** No comparten un archivo. T16 toca `perfil/*`, T17 toca
   `inactiva/*` y `comercios/[id]/loading.tsx`. Ambas dependen de T15 solo por coherencia
   visual, no por código — salvo el `loading.tsx` de la ficha, que sí.
4. **T7-bis antes de FASE 3, no después.** Es R3 literal. `T19` tiene mandato de auditar
   contra la norma; con la norma a medias reportará el carnet, la placa y los carriles como
   violaciones y `frontend-implementer` los revertirá obedientemente.
5. **T14-bis después de T17 y no antes**, y **con datos sembrados**: con 4 comercios y 0
   promociones vigentes (`SPEC:535-536`) el catálogo no puede enseñar ni una estantería.
   Pedir juicio estético sobre eso es pedirlo sobre el estado vacío.
6. **T6 no se recupera como fase propia.** Su objeto —decidir los `view-transition-name`
   antes del marcado— ya no se puede cumplir: el marcado está escrito. Se absorbe en T26
   como decisión de pulido, con la opción explícita de **retirar la transición** (R11).
7. **Lo del panel que compite, y va detrás**: F2 («Mi contraseña» duplicada,
   `admin/page.tsx:152-157`), V3 (preload de fuente), D2 si resulta ser global, `/`
   redirigiendo a `/admin`, y N1 (`manifest.ts:16` `start_url: '/admin'`). **N1 es la
   única que discuto**: es la primera pantalla del socio que instala la PWA y hoy le abre
   el acceso administrativo **en cada arranque**, sin barra de direcciones para corregirlo
   (`SPEC:20`). Vive en `src/app/manifest.ts`, zona de trabajo, y el arreglo es una línea
   — pero **cambia el arranque de los tres portales**, así que es decisión de producto, no
   de diseño: va a §6 como puerta P3.

---

## 5. Secuencia de agentes, ejecutable literalmente

Formato de `WORKFLOW.md`. **Solo `frontend-implementer` escribe código de producto;
`qa-tester` solo `src/lib/**/*.test.ts`.** Lo que cruza `SCOPE.md` §2 va a
`PROPUESTAS PARA BACKEND`, nunca a un parche.

Cada bloque `Invocar:` es el encargo tal cual para lanzarlo.

---

### C0 — Dejar el árbol en verde y consolidarlo en commits · **PRIMERA, SIN EXCEPCIÓN**

- **Agente**: `frontend-implementer` (es el único con shell y con escritura)
- **Depende de**: —
- **Archivos**: ninguno de producto por defecto. Solo los que hagan falta para compilar.
- **Riesgo**: alto (es el que destapa lo desconocido)

**Invocar:**

> Estás en `mejora-diseno`, HEAD `6072541`. Hay ~61 archivos sin commitear del rediseño
> del Portal de Miembros y **nadie ha verificado que el árbol compile**. Tu encargo tiene
> cuatro partes, en orden, y no escribes ni una línea de rediseño nuevo:
>
> 1. Ejecuta `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build` y **pega la
>    salida íntegra**. Si algo falla, corrige **solo lo mínimo** para ponerlo en verde y
>    reporta cada corrección con `archivo:línea` y por qué.
> 2. Ejecuta `git diff -- src/app/admin/page.tsx src/app/admin/miembros/[id]/page.tsx
>    src/lib/miembros/buscar-miembros.ts` y **pega el diff**. La premisa P1 del plan dice
>    que el panel **no se rediseña**. Para cada cambio: o lo justificas como necesario
>    (p. ej. una firma compartida que cambió), o **lo descartas con `git checkout --`**.
>    No dejes cambios del panel sin explicar.
> 3. Verifica tres cosas concretas y reporta el resultado con `archivo:línea`:
>    (a) que no queda ningún literal de color en `src/components/ui/pantalla-auth.module.css`
>        —D7, el halo dorado que era `rgba(191,160,99,…)`—;
>    (b) que `src/app/miembros/(portal)/perfil/perfil.module.css:124`
>        (`border: 1px solid #000`) sigue siendo la única excepción de impresión, y déjalo
>        anotado para T16;
>    (c) abre `/miembros`, `/admin` y `/comercios` en `pnpm dev` y **cuenta los Issues del
>        overlay de Next**. Es el DoD #3 de T8 (D2). Si son 0, D2 queda **descartado con
>        evidencia** y lo dices; si no, lo dejas abierto. No lo arregles todavía.
> 4. **Consolida en commits por tarea**, no en uno solo. Sugerencia de reparto, ajústala a
>    lo que veas: `T8 higiene (D14/D1/D3/D4)` · `T9 acceso: las seis pantallas` ·
>    `T11 cromo del portal` · `T12 placa del logo y cadena de respaldo` ·
>    `T13 catálogo: categorías, estanterías y rejilla` · `T17 (parcial) loading y error` ·
>    `docs: entregables de FASE 1`. Cada commit debe compilar por sí solo si es viable; si
>    no lo es, dilo y agrupa.
>
> **NO hagas**: crear `/miembros/comercios/[id]` (eso es T15), tocar `perfil/*` (T16),
> tocar `inactiva/*` (T17), ni abrir ningún archivo de `SCOPE.md` §2.

- **DoD**: cuatro comandos en verde, pegados. Diff del panel justificado o descartado.
  Conteo de Issues del overlay en los tres portales. Historial con un commit por tarea y
  `git status` limpio.

---

### PUERTAS P1, P2, P3 — decisión del propietario · ver §6

No son tareas de agente. **T15 puede arrancar sin P1 y sin P3**; **T16 no arranca sin
P1**; **nada de dirección de arte nueva arranca sin P2**.

---

### T15 — Ficha de comercio `/miembros/comercios/[id]` · RUTA NUEVA

- **Agente**: `frontend-implementer`
- **Depende de**: C0
- **Archivos**: `src/app/miembros/(portal)/comercios/[id]/page.tsx` **nuevo** ·
  su `.module.css` **nuevo** · `src/app/miembros/(portal)/page.tsx` (pasar `volver`)
- **Riesgo**: alto (superficie nueva que lee la base para el usuario final)

**Invocar:**

> Implementa la ficha de comercio del Portal de Miembros, tarea **T15** de
> `.claude/docs/PLAN-rediseno-miembros.md`. La spec cerrada está en
> `.claude/docs/SPEC-pantallas-miembros.md` **§5 (líneas 650-786)**: layout móvil §5.3,
> la vuelta §5.4, escritorio §5.6, los ocho estados §5.7. La jerarquía tipográfica está en
> `.claude/docs/T4-direccion-arte.md` **§7.3**. **Móvil primero, 375×667.**
>
> **Contexto que tienes que saber antes de escribir**: el catálogo **ya publica enlaces a
> esta ruta** (`_components/comercio-card.tsx:89` y `:200`, vía `hrefFicha` en `:55-63`),
> y la ruta **no existe**: hoy cada tarjeta del catálogo lleva a un 404. Cerrar eso es el
> objetivo. El comentario de `comercio-card.tsx:42-46` afirma que «la ruta ya existe»:
> **es falso, corrígelo** al terminar.
>
> Piezas ya escritas que debes **consumir, no reescribir**:
> - `src/lib/miembros/volver-catalogo.ts` → `resolverVolverAlCatalogo(searchParams.volver)`.
>   Hoy **no lo usa nadie**. Es la guarda contra redirección abierta del botón «‹ Comercios».
> - `src/lib/miembros/navegacion-portal.ts` ya trata `/miembros/comercios` como hijo de
>   «Inicio» (`:34`), así que la pestaña quedará activa sola. Verifícalo, no lo dupliques.
> - `src/lib/comercios/logo-comercio.ts` → `resolverLogoComercio(logoComercio, logoMarca)`.
>   La misma cadena comercio → marca → inicial del catálogo.
> - `src/lib/comercios/promocion-vigente.ts` → `esPromocionVigente`.
> - `src/lib/comercios/beneficios-formato.ts` → `formatearBeneficio`.
> - `src/components/ui/carril.tsx` → `Carril` / `CarrilPista` para promociones y sedes.
>
> **Reglas duras, cada una por una razón:**
> - `requireMiembroVigente()` al entrar. Sin excepción.
> - `createClient()`, **nunca** `createAdminClient()`. Los portales de usuario final no
>   usan service role; `admin.ts` lleva `server-only` y la barrera es de compilación.
> - `notFound()` si el comercio no existe, `activo === false` o `deleted_at` no es null.
>   **Toda** consulta filtra `.is('deleted_at', null)`.
> - **Solo promociones vigentes.** Una ficha que contradiga al catálogo sería peor que el
>   bug D14 original.
> - `Promise.all` sobre las consultas independientes. Encadenar `await` es regresión
>   (`e1fc40a`).
> - **Es navegación push, NO overlay.** Cero ranuras `@modal` — vive solo en
>   `app/admin/layout.tsx`. Y el fix `822ea7c` refuerza esto: `useCerrarOverlay()` es solo
>   para rutas interceptadas y aquí no hay ninguna.
> - Server Component. Un `<h1>` (el nombre del comercio) y `metadata` con ese nombre.
> - `@container contenido`, nunca `@media`, dentro de `<main>`.
> - Cero literales: color, espaciado, radio y duración salen de `tokens.css`.
> - La acción principal («Mostrar mi carnet», `SPEC:187`) usa `Button variant="brand"`,
>   que es el relleno dorado plano firmado en T5 (5,40:1). No `variant="gold"`, que es el
>   barrido y reprueba 1.4.3 en tema claro (ver `button.module.css:171-174`).
>
> **Y cierra el cabo que hoy queda suelto**: `(portal)/page.tsx` renderiza
> `<ComercioCard>` en `:369` y `<ComercioCardCompacta>` en `:330` y `:338` **sin pasar
> `volver`**, así que el «volver conservando filtros» de `SPEC §5.4` no funcionaría.
> Constrúyelo desde los `searchParams` ya normalizados de la página y pásalo.
>
> **NO hagas**: `.range()` ni paginación (es B1, backend). `next/image` ni tocar
> `next.config.ts` (R10). `backdrop-filter` en filas de lista. Ningún formulario.

- **DoD**:
  1. Cuatro comandos en verde.
  2. **Captura a 375×667 primero**, luego 1440px.
  3. **Ninguna tarjeta del catálogo lleva a un 404.** Se comprueba abriendo las cuatro.
  4. Enlace directo abre la ficha completa; el botón atrás vuelve al catálogo
     **conservando scroll y filtros**; con `?volver=https://otro-sitio.com` el botón
     **sigue yendo a `/miembros`**.
  5. Una pestaña queda activa, con `aria-current`.
  6. Id inexistente, inactivo o con `deleted_at` → `notFound()`.
  7. Los ocho estados de `SPEC §5.7`, con captura cada uno.
  8. Server Component, sin `admin.ts`, un `<h1>`, `metadata` con el nombre.
  9. El comentario falso de `comercio-card.tsx:42-46` corregido.

---

### T16 — Carnet `/miembros/perfil`

- **Agente**: `frontend-implementer` · **Depende de**: T15 y **P1 resuelta**
- **Archivos**: `perfil/page.tsx` · `perfil.module.css` · `perfil/loading.tsx` (reconciliar)
- **Riesgo**: medio

**Invocar:**

> Implementa **T16** del plan: el carnet. Spec en `SPEC-pantallas-miembros.md` **§6
> (788-935)**, con la aritmética del peor caso a 375px en **§6.3** y el escritorio a dos
> columnas en **§6.5**. Tipografía en `T4-direccion-arte.md` **§7.4**. Presupuesto de oro
> del carnet: `T4 §3.3`.
>
> **Estado de partida**: `perfil/page.tsx` y `perfil.module.css` están **sin tocar** desde
> antes del rediseño. Concretamente:
> - `perfil.module.css:29-34` — `.cuerpo { grid-template-columns: 1fr auto }` **sin
>   `max-width` propio**: el carnet se estira hasta `--content-max: 1100px` y deja el hueco
>   muerto que el propietario reportó. Es lo primero que hay que resolver.
> - `perfil/page.tsx:62-65` usa `PageHeader`, que es la cabecera del **panel**. El catálogo
>   ya migró a su propio `EncabezadoCatalogo` con tres niveles de rampa: hoy las dos
>   pantallas del socio no comparten dirección de arte.
> - `perfil.module.css:124` — `border: 1px solid #000` dentro de `@media print`. Literal de
>   color. O sale a token, o queda documentado como excepción sancionada igual que `QrCode`.
>
> **Reconcilia el esqueleto**: `perfil/loading.tsx` ya existe y **dibuja un carnet que la
> página no tiene** (`:16-19` describe filo dorado, dos columnas y colapso a 620px del
> contenedor; `:56` reserva **232px** para el QR). La spec **§6.3 / N9** pide **160px + 2×32
> de zona de silencio**. Los tres tienen que coincidir al terminar, o el esqueleto produce
> justo el salto que existe para evitar.
>
> **Reglas duras — cada una ya costó un bug:**
> - **El QR va negro sobre blanco en los dos temas.** Invertirlo rompe el escaneo en la
>   caja del comercio, delante del cliente. `REPORTE.md:198` confirma que hoy se cumple:
>   no lo rompas.
> - **`plan?.nombre` se mantiene** (`perfil/page.tsx:72`). `CLAUDE.md` §«Lo que ORUM es»
>   lo declara correcto: el producto no es binario, solo el estado. **El diseño debe
>   soportar un nombre de plan largo, y a dos líneas**, porque el esquema admite N planes.
> - El estado se **deriva** con `derivarEstadoMembresia` (`page.tsx:52-56`). Nunca
>   `membresias.estado` en crudo. Activa → verde punto lleno; inactiva → rojo atenuado y
>   punto **hueco** con el motivo en texto. «Vence en N días» **no es un estado**: señal
>   ámbar secundaria.
> - La vigencia es fecha civil `'YYYY-MM-DD'`: `Date.UTC(...)` y `timeZone: 'UTC'`
>   (`page.tsx:13-29`). Leerla en Bogotá la retrasa un día y el carnet ya anunció una vez
>   el vencimiento antes de tiempo. **No lo «simplifiques».**
> - `@media print` sigue funcionando.
> - `@container contenido`, no `@media`, dentro de `<main>`.

- **DoD**: (1) cuatro comandos en verde; (2) captura 375px, carnet entero sin
  desplazamiento horizontal, contrastada contra la aritmética de `SPEC §6.3`; (3) captura
  1440px **sin hueco muerto**; (4) **el QR se escanea con un lector real**, en claro y en
  oscuro; (5) vista previa de impresión legible; (6) contraste AA en todo texto, incluido
  el que caiga sobre superficie dorada; (7) el número sigue en `--font-mono` con
  `tabular-nums`; (8) **con un nombre de plan largo a dos líneas el carnet no se rompe**;
  (9) `loading.tsx`, página y spec coinciden en la geometría del QR.

---

### T17 — Membresía en pausa, y el `loading` de la ficha

- **Agente**: `frontend-implementer` · **Depende de**: T15 · **paralelizable con T16**
- **Archivos**: `inactiva/page.tsx` · `inactiva.module.css` ·
  `comercios/[id]/loading.tsx` **nuevo**
- **Riesgo**: bajo

**Invocar:**

> Cierra **T17**. Tres de sus cinco archivos ya están hechos (`miembros/error.tsx`,
> `(portal)/loading.tsx`, `perfil/loading.tsx`). **Faltan dos:**
>
> 1. **`/miembros/inactiva`** — sin tocar desde antes del rediseño. Spec en
>    `SPEC-pantallas-miembros.md` **§7**, tipografía en `T4 §7.5`. Es la pantalla del socio
>    que dejó de pagar: **debe invitar a volver, no despedir**. Hoy `inactiva/page.tsx:22`
>    es un `Card` con icono, `h1` y un `WhatsAppButton variant="primary"`. Revisa si la
>    acción principal debe pasar a `variant="brand"` según `SPEC §2.2`. Conserva lo que ya
>    está bien: la salida real por WhatsApp (`:34-48`) y que use `requireRolMiembro()` y no
>    `requireMiembroVigente()`, porque lo segundo crearía un bucle de redirección (`:23-27`
>    de `requerir-miembro.ts` lo explica).
>    **NOVEDAD que cambia el DoD**: ya hay credenciales de un miembro **vencido**
>    (`00029417`, en `Usuarios Pruebas PlayWright.txt`). Esta pantalla **se puede ver de
>    verdad por primera vez**. El DoD exige captura real, no razonada.
> 2. **`comercios/[id]/loading.tsx`** — el esqueleto de la ficha. Mismo criterio que los
>    otros dos: **replica el layout real tomando las clases del propio componente**, no las
>    recrees a ojo. Mira `(portal)/loading.tsx:7-21` para el patrón y el porqué.
>
> `Skeleton` ya lleva `data-motion-esencial`: el barrido debe **seguir animando** bajo
> `prefers-reduced-motion`, porque un esqueleto congelado parece contenido roto.
> **No montes `RouteProgress`**: está condicionado a que T20 lo apruebe.

- **DoD**: (1) cuatro comandos en verde; (2) **captura real de `/miembros/inactiva`
  entrando con `00029417`** — cierra B1 del `REPORTE.md`; (3) con la red a «Slow 3G»,
  abrir una ficha muestra su esqueleto antes que la pantalla; (4) el esqueleto no es ruido
  para el lector de pantalla; (5) `/miembros/inactiva` ofrece una salida real y accesible
  por teclado.

---

### T7-bis — Segundo diff de `CLAUDE.md` · **PUERTA DURA antes de FASE 3**

- **Agente**: `docs-handoff` redacta. **Lo aplica el propietario.**
- **Depende de**: T15, T16, T17 (para que el diff describa lo que existe)
- **Riesgo**: bajo de ejecución, **muy alto de omisión** (R3)

**Invocar:**

> `REVISION-CLAUDE-MD.md:171-176` dejó explícitamente fuera del primer diff las rupturas
> **RUP-3, RUP-5 y RUP-6**, porque dependían de entregables que entonces no existían.
> **Ya existen** (`SPEC-pantallas-miembros.md`, `T4-direccion-arte.md`,
> `T5-validacion-contraste.md`, del 30/08). Redacta el **segundo diff**, con el mismo
> formato «Quitar (literal) / Poner (literal)» para que aplicarlo sea copiar y pegar.
> Escribe en `.claude/docs/REVISION-CLAUDE-MD-2.md`. **No edites `CLAUDE.md`**: está fuera
> de la zona de trabajo de `SCOPE.md` §1 y su autorización es una acción del propietario.
>
> Lo que el diff debe cubrir, con la evidencia de dónde sale cada regla:
> 1. **RUP-2 + `T4 §3.2`** — el «Presupuesto: ≤5 % del área visible por pantalla» de la
>    sección «El oro» **está sustituido de hecho** por la regla de tres comprobaciones
>    sobre captura de `T4 §3.2`, con las mediciones de `§3.3` y las excepciones del carnet
>    y del acceso. Hoy la norma y el sistema dicen cosas distintas.
> 2. **RUP-3** — una frase en «Movimiento» que excluya explícitamente los
>    pseudo-elementos `::view-transition-*` de la prohibición de animar `width`/`height`,
>    para que `code-reviewer` no lo reporte y para que nadie la use como excusa para animar
>    `width` a mano.
> 3. **RUP-5** — la condición junto a la regla nº1. **Redáctala como espíritu, no como
>    letra**: «nada alcanzable únicamente deslizando». El «Ver todos» obligatorio del plan
>    **no se implementó a propósito** y el argumento está en
>    `src/app/miembros/(portal)/page.tsx:273-281` y `src/lib/comercios/estanterias.ts:11-15`:
>    las estanterías son de **duplicación**, todo lo que muestran está en la rejilla de la
>    misma página, y un «Ver todos» apuntaría a esta misma URL. Recoge esa distinción.
> 4. **RUP-6** — la placa del logo, en «Componentes», como **segunda** superficie que no
>    sigue el tema, con `QrCode` como precedente y su diferencia explícita: aquí es
>    **token** (`--placa-logo-bg`, `tokens.css:370`), no literal. Añade la cadena
>    **comercio → marca → inicial** y por qué el `alt` es la inicial y la placa va
>    `aria-hidden` (`comercio-logo.tsx:22-38`).
> 5. **Deuda conocida #4 — es FALSA desde el 02/09.** «El Portal de Miembros solo se ha
>    visto en su pantalla de acceso» ya no se sostiene: hay credenciales
>    (`Usuarios Pruebas PlayWright.txt`) y tres capturas
>    (`.playwright-mcp/recorrido-3-portales/miembro-0{1,2,3}-*.png`). Retírala.
> 6. **Deuda conocida #1 — sigue siendo cierta**, y conviene precisarlo: cero
>    `view-transition-name` en `src/`. Anótalo con la fecha para que no se dé por hecha.
> 7. **Una línea nueva en «Formularios: overlay, no página»**: cerrar un overlay
>    interceptado es **siempre** `useCerrarOverlay()` (= `router.back()`) o
>    `useCerrarCuando(state.ok)`, de `src/components/shell/overlay-ruta.tsx`. Nunca un
>    `<Link>` hacia adelante ni un `redirect()` de servidor: no vacían la ranura `@modal` y
>    el overlay queda montado y desacoplado de la URL. Es el commit `822ea7c`, 17 archivos.
>
> **No toques**: `Estado de membresía`, `Fechas`, la ranura única `@modal`, `QrCode` negro
> sobre blanco, `Accesibilidad`, ni las prohibiciones técnicas. El primer diff ya declaró
> que no cambian (`REVISION-CLAUDE-MD.md:157-169`).

- **DoD**: diff literal por secciones, aprobación explícita del propietario, `CLAUDE.md`
  actualizado en el repositorio. **FASE 3 no arranca antes.**

---

### T14-bis — Punto de control visual, con datos sembrados · no bloqueante duro

- **Agente**: `frontend-implementer` (solo capturas y siembra en la base de pruebas)
- **Depende de**: T17

**Invocar:**

> Captura el Portal de Miembros rediseñado: catálogo, ficha, carnet e inactiva, a **375px
> primero** y luego 1440px, en claro y en oscuro. **Antes de capturar hay que sembrar
> datos**, y esta es la razón: `SPEC:535-536` deja constancia de que la base de prueba
> tiene **4 comercios y 0 promociones vigentes**. Con eso ninguna estantería se renderiza
> (`estanterias.ts:22`, umbral de 8) y **todas** las tarjetas caen al estado «Sin beneficio
> vigente hoy». Capturar así sería fotografiar el estado vacío y llamarlo rediseño.
>
> Siembra, desde el panel y sin tocar código: **≥10 comercios**, al menos 4 con
> `created_at` reciente, **≥3 promociones vigentes repartidas en ≥2 comercios**, y para
> probar la placa: un comercio con **logo apaisado**, uno **cuadrado**, uno **sin logo
> propio pero con marca que sí lo tenga**, uno con **`logo_url` muerto**, y uno con **PNG
> transparente de logotipo oscuro**. Son los ocho DoD de T12, que hoy no tienen ni una
> prueba visual.
>
> **NO es una tarea de rediseño**: no cambies código de producto salvo que la captura
> destape un fallo, y en ese caso repórtalo, no lo arregles aquí.

- **DoD**: el juego de capturas, más la verificación de que **V1** («botón circular
  recortado», `REPORTE.md:137-144`) es la Vercel Toolbar del preview y no la aplicación.
  Si es de la aplicación, pasa a T22.

---

### FASE 3 — los seis auditores, **en paralelo**, solo lectura

- **Depende de**: T7-bis aplicada y T14-bis
- **Alcance de todos**: el diff de C0 → T17. Formato `REVIEW_SEVERITY.md`: severidad +
  `archivo:línea` + impacto + corrección concreta.

**T18 · `accessibility-auditor` — auditor principal. Un solo fallo AA es nivel 1 y bloquea.**

> Audita el Portal de Miembros implementado contra la tabla que **tú mismo firmaste** en
> `.claude/docs/T5-validacion-contraste.md` (`--gold-600` relleno + tinta = 5,40:1) y
> contra `T4-direccion-arte.md` §4.3 (contraste de la placa) y §7 (jerarquía).
> Foco, con lo ya verificado como línea base:
> - Que la tabla firmada **se implementó tal cual**: `--action-gold` se mapea a
>   `--gold-600` en claro y `--gold-500` en oscuro (`globals.css:81-82`, `:164`, `:231`).
>   Mide **sobre la captura**, no sobre el token.
> - **Los carriles (RUP-5)**: `CarrilPista` **no lleva `tabindex`** a propósito
>   (`carril.tsx:35-38`). Verifica que todo su contenido es alcanzable con teclado y con
>   lector **sin deslizar**, y que la ausencia de `tabindex` no deja nada inalcanzable.
> - **Los chips**: `chips-categoria.tsx:100` usa `aria-current="true"` (no `"page"`), y el
>   check de `:104` es el portador no-cromático. Verifica que ambos son correctos y que el
>   chip alcanza **44px** (N5 de la spec; `T4 §7.6`).
> - **La placa del logo**: contraste contra la superficie de la tarjeta en **los dos
>   temas** (`--placa-logo-bg: var(--w-0)`, constante), y que la tarjeta anuncia el nombre
>   **una sola vez** — la placa va `aria-hidden` y el `alt` es la inicial
>   (`comercio-logo.tsx:54,59`).
> - **Encabezados**: `EncabezadoCatalogo` pone el `h1` (`:25`), la rejilla un `h2`
>   (`page.tsx:365`), cada `Carril` el suyo (`carril.tsx:85`) y la tarjeta `h3`
>   (`comercio-card.tsx:109`). Comprueba que **no hay salto por ninguna rama**, incluida la
>   rama sin estanterías y la del estado vacío.
> - `:focus-visible` en tarjeta navegable, chips, carriles y salida del `error.tsx`.
> - Áreas ≥44px, con `::after` de `var(--tap-min)` donde el control deba verse pequeño y
>   `min-height` bajo `@media (pointer: coarse)` en filas anchas.
> - `error.tsx` y los tres `loading.tsx`: `role="status"`, `sr-only`, y que el esqueleto no
>   sea ruido para el lector.

**T19 · `code-reviewer`**

> ESLint **no tiene ni una regla propia** (`eslint.config.mjs`): las prohibiciones de
> `CLAUDE.md` solo las ves tú. **Audita contra la norma actualizada por T7-bis, no contra
> la anterior.** Busca: literales de color, espaciado, radio y duración; `@media` donde
> tocaba `@container` **dentro del contenedor `contenido`**; animación de propiedades de
> layout; `none` dentro de listas de sombras; `outline: none` sin sustituto;
> `backdrop-filter` en filas de lista; `style` para maquetar.
> Convenciones: exportación **con nombre** (`export default` solo donde el App Router lo
> obliga), `type` y nunca `interface`, kebab-case, dominio en español.
> Cuatro puntos concretos que ya tengo localizados y quiero tu dictamen sobre ellos:
> (a) `perfil.module.css:124` `border: 1px solid #000` en `@media print` — ¿excepción
> sancionable o token?; (b) `encabezado-catalogo.tsx:17` exporta `estilosEncabezado` **sin
> ningún consumidor**, y su comentario `:13-14` afirma que lo usa `loading.tsx`, que no lo
> usa; (c) `src/lib/miembros/volver-catalogo.ts` — si T15 ya cerró, debe tener consumidor;
> si no, es código muerto; (d) `page.tsx:386-390` documenta que las consultas ignoran el
> `error` de Supabase y que el `EmptyState` miente — confirma si eso es aplicable aquí o
> escala.

**T20 · `performance-engineer`**

> (a) **Peso real de los logos** en el catálogo lleno y su efecto en LCP: son `<img>`
> crudos a hosts de terceros (`comercio-logo.tsx:57-63`, con `loading="lazy"` y
> `decoding="async"`). Decide si D11 queda documentado o se escala.
> (b) Coste de la navegación catálogo → ficha.
> (c) Coste de las consultas nuevas: `categorias`, `created_at`, `marcas.logo_url`. Ojo a
> que la consulta de `comercios` para los chips **cambió de `select` en vez de añadirse**
> (`page.tsx:88-100`): confirma que el coste neto es cero.
> (d) Si el sobrefetching de `page.tsx:81-106` es recortable **dentro de `page.tsx`**:
> habilita o descarta **T24**.
> (e) Si conviene montar `RouteProgress` en el portal (arrastra `Suspense` y
> `useSearchParams`).
> **No propongas tocar Server Actions ni `src/lib/supabase/`**: eso es
> `PROPUESTAS PARA BACKEND`.

**T21 · `security-auditor`**

> Seis frentes. Los cuatro del plan y **dos nuevos que el merge introdujo**:
> 1. La ruta nueva `/miembros/comercios/[id]`: `requireMiembroVigente()`, `createClient()`
>    y **no** `admin.ts`, `deleted_at` y `activo` filtrados, y que el `[id]` no permita
>    enumerar comercios inactivos.
> 2. Entrada no confiable de la URL: `categoria_id` (saneado en `page.tsx:38-42`),
>    `q` (escapado en `:33-35`), y **`volver`** (lista blanca en
>    `src/lib/miembros/volver-catalogo.ts`). Verifica que la lista blanca cubre
>    `//otro-sitio.com`, `/miembros@otro-sitio.com` y `\/\/`.
> 3. `logo_url`: el navegador del socio pide a hosts de terceros en cada render —IP y
>    User-Agent en registros ajenos—, nadie valida el esquema (`http://` ⇒ contenido mixto
>    ⇒ imagen rota), y **`next.config.ts` no debe haber ganado `remotePatterns` abiertos**.
> 4. Observación, no tarea: `miembros.codigo_publico` es un uuid que **no usa nadie**
>    mientras el QR lleva `numero_membresia` de 8 dígitos (`perfil/page.tsx:100`).
>    ¿Riesgo de enumeración? Cambiarlo cruza la frontera (`buscar_miembro_comercio`).
> 5. 🆕 **`Usuarios Pruebas PlayWright.txt` está en la raíz del repositorio, versionado**,
>    con credenciales de acceso en claro de los tres portales. Llegó con el merge
>    `14fb663`. Dictamina severidad y remedio (`.gitignore` + rotación, o gestor de
>    secretos), y si hay que reescribir historial.
> 6. 🆕 `.claude/settings.local.json` conserva `PowerShell(git *)` preaprobado, que abarca
>    `git push --force` y `git reset --hard` (`SCOPE.md` §3b lo deja anotado como
>    pendiente). Ningún auditor tiene shell, pero `frontend-implementer` sí.

**T22 · `mobile-ux-specialist`**

> Auditaste la spec en T3 (tus hallazgos N4, N5, N6, N7, N9 están en `SPEC:20-28`). Ahora
> audita **el resultado**, contra la línea base medida: el catálogo **anterior** a 375px
> tenía **cero desbordamientos y cero áreas bajo 44px**. No puede empeorar.
> Rango 280-430px. Comprueba en particular:
> - **N4 cerrado**: `portal.module.css:261` usa `min-height`, no `height`.
> - **N5**: el chip a 44px reales (`chips-categoria.module.css`).
> - **N6**: el sangrado del carril no invade la zona del gesto de atrás del sistema
>   (`portal.module.css:206-218`, `carril.module.css`).
> - Que **desplazar la fila de chips no bloquee el desplazamiento vertical** de la página.
>   Es el fallo clásico del carrusel y solo se ve en dispositivo real.
> - **V1** de `REPORTE.md`: si T14-bis concluyó que el botón circular recortado es de la
>   aplicación y no de la Vercel Toolbar, es tuyo.

**T23 · `apple-hig-specialist`**

> Auditaste la spec en T3 (N1, N2, N3, N8). Audita el resultado:
> - **N2 cerrado**: `input.module.css:21` usa `--t-control-size`, que sube a 16px bajo
>   puntero grueso. Verifica que Safari iOS **ya no hace zoom** al enfocar con `autoFocus`.
> - **N3 cerrado**: `portal.module.css:48` reserva `env(safe-area-inset-top)`. Verifica en
>   PWA instalada con `black-translucent`.
> - **N1 sigue abierto**: `src/app/manifest.ts:16` → `start_url: '/admin'`. Un socio que
>   instale la PWA arranca en el acceso administrativo **en cada arranque**. Está escalado
>   como puerta P3; documenta el impacto exacto para esa decisión.
> - **N8**: el navegador **no** suprime `::view-transition-*` bajo
>   `prefers-reduced-motion`, y Safari ≤17 no ejecuta la transición. Hoy **no hay ninguna
>   implementada** (cero `view-transition-name` en `src/`), así que dictamina si debe
>   entrar en T26 o retirarse.
> - `100dvh` (`portal.module.css:4`) con las barras dinámicas de Safari;
>   `-webkit-line-clamp`; Dynamic Type; VoiceOver en carnet, ficha y carriles; si la ficha
>   se comporta como vista empujada de iOS; y si el `backdrop-filter` del cromo se sostiene
>   en gama media.

**Bucle de corrección** — `frontend-implementer`, tras T18-T23:

> Ordena por severidad global (`REVIEW_SEVERITY.md`) y aplica en ese orden. Si discrepas de
> un hallazgo, **argumenta por escrito**; no lo omitas en silencio. Tras aplicar niveles 1
> y 2, se re-audita **solo el dominio afectado**, no todo.
> **DoD**: cero hallazgos de nivel 1 abiertos. **Cero fallos AA, sin excepción.**

---

### T24 — Sobrefetching · **CONDICIONAL a que T20 cuantifique ganancia**

**Prohibiciones**: no abrir `actions.ts` ni `src/lib/supabase/**`; no convertir
`Promise.all` en `await` secuenciales; no introducir `.range()`.
**DoD**: consultas y filas antes y después, medidas. Los chips y el `<details>` de filtros
conservan **exactamente** las mismas opciones: se comparan las listas.

---

### T25 — `qa-tester`

- **Depende de**: FASE 3 cerrada · **Zona de escritura**: `src/lib/**/*.test.ts`, **solo
  funciones puras**

**Invocar:**

> Dos entregas.
>
> **1. Tests automatizados.** El rediseño creó **cuatro módulos puros y ninguno tiene
> test**. Por orden de riesgo:
> - `src/lib/miembros/volver-catalogo.ts` → `resolverVolverAlCatalogo`. **El más urgente**:
>   es la guarda contra una **redirección abierta** en una pantalla autenticada. Cubre
>   `/miembros`, `/miembros?…`, `//otro-sitio.com`, `/miembros@otro-sitio.com`,
>   `/miembros/perfil`, `string[]`, `undefined` y cadena vacía. Los casos están enumerados
>   en su propio JSDoc (`:17-26`).
> - `src/lib/comercios/estanterias.ts` → `seleccionarNovedades` (umbrales 8/4/90 días,
>   `createdAt` null e ilegible, orden descendente, tope 10) y
>   `seleccionarBeneficiosDelMomento` (umbrales 3/2). Recibe `ahora` por parámetro
>   **a propósito**: es determinista.
> - `src/lib/miembros/navegacion-portal.ts` → `esDestinoActivo`. Las tres formas de ruta que
>   su JSDoc enumera (`:8-16`), incluida `/miembros/comercios/[id]` y `/miembros/inactiva`.
> - `src/lib/comercios/logo-comercio.ts` → `resolverLogoComercio`. Tres ramas más cadena
>   vacía y cadena de espacios, que es el caso que motivó el `trim()` (`:9-13`).
> - Si sobra capacidad: `limpiarTermino` (`buscar-miembros.ts:31`), que **sanea la entrada
>   de un filtro `.or()` de PostgREST** y sigue sin test.
>
> **2. Protocolo de verificación manual**, en `.claude/docs/`. Guion para una persona con
> un teléfono. Usa `Usuarios Pruebas PlayWright.txt`: activos `00031324`/`00044150`,
> **vencido `00029417`**. Debe cubrir: acceso con credenciales buenas y malas **en las seis
> pantallas**; catálogo con una promoción vencida en la base, **que no debe aparecer**, ni
> en la rejilla ni buscando su título; catálogo con y sin filtros, por categoría, y **con
> JavaScript desactivado**; los cinco casos de logo de T14-bis; catálogo → ficha → atrás
> **conservando scroll y filtros**; `?volver=` manipulado; carnet en claro y oscuro con el
> **QR escaneado por un lector real**; `/miembros/inactiva` con `00029417`; red lenta;
> `prefers-reduced-motion`; teclado completo sin ratón, incluidos los carriles; y **Enter
> con el foco en el menú de tema, que NO debe cerrar la sesión** (`layout.tsx:71-76`).
>
> **Restricción**: `vitest` solo descubre `src/**/*.test.ts`. Un `.test.tsx` se escribe, se
> guarda y **nunca se ejecuta ni falla**. No escribas ninguno.

- **DoD**: cuatro comandos en verde. Protocolo en `.claude/docs/`. Cada bug con pasos de
  reproducción y severidad.

---

### T26 — `motion-ux-polish` (absorbe el T6 nunca entregado)

**Invocar:**

> Doble sombrero, porque **T6 nunca se entregó y el marcado ya está escrito**. Primero
> resuelve lo estructural que quedó sin decidir, luego pule.
>
> **Estructural (lo que era T6):**
> - `<ViewTransition>` tarjeta → ficha. **Hay cero `view-transition-name` en todo `src/`.**
>   Decide: qué elementos lo reciben, con qué nombre, y cómo se garantiza que sea **único
>   por documento** cuando la misma tarjeta aparece **dos veces en la misma página** —una en
>   la rejilla y otra en una estantería (`page.tsx:330`/`:338` frente a `:369`). Ese
>   duplicado es real y rompe la unicidad: resuélvelo o retira la transición.
>   Decide también qué ocurre cuando el logo es el respaldo tipográfico o el de la marca.
>   `T4 §1.3` y la deuda #1 de `CLAUDE.md`. `apple-hig` (T23) ya avisó de N8: el navegador
>   **no** suprime `::view-transition-*` bajo `prefers-reduced-motion` y Safari ≤17 no la
>   ejecuta.
> - Confirma o revoca la decisión ya tomada en el código: **scroll nativo con
>   `scroll-snap`**, no gesto propio (`carril.tsx:4-15`). Si propones gesto propio,
>   demuestra qué aporta que el sistema operativo no dé ya, y usa `proyectarMomento` y
>   `amortiguarBorde`, no una reimplementación.
>
> **Pulido**: entrada del esqueleto y relevo al contenido; feedback de pestañas y chips;
> ajuste fino del `scroll-snap`; entrada del carnet y del acceso.
>
> **Reglas duras**: presets de `src/lib/shared/motion.ts`; curvas y duraciones de
> `tokens.css`; `bounce: 0` por defecto — **el rebote se gana**, solo tras un gesto con
> momento; feedback en `pointerdown`, no en `click`; entrada y salida por el **mismo**
> camino; solo `transform` y `opacity` en lo escrito a mano; `prefers-reduced-motion`
> recibe un equivalente **no vestibular**, no la ausencia de feedback.
> **Dos recordatorios que ya costaron una sesión cada uno**: en motion 12 la forma correcta
> para animar un número es la de **valor único**, `animate(desde, hasta, opciones)`; la otra
> no lanza, simplemente no anima. Y `getComputedStyle` durante una transición da falsos
> negativos: en una pestaña que el navegador no pinta las transiciones no avanzan.
> **Verifica cada cambio con captura.**

---

### T27 — `design-system-architect`, modo **AUDITAR**

**Invocar:**

> Verifica que lo implementado coincide con los tokens y variantes que tú definiste en
> `.claude/docs/T4-direccion-arte.md`. Cinco puntos, todos con `archivo:línea`:
> 1. Los **ocho tokens nuevos** existen y se consumen donde debían: `--placa-logo-*`
>    (`tokens.css:370-386`), `--action-gold` / `--action-gold-fg` (`globals.css:81-82`,
>    `:164`, `:231`), `--carril-tarjeta-w` (`tokens.css:342`).
> 2. **P1 — no-regresión**: el panel y el Portal de Comercios se ven **exactamente igual**
>    que antes, salvo las pantallas de acceso, que cambian a propósito por P3. Dato de
>    partida verificado: `ComercioLogo` perdió la prop `size` y **ya no tiene consumidores
>    fuera de `/miembros`**; `Button` ganó la variante `brand` **sin tocar `primary`**.
>    Confirma que no se ha filtrado nada más.
> 3. **Presupuesto de oro medido sobre la captura**, con la regla de tres comprobaciones de
>    tu propio `§3.2` — no con el «≤5 %» viejo — y las excepciones del carnet y del acceso.
> 4. Cero literales fuera de la excepción de `QrCode`. Dictamina el caso de
>    `perfil.module.css:124`.
> 5. La tabla del criterio estético del plan, **fila por fila**, con la captura como prueba.
>    Presta atención especial a «Profesional»: «los logos ajenos se presentan con una placa
>    común: mismo tamaño, mismo relleno, mismo fondo, **logo entero**».

---

### T28 — `docs-handoff`

**Invocar:**

> Documenta en `.claude/docs/` y corrige lo que quedó desactualizado. **`docs/**` es solo
> lectura: se cita, no se reescribe.**
> 1. Documenta, por orden de «lo que se olvidará primero»: **la placa del logo y la cadena
>    comercio → marca → inicial**; el patrón de la ficha y su guarda `?volver=`; la
>    primitiva de carril y por qué es scroll nativo; el filtro por categoría como enlace;
>    la guarda de `Grid`; y el patrón `loading.tsx`/`error.tsx` fuera de `/admin`.
> 2. **Corrige `ARCHITECTURE.md`**, que hoy tiene al menos cinco afirmaciones falsas:
>    (a) **D15** — dice que `promocion-vigente.ts` lo consumen «Portal de Comercios y de
>    Miembros»; era falso cuando se escribió y contribuyó a que D14 pasara desapercibido.
>    **Ahora sí es cierto** (`(portal)/page.tsx:153,243`): reescríbelo con las líneas.
>    (b) La firma de `ComercioLogo` ya no lleva `size?: number`.
>    (c) «6 `loading.tsx`, todos bajo `/admin`» y «un solo `error.tsx`»: ya hay tres
>    `loading.tsx` y un `error.tsx` en `/miembros`.
>    (d) El inventario de `src/lib/` en zona de trabajo no incluye `logo-comercio.ts`,
>    `estanterias.ts`, `navegacion-portal.ts` ni `volver-catalogo.ts`.
>    (e) `comercios.created_at` y `marcas.logo_url` existen **y ahora se usan**.
> 3. Marca `.claude/docs/PLAN-portal-miembros.md` como `SUSTITUIDO por
>    PLAN-rediseno-miembros.md · 29/08/2026`. **No lo borres**: contiene la verificación de
>    por qué las cinco animaciones de layout no llegan a este portal.
> 4. Marca en `PLAN-rediseno-miembros.md` una cabecera que apunte a
>    `PLAN-CONTINUACION-miembros.md` como su continuación, y corrige su deriva de
>    numeración (§4 dice «T29», que no existe).
> 5. Segunda pasada sobre `CLAUDE.md` si la implementación se apartó de la norma de
>    T7-bis. Mismo proceso: **tú redactas, el propietario aplica.**

---

## 6. Puertas bloqueantes — decisiones del propietario

Solo tres. No convierto el plan en un cuestionario.

### P1 · «Premium»: la norma dice una cosa y el reporte le atribuye a usted la contraria

**No la resuelvo yo, y quiero ser explícito sobre por qué.**

- `CLAUDE.md` §«Lo que ORUM es» dice hoy: *«Que el carnet muestre `plan.nombre`
  (`src/app/miembros/(portal)/perfil/page.tsx:72`) es correcto, no un defecto»*. Esa frase
  la escribió `T7` el 30/08 **después de verificar el esquema real**: `planes_membresia`
  tiene `precio numeric` y `duracion_meses integer`, hay un `/admin/planes` con cuatro
  acciones, y `membresias.plan_id` apunta a un plan.
- `REPORTE.md:120-133` (02/09) cita la versión **anterior** de `CLAUDE.md` —«No hay
  niveles ni planes premium»— y concluye: *«Decisión de producto: eliminar el concepto, o
  actualizar `CLAUDE.md`»*. `CLAUDE.md` ya se actualizó; el reporte no lo sabía.

> **Pregunta, en una línea: ¿el socio debe ver el nombre de su plan en el carnet, sí o no?**

- **Si es SÍ**: no hay nada que hacer. La norma ya lo dice, `perfil/page.tsx:72` ya lo hace
  y T16 solo tiene que soportar nombres largos a dos líneas. **P1 se cierra sin código.**
- **Si es NO**: es un cambio pequeño en el carnet (`perfil/page.tsx:72`) **pero también en
  la verificación del comercio**, que hoy lo muestra a la caja (`REPORTE.md:122-124`), y
  eso último **cruza la frontera de `SCOPE.md`** — va a PROPUESTAS PARA BACKEND, no a T16.

**Bloquea**: T16. **No bloquea**: T15, T17, C0.

### P2 · T10: aprobación de la dirección de arte del acceso

Las seis pantallas de acceso están **implementadas y sin commitear**, y **nadie las ha
visto**. Las tres capturas de Playwright son del deployment anterior (§3.1). El plan sitúa
aquí una puerta dura por una razón económica: «atractivo, elegante, lujoso, innovador» es
subjetivo y **ningún DoD lo captura**; descubrir que la interpretación del equipo no es la
suya cuesta infinitamente menos con **una pantalla de dos campos** que con seis.

> **Pregunta: tras C0, ¿aprueba el acceso rediseñado —teléfono y escritorio— o pide
> correcciones concretas?**

**Bloquea**: cualquier dirección de arte nueva (T15, T16, T17 la heredan). **No bloquea**:
C0. Si es «no», se vuelve a T2 y **no se sigue construyendo**.

### P3 · `manifest.ts:16` — la PWA del socio arranca en el acceso administrativo

`src/app/manifest.ts:16` declara `start_url: '/admin'` con `display: 'standalone'`. Un
socio que instale la aplicación **arranca en el acceso administrativo en cada arranque**, y
en `standalone` **no hay barra de direcciones para corregirlo**. Lo detectó
`apple-hig-specialist` (`SPEC:20`, N1). Y tiene un hermano: `app/page.tsx:8` hace
`redirect('/admin')` sin mirar el rol, así que quien escriba el dominio a secas aterriza en
el acceso administrativo con `?error=sin_permiso`.

Es **una línea de código en zona de trabajo**, pero **cambia el arranque de los tres
portales** y los `shortcuts` del manifest apuntan a acciones del panel (`:52-65`). No es
decisión de diseño.

> **Pregunta: ¿la aplicación instalable es la del socio, la del empleado, o hace falta una
> pantalla de elección?**

**No bloquea nada de esta ruta crítica.** Se decide antes de FASE 3 para que T23 audite lo
correcto.

---

## 7. Riesgos nuevos, que el plan original no podía prever

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| **R-N1** | **El catálogo entero enlaza a un 404** (`comercio-card.tsx:89`, `:200`) y un comentario del código afirma lo contrario (`:42-46`). Un agente que lea ese comentario dará T15 por hecho | **Certeza (es un hecho)** | **Muy alto** | T15 es la primera tarea de código tras C0, y su DoD #9 exige corregir el comentario |
| **R-N2** | **61 archivos sin commitear, sin ninguna verificación registrada.** Si `build` falla, todo lo construido encima hereda el fallo y el diff se vuelve inatribuible | Media | **Muy alto** | C0 es la primera tarea y no se salta |
| **R-N3** | **Credenciales versionadas en la raíz** (`Usuarios Pruebas PlayWright.txt`), llegadas con `14fb663` | Certeza | Alto | Hallazgo propio de T21 (frente 5). No es tarea de este plan: es decisión de seguridad |
| **R-N4** | **T7 quedó a medias por diseño** y su segundo diff nunca se escribió. `T19` auditará contra una norma que no describe el sistema | **Alta** | **Muy alto** | `T7-bis` es puerta dura antes de FASE 3 |
| **R-N5** | **`ARCHITECTURE.md` está desactualizado en al menos cinco puntos** y todos los agentes lo leen como base de hechos | Alta | Medio | T28 punto 2, con las cinco correcciones enumeradas |
| **R-N6** | **La base de prueba no puede enseñar el rediseño**: 4 comercios, 0 promociones vigentes (`SPEC:535-536`). Ninguna estantería se renderiza y todas las tarjetas caen al estado «Sin beneficio vigente hoy» | Certeza | Alto | T14-bis siembra datos **antes** de pedir juicio estético. Y R5 del plan original queda confirmado, no mitigado |
| **R-N7** | **`perfil/loading.tsx` ya dibuja un carnet que no existe**, y con un QR de 232px donde la spec pide 160+2×32 (N9). El esqueleto miente y produce el salto que existe para evitar | Certeza | Medio | DoD #9 de T16: página, esqueleto y spec deben coincidir |
| **R-N8** | **T6 nunca se entregó y el marcado ya está escrito.** La misma tarjeta aparece dos veces en la misma página (estantería + rejilla): un `view-transition-name` duplicado **no es único por documento** | Alta | Medio | T26 lo resuelve o **retira** la transición (R11 del plan original) |
| **R-N9** | **Dos archivos del panel modificados sin commitear** (`admin/page.tsx`, `admin/miembros/[id]/page.tsx`) en una rama cuya P1 dice que el panel no se rediseña | Media | Alto | C0 paso 2: se justifican o se descartan con `git checkout --` |

---

## 8. Fuera de alcance

Se hereda **íntegro** el «Fuera de alcance» del plan original (sus 17 puntos), y se añaden:

18. **F2** — «Mi contraseña» listada dos veces en `/admin` (`admin/page.tsx:152-157`).
    Es del panel; P1 dice que el panel no se rediseña. **Plan propio, después de Miembros.**
19. **V3** — warning de preload de fuente (`REPORTE.md:158-164`). Benigno, cero errores de
    consola. Se documenta, no se persigue.
20. **Limpieza de los datos de prueba** creados en el deployment (`REPORTE.md:216-226`),
    incluida la sucursal «Sede Fix QA» duplicada. Es operación, no código.
21. **Configurar `MAILERSEND_API_KEY` / `MAILERSEND_FROM_EMAIL` en Vercel**
    (`REPORTE.md:183-185`). Bloquea el onboarding real de usuarios; es entorno, no código.

---

## PROPUESTAS PARA BACKEND

Cruzan la frontera de `SCOPE.md` §2. **No son tareas de este plan.** Se heredan **B1 a B6**
del plan original sin cambios. Lo que este documento **añade o modifica**:

### B1 — Paginación con total · **sube a prioridad alta, con dato nuevo**
El catálogo corta con `.limit(100)` en cinco sitios (`(portal)/page.tsx:100,102,103,104,105`
y `:138,149,182,215,222`). Con el filtro por categoría ya implementado, el escenario del
plan es real: si una categoría tiene 120 comercios, el socio ve 100 y cree que son todos.
**Entretanto**, avisar cuando las filas recibidas igualen exactamente al límite — cambia el
copy y **necesita decisión de producto**.

### B4 — Imágenes · **Q1 sigue sin respuesta**
`.claude/docs/PROPUESTA-BACKEND-imagenes.md` lleva lista desde el 29/08 y **nadie ha
decidido si se lleva al equipo backend**. Dato nuevo que la refuerza: **T12 dejó escrito en
el propio código que su respaldo ante logo roto no está verificado**
(`comercio-logo.tsx:40-43`). Mientras los logos vivan en hosts de terceros, ese riesgo no
se cierra del todo por mucho CSS que se le eche.

### B7 🆕 — Mostrar o no el nombre del plan en la verificación del comercio
**Solo aplica si la respuesta a P1 es «no».** El carnet (`perfil/page.tsx:72`) es zona de
trabajo y se cambia en T16. La pantalla de verificación del comercio, que también lo
muestra (`REPORTE.md:122-124`), sale de `src/app/comercios/(portal)/actions.ts`, que es
**zona de solo lectura**. Cambiarla es propuesta, no parche. Y hay que decidirlo **a la
vez** en los dos sitios: que el carnet lo oculte y la caja lo enseñe es peor que enseñarlo
en ambos.

### B8 🆕 — `error` de Supabase descartado en las lecturas del portal del socio
`(portal)/page.tsx:386-390` lo documenta en su propio comentario: las consultas
desestructuran solo `data`, así que **un fallo de lectura no lanza —devuelve cero filas— y
el socio ve «Aún no hay comercios» cuando su club sí existe**. El `EmptyState` miente. Es
el patrón universal del repositorio (`ARCHITECTURE.md:530`) y no se puede arreglar desde
una página sin cambiar el contrato de las lecturas. **Es el fallo que más directamente
contradice el adjetivo «confiable» del encargo.**
