# Plan: mejora del Portal de Miembros
> tech-lead · 28/08/2026 · rama `mejora-diseno` · commit base `e4d33e9`
>
> Fase 1 del pipeline de `WORKFLOW.md`. Entrada: petición T3 de `task-triage`.
> Base de hechos: `CLAUDE.md`, `.claude/docs/ARCHITECTURE.md`, `.claude/docs/API-CONTRACT.md`,
> `.claude/docs/SCOPE.md`. `graphify-out/` no se ha leído (zona prohibida, §3).

---

## Objetivo

Que navegar dentro del Portal de Miembros deje de sentirse como un salto —que haya
respuesta inmediata al toque y una fase intermedia visible— y que el catálogo de
comercios no se desborde ni se desalinee en pantallas estrechas.

**No es un rediseño.** Es cerrar los huecos que hacen que un portal correcto se sienta
barato.

---

## Contexto técnico

Lo que condiciona el enfoque, todo verificado sobre el código, no inferido.

### El Portal de Miembros tiene tres rutas y **ninguna navegación lista → ficha**

```
src/app/miembros/(portal)/layout.tsx          cabecera + <main> + barra inferior
src/app/miembros/(portal)/page.tsx            "Inicio": catálogo de comercios (rejilla de tarjetas)
src/app/miembros/(portal)/perfil/page.tsx     "Mi perfil": carnet + QR
src/app/miembros/(portal)/inactiva/page.tsx   muro de membresía no vigente
```

`ComercioCard` (`_components/comercio-card.tsx`) **no es un enlace**: no recibe `href`, no
envuelve un `<Link>`, y no existe ninguna ruta `miembros/(portal)/[id]`. Es decir: **en
este portal no se puede abrir la ficha de un comercio**, porque esa pantalla no existe.

`PortalNav`/`PortalTabBar` (`_components/portal-nav.tsx:8-11`) declaran exactamente dos
destinos: `/miembros` ("Inicio") y `/miembros/perfil` ("Mi perfil").

**Interpretación de trabajo**: cuando el usuario dice "lista y ficha" se refiere casi con
seguridad a estas dos pestañas — la lista de comercios y su ficha personal, el carnet. Es
la única transición que existe. **Se confirma en T4 antes de implementar nada** (ver
riesgo R1): si en realidad hablaba de `/admin/miembros → /admin/miembros/[id]`, que sí es
una lista→ficha real, el plan cambia de portal entero y hay que rehacerlo.

### Por qué esa navegación se siente brusca: no hay fase intermedia que animar

Tres ausencias que se acumulan, las tres en zona de trabajo:

| Ausencia | Evidencia | Consecuencia al tocar una pestaña |
|---|---|---|
| No hay `loading.tsx` en `miembros/(portal)/` | 6 `loading.tsx` en el repositorio, **los 6 bajo `/admin`** (ARCHITECTURE, "Estados de carga") | La pantalla anterior se queda quieta hasta que el servidor responde |
| No hay `RouteProgress` | Se monta en `src/app/admin/layout.tsx:44` y **en ningún otro sitio**. `AppShell` no llega a los portales | Ni siquiera hay una barra fina que diga "voy" |
| No hay `error.tsx` | El único del repositorio es `src/app/admin/error.tsx` | Una excepción cae en la pantalla por defecto de Next |

La secuencia real hoy es: toque → **nada** durante el ida y vuelta al servidor → la pantalla
se reemplaza de golpe. Eso es exactamente lo que se describe como "brusco". No es un
problema de curva de animación: es que **no hay nada entre los dos fotogramas**.

Y `/miembros` es la ruta más cara del portal: `page.tsx` dispara hasta **10 consultas** a
Supabase (`:47-59`, `:64`, `:75-86`, `:91`, `:136-154`), de las que cuatro son diccionarios
completos que se traen aunque el filtro esté vacío (`API-CONTRACT.md` §5). Volver a
"Inicio" desde el carnet paga esa cuenta entera, en silencio.

### El "desalineado en móvil": hay un candidato con aritmética, no una corazonada

```css
/* src/components/ui/layout.module.css:25 */
grid-template-columns: repeat(auto-fit, minmax(var(--min, 240px), 1fr));
```

`minmax()` sin guarda de `min()`: la pista **nunca baja** de `--min`, aunque el contenedor
sea más estrecho. En `/miembros`:

- `src/app/miembros/(portal)/page.tsx:224` → `<Grid min="290px">`, el `min` más alto de todo
  el producto (los demás van de 190px a 280px).
- `portal.module.css:170` → `.main` con `padding: … var(--space-4) …`, y
  `tokens.css:112` → `--space-4: 1rem` = 16px por lado.

Ancho útil = viewport − 32px. La rejilla **cabe solo desde 322px de viewport**. Por debajo
desborda: iPhone SE a 320px se pasa 2px, un Galaxy Fold plegado a 280px se pasa 42px. Un
desbordamiento horizontal de pocos píxeles no se lee como "hay scroll": se lee como que
**la tarjeta no está alineada con la cabecera y con el resto de la página**. Encaja con la
descripción del usuario.

Es una **hipótesis fuerte, no un hecho confirmado**: nadie ha visto esta pantalla renderizada
(ver R1). Puede haber además otra causa distinta, y por eso el plan empieza por diagnóstico.

Lo que **no** es la causa: los cuatro módulos que usan `@media` donde tocaba `@container`
(ARCHITECTURE, fila A de "Adaptación") están **todos en `/admin`**. El Portal de Miembros ya
cumple la regla: `perfil.module.css:37,85` y `filtros-form.module.css:9,20` usan
`@container contenido`, y el contenedor existe de verdad en `portal.module.css:174-175`.
En este portal esa deuda no aplica.

### Las cinco animaciones de layout **no tocan el Portal de Miembros**

Este es el hallazgo que más cambia la prioridad respecto a lo que sugería la entrada.
Verificado consumidor por consumidor:

| Transición prohibida | Vive en | ¿Llega al Portal de Miembros? |
|---|---|---|
| `app-shell.module.css:56` (`width` de la barra lateral) | `AppShell` | **No.** `AppShell` solo se monta en `app/admin/layout.tsx` |
| `app-shell.module.css:390` (`padding-left`) | `AppShell` | **No**, mismo motivo |
| `route-progress.module.css:27` (`width`) | `RouteProgress` | **No.** Único uso: `app/admin/layout.tsx:44` |
| `feedback.module.css:65` (`ProgressBar`) | `ProgressBar` | **No.** Único consumidor en todo `src/`: `app/dev/ui/gallery.tsx:582-583`, que hace `notFound()` en producción |
| `toggle.module.css:87` (pulgar del `Switch`) | `Switch` | **No.** Único consumidor: `gallery.tsx:354,355,720,721` |

Conclusión: **arreglarlas no puede mejorar lo que el usuario está viendo.** Dos son del
panel administrativo y tres no aparecen en ninguna pantalla de producto. Son deuda real y
hay que pagarla, pero es **deuda transversal preexistente, no la petición**, y meterla en
la ruta crítica de esta iteración solo compra riesgo: `app-shell.module.css` es el chrome de
las 40 pantallas del panel, y hoy no hay forma de verificar visualmente una regresión ahí.

Va a su propia sección, al final, fuera de alcance de esta iteración.

---

## Discrepancias con la propuesta de `task-triage`

Triage acierta en el nivel (T3) y en el núcleo del reparto. Cambio cinco cosas.

| Cambio | Razón |
|---|---|
| **`motion-ux-polish` entra, y entra dos veces** | Triage lo omitió. La queja literal del usuario es sobre movimiento: omitir al dueño del dominio de movimiento en una petición sobre movimiento no se sostiene. Pero tampoco vale meterlo solo en Fase 5: **en esta petición el movimiento es el requerimiento, no el barniz**. Solución: entra en Fase A con **sombrero de diagnóstico** (solo lectura, emite dictamen, no pule nada — no se tira trabajo porque no hay trabajo que tirar) y vuelve en Fase F con sombrero de pulido, cuando ya haya algo que pulir |
| **`ux-designer` se reincorpora, acotado** | Triage lo descartó. El plan crea **estados de UI que hoy no existen** en este portal: carga, error y sus textos. Copy y estados son dominio único de `ux-designer` (`WORKFLOW.md`), y `mobile-ux-specialist` **audita specs, no las produce**. Alcance recortado: los tres estados del portal y su copy. No un rediseño |
| **`performance-engineer` se adelanta a Fase A** | Triage lo puso después de la implementación. Aquí su hallazgo **es una causa candidata del síntoma**: 10 consultas por render de `/miembros` alargan justamente el hueco silencioso que se percibe como brusquedad. Como auditor posterior llega tarde para informar el diseño. Es solo lectura: adelantarlo no rompe ninguna regla |
| **`apple-hig-specialist` se añade a la auditoría** | Triage no lo listó. El portal es la superficie PWA del producto: barra inferior con `env(safe-area-inset-bottom)` (`portal.module.css:206`), `100dvh` (`:4`) y un carnet con QR que se enseña desde un iPhone en la caja del comercio. Es solo lectura y corre en paralelo: coste marginal |
| **`qa-tester` se mantiene, pero con alcance declarado y honesto** | Su zona es `src/lib/**/*.test.ts`, **solo funciones puras**, y `vitest` solo descubre `.test.ts`: un test de componente ni se ejecutaría. Este plan es casi todo CSS y estructura de rutas. Habrá test solo si T8 extrae una función pura. Su papel real aquí es la **verificación manual guiada** de T13. Decirlo evita fingir una cobertura que no existe |

Coincido con triage en descartar `state-data-architect` (no hay store, ni caché, ni
librería de datos que mapear) y `security-auditor` (ninguna tarea toca datos,
autenticación ni permisos; ninguna toca los doce archivos `'use server'`).

---

## Decisiones de diseño técnico

| Decisión | Alternativas descartadas | Razón |
|---|---|---|
| Atacar la brusquedad con **estado de carga + progreso de ruta**, no con transiciones de vista | Aplicar `<ViewTransition>` ya (deuda #1 de `CLAUDE.md`) | Tres motivos. (1) **No hay sujeto**: una transición de elemento compartido necesita un elemento que persista entre las dos pantallas; el catálogo de comercios y el carnet no comparten ninguno. (2) **No hay fase que animar**: hoy la secuencia es toque → nada → salto; animar el salto lo disimula, no lo arregla. (3) **No se puede verificar**: `experimental.viewTransition` en Next 16 sobre un árbol que nadie ha visto renderizado, sin navegador redimensionable, es riesgo sin control. Queda como candidato de Fase F, condicionado al dictamen T3 |
| Arreglar el desbordamiento **en `Grid`**, no en la página | Bajar `min="290px"` a `min="260px"` solo en `/miembros` | El fallo es del componente: `minmax()` sin guarda desborda para **cualquier** `min` mayor que el contenedor, y hay 9 consumidores. Bajar el número en una página deja la trampa armada para las otras ocho y cambia el diseño de la rejilla en pantallas donde funciona bien. La guarda `min(var(--min), 100%)` es **no-op cuando el contenedor es más ancho que `--min`**: no altera ninguna pantalla que hoy esté bien |
| Empezar por **diagnóstico**, no por implementación | Ir directo a `frontend-implementer` con la lista de sospechas | La petición dice "no sé exactamente qué" y **nadie ha visto este portal renderizado**. Implementar contra una hipótesis no confirmada, sin poder mirar el resultado, es escribir código a ciegas dos veces |
| **Excluir de esta iteración** las cinco animaciones de layout | Meterlas como T0 "ya que estamos" | Ninguna llega al Portal de Miembros (tabla arriba). Dos son el chrome del panel completo y no hay forma de verificar una regresión ahí hoy. Mezclarlas contamina el diff de esta petición y difumina qué cambio arregló qué |
| Reutilizar `SkeletonPageHeader`/`SkeletonBuscador` para el `loading.tsx` | Esqueleto nuevo a medida | Ya existen en `src/components/ui/skeletons.tsx`, son Server Components y es literalmente el patrón de los 6 `loading.tsx` del panel. `CLAUDE.md`: "usa los que hay" |
| **Ningún formulario nuevo** en este plan | — | Corolario: no hay que crear gemelas bajo `@modal`. La ranura vive solo en `app/admin/layout.tsx` y este portal no la tiene; si alguna tarea derivara en un formulario, **eso solo cambia el plan**, no se improvisa |

---

## Tareas

Nomenclatura de fases: A diagnóstico · B especificación · C implementación · D auditoría ·
E verificación · F pulido · G cierre.

---

### FASE A — Diagnóstico. Nadie escribe código.

#### T1 — Auditoría móvil del Portal de Miembros, sin navegador
- **Agente**: `mobile-ux-specialist`
- **Depende de**: —
- **Archivos** (lectura): `src/app/miembros/(portal)/**` completo ·
  `src/components/ui/layout.module.css` · `src/components/ui/card.module.css` ·
  `src/styles/tokens.css` · `src/components/use-media-query.ts`
- **Descripción**: encontrar todo lo que se desalinea, desborda o queda por debajo del
  mínimo táctil entre **280px y 430px** de viewport. Como no hay navegador redimensionable,
  el método es **aritmético y declarado**: ancho útil = viewport − 2×`--space-4`, y contra ese
  número se comprueba cada anchura mínima. Punto de partida obligatorio, ya calculado por
  `tech-lead`: `layout.module.css:25` con `min="290px"` desborda por debajo de 322px de
  viewport. Confirmarlo o refutarlo, y seguir buscando: `filtros-form.module.css:3`
  (mínimo intrínseco ~620px, con guardas de contenedor a 860 y 460 — verificar que no hay
  hueco entre ellas), `comercio-card.module.css:19-28` (`white-space: nowrap` sobre el
  nombre), `perfil.module.css` en el carnet, y las áreas táctiles de la barra inferior
  (`portal.module.css:226-245`, contra `--tap-min: 44px`).
- **DoD**: reporte con formato de `REVIEW_SEVERITY.md`. Cada hallazgo lleva `archivo:línea`,
  **el ancho de viewport exacto a partir del cual falla** y la corrección concreta. Cero
  hallazgos sin número. Marcar explícitamente cuáles requieren una captura para confirmarse.
- **Riesgo**: bajo

#### T2 — Coste real de la navegación Inicio ↔ Mi perfil
- **Agente**: `performance-engineer`
- **Depende de**: —
- **Archivos** (lectura): `src/app/miembros/(portal)/page.tsx` ·
  `perfil/page.tsx` · `layout.tsx` · `src/app/admin/layout.tsx:44` ·
  `src/components/shell/route-progress.tsx`
- **Descripción**: cuantificar el hueco silencioso. Tres preguntas concretas: (a) cuántas
  consultas y cuántas filas paga cada una de las dos navegaciones, incluida la pregunta de
  si el `layout.tsx` compartido **se reejecuta** al cambiar de pestaña o si Next reutiliza
  su segmento; (b) cuál de las 10 consultas de `page.tsx` es recortable **sin cruzar la
  frontera** — `API-CONTRACT.md` §5 ya señala los diccionarios de `:47-59`; (c) qué
  aportaría montar `RouteProgress` en este portal y qué coste de bundle tiene (arrastra
  `Suspense` y `useSearchParams`).
- **DoD**: tabla consulta-por-consulta con filas estimadas y veredicto recortable/no. Una
  recomendación numerada sobre `RouteProgress`. Todo lo que exija tocar una Server Action o
  `src/lib/supabase/` va a `PROPUESTAS PARA BACKEND`, no a una tarea.
- **Riesgo**: bajo

#### T3 — Dictamen de movimiento: qué se anima y si procede `<ViewTransition>`
- **Agente**: `motion-ux-polish` · **sombrero de diagnóstico, no de pulido**
- **Depende de**: —
- **Archivos** (lectura): `src/app/miembros/(portal)/portal.module.css` (`:100-104`,
  `:239-259`) · `_components/*.module.css` · `src/lib/shared/motion.ts` ·
  `src/styles/tokens.css` · `next.config.ts`
- **Descripción**: inventariar **todo** el movimiento que hoy existe en este portal — que es
  poco: la transición de los enlaces de cabecera, el `scale: 0.94` de la pestaña activa y su
  bloque `prefers-reduced-motion`. Y emitir un **dictamen razonado, sí o no**, sobre aplicar
  `<ViewTransition>` entre `/miembros` y `/miembros/perfil`, sabiendo que (i) las dos
  pantallas no comparten ningún elemento, (ii) hoy no hay estado de carga entre ellas, y
  (iii) no hay forma de verificarlo visualmente en esta máquina. Si el dictamen es "no
  todavía", decir **qué tendría que ser cierto** para que fuese "sí".
- **NO hagas**: proponer curvas, resortes ni retardos para pantallas cuyo estado de carga
  aún no se ha especificado. Eso es Fase F y se tiraría.
- **DoD**: inventario con `archivo:línea`. Dictamen en una frase con tres razones. Si es
  favorable, el elemento compartido concreto y la ruta de verificación. Si es desfavorable,
  la condición de reapertura.
- **Riesgo**: bajo

#### T4 — Insumos del usuario. **BLOQUEANTE HUMANO**
- **Agente**: ninguno. Lo aporta el usuario.
- **Depende de**: —
- **Descripción**: es la tarea de la que depende que este plan sea ejecutable en vez de
  especulativo. Tres preguntas y un paquete. Las tres preguntas, en orden de impacto sobre
  el plan:

  1. **"Lista y ficha": ¿son las pestañas Inicio y Mi perfil del Portal de Miembros?**
     Es la única transición que existe ahí: `ComercioCard` no es clicable y no hay ruta de
     detalle de comercio. Si en realidad hablabas de `/admin/miembros → /admin/miembros/[id]`,
     que sí es una lista→ficha de verdad, **este plan cambia de portal y hay que rehacerlo**.
  2. **¿Qué pantalla se ve desalineada, y en qué teléfono?** Basta el modelo. Con eso el
     cálculo de T1 pasa de hipótesis a confirmación o queda descartado.
  3. **¿Podemos tener credenciales de un miembro con membresía vigente en un entorno de
     prueba?** Sin ellas nadie del equipo puede ver `/miembros` ni `/miembros/perfil`
     renderizados: `requireMiembroVigente()` (`page.tsx:32`) cierra el paso. Si no las hay,
     el plan sigue siendo ejecutable, pero **toda verificación visual pasa a depender de
     capturas tuyas** y eso se acepta por escrito, no se descubre a mitad.

  **Paquete de capturas "antes"** (con el teléfono real, no con el simulador):
  `/miembros` sin filtros · `/miembros` con un filtro puesto · `/miembros` sin resultados ·
  `/miembros/perfil` · **un vídeo o ráfaga de 2-3 capturas tocando la pestaña "Mi perfil"**,
  que es donde debe verse el hueco silencioso · las mismas en modo claro y oscuro si es
  posible.
- **DoD**: las tres respuestas y el paquete de capturas, en el hilo. Sin esto, **Fase C no
  arranca**; A y B sí pueden avanzar en paralelo.
- **Riesgo**: alto (es el punto único de bloqueo de todo el plan)

---

### FASE B — Especificación. Sigue sin escribirse código.

#### T5 — Spec de los estados de carga, error y vacío del Portal de Miembros
- **Agente**: `ux-designer`
- **Depende de**: T1, T2, T4
- **Archivos** (lectura): los de T1 · `src/components/ui/skeletons.tsx` ·
  `src/components/ui/feedback.tsx` · `src/app/admin/loading.tsx` · `src/app/admin/error.tsx`
- **Descripción**: especificar qué se ve, exactamente, entre que el miembro toca una pestaña
  y que la pantalla aparece — para las dos rutas y en los dos anchos. Y qué ve si algo falla.
  Concretamente: forma del esqueleto de `/miembros` (cabecera + filtros + rejilla) y de
  `/miembros/perfil` (el carnet es una sola pieza, un esqueleto de tabla ahí sería mentira),
  copy del `error.tsx` del portal con su salida, y revisión del copy del `EmptyState` que ya
  existe en `page.tsx:206-222`.
- **Restricciones que la spec no puede violar**, todas verificadas:
  - **`useToast()` lanza fuera de `/admin`**: `ToastProvider` se monta en
    `app-shell.tsx:72`. Nada de toasts en este portal.
  - **No hay paginación ni forma de saber si una lista se truncó**: `page.tsx:86` corta en
    `.limit(100)` en silencio (`API-CONTRACT.md` §4). No especifiques "ver más", ni un
    contador de totales, ni scroll infinito.
  - **No hay filtro por estado de membresía** ni ordenación elegible.
  - El esqueleto debe llevar `data-motion-esencial` (`CLAUDE.md`, "Movimiento").
  - El oro no codifica datos y va por debajo del 5% del área.
- **DoD**: spec en `.claude/docs/` con los estados de las dos rutas, en escritorio y móvil,
  el copy literal en español, y una lista explícita de "lo que NO se puede ofrecer y por
  qué", citando la fila de `API-CONTRACT.md` §4 correspondiente.
- **Riesgo**: medio (es donde más fácil se cuela una capacidad que el contrato no da)

#### T6 — Dictamen sobre el cambio en `Grid` y su radio de impacto
- **Agente**: `design-system-architect`
- **Depende de**: T1
- **Archivos** (lectura): `src/components/ui/layout.module.css:23-28` ·
  `src/components/ui/layout.tsx` · los 6 consumidores de producto de `<Grid>`
  (`miembros/(portal)/page.tsx:224`, `admin/page.tsx:99,125`, `admin/metricas/page.tsx:214`,
  `skeletons.tsx:54,69`)
- **Descripción**: dictaminar si la guarda `minmax(min(var(--min, 240px), 100%), 1fr)` es la
  corrección correcta y **demostrar que es no-op** para los otros consumidores, o proponer
  otra. Comprobar de paso si el mismo patrón sin guarda aparece en otras rejillas
  (`filtros-form.module.css:3`, `perfil.module.css`) y si conviene una regla escrita para que
  no vuelva: ESLint **no tiene ni una regla propia** y no lo detectaría nunca.
- **DoD**: veredicto con la declaración CSS exacta, tabla de los 6 consumidores con el ancho
  al que hoy desbordan cada uno, y afirmación explícita de no-regresión por encima de ese
  ancho. Si propone tocar `tokens.css`, justificar contra las 145 propiedades existentes.
- **Riesgo**: medio (`Grid` es compartido; una regresión aquí se ve en el panel, no aquí)

---

### FASE C — Implementación. Un solo escritor.

Las tres tareas las ejecuta `frontend-implementer`, **en este orden**, y **cada una es un
commit independiente**: si T8 introduce una regresión visual, T7 no se revierte con ella.
Ninguna toca la zona de solo lectura de `SCOPE.md` §2: no se abre ningún `actions.ts`, ni
`src/lib/auth/`, ni `src/lib/supabase/`, ni `src/lib/correo/`.

#### T7 — Continuidad de navegación en el Portal de Miembros
- **Agente**: `frontend-implementer`
- **Depende de**: T2, T4, T5
- **Archivos** (escritura):
  - `src/app/miembros/(portal)/loading.tsx` — **nuevo**
  - `src/app/miembros/(portal)/perfil/loading.tsx` — **nuevo**
  - `src/app/miembros/error.tsx` — **nuevo**, `'use client'`
  - `src/app/miembros/(portal)/portal.module.css` — si T5 pide ajuste de la señal de toque
  - `src/app/miembros/(portal)/layout.tsx` — **solo** si T2 aprueba montar `RouteProgress`
- **Descripción**: dar respuesta inmediata al toque y una fase intermedia visible. Es la
  tarea que ataca la queja principal. Los esqueletos se componen con las piezas de
  `src/components/ui/skeletons.tsx` siguiendo el patrón de los 6 `loading.tsx` del panel; el
  `error.tsx` sigue el de `src/app/admin/error.tsx` (registra con prefijo entre corchetes y
  ofrece `reset()`). El copy sale de T5, literal.
- **Trampas conocidas, ya verificadas** (`ARCHITECTURE.md`, "Cinco trampas"):
  - `useToast()` **lanza** aquí. No lo importes.
  - `src/lib/shared/haptica.ts` lleva `'use client'`: no lo importes desde un Server Component.
  - `export default` sí, porque el App Router lo exige en `loading.tsx` y `error.tsx`; en
    cualquier otro archivo, exportación con nombre.
  - Si acabas moviendo o añadiendo rutas paralelas, **reinicia el servidor de desarrollo**.
- **DoD**:
  1. `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build` en verde.
  2. Los dos `loading.tsx` renderizan un esqueleto **que corresponde a su pantalla** — el del
     carnet no es una tabla.
  3. El esqueleto lleva `data-motion-esencial` y sigue animando bajo
     `prefers-reduced-motion`.
  4. Cero literales de color, espaciado, radio o duración; todo por `var(--…)`.
  5. Cero animación de `width`, `height`, `top`, `left` o `margin` en lo añadido.
  6. Un `<h1>` por pantalla, sin saltos de nivel, también en el estado de error.
  7. **Verificación con throttling de red**: con la red a "Slow 3G" en DevTools, tocar
     "Mi perfil" muestra el esqueleto antes de la pantalla. Se adjunta captura. Esto **no
     requiere redimensionar la ventana**, así que sí es ejecutable en esta máquina.
- **Riesgo**: bajo (solo añade archivos; no modifica pantallas existentes salvo el layout,
  y esa parte es condicional)

#### T8 — Desbordamiento y alineación en pantallas estrechas
- **Agente**: `frontend-implementer`
- **Depende de**: T1, T4, T6
- **Archivos** (escritura): `src/components/ui/layout.module.css:25` · lo que salga de T1
  dentro de `src/app/miembros/(portal)/**`
- **Descripción**: aplicar la guarda dictaminada en T6 sobre `Grid` y corregir los hallazgos
  de nivel 1 y 2 de T1. **Solo esos dos niveles en esta iteración**: los niveles 3 y 4 se
  registran y se cierran después, para que el diff siga siendo legible.
- **DoD**:
  1. Los cuatro comandos en verde.
  2. **Sin desbordamiento horizontal a 280, 320, 360, 390 y 430px.** Como la ventana no se
     puede redimensionar por automatización, la comprobación es doble y ambas partes son
     obligatorias: (a) aritmética escrita en el reporte, ancho útil frente a ancho mínimo
     exigido por cada pista; (b) **captura del usuario** en su teléfono real sobre la rama.
  3. Se demuestra por inspección que el cambio en `Grid` **no altera** las otras cinco
     pantallas que lo usan por encima de su ancho mínimo, con la tabla de T6 como referencia.
  4. Ningún `@media` nuevo dentro del contenedor `contenido`: si hace falta un punto de
     ruptura, es `@container contenido (…)`, y se comprueba que hay contenedor ancestro —
     lo hay, `portal.module.css:174-175`.
- **Riesgo**: **medio-alto**. Es el único cambio del plan que sale del Portal de Miembros y
  toca un componente con 9 consumidores, y es el que peor se puede verificar aquí.

#### T9 — Recorte del sobrefetching de `/miembros`  ·  **CONDICIONAL**
- **Agente**: `frontend-implementer`
- **Depende de**: T2 (solo se ejecuta si T2 identifica un recorte de impacto medible)
- **Archivos** (escritura): `src/app/miembros/(portal)/page.tsx:47-59`
- **Descripción**: eliminar consultas cuyo resultado no se usa, sin cambiar ni un píxel de lo
  que se ve. Candidatos de `API-CONTRACT.md` §5: los diccionarios completos de marcas,
  ciudades y tipos de beneficio, y la lista completa de comercios que solo puebla el
  desplegable del filtro.
- **Prohibiciones duras de esta tarea**:
  - No tocar `actions.ts` ni `src/lib/supabase/**`. La consulta se recorta **dentro de
    `page.tsx`**, que es zona de trabajo.
  - **No convertir `Promise.all` en `await` secuenciales.** La paralelización se hizo en el
    commit `e1fc40a` y deshacerla es una regresión.
  - No introducir paginación ni `.range()`: no existen en el contrato. Eso es P1.
- **DoD**: número de consultas y de filas antes y después, medido. Los cuatro comandos en
  verde. El desplegable de filtros conserva exactamente las mismas opciones — se compara la
  lista antes y después, no se asume.
- **Riesgo**: medio (tocar la consulta de la pantalla principal por una ganancia que aún no
  está cuantificada; por eso es condicional a T2, no un acto de fe)

---

### FASE D — Auditoría. Los cuatro **en paralelo**, todos solo lectura.

Alcance común: **solo el diff de la Fase C**, no el repositorio entero. Formato obligatorio
de `REVIEW_SEVERITY.md`. Lo que se vea fuera del propio dominio se deriva en una línea, no
se desarrolla.

#### T10 — Revisión de código
- **Agente**: `code-reviewer` · **Depende de**: T7, T8, (T9)
- **Descripción**: correctitud, tipado, convenciones. Puntos de atención específicos:
  exportación con nombre salvo donde el App Router obliga; `type` y nunca `interface`;
  kebab-case; dominio en español. Y las prohibiciones de `CLAUDE.md` que **ningún linter
  detecta aquí**: color/espaciado/duración literales, `@media` donde tocaba `@container`,
  animación de propiedades de layout, `none` dentro de una lista de sombras,
  `outline: none` sin sustituto.
- **DoD**: reporte con severidad y `archivo:línea`. Un hallazgo sin corrección concreta se
  devuelve.

#### T11 — Accesibilidad
- **Agente**: `accessibility-auditor` · **Depende de**: T7, T8, (T9)
- **Descripción**: WCAG 2.1 AA sobre lo añadido. Contraste AA en el copy nuevo del error y
  del esqueleto; `:focus-visible` en toda salida del estado de error; jerarquía de
  encabezados; que el esqueleto no sea ruido para el lector de pantalla; áreas táctiles
  ≥44px en la barra inferior, ampliando con `::after` si el control debe verse pequeño y
  subiendo `min-height` bajo `@media (pointer: coarse)` si es una fila ancha.
- **A revisar de oficio, aunque sea preexistente**: la pestaña activa de
  `portal.module.css:251-253` se distingue por **color y grosor de trazo (1.8 → 2.2)**. Si
  ese es el único portador del estado activo, choca con "color como único portador de
  significado". El `aria-current` sí está puesto (`portal-nav.tsx:57`); la pregunta es la
  señal visual.
- **DoD**: hallazgos con criterio WCAG citado y corrección concreta. Los niveles 1 y 2 se
  aplican en esta iteración.

#### T12 — Re-auditoría móvil y auditoría de plataforma Apple
- **Agentes**: `mobile-ux-specialist` y `apple-hig-specialist`, en paralelo entre sí
- **Depende de**: T7, T8, (T9)
- **Descripción**: `mobile-ux-specialist` verifica que sus hallazgos de T1 quedaron cerrados
  y que no aparecieron nuevos. `apple-hig-specialist` audita lo específico de Apple, que
  nadie ha mirado: `env(safe-area-inset-bottom)` en la barra inferior (`portal.module.css:206`)
  y su interacción con el `padding-bottom` de `.main` (`:185-191`), comportamiento de
  `100dvh` (`:4`) con las barras dinámicas de Safari en iOS, `-webkit-line-clamp` de
  `comercio-card.module.css:43-47`, `backdrop-filter` de cabecera y barra —que es cromo
  fijo, **no** filas de lista, así que aquí es legítimo—, y la lectura del carnet con
  VoiceOver y Dynamic Type.
- **DoD**: dos reportes separados, sin solaparse: táctil, viewport y teclado para el
  primero; safe areas, Dynamic Type, VoiceOver y convenciones HIG para el segundo. El
  mínimo de 44px lo pueden reportar los dos: es el mismo criterio desde dos normas.

#### Bucle de corrección
- **Agente**: `frontend-implementer` · **Depende de**: T10, T11, T12
- **Descripción**: ordenar todos los hallazgos por severidad global (`REVIEW_SEVERITY.md`) y
  aplicar en ese orden. Si discrepa de uno, lo argumenta por escrito; **no lo omite en
  silencio**. Tras aplicar niveles 1 y 2 se re-audita **solo el dominio afectado**.
- **DoD**: cero hallazgos de nivel 1 abiertos. Los de nivel 2, cerrados o con fecha. Los 3 y
  4 registrados.

---

### FASE E — Verificación

#### T13 — Pruebas y protocolo de verificación manual
- **Agente**: `qa-tester`
- **Depende de**: la Fase D cerrada
- **Zona de escritura**: `src/lib/**/*.test.ts`, **solo funciones puras**
- **Descripción**: dos entregas distintas, y conviene no confundirlas.
  1. **Tests automatizados**: solo si la Fase C dejó una función pura nueva o modificada.
     Con el alcance actual probablemente **no la haya** — el plan es CSS y estructura de
     rutas. Si `esActivo` (`portal-nav.tsx:17`) se extrae a `src/lib/`, entonces sí tiene
     test, y es barata: dos rutas, cuatro casos.
  2. **Protocolo de verificación manual**, que es la entrega de valor real aquí. Guion paso
     a paso, ejecutable por una persona con un teléfono, que cubra: navegación Inicio ↔ Mi
     perfil con red lenta, catálogo con y sin filtros, catálogo sin resultados, membresía no
     vigente (`/miembros/inactiva`), modo claro y oscuro, `prefers-reduced-motion` activado,
     y el carnet con el QR **escaneado de verdad por un lector** en los dos temas.
- **Restricciones**: `vitest` solo descubre `src/**/*.test.ts`. Un `.test.tsx` se escribe, se
  guarda y **nunca se ejecuta ni falla**. No escribas ninguno. No inventes tests de
  componente para aparentar cobertura.
- **DoD**: los cuatro comandos en verde. Protocolo publicado en `.claude/docs/`. Cada bug
  encontrado con pasos de reproducción y severidad.
- **Riesgo**: medio (la cobertura automatizable de esta iteración es casi nula, y eso hay
  que decirlo en el reporte, no maquillarlo)

---

### FASE F — Pulido

#### T14 — Movimiento, ahora que hay algo que animar
- **Agente**: `motion-ux-polish` · **sombrero de pulido**
- **Depende de**: T13 en verde
- **Descripción**: con el estado de carga ya existiendo, proponer el movimiento que lo cose:
  entrada del esqueleto, relevo esqueleto → contenido, feedback de la pestaña. Y **retomar
  el dictamen de T3**: si dijo "no todavía" y las condiciones que puso ya se cumplen,
  reabrirlo aquí con una propuesta acotada y verificable.
- **Reglas duras**: presets y helpers de `src/lib/shared/motion.ts`; curvas y duraciones de
  `tokens.css`; `bounce: 0` por defecto, el rebote solo tras un gesto con momento; feedback
  en `pointerdown`, no en `click`; entrada y salida por el mismo camino; solo `transform` y
  `opacity`; `prefers-reduced-motion` recibe un equivalente no vestibular, no la ausencia de
  feedback. Y la forma de `animate` en motion 12 es la de **valor único**
  (`animate(desde, hasta, opciones)`): la otra no lanza, simplemente no anima, y no queda
  rastro en consola.
- **DoD**: propuestas priorizadas, cada una con su coste y su forma de verificación. Las
  aplica `frontend-implementer`. **Cada cambio de movimiento se verifica con una captura**:
  medir con `getComputedStyle` durante una transición dio tres diagnósticos falsos seguidos
  en una sesión anterior, porque en una pestaña que el navegador no pinta las transiciones no
  avanzan y siempre se lee el valor inicial.
- **Riesgo**: medio (es lo más difícil de verificar sin ojo humano; por eso va al final,
  cuando el resto ya está cerrado y una regresión aquí no arrastra nada)

---

### FASE G — Cierre

#### T15 — Coherencia visual
- **Agente**: `design-system-architect` · **modo AUDITAR** · **Depende de**: T14
- **Descripción**: comprobar que lo añadido no ha creado un dialecto. Esqueletos coherentes
  con los 6 del panel, error coherente con `admin/error.tsx`, presupuesto de oro ≤5%, oro
  que no codifica datos, cero literales fuera de la excepción sancionada de `QrCode`.
- **DoD**: veredicto de coherencia con hallazgos, o aprobación explícita.

#### T16 — Documentación  ·  **CONDICIONAL**
- **Agente**: `docs-handoff` · **Depende de**: T15
- **Se ejecuta solo si**: T8 modificó `Grid`, o si el portal estrenó una convención de
  carga/error que antes no tenía. Ambas cosas son probables.
- **Descripción**: registrar en `.claude/docs/` la guarda de `Grid` y su porqué —un
  `minmax()` sin `min()` desborda y ESLint no lo ve— y el patrón de `loading.tsx` y
  `error.tsx` fuera de `/admin`. `docs/**` es **solo lectura**: se cita, no se reescribe.
- **DoD**: documento en `.claude/docs/`. Si `CLAUDE.md` merece una línea nueva, se **propone
  al usuario**, no se edita por iniciativa propia.

---

## Secuencia de ejecución

```
FASE A  ──  T1 mobile-ux  ║  T2 performance  ║  T3 motion (diagnóstico)   [en paralelo]
            T4 INSUMOS DEL USUARIO  ← se pide AL EMPEZAR la fase, no al terminarla

              ↓ (A cerrada + T4 respondida)

FASE B  ──  T5 ux-designer  ║  T6 design-system-architect                 [en paralelo]

              ↓

FASE C  ──  T7 continuidad  →  T8 desbordamiento  →  T9 sobrefetching (condicional)
            secuencial, un commit por tarea, mismo agente

              ↓

FASE D  ──  T10 code-reviewer ║ T11 a11y ║ T12 mobile + apple            [en paralelo]
              ↓
            frontend-implementer aplica por severidad → re-auditoría del dominio afectado

              ↓

FASE E  ──  T13 qa-tester  →  correcciones  [repetir hasta verde]

              ↓

FASE F  ──  T14 motion-ux-polish  →  frontend-implementer aplica

              ↓

FASE G  ──  T15 design-system-architect  →  T16 docs-handoff (condicional)
```

**T4 se pide el primer día**, en paralelo con T1-T3, no cuando A termina. Es lo único que
tiene latencia humana y bloquea toda la Fase C; pedirlo tarde para todo el plan por nada.

**Ruta crítica**: T4 → T5 → T7 → Fase D → T13. Todo lo demás cabe alrededor.

---

## Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | **"Lista y ficha" no son las dos pestañas del portal.** En el Portal de Miembros no existe navegación lista→ficha: `ComercioCard` no es clicable y no hay ruta de detalle. Si el usuario hablaba de `/admin/miembros → [id]`, el plan entero apunta al portal equivocado | Media | **Alto** | Es la pregunta 1 de T4 y se hace el primer día. Fase C no arranca sin respuesta. Coste de equivocarse si se pregunta: cero. Si no se pregunta: el plan completo |
| R2 | **Nadie puede ver el portal renderizado.** `requireMiembroVigente()` exige un miembro con membresía vigente y esas credenciales no están aquí | **Alta** (es un hecho, no una probabilidad) | Alto | Todas las tareas de Fase C tienen un DoD verificable **sin ver la pantalla**: aritmética de anchos, los cuatro comandos, inspección de no-regresión. Lo que solo se ve con el ojo se agrupa en dos paquetes de capturas del usuario, "antes" (T4) y "después" (T8/T13). Y se pide credenciales de prueba en T4: si llegan, R2 desaparece |
| R3 | **La automatización de navegador no redimensiona la ventana.** Ya falló cinco veces | **Alta** (hecho) | Medio | **No se planifica ni un paso de verificación que lo requiera.** El desbordamiento se demuestra por aritmética más captura del usuario. Lo que sí es ejecutable aquí y se usa: throttling de red en DevTools (T7), que no necesita cambiar el ancho |
| R4 | **El cambio en `Grid` regresiona el panel administrativo.** 9 consumidores, 6 de producto | Baja | **Alto** | T6 exige demostrar la no-regresión **antes** de tocar nada, con tabla por consumidor. La guarda propuesta es matemáticamente no-op por encima del ancho mínimo. Commit aparte de T7, revertible solo |
| R5 | **Se arregla lo que no dolía.** Las cinco animaciones de layout no llegan a este portal (verificado consumidor por consumidor): se invierte la iteración en deuda transversal y el usuario sigue viendo lo mismo | Media | Medio | Excluidas explícitamente de esta iteración y movidas a su propia sección al final del documento. La primera tarea de código, T7, ataca la queja principal directamente |
| R6 | **El diagnóstico no encuentra la causa real del "desalineado"** y la hipótesis de los 322px se refuta | Media | Medio | Por eso Fase A precede a Fase C y T4 pide capturas. Si T1 se queda sin candidatos, se para y se pide una captura anotada por el usuario. Implementar contra una hipótesis refutada es peor que esperar |
| R7 | **Alcance que se estira.** "Mejorar el diseño" es una invitación abierta y el portal tiene deuda de sobra alrededor | Media | Medio | La sección "Fuera de alcance" es vinculante. Todo lo que aparezca y no esté en ella se registra como tarea futura, **no se hace**. Los niveles 3 y 4 de la Fase D se registran, no se aplican |
| R8 | **Se cruza la frontera sin darse cuenta.** El sobrefetching de T9 está a un paso de `src/lib/supabase/` | Baja | **Alto** | T9 nombra sus archivos de escritura exactamente y prohíbe abrir `actions.ts` y `src/lib/supabase/**`. `SCOPE.md` §1b: la regla de solo lectura gana siempre sobre la de escritura. Ningún auditor tiene shell, así que no puede escribir aunque quisiera |

---

## Fuera de alcance

Explícitamente **no** se hace en esta iteración. Cada línea con su porqué.

1. **Las cinco transiciones que animan propiedades de layout.** Verificado consumidor por
   consumidor que **ninguna llega al Portal de Miembros**: `app-shell.module.css:56` y
   `:390` son el chrome del panel; `route-progress.module.css:27` solo se monta en
   `app/admin/layout.tsx:44`; `feedback.module.css:65` (`ProgressBar`) y
   `toggle.module.css:87` (`Switch`) tienen como **único** consumidor
   `app/dev/ui/gallery.tsx`, que hace `notFound()` en producción. Es deuda transversal real
   y hay que pagarla — con su propio plan, su propio diff y verificación del panel completo.
   Aquí solo compraría riesgo. Ver "Deuda preexistente" abajo.
2. **`<ViewTransition>` entre lista y ficha (deuda #1 de `CLAUDE.md`).** Condicionada al
   dictamen de T3 y, si procede, se hace en T14. Motivo para no abrir por aquí: no hay
   elemento compartido entre catálogo y carnet, no hay fase intermedia que animar hasta que
   T7 la cree, y no se puede verificar visualmente en esta máquina.
3. **Rediseño visual del portal**: paleta, tipografía, retícula, densidad. La petición habla
   de alineación y transiciones, no de dirección de arte. Un rediseño es otra petición y
   probablemente otro nivel de triage.
4. **Ficha de detalle de un comercio.** Hoy no existe y crearla es un feature nuevo con su
   ruta, su consulta y su spec — no una mejora de diseño. Si es lo que el usuario quiere,
   se replantea desde triage.
5. **Paginación, "ver más" y aviso de lista truncada.** `.range(` no aparece ni una vez en
   `src/`. Va a `PROPUESTAS PARA BACKEND`.
6. **Filtro por estado de membresía y ordenación elegible.** No existen en el contrato
   (`API-CONTRACT.md` §4). Propuestas, no tareas.
7. **Toasts en el Portal de Miembros.** `ToastProvider` se monta en `app-shell.tsx:72` y
   `useToast()` **lanza** fuera de `/admin`. Montarlo aquí es una decisión de arquitectura de
   otro tamaño, no un detalle de esta iteración.
8. **`error.tsx` para `/comercios`, `/login`, `/activar-cuenta` y la raíz.** Es la misma
   carencia y la misma corrección, pero el Portal de Comercios es la herramienta de caja y
   merece su propia verificación. Se registra, no se cuela.
9. **`/` hace `redirect('/admin')` sin mirar el rol**, así que un miembro que abra el
   dominio a secas acaba en el acceso administrativo con `?error=sin_permiso`
   (`app/page.tsx:8`). **Afecta a miembros y roza esta petición**, pero es un cambio de
   enrutado con implicaciones de sesión, no de diseño. Se escala aparte.
10. **Los otros dos portales y el panel administrativo.** Solo se les toca a través de
    `Grid` (T8), y precisamente por eso T6 exige demostrar la no-regresión antes.

---

## Deuda preexistente que este plan NO resuelve

Separada a propósito de la petición del usuario. Ninguna de estas líneas la pidió nadie;
todas salen de `ARCHITECTURE.md`. Se listan para que no se cuelen en el diff y para que
existan como candidatas a la siguiente iteración, con prioridad sugerida.

| Prioridad | Deuda | Por qué no entra ahora |
|---|---|---|
| Alta | **Las cinco animaciones de propiedades de layout** (`ARCHITECTURE.md`, filas A). Beneficia a las 40 pantallas del panel, **no al Portal de Miembros** | Radio de impacto grande, verificación visual del panel no disponible, y cero relación con el síntoma reportado. Merece un plan propio |
| Alta | **Faltan `error.tsx` en `/miembros` (parcialmente cubierto por T7), `/comercios`, `/login`, `/activar-cuenta` y la raíz** | T7 cubre solo el Portal de Miembros. El resto es otro alcance |
| Media | **Faltan `loading.tsx`** en `admin/bitacora/`, `admin/metricas/`, `admin/miembros/[id]/`, `admin/comercios/[id]/` y `comercios/(portal)/` | Mismo patrón que T7, otro portal |
| Media | **El `error` de Supabase se descarta en todas las páginas**: un fallo de red se presenta como "no hay resultados". El `EmptyState` de `page.tsx:206` miente | Corregirlo bien exige decidir el estado de error de lectura en todo el producto. Es transversal, no local |
| Media | **`--gold-500` escrito a mano** como `rgba(191,160,99,…)` en `pantalla-auth.module.css:43-44`, y `background: #fff` en `toggle.module.css:82` | Literales prohibidos, arreglo trivial, **cero relación con esta petición**. Meterlos aquí solo ensucia el diff |
| Media | **14 parejas de ruta real y gemela `@modal` con las consultas duplicadas literalmente** | Solo `/admin`. Riesgo real, alcance ajeno |
| Media | **No existe `src/lib/shared/formato.ts`**: la fecha civil está reimplementada 3 veces y el importe en pesos 4, más 8 `toLocaleString('es-CO')` sueltos. Uno de esos sitios es `miembros/(portal)/perfil/page.tsx:26,32` | Toca 12 sitios en cuatro secciones. Refactor limpio, pero es una tarea propia con su propio riesgo |
| Baja | **`limpiarTermino` sin test**, y **sanea la entrada de un filtro `.or()` de PostgREST**: es la función pura con más razones para tenerlo. También sin test: `haptica`, `iniciales`, las tres de `nav-config.ts` | Zona de `qa-tester`, independiente de esta petición. Si sobra capacidad en T13, empezar por `limpiarTermino` |
| Baja | **ESLint no tiene ni una regla propia.** Nada impide automáticamente un `className="orum-*"`, un color literal, un `@media` donde tocaba `@container` ni una animación de layout | Sería el arreglo con más apalancamiento del repositorio: convertiría cinco reglas de `CLAUDE.md` en errores de compilación. **Es un plan propio y vale la pena proponerlo** |

---

## PROPUESTAS PARA BACKEND

Cruzan la frontera de `SCOPE.md` §2. **No son tareas de este plan.** Es una lista para
llevar a una conversación con quien mantiene ese código.

### B1 — El catálogo del miembro se trunca en silencio a 100 comercios

Refuerza **P1** de `API-CONTRACT.md` con el caso concreto de esta petición.

- **Qué se necesita**: que el catálogo de comercios acepte página y tamaño y devuelva el
  total junto a las filas. `count: 'exact'` ya se usa en el repositorio
  (`src/app/admin/page.tsx:42`): el patrón existe, no hay que inventarlo.
- **Dónde muerde**: `src/app/miembros/(portal)/page.tsx:86` y `:55` cortan con `.limit(100)`.
  El miembro **no sabe** que hay más comercios; el producto tampoco. Cuando el club supere
  los 100 aliados, parte del beneficio que el miembro paga deja de mostrarse, sin ningún
  aviso, ni en pantalla ni en logs.
- **Por qué la alternativa solo-frontend es peor**: sin `range`, un "ver más" **no puede
  existir**. Paginar en memoria exige traerlo todo primero, que es justo lo que se evita.
- **Entretanto, y sin cruzar la frontera**: cuando el número de filas recibidas iguale
  exactamente al límite, mostrar un aviso honesto — "mostrando los primeros 100, afina la
  búsqueda". Es una heurística, no una verdad, pero es mejor que mentir en silencio. **Es
  una propuesta para el usuario, no una tarea de este plan**: cambiaría el copy de la
  pantalla y necesita decisión de producto.

### B2 — Recorte de los diccionarios del catálogo, si T2 lo justifica

- **Qué se necesita**: una vista o función que devuelva los comercios ya resueltos con su
  marca, sus ciudades y sus promociones vigentes, en una sola lectura.
- **Dónde muerde**: `page.tsx:47-59` trae las 100 marcas, las 100 ciudades y todos los tipos
  de beneficio en cada visita, aunque el filtro esté vacío, solo para usarlos como
  diccionario de nombres. Son hasta 10 consultas por render de la pantalla principal del
  portal, y eso alarga el hueco silencioso que el usuario percibe como brusquedad.
- **Por qué solo-frontend no basta**: T9 puede recortar lo que **no se usa**, pero no puede
  fusionar lecturas ni crear una vista sin tocar `supabase/migrations/**`.
- **Entretanto**: T9, que es estrictamente lo recortable dentro de `page.tsx`. Y T7, que
  hace que la espera sea visible en vez de silenciosa — que es la mitad del problema.

### B3 — Nada más

Este plan **no necesita** ningún otro cambio de backend. Los estados de carga, el estado de
error, la guarda de `Grid` y el movimiento son íntegramente de frontend y caben dentro de
`src/app/miembros/**`, `src/components/**` y `src/styles/**`. Se hace constar para que
nadie asuma que hace falta negociar algo antes de empezar: **la Fase A y la Fase C pueden
arrancar hoy**, en cuanto T4 tenga respuesta.
