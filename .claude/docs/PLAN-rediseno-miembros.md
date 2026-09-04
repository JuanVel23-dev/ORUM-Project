# Plan: rediseño total del Portal de Miembros
> tech-lead · 29/08/2026 · rama `mejora-diseno` · commit base `e4d33e9`
>
> Fase 1 del pipeline de `WORKFLOW.md`. Nivel T4 (rediseño de un módulo completo, con
> funcionalidad nueva, corrección de un defecto de confianza y revisión de la norma).
> Base de hechos: `CLAUDE.md`, `.claude/docs/ARCHITECTURE.md`, `.claude/docs/API-CONTRACT.md`,
> `.claude/docs/SCOPE.md`, `.claude/docs/WORKFLOW.md`,
> `.claude/docs/PROPUESTA-BACKEND-imagenes.md`, los hallazgos que el propietario verificó en
> el navegador, sus decisiones del 29/08 y **el esquema real de la base de datos**.
> `graphify-out/` no se ha leído (zona prohibida, `SCOPE.md` §3).
>
> **Requiere aprobación del propietario antes de que se escriba una línea de código de
> producto.** No se ha modificado ningún archivo salvo este documento.

---

## Objetivo

Que el socio que paga abra ORUM en su teléfono y sienta que pertenece a algo: confiable,
cuidado, distinto. Hoy ve un panel administrativo con otra cabecera.

En concreto, y en el orden en que el cliente lo encuentra:

1. **El acceso** es la primera impresión y hoy es genérico.
2. **El catálogo** debe leerse como un directorio curado que invita a explorar —con filtro
   por tipo de comercio, con los logos de los aliados bien presentados y **sin anunciar
   promociones caducadas**— y no como una rejilla de fichas con cuatro desplegables encima.
3. **Cada negocio** merece una ficha propia donde su marca se vea bien.
4. **El carnet** debe leerse como una credencial, no como un bloque de formulario a ancho de
   página.
5. **La baja** debe invitar a volver, no despedir.

---

## Premisas fijadas por el propietario

| # | Premisa | Consecuencia operativa |
|---|---|---|
| **P1** | **Solo el recorrido del cliente.** El panel y la herramienta de comercios «por el momento están bien» y **no se rediseñan** | Todo lo que se añada al sistema es **aditivo**. Ningún token cambia de valor. `Button` está en 34 archivos, `Grid` en 9, `tokens.css` es global: el panel debe verse **idéntico** después (T28). **Única excepción autorizada: las pantallas de acceso** (P3) |
| **P2** | **Móvil primero.** No es una adaptación posterior | Lienzo canónico: **375×667**. El escritorio es la variante. En cada DoD la **captura móvil va primero**. `mobile-ux-specialist` audita **la spec**, en FASE 1 |
| **P3** | **El rediseño empieza en el login, y entra el de administración.** Cita: *«mejoremos el diseño del login para todo»* | **Las seis pantallas de acceso se rediseñan a la vez.** El principio de `CLAUDE.md` —«son dos puertas al mismo club»— **queda intacto**: no hay divergencia ni regla que romper |
| **P4** | **Manda Apple; `CLAUDE.md` se revisa** | Cada ruptura va argumentada y listada. La revisión de la norma es **entregable obligatorio y previo** (T8). **El contraste AA no se negocia**: hoy 0 fallos y ahí se queda |
| **P5** | **«Premium» es un efecto, no un nivel** | Confiable, lujosa, novedosa, no genérica, profesional, innovadora |
| **P6** | **Entran filtros por categoría y carruseles** | Los datos de categoría **ya existen** y no se usan. Los carruseles entran con condiciones (RUP-5) |
| **P7** | **Hay fotos, y ya funcionan** | El trabajo no es «diseñar sin imágenes»; es **presentar bien imágenes ajenas que no controlamos**. **El respaldo de la inicial se conserva** |

---

## Qué pasa con `.claude/docs/PLAN-portal-miembros.md`

**Este plan lo SUSTITUYE.** Declaraba fuera de alcance las dos cosas que ahora son el encargo
(su punto 3, rediseño visual; su punto 4, ficha de comercio). Anuladas esas exclusiones, lo
que queda es un subconjunto. Su FASE A entera era **diagnóstico a ciegas** —su riesgo R2:
«nadie ha visto este portal renderizado»— y ya está cerrada.

| Del plan anterior | Dónde vive ahora | Cambio |
|---|---|---|
| T8 — guarda de `Grid` (`layout.module.css:25`) | **T9** | Anchos ya medidos: 42px a 280px, 2px a 320px, 0 desde 344px |
| T7 — `loading.tsx`, `error.tsx`, `RouteProgress` | **T18** | Al final: los esqueletos deben parecerse a los layouts **nuevos** |
| T9 — recorte del sobrefetching | **T25** (condicional) | Sigue condicionado a que se cuantifique la ganancia |
| Su dictamen sobre `<ViewTransition>` | **T7** | **Se invierte.** Decía «no» porque catálogo y carnet no comparten elemento. Con la ficha **sí** lo hay |
| Sus `PROPUESTAS PARA BACKEND` B1 y B2 | Sección homónima | Íntegras; B1 sube de prioridad |

`docs-handoff` le añadirá una cabecera `SUSTITUIDO por PLAN-rediseno-miembros.md · 29/08/2026`.
**No se borra**: contiene la verificación de por qué las cinco animaciones de layout no llegan
a este portal.

---

## Contexto técnico

### 1. El sistema de diseño **ya es Apple**. Lo que no lo es, es este portal.

| Token | Línea | Qué es |
|---|---|---|
| `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` | `tokens.css:238` | El comentario del archivo lo llama «el sello Apple» |
| `--dur-press: 90ms` / `--dur-rebote: 440ms` / `--ease-rebote` | `:258-260` | La **asimetría ida/vuelta** de iOS, con doce líneas explicando por qué el rebote vive en la vuelta |
| `--t-title-1` … `--t-overline` | `:170-228` | La rampa tipográfica de Apple, cada tamaño con **su propio tracking y leading** |
| `--font-mono` pidiendo SF Mono | `:167` | Para distinguir 0/O y 1/l cuando alguien dicta su número en una caja |
| `--tap-min: 44px` | `:301` | El mínimo de HIG |
| `--material` + `--blur-xl` + `prefers-reduced-transparency` | `portal.module.css:25-43` | Material translúcido con su degradación, ya implementado |

**Consecuencia**: no es importar un lenguaje visual, es **aplicar a fondo el que ya existe** y
añadir lo que falta: jerarquía, material y ceremonia.

### 2. `CLAUDE.md` va por detrás del esquema y del código

Tres cosas que la norma afirma y el producto contradice. **Ninguna es culpa del código.**

**(a) El oro.** `CLAUDE.md` dice que vive en «wordmark, indicador de ruta activa, anillo de
focus, hairlines, y el CTA comercial del Portal Público», y que «jamás codifica datos». En
producción hay tres usos fuera de esa lista: el filo del carnet
(`perfil.module.css:19-27`), el badge del beneficio (`comercio-card.tsx:59`) y **el halo del
acceso** (`pantalla-auth.module.css:29-47`, «la única superficie dorada grande del sistema»
según su propio comentario). Y el Portal Público **no existe**: la única excepción sancionada
apunta a una pantalla que nadie ha construido.

**(b) El producto no es binario. El estado sí.** `CLAUDE.md` líneas 16-17 dicen: *«Un solo
producto: la membresía mensual. No hay niveles ni planes premium. El estado de un miembro es
binario: paga o no paga»*. **El esquema real dice otra cosa**: `planes_membresia` es una tabla
completa —`nombre`, `descripcion`, `precio numeric`, `duracion_meses integer DEFAULT 1`,
`activo`— que soporta **varios planes con precios y duraciones distintas**, hay un
`/admin/planes` con cuatro acciones para gestionarlos, y `membresias.plan_id` apunta a uno.

Esa frase **mezcla dos ejes que son independientes**, y ahí está el error:

| Eje | ¿Binario? | Dónde vive |
|---|---|---|
| **Estado de la membresía** — vigente o no | **Sí, y no se toca** | `derivarEstadoMembresia`: `estado === 'activa' && fecha_fin >= hoy` |
| **Producto** — qué plan compró | **No.** El esquema soporta N | `planes_membresia`, `membresias.plan_id` |

**Conclusión, y cierra una pregunta que este plan traía abierta**: que el carnet muestre
`plan?.nombre` (`perfil/page.tsx:72`) y que en el carnet de prueba se lea «PREMIUM»
**es correcto**. No es un defecto. Lo que hay que corregir es la frase de `CLAUDE.md`, en T8.

**(c) `ARCHITECTURE.md` se equivoca sobre quién usa `esPromocionVigente`.** Ver §4.

### 3. El filtro por categoría: los datos existen y no se usan

- `categorias` existe y `comercios.categoria_id` también. **El catálogo no consulta
  `categorias` ni una sola vez**: sus cuatro diccionarios son `comercios` (`page.tsx:49-55`),
  `marcas` (`:56`), `ciudades` (`:57`) y `tipos_beneficio` (`:58`).
- `FiltrosForm` ofrece cuatro controles: Buscar, Comercio, Marca, Ciudad. **Categoría no está.**
- **`categorias` es solo `id, nombre`**: sin icono, color ni orden. El filtro es simple. Si el
  diseño quiere un icono por categoría, es **columna nueva** → propuesta, no tarea (B5).

Una consulta más y un control más. **Cero backend.** Mayor valor por menor coste del plan.

**Anomalía de `tipos_beneficio`, resuelta**: **no está desperdiciada.** Forma el mapa
`codigoTipo` (`page.tsx:159`), que en `:171` traduce `tipo_beneficio_id` a su código y alimenta
`formatearBeneficio(p.tipoCodigo, p.valor)` en el badge dorado (`comercio-card.tsx:59-61`).
**Es lo que hace que la insignia diga «2x1»** y no un número suelto.

### 4. 🔴 D14 — El catálogo del miembro anuncia promociones **caducadas**

Es el hallazgo más grave del plan y salió al verificar el esquema. **No es de diseño: es de
confianza, y hoy está vivo en producción.**

`promociones` tiene `fecha_inicio`, `fecha_fin` y `activo`: **las promociones caducan.** Existe
`esPromocionVigente` (`src/lib/comercios/promocion-vigente.ts`), función pura con **6 casos de
test**. Quién la usa, verificado con `grep` sobre todo `src/`:

| Consumidor | Línea | ¿Filtra por vigencia? |
|---|---|---|
| Portal de **Comercios**, catálogo de la caja | `comercios/(portal)/page.tsx:72` | ✅ Sí |
| Portal de **Comercios**, al registrar la venta | `comercios/(portal)/actions.ts:149` | ✅ Sí — **rechaza** la venta si la promoción no está vigente |
| Portal de **Miembros** | — | ❌ **No la importa.** Su consulta (`page.tsx:139-146`) filtra `activo` y `deleted_at`, **nunca las fechas** |

**La asimetría produce el peor resultado posible**: el socio ve «2x1» en la app, va al
comercio, y la herramienta de caja **rechaza el beneficio** por caducado. La aplicación promete
lo que el sistema deniega, delante del cliente y del comercio.

Afecta a dos sitios, no a uno: la consulta de promociones por comercio (`:139-146`) **y** la
búsqueda por título de promoción (`:91-97`), que hace que un comercio aparezca en los
resultados por una promoción que ya venció.

**Es un arreglo de frontend, en zona de trabajo**: importar `esPromocionVigente` y filtrar,
exactamente como hace el portal de comercios. Cero backend. Va en el primer commit (T9).

**D15, derivado**: `ARCHITECTURE.md` afirma que `promocion-vigente.ts` lo consumen «Portal de
Comercios y de Miembros». **Es falso.** Se corrige en T29.

### 5. Las imágenes ya funcionan, y ahí está el trabajo

**Lo que hay hoy, y está bien:**

- `comercio-logo.tsx:24` pinta `logo_url` con un `<img>` crudo, **deliberadamente**, con
  `eslint-disable @next/next/no-img-element` y el comentario «URL externa arbitraria, no un
  asset local». Es correcto para lo que hay.
- **El respaldo es la inicial del comercio**, no un icono genérico, con un razonamiento bueno
  en `:10-17`: un catálogo con el mismo icono de tienda repetido «se lee como incompleto».
  **Se conserva** (P7).
- `.logo` ya tiene `background: var(--surface-sunk)` y borde: la placa existe a medias.
- El CSP solo declara `frame-ancestors 'none'` (`next.config.ts:20`): **no restringe `img-src`**.

**Una mejora gratis que el esquema destapa: `marcas` también tiene `logo_url`.** Hoy
`ComercioLogo` solo mira el del comercio y, si no hay, cae a la inicial. Pero un comercio sin
logo propio **que pertenezca a una marca sí tiene logo disponible**. La cadena correcta es
**logo del comercio → logo de la marca → inicial**, y rellena huecos visuales del catálogo, que
es justo lo que separa «completo» de «a medio hacer». `page.tsx:56` ya consulta `marcas`: solo
hay que añadir `logo_url` al `select`.

**Los seis problemas de presentación:**

| # | Problema | Evidencia | Qué ve el socio |
|---|---|---|---|
| **D8** | **`object-fit: cover` mutila los logotipos apaisados** | `comercio-logo.module.css:9` | El comentario de `:7-8` dice: «se recortan al cuadro en vez de deformarse. Un logo estirado es lo primero que delata un catálogo barato». **El diagnóstico es correcto; el remedio es el equivocado.** `cover` cambia deformación por **mutilación**: un logotipo 4:1 en un cuadro pierde los lados. Para una foto `cover` es correcto; **para un logo la regla es `contain`** |
| **D9** | **Sin `onError`: un `logo_url` muerto pinta el icono de imagen rota** | `comercio-logo.tsx:21-33` | Peor que el respaldo tipográfico. Un logo roto destruye la confianza que el rediseño busca |
| **D10** | **Logos transparentes invisibles en tema oscuro** | `.logo` usa `--surface-sunk`, que en oscuro **es oscuro** | PNG transparente con logotipo oscuro sobre placa oscura: desaparece. Fallo clásico de los catálogos de aliados |
| **D11** | **Sin optimización de imagen** | `next.config.ts` **no tiene bloque `images`** | Un PNG de 2 MB se descarga entero para pintarse a 44px. Con el catálogo lleno, golpea el LCP |
| **D12** | **`alt` duplica el nombre visible** | `comercio-logo.tsx:26` pone `alt={`Logo de ${nombre}`}`; `comercio-card.tsx:32` renderiza el nombre **al lado** | El lector dice «Logo de Pequeño Cesar» y luego «Pequeño Cesar». `CLAUDE.md`: *«Un avatar junto a un nombre visible va decorativo»*. `Avatar` tiene prop `decorativo`; **`ComercioLogo` no** |
| **D13** | **`style={{ width, height }}` para maquetar** | `comercio-logo.tsx:28` y `:38` | Roza la prohibición de `CLAUDE.md`. Se resuelve inyectando una custom property, que la norma **sí** admite |

**Dónde viven los logos, y qué implica**: `logo_url` es una **columna de texto que un
administrador rellena** (`crearComercio` la recibe como campo de `FormData`). No hay Storage ni
`input type="file"` en el repositorio. Es decir, **hoy apuntan a hosts de terceros**. Eso tiene
tres consecuencias —rendimiento, disponibilidad y privacidad— y **ya están desarrolladas, con
el SQL del bucket y las políticas RLS, en `.claude/docs/PROPUESTA-BACKEND-imagenes.md`**. Este
plan la referencia y **no la duplica**.

Lo único que este plan necesita decidir de ahí: **`next/image` NO entra en esta iteración.**
Requiere `remotePatterns`, y cubrir hosts arbitrarios exigiría `hostname: '**'`, que convierte
la app en un proxy de optimización abierto. Entra **después**, si se aprueba el bucket.

### 6. Cuatro defectos verificados en el navegador

| # | Defecto | Ubicación | Efecto medido |
|---|---|---|---|
| D1 | `minmax(var(--min,240px),1fr)` sin guarda `min()` | `layout.module.css:25` | Desborda 42px a 280px, 2px a 320px, 0 desde 344px. Afecta a los **9 usos de `<Grid>`** |
| D2 | `<script dangerouslySetInnerHTML>` dentro de un componente React | `theme-script.tsx:29` | Error de React **en cada carga** y «2 Issues» permanentes en el overlay de Next, que **tapan cualquier error nuevo** |
| D3 | `scale: 0.94` anulado con `transform: none` | `portal.module.css:248` y `:255-258` | `transform: none` **no toca `scale`**: el movimiento reducido no surte efecto en la barra inferior |
| D4 | La misma acción dos veces en la misma pantalla | `layout.tsx:43-47` y `:68-75` | El patrón que `CLAUDE.md` condena, con «Mi contraseña» como precedente |

### 7. Tres defectos más, encontrados al planificar

| # | Defecto | Ubicación |
|---|---|---|
| D5 | **Salto de encabezado.** `PageHeader` → `<h1>` (`layout.tsx:138`), `ComercioCard` → `<h3>` (`comercio-card.tsx:32`): h1 → h3 sin h2 | `comercio-card.tsx:32` |
| D6 | `esActivo` (`portal-nav.tsx:17`) marca `/miembros` **solo en coincidencia exacta**. Con `/miembros/comercios/[id]`, ninguna pestaña quedará activa dentro de una ficha | `portal-nav.tsx:17-19` |
| D7 | **Literal de color prohibido**: el halo dorado escrito `rgba(191,160,99,…)`, que es `--gold-500` a mano | `pantalla-auth.module.css:43-44` |

### 8. Lo que el esquema permite, y lo que sigue bloqueado

**Verificado contra `database.types.ts`, no supuesto.** Esto importa porque el archivo **se
mantiene a mano** y un `select` de una columna ausente no compila (trampa #5 de
`ARCHITECTURE.md`). Aquí no ocurre:

| Mejora | ¿Compila hoy? | Evidencia |
|---|---|---|
| **Filtro por categoría** | ✅ | `categorias: { id, nombre }` (`database.types.ts:135-146`) y `comercios.categoria_id` (`:96`) |
| **Estantería «Nuevos en el club»** | ✅ | **`comercios.created_at: Timestamp`** ya declarado (`:101`). Basta añadirlo al `select` de `page.tsx:77` y ordenar. **Cero backend, cero trabajo de tipos** |
| **Respaldo de logo por marca** | ✅ | **`marcas.logo_url: string \| null`** ya declarado (`:125`) |
| **Filtrar promociones vencidas (D14)** | ✅ | `esPromocionVigente` existe con 6 tests y ya se usa en el otro portal |

| Bloqueado | Por qué |
|---|---|
| **Estantería «Destacados»** | **Ninguna de las 16 tablas tiene columna de destacado, orden ni prioridad.** Ordenar por `id` no es destacar → B5 |
| **Icono o color por categoría** | `categorias` es solo `id, nombre` → B5 |
| **Paginación y saber si la lista se truncó** | `.range(` no aparece nunca en `src/`; el catálogo corta en `.limit(100)` en silencio → B1 |
| **Historial de beneficios del miembro** | No hay página ni acción sobre `ventas` fuera de métricas → B3 |
| **Optimización y alojamiento de imágenes** | Sin Storage → `PROPUESTA-BACKEND-imagenes.md` / B4 |
| **Toasts en el portal** | `useToast()` **lanza** fuera de `/admin` (`toast.tsx:50`) |
| **Ordenación elegible, filtro por estado, búsqueda con acentos** | No existen |

**Dos correcciones a supuestos que circulaban:**

- **El QR del carnet codifica `numero_membresia`, no `codigo_publico`.** `perfil/page.tsx:100`
  pasa `value={miembro.numeroMembresia}`, y `requireMiembroVigente` ni siquiera selecciona
  `codigo_publico`. **`miembros.codigo_publico` no lo usa nadie en todo `src/`**: solo aparece
  en `database.types.ts:191,208`. Que exista un uuid público sin usar mientras el QR lleva un
  número de 8 dígitos es una observación para `security-auditor` (T22), **no una tarea de este
  plan**: cambiarlo obligaría a tocar `buscar_miembro_comercio`, que es backend.
- **`membresias.comprobante_url`** es el **tercer** «URL a un archivo» sin Storage detrás, junto
  a los dos `logo_url`. Refuerza la propuesta de imágenes: el patrón no es una excepción, es una
  costumbre.

### 9. La frontera de `SCOPE.md` no se toca en ningún punto

Ninguna tarea abre un `actions.ts`, ni `src/lib/auth/`, ni `src/lib/supabase/`, ni
`src/lib/correo/`, ni `supabase/**`, ni `docs/**`. Las lecturas nuevas —categorías,
`created_at`, `marcas.logo_url`, la ficha— se escriben **dentro de su `page.tsx`**, que es zona
de trabajo, con `createClient()`; nunca `admin.ts`, que lleva `server-only`.

---

## Decisión pendiente del propietario

Queda **una**, y no bloquea el arranque. Las otras dos se resolvieron con el esquema real
(§2b: el carnet es correcto) y con la propuesta de imágenes ya redactada.

### Q1 — ¿Se lleva la propuesta de imágenes al equipo backend, y con qué prioridad?

`.claude/docs/PROPUESTA-BACKEND-imagenes.md` está lista: bucket, políticas RLS, límites de peso
y formato, la decisión sobre SVG, y la recomendación de entrar como migración versionada.

- **No bloquea este plan.** T13 hace que ningún logo se vea roto, deformado ni invisible
  **hoy**, con `<img>` y una placa bien diseñada.
- **Lo que decide** es si `next/image` entra en una iteración posterior (D11) y si el catálogo
  deja de depender de que cien sitios ajenos sigan en pie.
- **Recomendación de `tech-lead`: sí, y con prioridad alta.** No por optimización, sino por la
  primera palabra del encargo: un catálogo cuyos logos dependen de servidores de terceros **no
  puede ser confiable**. Y hay un aviso que conviene no perder: `supabase/migrations/` tiene
  solo dos archivos y **no hay un `CREATE TABLE` en todo el repositorio** — el esquema se creó a
  mano en Supabase. Si se va a tocar la base, es el momento de empezar a versionarla.

---

## El criterio estético, traducido a decisiones verificables

«Confiable, lujosa, novedosa, no genérica, profesional, innovadora» es lo que el propietario
quiere **sentir**. Como criterio de aceptación no sirve. Esta tabla es el contrato:
`ux-designer` la desarrolla en T3, `design-system-architect` la traduce a tokens en T5, T28 la
verifica.

| Adjetivo | Decisión concreta | Cómo se verifica |
|---|---|---|
| **Confiable** | Nada se mueve sin avisar, **nada se ve roto y nada miente**. Estado de carga en toda navegación (T18); error con salida (T18); **ninguna promoción caducada anunciada** (D14/T9); ningún logo roto ni invisible (T13); si el catálogo se trunca, se dice (B1) | Catálogo con una promoción vencida en la base: **no aparece**. Catálogo con un `logo_url` muerto: se ve la inicial. Captura con red a «Slow 3G». 0 fallos de contraste |
| **No genérica** | El primer pantallazo móvil (375×667, **sin desplazar**) contiene: wordmark, jerarquía con **al menos tres niveles** de la rampa, y la fila de categorías visible. **No** contiene cuatro desplegables apilados, que es lo que hay hoy | Captura a 375×667 anotada con el token tipográfico de cada bloque |
| **Profesional** | Una familia (Inter), un juego de iconos, radios y sombras **solo** de `tokens.css`. **Los logos ajenos se presentan con una placa común**: mismo tamaño, mismo relleno, mismo fondo, logo entero. Cero sombras de librería, cero degradados que no sean `--gold-sheen` o `--gold-hairline` | `code-reviewer` (T20): cero literales. Captura del catálogo con logos de proporciones distintas alineados |
| **Lujosa** | El oro **se gana**: wordmark, filo del carnet, anillo de foco, insignia de beneficio y —si RUP-1 procede— la acción principal. El lujo lo lleva el **aire y el material** | Presupuesto de oro **medido sobre la captura** en T28 |
| **Novedosa / innovadora** | Tres cosas que hoy no existen: **transición de elemento compartido** tarjeta → ficha (deuda #1, habilitada y sin estrenar); **fila de categorías deslizable**; **carnet como objeto** con material propio | T7 y T27; captura o vídeo corto de cada una |
| **Móvil de verdad** (P2) | Toda decisión se toma primero a 375px. Objetivos ≥44px. Sin scroll horizontal salvo donde es el gesto | Cada DoD exige **captura móvil antes que la de escritorio** |

**Lo que NO se hace, porque es lo genérico**: sombras difusas de librería, degradados
arbitrarios, esquinas fuera de la escala de radios, iconos de otra familia, rebote sin gesto
previo, y **logos ajenos pintados tal cual llegan**.

---

## Rupturas de `CLAUDE.md` que este rediseño propone

**P4**: manda Apple y la norma se revisa. Cada ruptura va aquí. **Lo que no está en esta lista,
no se rompe.**

### RUP-1 · El oro pasa a ser el color de la acción principal, **solo en el recorrido del cliente**

- **Regla**: *«El oro es color de MARCA, no de acción»* · *«Botón primario = tinta»*.
- **Propuesta**: en el Portal de Miembros y en las pantallas de acceso, la acción principal usa
  oro con texto en tinta. En el panel y en el Portal de Comercios, `primary` **sigue siendo
  tinta** (P1).
- **Por qué**: en el lenguaje de Apple la acción principal lleva el *tint* de la app, y ORUM no
  tiene más tint que el oro. Un CTA negro sobre superficie clara, en la pantalla del socio que
  paga, se lee como formulario administrativo.
- **Coste bajo**: `Button` **ya tiene** `variant="gold"`. No se crea capacidad; se amplía dónde
  se admite. Hoy la norma la limita al «CTA comercial del Portal Público», que **no existe**.
- **Condición innegociable (AA)**: un relleno debe cumplir **dos cosas a la vez**: 4.5:1 con su
  texto (1.4.3) **y** 3:1 de borde contra la superficie (1.4.11).

  | Combinación | Ratio | ¿Sirve de relleno? |
  |---|---|---|
  | Tinta `--n-1000` sobre `--gold-500` | 7.94:1 | ✅ para el texto |
  | `--gold-500` **contra blanco** (borde) | **2.49:1** | ❌ **falla 1.4.11**. Prohibido |
  | `--gold-600` contra claro | 3.66:1 | ✅ para el borde |
  | `--gold-700` sobre claro | 5.44:1 | ✅ para texto dorado |

  **Camino propuesto**: relleno `--gold-600` con texto en tinta. Cumple el borde (3.66:1) y el
  texto quedaría sobre 4.5:1 — **cálculo preliminar de `tech-lead`, ~5.8:1, que NO se da por
  bueno**. Lo recalcula y firma `accessibility-auditor` en **T6, antes de implementar**. Si no
  llega, el primario **vuelve a tinta** y la ruptura decae.
- **Nota**: las seis pantallas de acceso se sirven **siempre en oscuro**
  (`pantalla-auth.module.css:1-22`). Ahí los ratios son otros y se calculan aparte.

### RUP-2 · Presupuesto de oro: dos excepciones acotadas y medidas

- **Regla**: *«≤5% del área visible por pantalla»*.
- **Propuesta**: el ≤5% sigue siendo la norma. Dos excepciones: el **carnet**, hasta ~15%, y las
  **pantallas de acceso**, que hoy ya la incumplen de hecho con su halo.
- **Por qué**: el carnet es un objeto, no una pantalla; una credencial sin material propio se lee
  como un `<div>` con datos. El acceso es una superficie de marca que ocupa la ventana unos
  segundos.
- **Límite duro**: el oro **sigue sin codificar estado**. Activa/inactiva se dice con
  verde/rojo, punto lleno/hueco **y** texto.

### RUP-3 · Aclaración (no ruptura): la API de View Transitions

- **Regla**: *«Animar `width`, `height`, `top`, `left`, `margin` — prohibido»*.
- **Situación**: un morfeo de elemento compartido corre sobre pseudo-elementos
  `::view-transition-*` que anima el compositor. No es una transición escrita a mano.
- **Propuesta**: una frase que lo excluya **explícitamente**, para que `code-reviewer` no lo
  reporte como violación y para que nadie la use como excusa para animar `width` a mano.

### RUP-4 · Reconciliar dónde vive el oro con lo que ya ships

- **Propuesta**: actualizar la lista (§2a) y **precisar** la segunda frase: de *«jamás codifica
  datos»* a *«el oro nunca es el único portador de un significado, y nunca codifica estado»*. El
  badge del beneficio lleva su cifra en texto: no es color como único portador.

### RUP-5 · Carruseles frente a «menor número de clics»

- **Regla nº1 de `CLAUDE.md`**, que manda sobre las otras tres.
- **La tensión es real**: un carrusel esconde contenido detrás de un gesto y mucha gente nunca
  desliza. En un catálogo cuyo propósito es **descubrir**, un carrusel mal puesto **reduce** el
  descubrimiento.
- **Dónde aportan** (entran): estanterías **secundarias y curadas** —categorías, novedades,
  promociones vigentes, y en la ficha sus promociones y sucursales—. Ahí no esconden:
  **comprimen una dimensión secundaria**.
- **Dónde serían un error** (no entran): **el listado principal**. Ese es el contenido.
- **Condición obligatoria**: **nada alcanzable únicamente deslizando.** Cada estantería lleva su
  «Ver todos» a la rejilla filtrada. Deslizar es un **atajo**, nunca el único camino. Así el
  número de clics **no aumenta**.
- **Propuesta para `CLAUDE.md`**: añadir esa condición como regla.

### RUP-6 · Una superficie que **no** sigue el tema: la placa del logo

- **Regla implícita**: todo se pinta con tokens que cambian por tema. La única excepción
  documentada es `QrCode`, negro sobre blanco en ambos temas.
- **Propuesta**: la placa que contiene el logo tiene un fondo **constante en los dos temas**,
  definido por un token propio.
- **Por qué es el mismo caso que `QrCode`**: son **assets ajenos que asumen fondo claro**. Un PNG
  transparente con logotipo oscuro desaparece sobre placa oscura (D10), igual que un QR
  invertido deja de escanearse. La causa es idéntica: el activo no es nuestro.
- **Lo que NO es**: no es permiso para literales. `QrCode` los usa por excepción sancionada;
  **aquí se define un token** (T5) y se usa `var(--…)`.

### Lo que este plan explícitamente **NO** rompe

| Regla | Por qué se mantiene |
|---|---|
| **«Son dos puertas al mismo club»** | P3 rediseña **las seis** pantallas a la vez. El principio queda intacto |
| **La ranura `@modal` vive solo en `app/admin/layout.tsx`** | La ficha es **navegación push, no overlay**. En el idioma de Apple el contenido se empuja; la hoja es para tareas. Es la ruptura que más fácil se cuela por reflejo —«un formulario no navega»— y no aplica |
| **Estado de membresía binario, derivado con `derivarEstadoMembresia`** | §2b: **el producto no es binario, el estado sí.** Este eje no se toca. `SCOPE.md` §7: tocar esa función es propuesta a `tech-lead` |
| **Color nunca como único portador de significado** | Es a11y |
| **Nada de `orum-*`, literales, `style={{}}` para maquetar, `none` en listas de sombras, `outline: none` sin sustituto** | **D13 y D7 se corrigen en esa dirección**, no se amplía |
| **`backdrop-filter` solo en cromo fijo** | Rendimiento en gama media, y **las tarjetas y estanterías son filas de lista** |
| **`QrCode` negro sobre blanco en los dos temas** | Invertirlo rompe el escaneo en la caja |
| **Páginas = Server Components** | 16 de los 27 componentes de `ui/` son de servidor. Afecta a D9 |
| **`estilosAuth` para las clases del formulario de acceso** | La sacudida usa `:has(.alerta)` y **ambas clases deben salir del mismo módulo** (`pantalla-auth.module.css:146`). Moverlas la rompe **en silencio** |

---

## Decisiones de diseño técnico

| Decisión | Alternativas descartadas | Razón |
|---|---|---|
| **D14 se arregla en el primer commit, antes que nada estético** | Meterlo con el rediseño del catálogo | La aplicación **promete lo que la caja deniega**. Eso no es un defecto de diseño: es el producto mintiéndole al socio delante del comercio. Y es un arreglo de tres líneas que ya tiene función pura con 6 tests. Esperar al final de un rediseño de seis pantallas para dejar de mentir no se sostiene |
| **La cadena de logo es comercio → marca → inicial** | Solo comercio → inicial | `marcas.logo_url` existe y ya está en `database.types.ts:125`. Un comercio de una cadena sin logo propio **sí tiene logo**. Rellena huecos y es cero backend |
| **«Nuevos en el club» entra como estantería real** | Dejarlo en propuestas | `comercios.created_at` está confirmado en el esquema **y en `database.types.ts:101`**. Basta añadirlo al `select` de `page.tsx:77` y ordenar. Es curaduría **real**, salida de un dato real — a diferencia de «Destacados», que sigue bloqueado |
| **Los logos se presentan en una placa común**: proporción fija, `object-fit: contain`, relleno, fondo constante (RUP-6) | Mantener `cover` | `cover` cambia deformación por **mutilación** (D8). **Un logo se muestra entero o no se muestra.** El relleno común es lo que hace que logos distintos se lean como colección. **El comentario de `comercio-logo.module.css:7-8` no se borra: se actualiza.** Diagnosticó bien y eligió mal |
| **El respaldo ante imagen rota se resuelve, si se puede, sin convertir `ComercioLogo` en cliente** | `onError` sin más | Es **Server Component** y el catálogo pinta hasta 100. **Camino propuesto**: la inicial se renderiza siempre como fondo de la placa y el `<img>` va encima con fondo opaco; al fallar, aparece la inicial. Con `alt=""` —que además es lo correcto por D12— un `<img>` roto no debería pintar icono de rotura. **NO verificado**: T13 lo comprueba en Chrome, Firefox y Safari; **si alguno lo pinta, pasa a cliente con `onError`** y se acepta el coste. Lo que no se acepta es el icono roto |
| **`alt=""` cuando el nombre está visible al lado** | Mantener `alt="Logo de X"` | D12. `ComercioLogo` gana prop `decorativo`, como `Avatar`. **El arreglo de accesibilidad y el de la imagen rota son el mismo arreglo** |
| **`next/image` NO entra en esta iteración** | Migrar ya | Requiere `remotePatterns`, y hoy los hosts son arbitrarios: cubrirlos exige `hostname: '**'`, que abre un **proxy de optimización a cualquiera**. Entra después, si se aprueba el bucket de `PROPUESTA-BACKEND-imagenes.md` |
| **La categoría entra como fila de chips deslizable**, no como quinto `<select>` | Ampliar `FiltrosForm` | A 375px el formulario ya colapsa a una columna (`filtros-form.module.css:20-24`): un quinto desplegable son **cinco campos apilados antes del primer comercio**. Una fila de categorías ocupa una línea y **muestra el contenido en vez de esconderlo** |
| **Los chips son enlaces, no campos** | Un `<select>` en el `method="get"` | `<Link href="?categoria_id=3">` es **un toque, cero pulsaciones de «Filtrar»**: la regla nº1. Funciona sin JavaScript, queda en la URL y sobrevive al refresco, que es la convención del repositorio (`page.tsx:99` la documenta) |
| **Carruseles con scroll nativo y `scroll-snap`** | Una librería | El scroll nativo ya cumple **por construcción** lo que `CLAUDE.md` exige de un gesto: seguimiento 1:1, resistencia elástica y proyección de momento del sistema operativo. Es **compositor puro**, funciona sin JavaScript y el foco lo desplaza el navegador. Una librería habría que auditarla entera y casi seguro perdería |
| **La ficha de comercio ENTRA**, ruta real `/miembros/comercios/[id]` | Tarjeta no clicable; overlay interceptado | Lo primero es incompatible con el encargo; lo segundo exigiría una ranura `@modal` nueva para conseguir el patrón **equivocado**. No necesita backend |
| **Se aplica `<ViewTransition>`** al par tarjeta → ficha | Aplazarlo | Deuda #1, habilitada y sin estrenar, y **es aquí donde por fin hay sujeto**: logo y nombre persisten |
| **El movimiento estructural se decide ANTES de implementar** | Todo `motion-ux-polish` en FASE 5 | Los `view-transition-name` viven en el **marcado**. Si eso llega en FASE 5, se reescribe el marcado de cuatro pantallas. T7 es solo lectura y **no propone curvas ni resortes** |
| **`accessibility-auditor` valida el sistema ANTES de implementar** | Auditar solo el resultado | El sistema debe **nacer** cumpliendo. Es solo lectura: adelantarlo no rompe la regla de un solo escritor |
| **`security-auditor` entra** | Omitirlo, «es visual» | T16 crea una ruta nueva que lee la base en superficie de usuario final; T14 añade consultas; y hay dos asuntos reales: el navegador del socio pide a hosts de terceros en cada render, y **`codigo_publico` es un uuid sin usar mientras el QR lleva 8 dígitos** |
| **Aprobación visual tras el acceso, no tras todo** | Enseñar las seis pantallas al final | «Atractivo, lujoso, innovador» es subjetivo y **ningún DoD lo captura**. El acceso carga la dirección de arte completa con casi nada de layout: es donde se falla barato |
| **El carnet recibe ancho máximo y se centra** | Estirarlo hasta `--content-max: 1100px` | Causa del hueco reportado: `perfil.module.css:31`. Un carnet de 1100px no es un carnet |
| **El conmutador de tema sale de la cabecera** | Dejarlo | Apple lo entierra; aquí compite con **las dos únicas pestañas que importan**. Y el corolario «al sacar algo, comprueba el móvil» **está cubierto**: cabecera y avatar se renderizan a todos los anchos (`layout.tsx:42-82`) |
| **Ningún formulario nuevo** | — | Cero gemelas `@modal`, cero ranuras nuevas |
| **Ningún `@media` nuevo dentro de `<main>`** | — | `.main` declara el contenedor `contenido` (`portal.module.css:174-175`) |

---

## Tareas

Nomenclatura de `WORKFLOW.md`. **Solo `frontend-implementer` escribe código de producto.**
`qa-tester` escribe en `src/lib/**/*.test.ts`.

---

### FASE 1 — PLANIFICACIÓN Y NORMA

#### T1 — Aprobación del plan y de la propuesta de imágenes · **BLOQUEANTE HUMANO**
- **Descripción**: aprobar, corregir o rechazar el alcance, las **seis** rupturas y las
  exclusiones. Y responder **Q1**: si `.claude/docs/PROPUESTA-BACKEND-imagenes.md` se lleva al
  equipo backend y con qué prioridad.
- **DoD**: aprobación explícita. **Sin esto no se escribe una línea de código.** Q1 no bloquea:
  solo decide si `next/image` entra en una iteración posterior.

#### T2 — Spec de las seis pantallas · **móvil primero**
- **Agente**: `ux-designer` · **Depende de**: T1
- **Descripción**: la spec única. Flujos, estados y copy son dominio suyo. **Lienzo canónico
  375×667.**
  1. **Acceso** — primera impresión (P3). El propietario lo quiere «mucho mejor y no tan
     genérico». **Cubre las seis pantallas**, porque `PantallaAuth` es una sola envoltura. Se
     conservan los aciertos técnicos ya verificados (ver T10).
  2. **Catálogo** — **fila de categorías**, **estanterías**, rejilla y **presentación de los
     logos**. El estado vacío **está bien resuelto y no se rehace**; hay que definir el vacío
     **por categoría**, que es nuevo. Y el vacío nuevo de D14: un comercio cuyas promociones
     han caducado todas.
  3. **Ficha de comercio** (nueva). Estados: inexistente o inactivo (`notFound()`), sin
     promociones vigentes, sin sucursales, sin descripción, **sin logo propio pero con logo de
     marca**, **sin ninguno de los dos**, y **con logo roto**. Son estados distintos.
  4. **Carnet**. Resolver el hueco central. Debe funcionar **impreso**
     (`perfil.module.css:121-126`). **`plan?.nombre` se mantiene**: §2b lo confirma correcto.
  5. **Estado inactivo**. Que el socio quiera volver, no que se sienta expulsado.
  6. **Cromo** (cabecera, barra inferior, menú de cuenta).

  **Cuatro decisiones que la spec debe cerrar:**
  - **La placa del logo**: proporción, tamaño por contexto, relleno y qué fondo lleva en cada
    tema (RUP-6). Y cómo se ve un logo **de marca** frente a uno propio: ¿se distinguen?
  - **Fila de categorías**: cuántas caben a 375px sin desplazar, qué pasa con «Todas», cómo se
    ve la activa (el color no puede ser el único portador) y dónde va el «Ver todos» (RUP-5).
    **Sin icono ni color por categoría**: `categorias` es solo `id, nombre`.
  - **Estanterías**: las tres construibles son **categorías**, **novedades** (`created_at`) y
    **promociones vigentes**. **«Destacados» no tiene columna que lo soporte** (§8) y va a B5:
    **no se especifica como si existiera**.
  - **La tarjeta sin promociones**, que con D14 arreglado será **más frecuente**. Reserva el
    mismo alto con divisoria y «Sin promociones activas por ahora». **Antes de tocarlo, léase el
    comentario de `comercio-card.module.css:64-66`**: la divisoria existe para que las
    promociones caigan a la misma altura en todas las tarjetas, que es lo que se compara. Se
    propone una alternativa que resuelva ambas cosas, o se argumenta por qué la alineación pesa
    menos.
- **Restricciones**: sin paginación, «ver más», scroll infinito ni contador de totales; sin
  ordenación elegible; sin filtro por estado; sin toasts; sin historial de beneficios; sin
  destacados.
- **DoD**: spec en `.claude/docs/`, **a 375px primero**, con todos los estados de las seis
  pantallas, copy literal, jerarquía de encabezados de cada una (un `<h1>`, sin saltos — D5 se
  cierra desde aquí), y una sección **«lo que no se puede ofrecer y por qué»** citando §8.

#### T3 — Auditoría de la spec: ergonomía táctil y convenciones Apple
- **Agentes**: `mobile-ux-specialist` y `apple-hig-specialist`, en paralelo · **Depende de**: T2
- **Descripción**: **auditan la spec; no producen una paralela.** Con P2 es el filtro principal.
  `mobile-ux-specialist`: alcance del pulgar, ≥44px, 280-430px, teclado, y **el gesto de los
  carruseles** —que la fila de categorías no atrape el desplazamiento vertical, el fallo
  clásico—. Línea base medida: el catálogo **actual** a 375px tiene **cero desbordamientos y
  cero áreas bajo 44px**. No puede empeorar.
  `apple-hig-specialist`: safe areas (`portal.module.css:205-206`) contra el `padding-bottom` de
  `.main` (`:185-191`); `100dvh` (`:4`) con las barras dinámicas de Safari;
  `-webkit-line-clamp`; Dynamic Type; VoiceOver en carnet, ficha y carruseles; y si la ficha se
  comporta como vista empujada de iOS.

#### T4 — Dirección de arte y extensión del sistema
- **Agente**: `design-system-architect` · **Depende de**: T2
- **Entregables**:
  1. Tokens **nuevos** y por qué ninguno de los 145 servía. **Nada cambia de valor** (P1).
  2. **Tabla de contrastes recalculada, completa** —la de `CLAUDE.md` es normativa—, con
     **sección aparte para las pantallas de acceso**, que se sirven siempre en oscuro.
  3. **El token de la placa del logo** (RUP-6): fondo constante en ambos temas, con su contraste
     contra la superficie de la tarjeta calculado en los dos. **No un literal.**
  4. Qué variantes existentes cubren el rediseño (`Card variant="brand"`, `Button
     variant="gold"`, `Badge tone="gold"` ya existen) y cuáles hay que crear. **Antes de crear
     una, demostrar que ninguna sirve**: hay **11 componentes del catálogo que hoy solo usa la
     galería de desarrollo**, superficie probada y gratis.
  5. La forma canónica del carrusel como primitiva: contenedor, `scroll-snap`, tamaño de tarjeta,
     sangrado. Si acaba en `src/components/ui/`, debe ser **Server Component**.
  6. Coste de convertir en cliente cualquier componente de servidor.
- **DoD**: documento en `.claude/docs/` con tokens, tabla completa, token de la placa, mapa de
  variantes, forma del carrusel, y afirmación explícita de **no-regresión** para el panel y el
  Portal de Comercios.

#### T5 — Validación de accesibilidad **del sistema, antes de implementarlo**
- **Agente**: `accessibility-auditor` · **Depende de**: T4
- **Descripción**: que la paleta de T4 **nace** cumpliendo WCAG 2.1 AA. Hoy 0 fallos.
  - **RUP-1 se juega aquí.** Recalcular con el algoritmo: texto tinta sobre el relleno dorado
    (¿≥4.5:1?) y borde contra la superficie clara **y** la oscura (¿≥3:1, 1.4.11?). Si alguna
    falla, **el veredicto es que el primario vuelve a tinta**. No se propone un apaño de borde
    para salvar la estética.
  - Toda la tabla de T4, fila por fila, incluida la prohibida (`--gold-500` sobre blanco,
    2.49:1) y la sección del acceso en oscuro.
  - **La placa del logo (RUP-6)**: ≥3:1 de borde contra la superficie de la tarjeta **en los dos
    temas**, o un filo que lo dé.
  - **Los carruseles**: todo alcanzable con teclado y lector **sin deslizar** (RUP-5), y la fila
    con nombre accesible.
  - Ninguna señal confiada solo al color: categoría activa y estado de membresía llevan forma o
    texto.
  - `:focus-visible` en todo interactivo, incluida la tarjeta navegable y los chips.
- **DoD**: tabla firmada, ratio por ratio, con el veredicto de RUP-1 **en la primera línea**.
  Cero filas sin número.

#### T6 — Dictamen de movimiento estructural
- **Agente**: `motion-ux-polish` · **sombrero de diagnóstico** · **Depende de**: T2
- **Descripción**: **tres preguntas estructurales**, las únicas que condicionan el marcado:
  1. `<ViewTransition>` tarjeta → ficha: qué elementos reciben `view-transition-name`, con qué
     nombre, y cómo se garantiza que sea **único por documento**. **El logo es el candidato
     natural**, y hay que decidir qué ocurre cuando ese logo es el respaldo tipográfico o el de
     la marca en vez del propio.
  2. **Carrusel: ¿scroll nativo con `scroll-snap`, o gesto propio?** La recomendación es scroll
     nativo. Si se propone gesto propio, demostrar qué aporta que el sistema operativo no dé ya,
     y usar `proyectarMomento` y `amortiguarBorde`, no una reimplementación.
  3. Si entrada y salida recorren el mismo camino, y qué pasa con el botón atrás.
- **NO hagas**: proponer curvas, duraciones ni resortes. Eso es T27 y se tiraría.
- **Recordatorios que ya costaron una sesión**: en motion 12 la forma correcta para animar un
  número es la de **valor único**, `animate(desde, hasta, opciones)`; la otra no lanza,
  simplemente no anima. Y `getComputedStyle` durante una transición da falsos negativos: en una
  pestaña que el navegador no pinta, las transiciones no avanzan.

#### T7 — Revisión de `CLAUDE.md` · **ENTREGABLE OBLIGATORIO · PUERTA DURA**
- **Agente**: `docs-handoff` redacta. **La aplica el propietario.**
- **Depende de**: T4, T5, T6
- **Momento**: **antes de FASE 2.** Cada agente relee `CLAUDE.md` en cada sesión. Si la norma
  sigue diciendo «el oro no es color de acción» y «≤5%», el siguiente `code-reviewer` reportará
  el rediseño como violación, `frontend-implementer` lo corregirá obedientemente, y **el
  rediseño se revertirá solo**, sin que nadie decida revertirlo.
- **Descripción**: `.claude/docs/PROPUESTA-CLAUDE-MD.md` con el **antes y el después literal**,
  para que aplicarlo sea copiar y pegar:
  - **«El oro»**: RUP-1, RUP-2, RUP-4.
  - **La tabla de contrastes completa**, sustituida por la de T5. Es normativa y hay agentes que
    la citan literalmente.
  - **«Movimiento»**: la frase de RUP-3.
  - **«Las cuatro reglas que mandan»**: la condición de RUP-5 junto a la regla nº1.
  - **«Componentes»**: RUP-6, la placa del logo como segunda superficie que no sigue el tema,
    con `QrCode` como precedente y su diferencia (token, no literal).
  - **🔴 «Lo que ORUM es», líneas 16-17 — la corrección de más calado.** Hoy dicen: *«Un solo
    producto: la membresía mensual. No hay niveles ni planes premium. El estado de un miembro es
    binario»*. **El esquema real lo desmiente** (§2b): `planes_membresia` soporta varios planes
    con precio y duración propios. La frase **mezcla dos ejes independientes** y hay que
    separarlos:
    - **El producto NO es binario**: hay N planes, y el carnet mostrando `plan.nombre` es
      correcto.
    - **El estado de la membresía SÍ es binario**, y eso no se toca: sigue derivándose con
      `derivarEstadoMembresia` (`estado === 'activa' && fecha_fin >= hoy`).
    Separarlos importa más que la estética: mientras estén fundidos, un agente que lea «el
    estado es binario» puede concluir que los planes sobran y borrar el nombre del carnet.
  - **Deuda #1** (`viewTransition` sin aplicar): pasa a aplicada, con dónde.
  - **Deuda #4** (el portal solo visto en su acceso): ya no es cierta.
  - **No cambia**: «son dos puertas al mismo club». P3 la respeta rediseñando las seis.
- **Restricción de proceso, no negociable**: `CLAUDE.md` está fuera de la zona de trabajo de
  `SCOPE.md` §1 y gobierna a todos los agentes. **Ningún agente lo edita por iniciativa propia,
  ni con este plan aprobado.** La autorización es una acción explícita del propietario.
- **DoD**: propuesta con diff literal, aprobación explícita, `CLAUDE.md` actualizado en el
  repositorio. **Recién entonces empieza FASE 2.**

---

### FASE 2 — IMPLEMENTACIÓN

`frontend-implementer`, **en este orden**, **un commit por tarea**. Ninguna toca la zona de solo
lectura de `SCOPE.md` §2.

Convenciones: exportación **con nombre**, `export default` solo donde el App Router lo obliga;
kebab-case; dominio en español; `type`, nunca `interface`; `useToast()` **lanza** aquí;
`haptica.ts` lleva `'use client'`; estilos en `.module.css`, cero literales. **Toda captura de
DoD empieza por 375px** (P2).

#### T8 — Higiene: cinco defectos, y uno de ellos es de confianza
- **Depende de**: T7 aplicada
- **Archivos**: `miembros/(portal)/page.tsx` (D14) · `layout.module.css:25` (D1) ·
  `theme-script.tsx` y/o `src/app/layout.tsx` (D2) · `portal.module.css:247-259` (D3) ·
  `miembros/(portal)/layout.tsx:43-47` (D4)
- **Descripción**:
  - **🔴 D14 — promociones caducadas.** Importar `esPromocionVigente` y filtrar, **en los dos
    sitios**: la consulta de promociones por comercio (`page.tsx:139-146`) y la búsqueda por
    título (`:91-97`), que hoy hace aparecer un comercio por una promoción vencida. El patrón a
    copiar está en `comercios/(portal)/page.tsx:72`. La fecha de hoy se toma en la zona del
    negocio, no la del servidor. **Es el arreglo más importante de este commit**: hoy la app
    promete lo que la caja rechaza.
  - **D1**: guarda `minmax(min(var(--min, 240px), 100%), 1fr)`. No-op cuando el contenedor es más
    ancho que `--min`.
  - **D2**: que el script anti-parpadeo deje de producir un error de React en cada carga. **La
    forma la elige el implementador**; se exige el resultado, con dos mitades: cero errores **y**
    cero fogonazo.
  - **D3**: `transform: none` no anula `scale`. Bajo `prefers-reduced-motion` la barra recibe un
    **equivalente no vestibular**, no la ausencia de feedback.
  - **D4**: retirar el botón de WhatsApp de la cabecera y la clase `.soporteEscritorio`.
- **DoD**:
  1. Cuatro comandos en verde.
  2. **Con una promoción vencida en la base, el catálogo NO la muestra**, y buscar su título no
     hace aparecer el comercio. Dos capturas: antes y después.
  3. **Overlay de Next con 0 Issues** en `/miembros`, `/admin` y `/comercios`. Captura.
  4. Carga en frío con `data-theme=dark` **sin fogonazo**.
  5. Sin desbordamiento a 280/320/360/390/430px en las nueve rejillas. Aritmética **y** captura.
  6. Con `prefers-reduced-motion` la pestaña no escala y sí da feedback.
  7. La acción de soporte aparece **una sola vez** por pantalla.
- **Riesgo**: **medio-alto** (D1 toca 9 consumidores; D2 toca el arranque de todo el producto)

#### T9 — Acceso: las seis pantallas · **primera pantalla del rediseño (P3)**
- **Depende de**: T8
- **Archivos**: `src/components/ui/pantalla-auth.tsx` y `pantalla-auth.module.css` · los
  formularios de acceso si la spec lo pide
- **Descripción**: la primera impresión. Carga la dirección de arte completa con casi nada de
  layout, y por eso es donde se valida (T10). **Cambian las seis a la vez**: es lo que mantiene
  intacto «dos puertas al mismo club».
- **Reglas duras**:
  - **`estilosAuth` sigue siendo la fuente de las clases del formulario.** La sacudida usa
    `:has(.alerta)` (`pantalla-auth.module.css:146`) y **ambas clases deben salir del mismo
    módulo**. Moverlas la rompe **en silencio**.
  - **No remontar el formulario al fallar**: el `key={error}` va en el `Alert`, no en el `<form>`
    (`login-form.tsx:22-31`).
  - **Se conservan**, verificados: `inputMode="numeric"` con `type="text"` —el número lleva ceros
    a la izquierda y `type="number"` los descarta (`login-form.tsx:37-39`)—; `autoComplete`;
    `autoFocus`; el ojo con `InputButton`, que hace `preventDefault` en `onPointerDown` para no
    robar el foco; y `tabIndex: 0` — **nunca `tabIndex={-1}`**.
  - **D7**: el halo dorado pasa de `rgba(191,160,99,…)` a un token.
  - `prefers-reduced-transparency` y `prefers-reduced-motion` conservan su rama (`:85-105`).
- **DoD**: (1) cuatro comandos en verde; (2) **captura a 375×667 primero**, luego 1440px; (3) con
  credenciales malas el formulario **se sacude y conserva lo tecleado**; (4) en teléfono real,
  «Número de membresía» abre el **teclado numérico** y tocar el ojo **no cierra el teclado**;
  (5) contraste AA sobre superficie oscura con la tabla de T5; (6) cero literales: D7 cerrado;
  (7) **las seis pantallas compilan y se ven correctas** — captura de cada una.

#### T10 — **HITO DE APROBACIÓN DE DIRECCIÓN DE ARTE** · **BLOQUEANTE HUMANO**
- **Depende de**: T9
- **Descripción**: el propietario ve el acceso rediseñado —teléfono y escritorio— y dice **sí** o
  **no** antes de que se construya nada más.
- **Por qué**: «atractivo, elegante, lujoso, innovador» es subjetivo y **ningún DoD lo captura**.
  Si la interpretación del equipo no es la suya, es infinitamente más barato descubrirlo con
  **una pantalla de dos campos** que con seis.
- **DoD**: «sí, continúa», o correcciones concretas. Si es «no», se vuelve a T2; **no se sigue
  construyendo**.

#### T11 — Cromo del portal: cabecera, barra inferior, menú de cuenta
- **Depende de**: T10 aprobado
- **Archivos**: `(portal)/layout.tsx` · `portal.module.css` · `_components/portal-nav.tsx` ·
  `_components/menu-tema.tsx` **nuevo**, `'use client'`
- **Trampa verificada al planificar; no la descubras tú**: `ThemeToggle` renderiza un
  `SegmentedControl`, que son `<input type="radio">` en un `role="radiogroup"`
  (`segmented.tsx:56,70`). El menú vive **dentro de** `<form action={cerrarSesionMiembro}>`
  (`layout.tsx:56`). Consecuencias: (a) Enter con el foco en un radio dispara la **submisión
  implícita**, es decir **cierra la sesión**; (b) `DropdownMenu` mueve el foco entre
  `[role="menuitem"]` (`menu.tsx:80,87`) y un radio no lo es.
  **Solución prescrita**: tres `MenuItem` con `onSelect`, no el `SegmentedControl`. Como
  `layout.tsx` es Server Component y no puede pasar funciones a cliente, van en un componente de
  cliente propio que consume `useTheme()`.
- **DoD**: (1) cuatro comandos en verde; (2) con el foco en cualquier control de tema **Enter no
  cierra la sesión**, verificado a mano; (3) el menú se recorre con flechas y `Escape` lo cierra;
  (4) cambiar de tema **sin recargar**, sin salto del indicador durante la hidratación; (5) la
  pestaña activa se distingue por algo más que color; (6) `aria-current="page"` intacto.

#### T12 — `ComercioLogo`: la placa y la cadena de respaldo
- **Depende de**: T11
- **Archivos**: `src/components/ui/comercio-logo.tsx` y `comercio-logo.module.css` ·
  `miembros/(portal)/page.tsx` (añadir `logo_url` al `select` de `marcas`, `:56`) ·
  `_components/comercio-card.tsx`
- **Descripción**: cerrar D8–D13 y añadir la cadena de marca. Va **antes** del catálogo porque el
  catálogo lo usa y porque aquí se juega «profesional».
  1. **Cadena comercio → marca → inicial.** `marcas.logo_url` ya está en
     `database.types.ts:125`: cero trabajo de tipos. `page.tsx:56` ya consulta `marcas`; solo hay
     que pedir la columna y pasarla a la tarjeta.
  2. **D8** — `object-fit: contain` en caja de proporción fija, con relleno interior. **El
     comentario de `comercio-logo.module.css:7-8` se actualiza, no se borra**: diagnosticó bien y
     eligió mal el remedio, y esa distinción hay que dejarla escrita.
  3. **D10 + RUP-6** — placa con fondo **constante en ambos temas**, del token de T4. Nunca un
     literal.
  4. **D12** — prop `decorativo`, como `Avatar`. Con el nombre visible al lado, `alt=""`.
  5. **D9** — respaldo ante imagen rota. **Camino propuesto**: inicial siempre renderizada como
     fondo de la placa, `<img>` encima con fondo opaco. **Verificar en Chrome, Firefox y Safari**
     que un `<img>` roto con `alt=""` no pinta icono de rotura. **Si alguno lo pinta,
     `ComercioLogo` pasa a `'use client'` con `onError`** y se acepta el coste. Lo que no se
     acepta es dejar el icono roto.
  6. **D13** — el `size` sale de `style` de maquetación y pasa a custom property.
  7. **D11 queda fuera**: `next/image` no entra en esta iteración (ver Decisiones). **No se toca
     `next.config.ts`.**
  8. **El respaldo de la inicial se conserva** (P7), con su razonamiento de `:10-17` intacto.
- **DoD**:
  1. Cuatro comandos en verde.
  2. **Captura del catálogo con logos reales de proporciones distintas** —al menos uno cuadrado y
     uno apaisado—: **ninguno recortado, ninguno deformado**, mismo tamaño de placa y relleno.
  3. **Un comercio sin logo propio pero con marca muestra el logo de la marca.** Captura.
  4. **Captura con un `logo_url` muerto**: se ve la inicial, **nunca el icono de imagen rota**.
     Chrome, Firefox y Safari.
  5. **Captura con PNG transparente de logotipo oscuro, en tema oscuro**: se ve.
  6. Con lector de pantalla, la tarjeta anuncia el nombre **una sola vez** (D12 cerrado).
  7. `ComercioLogo` sigue siendo Server Component, **o** se documenta por escrito qué navegador
     lo impidió.
  8. Cero literales; el `size` no va en `style` de maquetación.

#### T13 — Catálogo: categorías, estanterías y rejilla
- **Depende de**: T12
- **Archivos**: `(portal)/page.tsx` · `_components/filtros-form.tsx` y su `.module.css` ·
  `_components/comercio-card.tsx` y su `.module.css` · componentes nuevos para la fila de
  categorías y las estanterías
- **Descripción**:
  1. **Consulta de `categorias`** sumada al `Promise.all` existente (`page.tsx:47-59`). **No** se
     encadenan `await` secuenciales: la paralelización se hizo en `e1fc40a`.
  2. **`created_at` al `select`** de comercios (`:77`, y el de la ruta por promoción en `:115`).
     Ya está en `database.types.ts:101`.
  3. **Fila de categorías**: chips que son **enlaces** (`?categoria_id=…`). Un toque, cero
     pulsaciones de «Filtrar». Sin JavaScript funciona y queda en la URL.
  4. **`searchParams`**: `categoria_id` se normaliza con el helper `primero()` que ya existe
     (`page.tsx:13`), porque Next entrega un array si el parámetro se repite. Este archivo es
     **el único de seis** que lo hace bien: no se pierda esa propiedad.
  5. **Estanterías**: las aprobadas en T2, de las tres construibles —categorías, **novedades por
     `created_at`**, promociones vigentes—. Scroll nativo con `scroll-snap` salvo dictamen
     contrario de T6. **Cada una lleva su «Ver todos»**: sin eso no se implementa (RUP-5).
  6. **Rejilla**: sigue siendo rejilla. **No se convierte en carrusel.**
  7. **D5**: la jerarquía de la tarjeta deja de saltar de h1 a h3.
- **Prohibiciones**: no tocar las consultas de resultados más allá del filtro de categoría, el
  `created_at` y el filtro de vigencia de T8 —el recorte de sobrefetching es T24—; no introducir
  `.range()`; **no poner `backdrop-filter` en tarjetas ni estanterías**; ningún `@media` nuevo
  dentro del contenedor `contenido`.
- **DoD**:
  1. Cuatro comandos en verde.
  2. **Captura a 375×667 sin desplazar**, contrastada contra la tabla del criterio estético.
     Luego 1440px.
  3. Filtrar por categoría funciona **con JavaScript desactivado**, queda en la URL, se comparte
     y sobrevive a un refresco.
  4. Combinar categoría con búsqueda, comercio, marca y ciudad da el resultado correcto, y
     «Limpiar» los borra **todos**. Se prueban las combinaciones, no se asumen.
  5. **La estantería de novedades ordena por `created_at` descendente**, y se comprueba contra
     dos comercios de fechas conocidas.
  6. Estado vacío **por categoría**, con salida.
  7. La estantería es recorrible **con teclado** y todo su contenido alcanzable **sin deslizar**.
  8. Sin desbordamiento a 280/320/360/390/430px. Aritmética **y** captura.
  9. Al desplazar la fila de categorías, **la página no se bloquea verticalmente**. En teléfono
     real.
  10. La tarjeta entera es navegable con `:focus-visible` propio, y el nombre **no** queda
      envuelto en un enlace dentro de otro enlace.
  11. `page.tsx` **sigue siendo Server Component**.
- **Riesgo**: **alto** (más superficie nueva y la que más fácil se estira)

#### T14 — Punto de control visual · **no bloqueante duro**
- **Depende de**: T13
- **Descripción**: capturas del catálogo a 375px y 1440px, claro y oscuro. **No detiene el
  trabajo.** Su valor: corregir densidad, jerarquía y **presentación de los logos** antes de que
  ese lenguaje se replique en la ficha y el carnet.

#### T15 — Ficha de comercio: `/miembros/comercios/[id]` · **RUTA NUEVA**
- **Depende de**: T13
- **Archivos**: `(portal)/comercios/[id]/page.tsx` **nuevo** · su `.module.css` **nuevo** ·
  `_components/portal-nav.tsx` (D6)
- **Reglas duras**:
  - **`requireMiembroVigente()` al entrar.** Sin excepción.
  - **`createClient()`, nunca `createAdminClient()`.** El panel usa service role; los portales de
    usuario final **jamás**. `admin.ts` lleva `server-only`.
  - `notFound()` si el comercio no existe, está inactivo o tiene `deleted_at`. Toda consulta
    filtra `.is('deleted_at', null)`.
  - **Solo promociones vigentes**: `esPromocionVigente`, el mismo criterio que T8 aplicó al
    catálogo. Una ficha que contradiga al catálogo sería peor que el bug original.
  - El beneficio se formatea con `formatearBeneficio`, que ya existe y tiene test.
  - **La cadena de logo de T12** aplica igual aquí.
  - `Promise.all` sobre las consultas independientes.
  - **D6**: `esActivo` debe marcar «Inicio» dentro de una ficha. Se **extrae a `src/lib/` como
    función pura**, para que `qa-tester` pueda cubrirla: hoy vive en un componente de cliente y
    `vitest` solo descubre `.test.ts`.
  - **Ninguna ranura `@modal`.** Es navegación push.
- **DoD**: (1) cuatro comandos en verde; (2) **captura a 375px primero**; (3) enlace directo abre
  la ficha completa y el botón atrás vuelve al catálogo **conservando scroll y filtros**; (4) una
  pestaña queda activa, con `aria-current`; (5) un id inexistente, inactivo o borrado da
  `notFound()`; (6) los seis estados de T2 —sin promociones vigentes, sin sucursales, sin
  descripción, con logo de marca, sin ningún logo, con logo roto— se ven **terminados**: seis
  capturas; (7) Server Component y sin `admin.ts`; (8) un `<h1>` (el nombre) y `metadata` con ese
  nombre.

#### T16 — Carnet: `/miembros/perfil`
- **Depende de**: T15
- **Archivos**: `perfil/page.tsx` · `perfil.module.css`
- **Descripción**: la credencial. Resolver el hueco central —`perfil.module.css:31`,
  `grid-template-columns: 1fr auto` estirado hasta `--content-max: 1100px`— con ancho máximo
  propio, centrado. Aplicar RUP-2 dentro de su límite.
- **Reglas duras**:
  - **El QR va negro sobre blanco en los dos temas.** Invertirlo rompe el escaneo en la caja.
  - **`plan?.nombre` se mantiene** (`:72`): §2b confirma que es correcto. El diseño debe soportar
    nombres de plan de longitud variable sin romperse, porque el esquema admite N planes.
  - El estado se **deriva** con `derivarEstadoMembresia`; nunca `membresias.estado` en crudo.
    Activa → verde, punto lleno. Inactiva → rojo atenuado, punto **hueco** con el motivo en
    texto. «Vence en N días» **no es un estado**: señal ámbar secundaria.
  - La vigencia es `'YYYY-MM-DD'` **civil**: `Date.UTC(...)` y `timeZone: 'UTC'`. Leerla en
    Bogotá la retrasa un día y el carnet ya anunció una vez el vencimiento antes de tiempo. El
    código actual lo hace bien (`:18-29`): **no lo «simplifiques»**.
  - `@media print` sigue funcionando (`:121-126`).
- **DoD**: (1) cuatro comandos en verde; (2) captura a 375px, carnet entero sin desplazamiento
  horizontal; (3) captura a 1440px **sin hueco muerto**; (4) **el QR se escanea de verdad**, con
  lector real, en claro y oscuro; (5) vista previa de impresión legible; (6) contraste AA en todo
  el texto, incluido el que caiga sobre superficie dorada; (7) el número sigue en `--font-mono`
  con `tabular-nums`; (8) **con un nombre de plan largo el carnet no se rompe**.

#### T17 — Estado inactivo, carga y error
- **Depende de**: T16
- **Archivos**: `inactiva/page.tsx` y su `.module.css` · `(portal)/loading.tsx` **nuevo** ·
  `perfil/loading.tsx` **nuevo** · `comercios/[id]/loading.tsx` **nuevo** ·
  `src/app/miembros/error.tsx` **nuevo**, `'use client'`
- **Descripción**: cerrar los tres agujeros de continuidad. Hoy no hay `loading.tsx` ni
  `error.tsx` en ninguna ruta de `/miembros` y `RouteProgress` solo se monta en
  `src/app/admin/layout.tsx:44`: la navegación es **toque → nada → salto**. Va al final porque un
  esqueleto debe parecerse a **la pantalla nueva**.
  - Esqueletos con `src/components/ui/skeletons.tsx`. El del carnet **no es una tabla**.
  - `error.tsx` sigue el patrón de `src/app/admin/error.tsx`. Copy de T2.
  - `RouteProgress` **solo si T20 lo aprueba**: arrastra `Suspense` y `useSearchParams`.
- **DoD**: (1) cuatro comandos en verde; (2) con la red a «Slow 3G», tocar cada pestaña y abrir
  una ficha **muestra el esqueleto antes que la pantalla** — tres capturas, sin necesidad de
  redimensionar la ventana; (3) el esqueleto lleva `data-motion-esencial` y **sigue animando**
  bajo `prefers-reduced-motion`; (4) no es ruido para el lector de pantalla; (5) un `<h1>` en el
  error, con salida accesible por teclado; (6) `/miembros/inactiva` ofrece una salida real.

---

### FASE 3 — AUDITORÍA

Los seis **en paralelo**, solo lectura. Alcance: **el diff de FASE 2**. Formato de
`REVIEW_SEVERITY.md`.

| # | Agente | Foco específico |
|---|---|---|
| T18 | `accessibility-auditor` | **Auditor principal.** Que la tabla firmada en T5 se implementó tal cual: contraste medido **sobre la captura**. Carruseles: todo alcanzable con teclado y lector **sin deslizar** (RUP-5). Placa del logo: contraste contra la tarjeta en ambos temas, y que la tarjeta anuncie el nombre **una sola vez** (D12). `:focus-visible` en tarjeta navegable, chips y salida del error. Encabezados de las seis pantallas (D5). Áreas ≥44px, con `::after` de `var(--tap-min)` donde el control deba verse pequeño y `min-height` bajo `@media (pointer: coarse)` en filas anchas. **Un solo fallo AA es nivel 1 y bloquea** |
| T19 | `code-reviewer` | ESLint **no tiene ni una regla propia**: las prohibiciones de `CLAUDE.md` solo las ve un humano o tú. Literales de color, espaciado, radio y duración; `@media` donde tocaba `@container`; animación de propiedades de layout; `none` en listas de sombras; `outline: none` sin sustituto; `backdrop-filter` en filas de lista; **`style` para maquetar** (D13). Convenciones: exportación con nombre, `type` y nunca `interface`, kebab-case, español. Y que **la norma auditada sea la de T7** |
| T20 | `performance-engineer` | (a) **Peso real de los logos en el catálogo lleno y su efecto en LCP** — decide si D11 quedó documentado o escalado; (b) coste de la navegación catálogo → ficha; (c) coste de las consultas nuevas —categorías, `created_at`, `marcas.logo_url`— y del render de las estanterías; (d) si el sobrefetching de `page.tsx:47-59` es recortable **dentro de `page.tsx`** — habilita o descarta T24; (e) si conviene `RouteProgress` |
| T21 | `security-auditor` | Cuatro frentes. (1) La ruta nueva: `requireMiembroVigente()`, `createClient()` y no `admin.ts`, `deleted_at` y `activo` filtrados, y que el `[id]` no permita enumerar comercios inactivos. (2) `categoria_id` llega de la URL: entrada no confiable. (3) **`logo_url`**: el navegador del socio pide a hosts de terceros en cada render —IP y User-Agent en registros ajenos—, nadie valida el esquema (`http://` ⇒ bloqueo por contenido mixto ⇒ imagen rota), y **`next.config.ts` no debe haber ganado `remotePatterns` abiertos**. (4) **Observación, no tarea**: `miembros.codigo_publico` es un uuid que **no usa nadie** mientras el QR del carnet lleva `numero_membresia` de 8 dígitos (`perfil/page.tsx:100`). Valorar si es un riesgo de enumeración; cambiarlo cruza la frontera (`buscar_miembro_comercio`) |
| T22 | `mobile-ux-specialist` | Contra la línea base: el catálogo actual a 375px tenía **cero desbordamientos y cero áreas bajo 44px**. No puede empeorar. Rango 280-430px. Gesto de los carruseles en dispositivo real |
| T23 | `apple-hig-specialist` | Safe areas contra el `padding-bottom` de `.main`; `100dvh` con las barras dinámicas de Safari; `-webkit-line-clamp`; Dynamic Type; VoiceOver en carnet, ficha y carruseles; si la ficha se comporta como vista empujada de iOS; y si el `backdrop-filter` del cromo se sostiene en gama media |

#### Bucle de corrección
- **Agente**: `frontend-implementer` · **Depende de**: T18–T23
- **Descripción**: ordenar por severidad global y aplicar en ese orden. Si discrepa, lo argumenta
  por escrito; **no lo omite en silencio**. Tras niveles 1 y 2 se re-audita **solo el dominio
  afectado**.
- **DoD**: cero hallazgos de nivel 1 abiertos. **Cero fallos AA, sin excepción.**

#### T24 — Recorte del sobrefetching de `/miembros` · **CONDICIONAL**
- **Depende de**: T20 (solo si cuantifica una ganancia)
- **Prohibiciones**: no abrir `actions.ts` ni `src/lib/supabase/**`; no convertir `Promise.all`
  en `await` secuenciales; no introducir `.range()`.
- **DoD**: consultas y filas antes y después, medidas. El desplegable de filtros y la fila de
  categorías conservan **exactamente** las mismas opciones: se comparan las listas.

---

### FASE 4 — VERIFICACIÓN

#### T25 — Pruebas y protocolo manual
- **Agente**: `qa-tester` · **Depende de**: FASE 3 cerrada
- **Zona de escritura**: `src/lib/**/*.test.ts`, **solo funciones puras**
- **Descripción**:
  1. **Tests automatizados** sobre lo testeable: `esActivo` extraída en T15 (ahora con tres
     formas de ruta), y cualquier mapeador puro de la ficha, del agrupado por categoría o de la
     **cadena de logo comercio → marca → inicial**, que es una función pura de tres ramas y
     barata de cubrir. Si sobra capacidad: `limpiarTermino` (`buscar-miembros.ts:31`), que
     **sanea la entrada de un filtro `.or()` de PostgREST**.
  2. **Protocolo de verificación manual**, la entrega de valor real. Guion para una persona con
     un teléfono: acceso con credenciales buenas y malas **en las seis pantallas**; **catálogo
     con una promoción vencida en la base, que no debe aparecer**; catálogo con y sin filtros,
     por categoría, y con JavaScript desactivado; **catálogo con un `logo_url` muerto, con un
     comercio sin logo propio pero con marca, y con un PNG transparente en tema oscuro**;
     catálogo → ficha → atrás conservando scroll y filtros; carnet en claro y oscuro con el **QR
     escaneado por un lector real**; `/miembros/inactiva`; red lenta; `prefers-reduced-motion`;
     teclado completo sin ratón, incluidos los carruseles; y Enter en el menú de tema, que **no**
     debe cerrar la sesión.
- **Restricción**: `vitest` solo descubre `src/**/*.test.ts`. Un `.test.tsx` se escribe, se
  guarda y **nunca se ejecuta ni falla**. No escribas ninguno.
- **DoD**: cuatro comandos en verde. Protocolo en `.claude/docs/`. Cada bug con pasos de
  reproducción y severidad.

---

### FASE 5 — PULIDO

#### T26 — Movimiento, ahora que hay algo que animar
- **Agente**: `motion-ux-polish` · **sombrero de pulido** · **Depende de**: T25 en verde
- **Descripción**: transición tarjeta → ficha; entrada del esqueleto y relevo al contenido;
  feedback de pestañas y chips; ajuste fino del `scroll-snap`; entrada del carnet y del acceso.
- **Reglas duras**: presets de `src/lib/shared/motion.ts`; curvas y duraciones de `tokens.css`;
  `bounce: 0` por defecto —**el rebote se gana**—; feedback en `pointerdown`, no en `click`;
  entrada y salida por el mismo camino; solo `transform` y `opacity` en lo escrito a mano;
  `prefers-reduced-motion` recibe un equivalente no vestibular.
- **DoD**: propuestas priorizadas, con coste y forma de verificación. Las aplica
  `frontend-implementer`. **Cada cambio se verifica con captura**, nunca con `getComputedStyle`
  durante la transición: en una pestaña que el navegador no pinta las transiciones no avanzan.
  Ya dio tres diagnósticos falsos seguidos.

---

### FASE 6 — CIERRE

#### T27 — Coherencia visual · **Depende de**: T26
- **Agente**: `design-system-architect` · **modo AUDITAR**
- **Descripción**: que lo implementado coincide con los tokens y variantes de T4; que **el panel
  y el Portal de Comercios se ven exactamente igual que antes** (P1) —**salvo las pantallas de
  acceso, que cambian a propósito por P3**—; presupuesto de oro **medido sobre la captura**,
  incluidas las dos excepciones de RUP-2; cero literales fuera de la excepción de `QrCode`; y la
  tabla del criterio estético, fila por fila.

#### T28 — Documentación y reconciliación de la norma · **Depende de**: T27
- **Agente**: `docs-handoff`
- **Descripción**:
  1. Documentar en `.claude/docs/`: **la placa del logo y sus siete decisiones, incluida la
     cadena comercio → marca → inicial** —es lo que se olvidará primero y lo que más se nota si
     se pierde—; el patrón de la ficha; la primitiva de carrusel y por qué es scroll nativo; el
     filtro por categoría como enlace; la guarda de `Grid`; y el patrón de
     `loading.tsx`/`error.tsx` fuera de `/admin`.
  2. **Corregir `ARCHITECTURE.md` (D15)**: afirma que `promocion-vigente.ts` lo consumen «Portal
     de Comercios y de Miembros». **Es falso** y contribuyó a que D14 pasara desapercibido: lo
     consumen `comercios/(portal)/page.tsx:72` y `actions.ts:149`, y **nadie más**. Añadir
     también que `comercios.created_at` y `marcas.logo_url` existen y ahora se usan.
  3. Marcar `.claude/docs/PLAN-portal-miembros.md` como `SUSTITUIDO`.
  4. **Segunda pasada sobre `CLAUDE.md`** si la implementación se apartó de la norma de T7.
     Mismo proceso: `docs-handoff` redacta, **el propietario aplica**.
- **Restricción**: `docs/**` es solo lectura. Se cita, no se reescribe.

---

## Secuencia de ejecución

```
FASE 1 ── T1 APROBACIÓN DEL PLAN + Q1 (propuesta de imágenes)      [día 1]
              ↓
          T2 ux-designer · MÓVIL PRIMERO ──┬─→ T3 mobile-ux ║ apple-hig  [auditan la spec]
                                           ├─→ T4 design-system-architect
                                           │        ↓
                                           │   T5 accessibility  ← VEREDICTO RUP-1
                                           └─→ T6 motion (dictamen estructural)
                                                    ↓
                                    T7  REVISIÓN DE CLAUDE.md
                                    ██  PUERTA DURA: sin esto, FASE 2 no arranca  ██
              ↓
FASE 2 ── T8 higiene  ← incluye 🔴 D14, promociones caducadas
              ↓
          T9 ACCESO · las seis pantallas (P3)
              ↓
          T10  ██ HITO: APROBACIÓN DE DIRECCIÓN DE ARTE ██  (propietario)
              ↓
          T11 cromo → T12 PLACA DEL LOGO → T13 CATÁLOGO → T14 punto de control
              ↓
          T15 ficha de comercio → T16 carnet → T17 inactiva + carga + error

              ↓
FASE 3 ── T18 a11y ║ T19 code ║ T20 perf ║ T21 security ║ T22 mobile ║ T23 apple  [paralelo]
              ↓
          frontend-implementer aplica por severidad → re-auditoría del dominio afectado
          T24 sobrefetching (condicional a T20)
              ↓
FASE 4 ── T25 qa-tester  →  correcciones   [repetir hasta verde]
              ↓
FASE 5 ── T26 motion-ux-polish  →  frontend-implementer aplica
              ↓
FASE 6 ── T27 design-system-architect (AUDITAR)  →  T28 docs-handoff
```

**Dos puertas duras**: T7 (la norma, antes de codificar) y T10 (la dirección de arte, con una
sola pantalla construida). T14 es punto de control, no puerta.

**Ruta crítica**: T1 → T2 → T4 → T5 → T7 → T9 → T10 → T12 → T13 → T15/T16 → FASE 3 → T25.

**T12 va antes que T13** a propósito: el catálogo consume la placa, y construirlo sobre logos mal
presentados obligaría a rehacerlo.

**Si hay que entregar algo antes que el rediseño**, es **T8**: D14 es un defecto de confianza
vivo en producción y su arreglo no depende de ninguna decisión estética. Puede adelantarse como
commit suelto sin esperar a T7.

---

## Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| **R1** | **Regresión de contraste AA.** Hoy 0 fallos. RUP-1 convierte el oro en color de acción y `--gold-500` sobre blanco da **2.49:1** frente a los 3:1 de 1.4.11 | Media | **Muy alto** | (1) **T5 firma la tabla ANTES de implementar** y su veredicto es vinculante: si el oro no llega, el primario vuelve a tinta. (2) T18 mide sobre la captura. (3) Un solo fallo AA es nivel 1 y **bloquea el cierre** |
| **R2** | **Los logos ajenos arruinan el resultado.** Rotos (D9), invisibles en oscuro (D10), mutilados (D8), pesados (D11). **El activo no es nuestro y llega como cada comercio quiera** | **Alta** | **Muy alto** | T12 es tarea propia, **antes del catálogo**, con ocho DoD verificados con logos reales de proporciones distintas, uno muerto, uno transparente y uno solo-de-marca. T20 mide el peso; T21 mira esquema y hosts. **El respaldo de la inicial se conserva** y ahora hay un escalón más: la marca |
| **R3** | **`CLAUDE.md` se revisa tarde o no se revisa.** Si sigue diciendo «el oro no es color de acción», el siguiente `code-reviewer` lo reportará como violación y el implementador lo corregirá. **El rediseño se revierte solo.** Y con la corrección de §2b hay un riesgo añadido: mientras «producto» y «estado» sigan fundidos en una frase, un agente puede concluir que los planes sobran y **borrar el nombre del plan del carnet** | Media | **Muy alto** | T7 es **puerta dura**: FASE 2 no arranca sin `CLAUDE.md` actualizado. La separación de los dos ejes está redactada explícitamente en su DoD. T28 hace una segunda pasada |
| **R4** | **El resultado no le parece «lujoso» al propietario.** Criterio subjetivo que ningún DoD captura | Media | Alto | La tabla del criterio estético convierte seis adjetivos en seis criterios comprobables. Y **T10**: el juicio se pide con **una pantalla de dos campos**, no con seis. T14 refuerza con la densidad del catálogo |
| **R5** | **D14 destapa que el catálogo se queda muy vacío.** Si muchas promociones están caducadas, filtrar bien puede dejar tarjetas sin nada que mostrar y el catálogo se verá **más pobre** justo después del arreglo | Media | Medio | Es la consecuencia correcta de dejar de mentir, no un motivo para no arreglarlo. T2 debe especificar la tarjeta sin promociones vigentes **contando con que será frecuente**, y el catálogo tiene ahora tres estanterías y el filtro por categoría para llenar la pantalla con contenido real |
| **R6** | **Los carruseles reducen el descubrimiento** y tensionan la regla nº1 | Media | Alto | RUP-5: estanterías **secundarias y curadas**, rejilla principal **sin convertir**, y **nada alcanzable solo deslizando**. T18 lo verifica con teclado y lector; si falla, es nivel 1 |
| **R7** | **El rediseño se filtra al panel** por `tokens.css` y los componentes compartidos: `Button` en 34 archivos, `Grid` en 9, `ComercioLogo` en 2 (pronto 3). Rompería P1 | Media | Alto | T4 debe demostrar que **todo lo nuevo es aditivo**; T27 verifica que el panel se ve **idéntico**, salvo el acceso, que cambia a propósito. La guarda de `Grid` es no-op por encima del ancho mínimo, va en commit propio |
| **R8** | **T9 rompe una de las seis pantallas de acceso** sin que nadie lo note: `PantallaAuth` las envuelve todas y solo se suele mirar la de miembros | Media | Alto | El DoD de T9 exige **captura de las seis**. La trampa de `estilosAuth` está nombrada: romper la sacudida **no da error, solo deja de animar** |
| **R9** | **El catálogo miente sobre cuántos comercios hay.** `.limit(100)` corta en silencio, y el filtro por categoría lo agrava | Baja hoy, **certeza a plazo** | Alto | B1, con prioridad subida. Entretanto T2 puede especificar un aviso honesto cuando las filas igualen al límite. **Requiere decisión de producto** |
| **R10** | **`next/image` abre un proxy de imágenes** si alguien «mejora» la optimización añadiendo `hostname: '**'` | Baja, alta si se improvisa | Alto | T12 lo prohíbe explícitamente: **no se toca `next.config.ts`**. T21 lo verifica. Entra solo si se aprueba el bucket de `PROPUESTA-BACKEND-imagenes.md` |
| **R11** | **`<ViewTransition>` no se puede verificar bien.** Deuda #1 sin estrenar, en Next 16, y aquí las transiciones **no avanzan en una pestaña que no se pinta** | Media | Medio | T6 decide la estructura antes del marcado. Verificación **por captura**. Si en T26 no se consigue, se retira |
| **R12** | **La ruta nueva cruza la frontera de datos** | Baja | **Muy alto** | T15 nombra sus reglas; T21 lo audita. Ningún auditor tiene shell |
| **R13** | **D2 tapa los errores del rediseño.** «2 Issues» permanentes | **Alta** (es un hecho) | Medio | T8 exige **0 Issues** en los tres portales, con captura |
| **R14** | **T13 se estira.** Categorías, chips, tres estanterías, rejilla y tarjeta a la vez | **Alta** | Medio | Prohibiciones enumeradas y once criterios de DoD. Si crece, se parte en dos commits —filtros y estanterías— **antes** de empezar |
| **R15** | **Alcance general que se estira** | **Alta** | Medio | «Fuera de alcance» es **vinculante**. Niveles 3 y 4 de FASE 3 se registran, no se aplican |
| **R16** | **La trampa del menú de tema**: Enter cierra la sesión | Media si no se avisa | Alto | Diagnosticada y resuelta en T11, con DoD que la verifica a mano |

---

## Fuera de alcance

1. **El panel administrativo y la herramienta de comercios** (P1). **Excepción autorizada: las
   pantallas de acceso** (P3).
2. **Rehacer el estado vacío del catálogo.** Está bien resuelto y verificado.
3. **Sustituir el respaldo tipográfico del logo por un icono.** El razonamiento de
   `comercio-logo.tsx:10-17` es correcto y P7 lo confirma: **se conserva**, ahora con la marca
   como escalón intermedio.
4. **Convertir la rejilla principal en carrusel** (RUP-5).
5. **Estantería «Destacados» e iconos por categoría.** **Ninguna de las 16 tablas tiene columna
   de destacado, orden o prioridad**, y `categorias` es solo `id, nombre`. B5. **No se
   especifican como si existieran.**
6. **`next/image` y la optimización de imágenes.** Requiere el bucket de
   `PROPUESTA-BACKEND-imagenes.md`. Iteración posterior.
7. **Paginación, «ver más», scroll infinito y contador de totales.** B1.
8. **Ordenación elegible, filtro por estado de membresía, búsqueda sin acentos.**
9. **Migrar los logos a Storage y validar la subida.** Cruza la frontera:
   `PROPUESTA-BACKEND-imagenes.md` / B4.
10. **Historial de beneficios usados por el miembro.** No hay página ni acción sobre `ventas`
    fuera de `/admin/metricas`. B3.
11. **Cambiar lo que codifica el QR.** `codigo_publico` es un uuid sin usar y el QR lleva el
    número de 8 dígitos; cambiarlo obligaría a tocar `buscar_miembro_comercio`, que es backend.
    Observación para T21, no tarea.
12. **Toasts en el portal.** `useToast()` **lanza** fuera de `/admin`.
13. **`/` hace `redirect('/admin')` sin mirar el rol** (`app/page.tsx:8`): un miembro que escriba
    el dominio a secas aterriza en el acceso administrativo con `?error=sin_permiso`. **Es la
    primera pantalla del socio**, pero exige un Portal Público o una pantalla de elección
    —ninguno existe— y tiene implicaciones de sesión. **Se escala como decisión de producto, con
    prioridad alta.**
14. **Las cinco transiciones que animan propiedades de layout.** Verificado consumidor por
    consumidor que **ninguna llega al Portal de Miembros**. Plan propio.
15. **`error.tsx` para `/comercios`, `/login`, `/activar-cuenta` y la raíz.**
16. **El resto de la deuda de `ARCHITECTURE.md`**: `src/lib/shared/formato.ts` inexistente (12
    sitios), las 14 parejas `@modal` con consultas duplicadas, los `error` de Supabase
    descartados, los dos tipos `MiembroEncontrado` incompatibles.
17. **Reglas propias de ESLint.** El arreglo con más apalancamiento del repositorio —convertiría
    seis prohibiciones de `CLAUDE.md` en errores de compilación— pero es un plan propio. **Vale
    la pena proponerlo justo después.**

---

## PROPUESTAS PARA BACKEND

Cruzan la frontera de `SCOPE.md` §2. **No son tareas de este plan.**

### B1 — Paginación con total en el catálogo · **prioridad alta**

- **Qué**: que el catálogo acepte página y tamaño y devuelva el total. `count: 'exact'` ya se usa
  en `src/app/admin/page.tsx:42`: el patrón existe.
- **Dónde muerde**: `page.tsx:86` y `:55` cortan con `.limit(100)`. Cuando el club supere los 100
  aliados, **parte del beneficio que el socio paga deja de mostrarse**, sin aviso en pantalla ni
  en logs.
- **Por qué sube ahora**: un catálogo con mejor aspecto es más creíble. Y el filtro por categoría
  lo agrava: si una categoría tiene 120 comercios, el socio ve 100 y cree que son todos.
- **Entretanto**: avisar cuando las filas recibidas igualen exactamente al límite. Heurística;
  cambia el copy y **necesita decisión de producto**.

### B2 — Una lectura para el catálogo, en vez de doce

- **Qué**: una vista o función que devuelva los comercios ya resueltos con marca (y su logo),
  categoría, ciudades y promociones vigentes.
- **Dónde muerde**: `page.tsx:47-59` trae las 100 marcas, las 100 ciudades y todos los tipos de
  beneficio **en cada visita, aunque el filtro esté vacío**. Hasta 10 consultas por render, y
  este plan añade categorías.
- **Por qué solo-frontend no basta**: T24 puede recortar lo que **no se usa**, pero no fusionar
  lecturas ni crear una vista sin tocar `supabase/migrations/**`.

### B3 — Historial de beneficios del miembro

- **Qué**: una lectura de `ventas` filtrada por el miembro de la sesión, con comercio, fecha y
  descuento. Bajo RLS, no service role.
- **Por qué**: es lo que convierte un catálogo en un club: «has ahorrado X este año». Hoy **no
  existe página ni acción** sobre `ventas` fuera de `/admin/metricas`.

### B4 — Alojar y gobernar las imágenes · **prioridad alta**

**La propuesta formal, con el SQL del bucket, las políticas RLS, los límites de peso y formato,
la decisión sobre SVG y la recomendación de versionar migraciones, está en
`.claude/docs/PROPUESTA-BACKEND-imagenes.md`.** No se duplica aquí.

Lo que este plan añade a esa propuesta, y conviene llevar en la misma conversación:

- **El patrón «URL a un archivo sin Storage detrás» aparece tres veces**, no una:
  `comercios.logo_url`, `marcas.logo_url` y **`membresias.comprobante_url`**. No es una
  excepción: es una costumbre. Si se crea un bucket, conviene decidir los tres a la vez.
- **`marcas.logo_url` entra en uso a partir de T12** (cadena comercio → marca → inicial), así que
  el bucket debe contemplar `marcas/` desde el principio — la propuesta ya lo hace.
- **Lo que este plan resuelve sin esperar**: T12 hace que ningún logo se vea roto, deformado ni
  invisible **hoy**. Resuelve el síntoma visible, no la causa: la disponibilidad sigue dependiendo
  de servidores ajenos.

### B5 — Curaduría editorial: destacados e iconografía de categoría

**Corregida con el esquema real.** La mitad de esta propuesta ha dejado de hacer falta:
`comercios.created_at` existe y está en `database.types.ts:101`, así que **«Nuevos en el club» es
tarea de este plan (T13), no una propuesta.** Lo que sigue bloqueado:

- **«Destacados»**: **ninguna de las 16 tablas tiene columna de destacado, orden ni prioridad.**
  Hace falta una columna `destacado` en `comercios`, o una tabla de curaduría con orden.
- **Icono o color por categoría**: `categorias` es solo `id, nombre`. Si el diseño lo pide, es
  columna nueva.
- **Por qué solo-frontend es peor**: ordenar por `id` no es destacar, es «insertado antes». Un
  club que destaca comercios al azar pierde justo la credibilidad que el rediseño busca.
- **Entretanto**: las tres estanterías construibles —categorías, novedades y promociones
  vigentes—, que son curaduría **real** porque salen de datos reales.

### B6 — Nada más

Todo lo demás —las seis pantallas de acceso, el catálogo con categorías y estanterías, la placa
del logo con su cadena de respaldo, el filtro de promociones vigentes, la ficha, el carnet, el
sistema visual, los estados de carga y error y el movimiento— cabe íntegramente dentro de
`src/app/**` (sin Server Actions), `src/components/**` y `src/styles/**`. **En cuanto T1 tenga
respuesta, FASE 1 arranca hoy.**
