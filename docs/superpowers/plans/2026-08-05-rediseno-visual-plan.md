# Rediseño visual ORUM — Plan de implementación

> **For agentic workers:** Los pasos usan checkbox (`- [ ]`) para seguimiento. Implementar
> tarea por tarea, verificando cada una antes de pasar a la siguiente.

**Spec de diseño:** [`2026-08-04-rediseno-visual-orum-design.md`](../specs/2026-08-04-rediseno-visual-orum-design.md)
**Fecha:** 2026-08-05

**Goal:** Sustituir por completo la capa visual e interactiva de ORUM por un sistema de
diseño propio (oro / negro / blanco, estética Apple, movimiento con resortes, tres modos
de tema) y convertir la app en PWA instalable, empezando por lo ya implementado: login,
cuenta y Portal de Administración.

**Architecture:** No cambia. Server Components para lectura con `requireRol`, Server
Actions para escritura, `createAdminClient()` para datos, formularios `'use client'` con
`useActionState`. Este plan toca **exclusivamente la capa de presentación**, con una única
excepción documentada y aprobable por separado (Task E0).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, CSS Modules,
`motion`, `lucide-react`, Serwist (solo Fase F), Vitest.

---

## Herramientas y dependencias

### Ya en el proyecto (sin cambios)

`next@16.2.10` · `react@19.2.4` · `typescript@^5` · `@supabase/ssr` · `@supabase/supabase-js`
· `vitest@^4.1.10` · `eslint@^9` · `pnpm@11.17.0` (node ≥ 20.9)

Estilos: **CSS Modules**, incluidos en Next.js. Sin configuración, sin runtime, compatibles
con Server Components.

### Dependencias nuevas

| Paquete | Fase | Peso aprox. | Justificación |
|---|---|---|---|
| `motion` | B1 | ~3–5KB (import mini) | Resortes interrumpibles, traspaso de velocidad y proyección de momento. Imposible con CSS (spec §5.1). |
| `lucide-react` | B2 | ~0.5KB por icono | ~30 iconos con trazo consistente, tree-shakeable. |
| `@floating-ui/react-dom` | B7 | ~5–8KB | **Condicional.** Solo si el posicionamiento con colisión de dropdowns/tooltips no sale con CSS. |
| `serwist` + `@serwist/next` | F2 | 0 en bundle principal | Service worker. Sucesor mantenido de `next-pwa`. |

Los pesos son aproximados; se verifican en B1 y se auditan en G3.

**Sobre los iconos:** se descarta dibujar los ~30 SVG a mano. La alineación óptica
consistente entre iconos dibujados a mano es un sumidero de tiempo con resultado
irregular. El trazo de 2px a 24px de Lucide se acerca al carácter de SF Symbols, que no
se puede usar (licencia exclusiva de plataformas Apple).

### Plataforma nativa antes que librería

| Necesidad | Solución | Qué evita |
|---|---|---|
| Modal / ConfirmDialog | **`<dialog>` nativo** | Focus trap, scroll lock, `Escape` y top-layer gratis |
| Popover simple | **Popover API nativa** | Portales y cierre al clic fuera |
| Sheet móvil | **Pointer Events + `setPointerCapture`** a mano | Ninguna librería ofrece arrastre 1:1 con proyección de momento |
| Dropdown con colisión | `@floating-ui` solo si hace falta | CSS Anchor Positioning es aún solo Chrome |

**Se descarta Radix UI** pese a su calidad: su modelo de animación entra en conflicto con
el enfoque de resortes, especialmente en `Sheet`, donde el gesto es lo esencial.

### Descartado explícitamente

| Descartado | Motivo |
|---|---|
| Tailwind | Migración grande; los tokens de este diseño (rampas, gradiente metálico, materiales) viven mejor en CSS puro. |
| shadcn/ui | Introduce un sistema de diseño ajeno justo cuando el objetivo es tener uno propio. |
| styled-components / emotion | Runtime en cliente, fricción con Server Components. |
| next-pwa | Sin mantenimiento activo; Serwist es su sucesor. |
| Framer Motion (paquete antiguo) | `motion` es su continuación, mismo API y mejor tree-shaking. |

### Verificación

- **Chrome DevTools + Lighthouse** — Core Web Vitals contra el presupuesto del spec §10.
- **Grabación en cámara lenta** — obligatoria para revisar movimiento (Task G4).
- **Dispositivos reales** — un iPhone y un Android de gama media. El simulador miente
  sobre el rendimiento de `backdrop-filter`.
- **Vitest** — solo funciones puras, según la convención de las Fases 1–3.

### Proceso de diseño: prototipo en código, sin Figma

La galería `/dev/ui` (Task B10) **es** la herramienta de diseño: todos los componentes,
variantes y estados, en los tres temas, en una pantalla. Un mockup estático no puede
mostrar si una hoja se deja agarrar a mitad de vuelo — que es precisamente lo que hay
que evaluar en este proyecto.

---

## Supuestos asumidos (decisiones §13 del spec aún abiertas)

Este plan se escribió asumiendo las recomendaciones. Si eliges distinto, cambia lo indicado:

| # | Supuesto | Si eliges otra cosa |
|---|---|---|
| 1 | **Inter Variable** auto-hospedada | `system-ui`: Task A1 se reduce a 10 min y desaparece el subsetting. Mantener Geist: Task A1 se elimina. |
| 2 | **Sin serif de acento** (todo grotesca) | Añadir una fuente más en A1 y aplicarla solo al wordmark en C1. |
| 3 | **`motion` aprobada** | Sin ella: Task B1 se sustituye por un motor de resortes propio (+2–3 días) y B7/B9/C5 pierden gestos. |
| 4 | **Wordmark tipográfico** (no hay logo) | Con logo real: Task C1 y F1 consumen los SVG en vez de generarlos. |
| 5 | **Alcance A→G completo**, con **punto de evaluación tras la Fase D** | Puedes parar en D y decidir. |

---

## Global Constraints

- **Ningún valor literal fuera de la capa de tokens.** Ningún color, espaciado, radio,
  duración o curva hardcodeado en un componente. Todo vía `var(--…)`.
- **Cero estilos inline nuevos.** Todos los `style={{…}}` actuales se eliminan al migrar
  cada pantalla. Los estilos viven en `.module.css`.
- **Solo se anima `transform` y `opacity`.** Nunca `width`, `height`, `top`, `left`,
  `margin` ni `box-shadow` directo.
- **`'use client'` solo en hojas interactivas.** Las páginas siguen siendo Server Components.
- **Ningún estado se codifica solo con color** — siempre punto/icono + texto (spec §2.7).
- **Pruebas automatizadas solo para funciones puras**, como en Fases 1–3. El resto se
  verifica manualmente.
- **Cada fase deja la app desplegable.** Las fases A–C no rompen pantallas existentes:
  los tokens `--orum-*` viejos se mantienen como alias hasta la Fase E.
- **Verificación por tarea:** `pnpm lint`, `pnpm test` y `tsc --noEmit` limpios antes de cerrar.
- **No se toca** lógica de negocio, esquema de BD, `requireRol` ni server actions
  (excepción: Task E0, aprobable aparte).

---

# FASE A — Fundaciones

> Sin cambios visibles en pantallas. Construye la base sobre la que todo lo demás hereda.

## Task A1: Tipografía Inter Variable

**Files:** Create `src/app/fonts/` · Modify `src/app/layout.tsx`

- [ ] **Step 1:** Descargar Inter Variable (`.woff2`, subset `latin`) a `src/app/fonts/InterVariable.woff2`.
- [ ] **Step 2:** Registrarla con `next/font/local`, con `display: 'swap'`, `variable: '--font-sans'`.
- [ ] **Step 3:** Retirar `Geist` y `Geist_Mono` de `layout.tsx`. Mantener una mono solo si
      se usa (números de membresía usan `tabular-nums` de Inter, no necesitan mono).
- [ ] **Step 4:** Aplicar la variable a `<html>`.

**Verificación:** la app carga con Inter; no hay petición a `fonts.googleapis.com`.

## Task A2: Capa de tokens

**Files:** Rewrite `src/app/globals.css` · Create `src/styles/tokens.css`

- [ ] **Step 1:** Crear `src/styles/tokens.css` con **todos** los tokens del spec §2, §3, §4, §5.2:
      neutrales (`--n-*`, `--w-*`), oro (`--gold-*`), acción, semánticos, espaciado 4pt,
      radios, sombras en capas, escala tipográfica con tracking y leading por tamaño,
      curvas, duraciones y z-index.
- [ ] **Step 2:** Definir los tokens **semánticos por tema** (los que consumen los
      componentes), no los crudos:

```css
:root, [data-theme="light"] {
  --bg:            var(--w-50);
  --surface:       var(--w-0);
  --surface-sunk:  var(--w-100);
  --border:        var(--w-300);
  --border-subtle: var(--w-200);
  --text:          #141418;
  --text-2:        #5B5B66;
  --text-3:        #8C8C97;
  --action:        #141418;
  --action-fg:     #FFFFFF;
  --focus:         var(--gold-600);
  --brand:         var(--gold-700);   /* dorado legible sobre claro */
  --success: #137A3B;  --warning: #A85508;
  --danger:  #C1121F;  --info:    #1D5FD1;
  color-scheme: light;
}

[data-theme="dark"] {
  --bg:            var(--n-1000);
  --surface:       var(--n-900);
  --surface-sunk:  var(--n-950);
  --border:        var(--n-700);
  --border-subtle: var(--n-800);
  --text:          var(--n-50);
  --text-2:        var(--n-400);
  --text-3:        var(--n-500);
  --action:        var(--n-50);
  --action-fg:     var(--n-1000);
  --focus:         var(--gold-400);
  --brand:         var(--gold-300);
  --success: #45D67C;  --warning: #F0912E;
  --danger:  #FF5A52;  --info:    #5B9DFF;
  color-scheme: dark;
}
```

- [ ] **Step 3:** Reset moderno + estilos base de `<body>` con la escala tipográfica.
- [ ] **Step 4:** **Mantener el bloque `--orum-*` y las clases `.orum-*` existentes**,
      remapeando sus valores a los tokens nuevos. Las 20 pantallas actuales siguen
      funcionando y ya se ven mejor. Se borra en Task E10.

**Verificación:** ninguna pantalla actual se rompe; todas heredan la tipografía y los neutrales nuevos.

## Task A3: Sistema de tres temas

**Files:** Create `src/components/theme/theme-script.tsx`, `theme-provider.tsx`,
`theme-toggle.tsx` (+ `.module.css`) · Modify `src/app/layout.tsx`

- [ ] **Step 1:** Script anti-flash, inyectado con `dangerouslySetInnerHTML` en `<head>`,
      **antes** de cualquier contenido. Resuelve `system|light|dark` desde `localStorage`
      y estampa `data-theme` en `<html>` antes del primer pintado.
- [ ] **Step 2:** `ThemeProvider` (`'use client'`) con estado de **tres** valores. Escucha
      `matchMedia('(prefers-color-scheme: dark)')` mientras el modo sea `system`, para que
      la app cambie sola al pasar el dispositivo a modo noche.
- [ ] **Step 3:** En `layout.tsx`, los dos `<meta name="theme-color">` con `media`
      (crítico para la barra de estado de la PWA, spec §2.9.4):

```html
<meta name="theme-color" content="#FBFBFC" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0A0A0C" media="(prefers-color-scheme: dark)" />
```

- [ ] **Step 4:** `ThemeToggle` como control segmentado de **3 posiciones** (Auto/Claro/Oscuro)
      con indicador deslizante. No un interruptor binario: un toggle de dos estados no
      puede expresar "automático".
- [ ] **Step 5:** Transición de 220ms limitada a `background-color`, `color` y `border-color`.
      Nunca `transition: all`.

**Verificación:** recargar en modo oscuro **sin flash blanco**; cambiar el tema del SO con
la app en `Auto` y ver que responde en vivo; los date-pickers nativos siguen el tema.

## Task A4: Utilidades de movimiento

**Files:** Create `src/styles/motion.css` · Create `src/lib/motion.ts`

- [ ] **Step 1:** Curvas y duraciones del spec §5.2 como custom properties.
- [ ] **Step 2:** `src/lib/motion.ts` exporta los presets de resorte como constantes
      tipadas (`SPRING_UI`, `SPRING_MOVE`, `SPRING_SHEET`, `SPRING_FLICK`).
- [ ] **Step 3:** Función pura `proyectarMomento(velocidad, deceleracion = 0.998)` del
      spec §5.1.5 — **con test en Vitest** (es función pura).
- [ ] **Step 4:** Bloque global `@media (prefers-reduced-motion: reduce)` como red de
      seguridad; el tratamiento fino va dentro de cada componente.

**Verificación:** `pnpm test` pasa con el nuevo test de proyección.

---

# FASE B — Primitivas de UI

**Files (todas las tareas):** `src/components/ui/<Componente>/index.tsx` + `<Componente>.module.css`

## Task B1: Instalar `motion`

- [ ] `pnpm add motion`
- [ ] Verificar que se importa la variante mini donde solo se necesita `animate`.
- [ ] Confirmar que el bundle inicial no crece en las rutas que no lo usan.

## Task B2: `Button` + `Spinner`

- [ ] Variantes `primary | secondary | ghost | danger | gold`, tamaños `sm | md | lg`,
      `loading`, `iconOnly`, `fullWidth`.
- [ ] `primary` usa **tinta** (`--action`), no oro. `gold` es la variante ceremonial,
      reservada al CTA comercial (spec §2.5).
- [ ] `scale(0.97)` en `:active` a 100ms — **feedback en `pointerdown`, no en `click`**.
- [ ] Estado `loading`: el spinner sustituye al texto **conservando el ancho** del botón.
      Cero layout shift. Medir el ancho antes de cambiar el contenido.
- [ ] La variante `gold` desplaza `--gold-sheen` ~8% en hover.
- [ ] `:focus-visible` con anillo de 2px `--focus` + `outline-offset: 2px`.
- [ ] Altura mínima 44px en `md` y `lg` (objetivo táctil).

## Task B3: Campos de formulario

- [ ] `Field` (envoltorio: label + control + ayuda + error), `Input`, `Textarea`, `Select`,
      `Switch`, `Checkbox`, `Radio`, `SegmentedControl`.
- [ ] Focus: el anillo **crece desde 0** con `--ease-out`, no aparece de golpe.
- [ ] Error: shake horizontal de 6px, 3 oscilaciones, 280ms + mensaje bajo el campo
      asociado con `aria-describedby` y `aria-invalid`.
- [ ] `Input` acepta `inputMode` y `autoComplete`; los de cédula/número de membresía usan
      `inputMode="numeric"` y `font-variant-numeric: tabular-nums`.

## Task B4: Superficies

- [ ] `Card`, `Surface`, `Divider`, `Section`, `Stack`, `Grid`.
- [ ] **Regla de radios anidados:** `radio_interno = radio_externo − padding` (spec §4.2).
- [ ] En tema oscuro la elevación se comunica con superficie más clara + hairline superior
      de luz (`inset 0 1px 0 rgba(255,255,255,.04)`), **no con sombra**.

## Task B5: `Badge` + `StatusBadge` + `PlanTierBadge`

- [ ] `Badge` genérico con variantes de color.
- [ ] **`StatusBadge`** — el eje binario del spec §2.8. Recibe el estado ya derivado
      (no lo calcula) y renderiza **punto + texto**, más el motivo como texto secundario:

```
Activa    → punto verde  + "Activa"
Inactiva  → punto rojo   + "Inactiva" + · motivo (vencida | cancelada | suspendida)
```

- [ ] Fondo atenuado al 8%, icono y texto en color pleno. **Nunca bloque saturado**
      (fatiga de alarma en listas largas).
- [ ] Señal secundaria `VenceEn` — texto ámbar sutil, **no un badge**. Una membresía por
      vencer está activa; darle badge propio mentiría sobre el estado.
- [ ] **`PlanTierBadge`** — el eje de marca. Aquí sí va el oro. Planes base en neutro.
- [ ] `Avatar`, `Pill`, `StatusDot`.

## Task B6: Feedback

- [ ] `Alert` (info/success/warning/danger) con icono, nunca color solo.
- [ ] `Toast` + `ToastProvider`: entra desde el borde, se apila, se descarta con swipe
      **con traspaso de velocidad**, `aria-live="polite"`.

## Task B7: Capas

- [ ] `Modal` (desktop): escala desde 0.96 con el blur del fondo entrando en paralelo.
      Sale **por el mismo camino** (spec §5.4).
- [ ] `Sheet` (móvil): sube desde abajo, **arrastre 1:1** con Pointer Events +
      `setPointerCapture`, respetando el offset del agarre. Rubber-band en el tope.
      Cierre por **proyección de momento**, no por posición al soltar.
      El backdrop se oscurece proporcionalmente al arrastre.
- [ ] `Popover` / `DropdownMenu`: `transform-origin` en **el botón que los disparó**,
      no en su centro.
- [ ] `ConfirmDialog`: solo para acciones destructivas e irreversibles. Usarlo de más
      entrena al usuario a aceptar sin leer.
- [ ] Todos: focus trap, `Escape`, retorno del foco al disparador, `role` correcto.
- [ ] `@media (prefers-reduced-transparency: reduce)` → superficie sólida sin blur.

## Task B8: Carga y vacío

- [ ] `Skeleton` con barrido de brillo sutil.
- [ ] `Spinner`, `ProgressBar` (barra fina superior para navegación).
- [ ] `EmptyState`: ilustración mínima + frase clara + **la acción que lo resuelve**.
- [ ] `ErrorState`: causa comprensible + reintento. Nunca un stack trace.

## Task B9: `DataList` — el componente crítico

Sustituye a `.orum-table`. Una fuente de datos, dos presentaciones.

- [ ] **≥768px:** tabla real, encabezado pegajoso, ordenación, `tabular-nums`, acciones
      reveladas al hover de fila.
- [ ] **<768px:** tarjetas apiladas — dato identificador como título, 2–3 campos de apoyo,
      acciones por menú. **Nunca scroll horizontal.**
- [ ] Entrada escalonada de 20ms entre filas, máximo 10 filas escalonadas (más se percibe
      como lentitud, no como elegancia).
- [ ] `content-visibility: auto` + `contain-intrinsic-size` para listas largas.
- [ ] Soporte de estado vacío, cargando y error.

## Task B10: Galería `/dev/ui`

- [ ] Página que renderiza **todos** los componentes con todas sus variantes y estados.
- [ ] Conmutador de tema visible para revisar los tres modos de un vistazo.
- [ ] Excluida de producción o protegida con `requireRol('super_admin')`.

**Verificación de la Fase B:** revisar `/dev/ui` en claro, oscuro y auto; en móvil y
escritorio; con `prefers-reduced-motion` activado en el SO.

---

# FASE C — App Shell y navegación

## Task C1: Shell y sidebar

**Files:** Create `src/components/shell/**` · Rewrite `src/app/admin/layout.tsx`

- [ ] `AppShell` con la estructura adaptativa del spec §6.1.
- [ ] **≥1024px:** sidebar de 264px translúcida, colapsable a rail de 72px con tooltips.
      Preferencia de colapso persistida.
- [ ] **768–1023px:** rail de iconos por defecto, expandible.
- [ ] `TopBar` translúcida con `backdrop-filter`, contenido pasando por debajo, y
      **scroll edge effect** (degradado) en vez de borde de 1px.
- [ ] Wordmark ORUM con filo dorado (`--gold-sheen`).
- [ ] Navegación agrupada: *Operación* (Miembros, Comercios) · *Administración*
      (Usuarios, Planes) · *Cuenta*.
- [ ] **Filtrado por rol** con la misma lógica que hoy (`esSuperAdmin`), sin duplicar
      reglas de autorización: el layout sigue llamando a `requireRol('super_admin','empleado')`.
- [ ] Eliminar todos los `style={{…}}` de `admin/layout.tsx`.

## Task C2: TabBar móvil

- [ ] **<768px:** tab bar inferior translúcida, máximo 5 destinos, en la zona del pulgar.
- [ ] Adaptada al rol: empleado → `Inicio · Miembros · Buscar · Vender · Más`;
      super_admin → `Inicio · Miembros · Comercios · Buscar · Más`.
- [ ] `env(safe-area-inset-bottom)` para no quedar bajo la barra de gestos del iPhone.
      Requiere `viewport-fit=cover` en el viewport.
- [ ] Hoja "Más" con el resto de destinos.

## Task C3: Indicador activo

- [ ] Indicador **dorado** que **se desliza** entre ítems como elemento compartido
      (`layoutId` de motion), no que parpadea de uno a otro.
- [ ] Ruta activa detectada con `usePathname()`, con coincidencia por prefijo para
      subrutas (`/admin/miembros/123` marca "Miembros").

## Task C4: Búsqueda global y paleta de comandos

**Files:** Create `src/components/shell/command-palette/**` ·
Create `src/app/admin/buscar/actions.ts`

- [ ] `SearchField` en el shell (no en una página aparte).
- [ ] `CommandPalette` con `⌘K` / `Ctrl+K`.
- [ ] Busca miembros por **número, cédula o nombre**, reutilizando la consulta que ya
      existe en `src/app/admin/miembros/`. **No duplicar lógica de búsqueda**: extraerla a
      una función compartida si hace falta.
- [ ] Resultados muestran `StatusBadge` **sin entrar a la ficha** — así "consultar estado"
      baja de 3 pasos a 1 (spec §6.3).
- [ ] Acciones ejecutables: "Registrar miembro", "Vender membresía", "Nuevo comercio".
- [ ] Debounce de 150ms máximo. Navegable solo con teclado.

## Task C5: Transiciones de ruta

- [ ] Investigar `experimental.viewTransition` en Next.js 16. **Validar que funciona**
      antes de construir sobre ello.
- [ ] Si no es estable: plan B con `motion` en el layout — cross-fade + desplazamiento de
      8px. Mismo resultado visual, más código.
- [ ] `ProgressBar` dorada de 2px arriba, solo si la navegación tarda >150ms (mostrarla
      antes produce parpadeo en navegaciones rápidas).

**Verificación de la Fase C:** navegar todo el admin en escritorio, tablet y móvil con el
contenido viejo dentro del shell nuevo. Probar `⌘K`. Verificar zona segura en iPhone.

---

# FASE D — Login y cuenta · **punto de evaluación**

## Task D1: `/login`

**Files:** Rewrite `src/app/login/page.tsx`, `login-form.tsx` (+ `.module.css`)

- [ ] Diseño a pantalla completa, **tema oscuro fijo** — es la puerta de la marca.
- [ ] Wordmark con `--gold-sheen`. Tarjeta translúcida centrada.
- [ ] Entrada: `opacity 0→1` + `translateY(8px→0)` + `scale(0.98→1)` con `SPRING_UI`.
- [ ] Autofocus en el correo. Enter envía.
- [ ] Botón con estado `loading` real (sustituye el `pending ? 'Ingresando…'` actual de
      `login-form.tsx:51`), sin cambio de ancho.
- [ ] Error con `Alert` + shake del formulario, `role="alert"` conservado.
- [ ] Cero `style={{…}}`.

## Task D2: `/admin/cuenta/password`

**Files:** Rewrite `src/app/admin/cuenta/password/page.tsx`, `password-form.tsx`

- [ ] Migrar a los componentes de la Fase B.
- [ ] Medidor de fortaleza de contraseña animado.
- [ ] Éxito → `Toast`, no un mensaje estático.

## Task D3: 🚦 Punto de evaluación

- [ ] Revisar en dispositivos reales: iPhone, Android, tablet, escritorio.
- [ ] Los tres modos de tema.
- [ ] **Decisión explícita: seguir a la Fase E o ajustar el sistema.**
      Aquí se ha invertido poco y se ve el resultado real. Ajustar tokens ahora cuesta
      horas; ajustarlos con 20 pantallas migradas cuesta días.

---

# FASE E — Portal de Administración

## Task E0: ⚠ Prerrequisito — `derivarEstadoMembresia`

**Files:** Modify `src/lib/membresias.ts`, `src/lib/membresias.test.ts`

> **Requiere aprobación explícita: es la única tarea del plan que toca lógica de negocio.**

Justificación (spec §2.8): `membresias.estado` tiene default `'activa'` y **nada la cambia
a `'vencida'` al pasar `fecha_fin`**. Sin esto, la UI mostraría "Activa" en verde a un
miembro que no paga desde hace meses. Cualquier badge que se pinte antes de resolver esto
es potencialmente falso.

- [ ] **Step 1:** Función pura, junto a las tres existentes:

```ts
export type EstadoDerivado =
  | { activa: true;  diasRestantes: number }
  | { activa: false; motivo: 'vencida' | 'cancelada' | 'suspendida' }

/**
 * Estado real de una membresía. `estado` guarda la intención administrativa;
 * la vigencia SIEMPRE se deriva de `fecha_fin`, para no depender de un cron.
 * Fechas en 'YYYY-MM-DD'.
 */
export function derivarEstadoMembresia(
  estado: 'activa' | 'vencida' | 'cancelada' | 'suspendida',
  fechaFin: string,
  hoy: string,
): EstadoDerivado
```

- [ ] **Step 2:** Reglas — `cancelada` y `suspendida` mandan siempre (son decisiones
      humanas). `activa` con `fecha_fin < hoy` → inactiva por `'vencida'`. `activa` con
      `fecha_fin >= hoy` → activa, con días restantes calculados.
- [ ] **Step 3:** Tests en `membresias.test.ts`: activa vigente, activa vencida por fecha,
      vence hoy (límite), cancelada con fecha futura, suspendida con fecha futura,
      vencida en BD.
- [ ] **Step 4:** Consumirla en **todo** punto que muestre estado.

**Verificación:** `pnpm test` verde; una membresía con `estado='activa'` y `fecha_fin`
pasada se muestra **Inactiva · vencida**.

## Task E1: `/admin` — Inicio

- [ ] Sustituir la tarjeta genérica actual (`admin/page.tsx:18-36`) por accesos reales
      según rol.
- [ ] Empleado: acción primaria "Registrar miembro y vender membresía" destacada.
- [ ] Placeholders de métricas preparados para la Fase 4 del roadmap (no datos falsos).

## Task E2: `/admin/miembros` — lista

- [ ] Migrar a `DataList`. Tabla en escritorio, tarjetas en móvil.
- [ ] `StatusBadge` derivado (E0) + `PlanTierBadge` + señal `VenceEn`.
- [ ] Búsqueda con resultados incrementales.
- [ ] **Acción inline "Renovar"** sin salir de la lista, con `useOptimistic`.
- [ ] FAB en móvil para el flujo estrella.

## Task E3: `/admin/miembros/[id]` — ficha

- [ ] Cabecera con datos del miembro, `StatusBadge` grande, número de membresía en
      `tabular-nums` con copia a un clic.
- [ ] Historial de membresías como línea temporal, no como tabla.
- [ ] Autoría de venta/registro visible (`vendido_por` / `registrado_por`).

## Task E4: Formularios de miembros

- [ ] `nuevo/page.tsx`, `[id]/editar/**`, `renovar-form.tsx` migrados a los primitivos.
- [ ] Validación en `blur`, no al enviar.
- [ ] La contraseña autogenerada (mostrada una sola vez) en un panel destacado con **copia
      a un clic** y confirmación visual. Es un momento crítico: si se pierde, hay que
      regenerarla.

## Task E5: Comercios — lista y ficha

- [ ] `comercios/page.tsx` y `[id]/page.tsx` a `DataList` + `Card`.
- [ ] Los dos estados independientes (`comercios.activo` vs `perfiles.activo`) se muestran
      **por separado y etiquetados**, como ya decidió la Fase 3.

## Task E6: Comercios — formularios, sucursales y promociones

- [ ] `comercio-form.tsx`, `editar-comercio-form.tsx`, `sucursal-form.tsx`, `promocion-form.tsx`.
- [ ] El campo `valor` de promoción cambia de formato según el tipo de beneficio
      (% / monto / 2x1), respetando `validarValorPromocion` de `src/lib/promociones.ts`.

## Task E7: `/admin/usuarios`

- [ ] Lista + `nuevo` + `[id]/editar` migrados.
- [ ] Badges de rol y de activo/inactivo.

## Task E8: `/admin/planes`

- [ ] Lista + `nuevo` + `[id]/editar` migrados.
- [ ] **Aquí se marca el tier dorado** — es el origen del `PlanTierBadge`.
- [ ] Un plan inactivo se distingue con claridad (no se puede vender).

## Task E9: Estados de carga por ruta

- [ ] `loading.tsx` en cada ruta del admin, con **skeletons que replican el layout real**
      de esa pantalla — no un spinner genérico centrado.
- [ ] `error.tsx` con `ErrorState` y reintento.
- [ ] `Suspense` donde tenga sentido hacer streaming de la estructura antes que los datos.

## Task E10: Limpieza

- [ ] Eliminar el bloque `--orum-*` y las clases `.orum-*` de `globals.css` (§51–208 del
      archivo original).
- [ ] Verificar por búsqueda que **no queda ningún** `className="orum-…"` ni `style={{…}}`
      en `src/app/**`.
- [ ] Borrar `src/app/page.module.css` si dejó de usarse.

**Verificación de la Fase E:** recorrer las ~20 rutas en los tres temas, en móvil y
escritorio. `pnpm build` limpio.

---

# FASE F — PWA

## Task F1: Manifest e iconos

**Files:** Create `src/app/manifest.ts`, `public/icons/**`

- [ ] Wordmark ORUM como SVG → generar iconos 192, 512 y **maskable** (sin maskable,
      Android recorta el icono y se ve un cuadrado dentro del círculo) + `apple-touch-icon` 180×180.
- [ ] `manifest.ts` con la API nativa de Next.js: `display: 'standalone'`,
      `theme_color: '#0A0A0C'`, `background_color: '#0A0A0C'`.
- [ ] **Shortcuts:** "Registrar miembro" y "Buscar miembro" — mantener pulsado el icono
      de la app da la acción en un toque.

## Task F2: Service worker

- [ ] `pnpm add -D @serwist/next` + `pnpm add serwist`.
- [ ] Precache del app shell. **Network-first para datos.**
- [ ] **Nunca cachear respuestas de Supabase con sesión.** Excluir explícitamente por URL.
- [ ] Página de fallback offline.
- [ ] Estrategia de actualización: avisar al usuario con un `Toast` cuando haya versión
      nueva, sin recargar de golpe.

## Task F3: iOS

- [ ] `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`.
- [ ] Splash screens generadas por tamaño de dispositivo (iOS no las genera solo).
- [ ] `viewport-fit=cover` + `env(safe-area-inset-*)` verificados en la tab bar.

## Task F4: Instalación

- [ ] Capturar `beforeinstallprompt` (Android/Chrome) → banner discreto y descartable.
- [ ] **Detectar iOS + Safari + no-standalone** → hoja ilustrada enseñando
      "Compartir → Añadir a pantalla de inicio". Safari **no** dispara
      `beforeinstallprompt`; sin esta guía, en iPhone nadie instala la app.
- [ ] Detectar `display-mode: standalone` para ocultar el banner y ajustar el header.

**Verificación de la Fase F:** instalar en un iPhone y un Android reales. Comprobar icono,
splash, barra de estado en ambos temas, zona segura y modo offline.

---

# FASE G — Auditoría y pulido

## Task G1: Accesibilidad de preferencias

- [ ] Auditar `prefers-reduced-motion` componente por componente: cross-fades, sin
      overshoot, conservando opacidad y color. **No** desactivar todo el feedback.
- [ ] `prefers-reduced-transparency` → superficies sólidas.
- [ ] `prefers-contrast: more` → fondos casi sólidos con borde definido.

## Task G2: Teclado y lectores de pantalla

- [ ] Recorrido completo solo con teclado, incluidos paleta de comandos, modales y hojas.
- [ ] `:focus-visible` visible en **todos** los interactivos. Ningún `outline: none` huérfano.
- [ ] Verificar `aria-live` en toasts y resultados de acciones.
- [ ] Objetivos táctiles ≥ 44×44px.

## Task G3: Rendimiento

- [ ] Medir LCP, INP y CLS contra el presupuesto del spec §10 (< 1.8s / < 100ms / < 0.05).
- [ ] Verificar que `backdrop-filter` no aparece en ningún elemento de lista.
- [ ] Revisar el peso del JS inicial (objetivo < 120KB comprimido en el admin).
- [ ] Probar el scroll y los gestos en un **Android de gama media real**, no en el
      simulador. Si el blur no rinde, degradar a superficie sólida.

## Task G4: Revisión de movimiento

- [ ] Grabar las interacciones y revisarlas **en cámara lenta**: a velocidad real no se
      ven los saltos de interrupción ni las discontinuidades de velocidad.
- [ ] Verificar que toda animación se puede **agarrar y revertir a mitad de vuelo**.
- [ ] Verificar simetría de entrada/salida en hojas, modales y menús.

---

## Orden y dependencias

```
A ──► B ──► C ──► D ──► 🚦 evaluación ──► E ──► F ──► G
                                          ▲
                                    E0 (aprobar aparte)
```

- **A y B primero** porque sin fundaciones cada pantalla nace inconsistente y hay que rehacerla.
- **C antes que las pantallas** porque el shell define el espacio en el que viven.
- **D antes que E** porque el login es barato, muy visible, y valida el sistema completo
  con riesgo bajo antes de comprometer 20 pantallas.
- **F después de E** porque la PWA cachea el shell: cachear un shell que va a cambiar
  obliga a rehacer la estrategia de invalidación.
- **E0 bloquea E2** (lista de miembros) y todo lo que muestre estado.

## Riesgos operativos

| Riesgo | Mitigación |
|---|---|
| La app queda mezclada entre estilo viejo y nuevo | A–C no rompen nada (alias `--orum-*`). En E se migra por secciones completas. E10 cierra. |
| `experimental.viewTransition` no es estable | Validar en C5 **antes** de construir; plan B con `motion` ya definido. |
| El oro se ve barato al escalar | El punto de evaluación D3 existe exactamente para eso. |
| Alcance creciente | Este plan no cambia funcionalidad. Cualquier mejora funcional que aparezca se anota y se decide aparte. |
| E0 se salta por prisa | Está marcado como bloqueante. Sin él la interfaz miente sobre quién paga. |
