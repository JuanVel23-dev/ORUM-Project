# Diagnóstico de diseño y plan de rediseño · 13/09/2026

> Rama `mejora-diseno`, tras traer `origin/main` (merge de `253f140`, «Cambio en la forma de
> asignación de # de membresía»). Base verde antes de tocar nada: `tsc` limpio, 123 pruebas
> en 14 archivos, todas pasando. Next.js 16.2.11, Node 24.19.
>
> Auditorías de origen:
> [`AUDIT-design-system-2026-09-13.md`](./AUDIT-design-system-2026-09-13.md) ·
> [`AUDIT-a11y-2026-09-13.md`](./AUDIT-a11y-2026-09-13.md) ·
> [`AUDIT-movil-2026-09-13.md`](./AUDIT-movil-2026-09-13.md) ·
> [`SPEC-portal-publico.md`](./SPEC-portal-publico.md)

---

## 0. Lo que llegó de `origin/main`

Un commit real: el **pozo de números de membresía** (`admin/miembros/numeros/**`,
`lib/miembros/pozo-numeros.ts`, `numeros-registro.ts` y sus pruebas). Cambia la forma de
asignar `numero_membresia`: en vez de calcularlo, se toma de un pozo precargado por rango.

Buena noticia: **ese código sí respeta el sistema de diseño**. Usa `FormCard`, `Cifra` y
`DataList` correctamente, y trae su gemela bajo `@modal`
(`admin/@modal/(.)miembros/numeros/cargar/page.tsx`), que es justo lo que la norma exige y
lo que se suele olvidar. Sus dos únicos defectos son de accesibilidad menor (filtros sin
`aria-current`, `Alert` sin `key`) y están en la lista de arreglos.

El commit arrastró además 18 archivos de `.playwright-mcp/` y dos PNG sueltos en la raíz
(`pozo-con-numeros.png`, `pozo-vacio.png`). Son evidencia de sesión, no código.

---

## 1. Veredicto por portal

| Portal | Estado | Frase |
|---|---|---|
| **Miembros** | El referente, con dos grietas | Ergonomía, safe areas, teclado y gestos resueltos con un detalle inusual. Pero le falta el carnet rediseñado (T16) y arrastra el único bug de CSS silencioso de todo el árbol |
| **Comercios** | Funcional, sin dirección de arte | Se desvía poco del sistema —tiene buena base— pero no recibió ni una pasada de diseño: sin safe areas, con fricción de teclado en caja, y con el patrón de estado equivocado |
| **Administración** | Deuda antigua, no nueva | Lo recién llegado está bien. La deuda son módulos viejos con `@media` donde la norma exige `@container contenido` |
| **Público** | **No existe** | `src/app/page.tsx` es un `redirect('/miembros')`. Un cliente nuevo que escribe el dominio aterriza en el portal del socio |
| **`components/ui/`** | Dos bugs de bajo nivel | `ProgressBar` anima `width`; `Switch` tiene literales. Conviene resolverlos antes de que un consumidor nuevo los herede |

---

## 2. Portal de Miembros — qué falta

### 2.1 Lo que está hecho (y no hay que tocar)

Catálogo con categorías, estanterías y rejilla · chips de categoría · filtros · carrusel de
destacados (V9, sin autoplay, teclado nativo por scroll, `prefers-reduced-motion` correcto) ·
ficha de comercio `/miembros/comercios/[id]` (T15) · placa de logo con cadena de respaldo
comercio → marca → inicial · cromo del portal (cabecera, barra inferior, menú de tema) ·
esqueletos de carga y pantalla de error · las seis pantallas de acceso (T9).

El estado de membresía se deriva correctamente con `derivarEstadoMembresia`, y el `QrCode`
sigue negro sobre blanco en los dos temas. Las dos reglas que más caro salen de romper,
cumplidas.

### 2.2 Los huecos reales

| # | Hueco | Evidencia | Impacto |
|---|---|---|---|
| **H1** | **El carnet (T16) nunca se rediseñó** | `perfil/page.tsx` sigue montado sobre `Card` y `PageHeader` genéricos. `perfil/loading.tsx` ya dibuja el esqueleto de una pantalla que no existe | Es la pantalla que el socio enseña en la caja. Hoy parece una ficha de administración |
| **H2** | **Hairline dorado que nunca se pinta** | `comercios/[id]/ficha.module.css:210`: `border: 1px solid var(--gold-hairline)`, y el token es un `linear-gradient`. CSS inválido, descartado en silencio. Los otros cinco usos del token lo aplican como `background` | El filo de marca de la ficha no existe y nadie lo notó |
| **H3** | **`inactiva` informa en vez de invitar** | `inactiva/page.tsx:44` usa `variant="primary"`, no `brand` | Es la pantalla del socio que dejó de pagar: la única con un motivo comercial claro |
| **H4** | **El respaldo del logo roto sigue sin verificar** | `comercio-logo.tsx:40-43` conserva escrito «PENDIENTE DE VERIFICAR EN NAVEGADOR (T12)» | Chrome puede pintar un glifo de rotura junto al texto alternativo |
| **H5** | **Cuatro módulos puros sin una sola prueba** | `logo-comercio.ts`, `estanterias.ts`, `navegacion-portal.ts`, `volver-catalogo.ts`. El último **sanea una redirección abierta** | La norma del proyecto es probar las funciones puras. Estas cuatro se saltaron |
| **H6** | **View Transitions habilitadas y sin usar** | `experimental.viewTransition` activo, **cero `view-transition-name` en todo `src/`** | Deuda declarada. El dictamen de movimiento (T6) nunca se emitió y el marcado se escribió sin él |
| **H7** | **El catálogo se ve vacío con los datos de hoy** | 4 comercios y 0 promociones vigentes. El umbral de estantería es ≥8 (`estanterias.ts:22`) | Con los datos actuales no se renderiza ninguna estantería y **todas** las tarjetas caen a «Sin beneficio vigente hoy». Pedir juicio estético sobre eso es pedirlo sobre el estado vacío |

### 2.3 La decisión que queda en tu tejado

El auditor del sistema de diseño marcó como **bloqueante** que `Badge tone="gold"` muestre
`formatearBeneficio()` («20% de descuento») en tres archivos, por la regla «el oro jamás
codifica datos».

**No lo he cambiado, y creo que el auditor se pasa de severo.** El oro ahí no codifica el
*valor* —es idéntico para un 10% y para un 2×1—, sino la *existencia* de un beneficio
vigente, y va siempre acompañado de texto, que es lo que la regla protege de verdad. Lo que
sí hay que medir es otra cosa: el **presupuesto del ≤5%** en una rejilla donde cada tarjeta
lleva su píldora dorada. Eso se mide sobre captura real, no se estima.

---

## 3. Hallazgos transversales

### 3.1 Prohibiciones duras rotas

| Sev | Archivo:línea | Qué |
|---|---|---|
| ALTA | `components/ui/feedback.module.css:65` | `ProgressBar` hace `transition: width` — recalcula layout cada fotograma |
| ALTA | `miembros/(portal)/comercios/[id]/ficha.module.css:210` | Borde con gradiente: CSS inválido, nunca se pinta |
| MEDIA | `components/ui/toggle.module.css:82-85` | `#fff` y `rgba(...)` literales existiendo `--w-0` y `--shadow-*` |
| MEDIA | `miembros/(portal)/perfil/perfil.module.css:124` | `border: 1px solid #000` literal en `@media print` |
| MEDIA | `comercios/(portal)/_components/verificar.module.css:55` | `rgba(0,0,0,.45)` literal — defendible, pero la única excepción sancionada por escrito es `QrCode` |
| MEDIA | `components/ui/menu.module.css:122` | `outline: none` sin sustituto |
| MEDIA | `admin/inicio.module.css:22`, `admin/miembros/miembros.module.css:14`, `components/ui/card.module.css:137` | `@media` donde la norma exige `@container contenido` |

### 3.2 Accesibilidad — WCAG 2.1 AA

Bloqueantes: 0. Los ratios de contraste firmados en `CLAUDE.md` **siguen cumpliéndose**
(verificado aritméticamente: `--gold-600` en claro 5,40:1 y 3,66:1; `--gold-500` en oscuro
7,94:1 y 7,24:1). No hay regresión de color.

El fallo real es uno: **el resultado de la búsqueda de miembro en la caja no tiene
`aria-live`** (`buscar-miembro-form.tsx:127-144`). Un cajero con lector de pantalla no se
entera de si la membresía es válida. WCAG 4.1.3.

El resto es deuda de consistencia: `Sheet` etiqueta el `div` interno en vez del `<dialog>`;
`Toast` pausa con ratón pero no con foco de teclado (2.2.1); `Button size="sm"` mide 36px sin
la ampliación con `::after` que sí tienen `Copiar` e `InputButton`; `AccionEstado` sin
`aria-pressed`; `ResultadoMiembro` usa `Badge` donde debe usar `StatusBadge`.

### 3.3 Móvil

Bloqueantes: 0. Serios: 2, **los dos en la Herramienta de Comercios**:

1. La cabecera `sticky` no reserva `env(safe-area-inset-*)`, a diferencia de la de Miembros.
   Con `viewport-fit: cover` y `statusBarStyle: 'black-translucent'` globales, un cajero que
   instale `/comercios` en iOS ve la marca bajo la barra de estado.
2. El campo «Descuento» es `readOnly` pero sigue siendo `type="number"` enfocable: el cajero
   lo toca, se abre el teclado numérico sin poder escribir, y tapa el total justo cuando lo
   necesita ver.

Y dos de fricción: `valor_compra` y `valor_descuento` en `type="number"` (teclado con `+`,
`-` y `,` en Android, y spinners nativos como blanco de toque parásito para alguien de pie
con una mano), y `autoFocus` en el login de miembros, que en Android Chrome abre el teclado
sin gesto y tapa el botón en pantallas cortas.

El Portal de Miembros no tiene hallazgos móviles: es el patrón que hay que replicar, no
corregir.

---

## 4. Lo que exige dispositivo real

No se puede cerrar desde aquí, y la automatización de navegador de esta máquina no
redimensiona la ventana:

- Zoom de teclado en Android con el `autoFocus` del login.
- Comportamiento de `readOnly` con `type="number"` en iOS frente a Android.
- Recorte de cámara del escáner QR en gama media y baja.
- Lector de pantalla real sobre `Sheet` al abrir en móvil.
- Zoom al 200% con la barra lateral en rail sobre `Card`.
- El glifo de rotura del logo (H4).
- El presupuesto del oro (§2.3), que se mide sobre captura.
