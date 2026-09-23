# Arquitectura del proyecto
> Generado por codebase-analyst · 28/08/2026 · commit `e4d33e9` · rama `mejora-diseno`

## Cómo leer este archivo

**`CLAUDE.md` de la raíz es normativo y manda.** Ya fija tokens, uso del oro, overlays y
la ranura `@modal`, `@container` frente a `@media`, fechas Bogotá/UTC, estado de
membresía, movimiento, accesibilidad y la organización de `src/lib/` por dominio.
**Nada de eso se repite aquí.** Copiarlo crearía una segunda fuente de verdad que se
desincroniza al primer cambio, que es exactamente el fallo que hizo nacer `CLAUDE.md`.

Este documento aporta solo lo que falta:

1. **Convenciones inferidas del código real** que `CLAUDE.md` no nombra, con ruta, línea
   y conteo de ocurrencias.
2. **Deuda técnica observada**, incluida la que `CLAUDE.md` ya acepta (marcada como tal).
3. **Inventario de APIs internas del frontend**: componentes de `src/components/ui/` con
   su firma, utilidades públicas de `src/lib/` en zona de trabajo, y quién las consume.

El contrato de datos va aparte, en `.claude/docs/API-CONTRACT.md`.

Donde `CLAUDE.md` ya dicta la regla, aquí hay un puntero de una línea. Donde el código
**contradice** a `CLAUDE.md`, eso es deuda técnica y está en la tabla: la norma no se
ajusta al código; se reporta la divergencia.

> `graphify-out/` no se ha leído (zona prohibida, `SCOPE.md` §3, y además congelado el
> 19/08/2026). Todo lo que sigue sale de leer los archivos y contar con Grep.

---

## Stack

| Tecnología | Versión | Notas |
|---|---|---|
| Next.js | **16.2.11** (exacta, sin `^`) | **App Router puro.** No existe `pages/`. `experimental.viewTransition: true` |
| React | **19.2.4** (exacta) | Server Components, `useActionState`, `useOptimistic`, `useSyncExternalStore` |
| TypeScript | `^5` | `strict: true`, `noEmit`, `moduleResolution: "bundler"`, alias `@/*` a `./src/*` |
| Gestor de paquetes | **pnpm 11.17.0** | Fijado en `packageManager`. Node `>=22.13.0` en `engines`, `.nvmrc` y `.node-version` |
| Estilos | **CSS Modules puros** | Sin Tailwind, sin styled-components, sin vanilla-extract, sin CSS-in-JS. 62 importaciones de `.module.css` |
| Datos | `@supabase/supabase-js` ^2.110.7, `@supabase/ssr` ^0.12.3 | Sin ORM, sin capa de API |
| Animación | `motion` ^12.43.0 | Envuelto en `src/lib/shared/motion.ts` |
| Iconos | `lucide-react` ^1.28.0 | Único juego de iconos |
| QR | `react-qr-code` ^2.2.0 (pintar), `@yudiel/react-qr-scanner` ^2.6.0 (leer) | El escáner se carga con `next/dynamic` |
| Correo | `mailersend` 3.2.0 (fijada) | Solo en `src/lib/correo/`, zona de solo lectura |
| Barrera de servidor | `server-only` ^0.0.1 | En `src/lib/supabase/admin.ts` |
| Tests | `vitest` ^4.1.10 | `environment: 'node'`, `include: ['src/**/*.test.ts']`. Solo `.ts`: **no puede haber tests de componentes** |
| Lint | `eslint` ^9 con `eslint-config-next` 16.2.10 | Config plana (`eslint.config.mjs`), sin reglas propias |
| Despliegue | `vercel.json` | Única clave: `regions: ["yul1"]` |

**No instalado, y su ausencia es significativa**: Prettier, Husky, lint-staged,
`@testing-library/*`, Playwright, Storybook, Zod (o cualquier validador de esquemas),
Zustand/Jotai/Redux, React Query, SWR. No hay CI: **no existe `.github/`**.

`next.config.ts` define seis cabeceras de seguridad para `/:path*` y documenta por qué
**no** hay CSP todavía (Next inyecta scripts en línea; requiere nonces y prueba en
producción).

---

## Estructura de directorios

```
src/
├── app/                        # App Router. 61 archivos de ruta.
│   ├── layout.tsx  page.tsx    # raíz: `/` hace redirect('/admin')
│   ├── manifest.ts  apple-icon.tsx
│   ├── globals.css             # 549 líneas: mapeo de tokens por tema, reset, base
│   ├── login/                  # acceso administrativo
│   ├── activar-cuenta/         # invitación por enlace (el módulo más nuevo)
│   ├── admin/                  # Portal Administrativo. Shell + @modal
│   │   ├── layout.tsx          # requireRol + AppShell + la ÚNICA ranura @modal
│   │   ├── @modal/             # 14 rutas interceptadas + default.tsx + loading.tsx
│   │   ├── miembros/ comercios/ planes/ usuarios/ bitacora/ metricas/ cuenta/
│   │   ├── error.tsx           # única frontera de error del repositorio
│   │   └── loading.tsx         # 6 loading.tsx en total, todos bajo /admin
│   ├── comercios/              # Portal de Comercios (herramienta de caja)
│   │   ├── login/
│   │   └── (portal)/           # grupo de rutas con su propio layout y chrome
│   ├── miembros/               # Portal de Miembros
│   │   ├── login/
│   │   └── (portal)/           # incluye inactiva/ y perfil/ (carnet + QR)
│   ├── dev/                    # SOLO desarrollo: notFound() en producción
│   │   ├── ui/                 # galería del sistema de diseño (gallery.tsx)
│   │   └── shell/              # vista previa del shell con datos falsos
│   └── offline/                # página de respaldo de la PWA
│
├── components/
│   ├── ui/                     # 27 modulos .tsx y 25 .module.css. Catálogo: CLAUDE.md
│   ├── shell/                  # AppShell, paleta de comandos, progreso de ruta,
│   │                           # overlay-ruta (envoltorio de rutas interceptadas)
│   ├── theme/                  # ThemeProvider, script anti-parpadeo, conmutador
│   ├── pwa/                    # registro del SW, aviso de instalación
│   └── use-*.ts                # 3 hooks sueltos: hidratado, media-query, preferencia
│
├── lib/                        # organizado POR DOMINIO. Ver CLAUDE.md.
│   ├── auth/ supabase/ correo/       # SOLO LECTURA (SCOPE.md §7)
│   ├── miembros/ comercios/ metricas/ bitacora/ shared/   # zona de trabajo
│   └── (13 archivos .test.ts, todos junto a su módulo)
│
├── styles/
│   ├── tokens.css              # 302 líneas, 145 declaraciones de custom property
│   └── formulario.module.css   # la única hoja compartida entre rutas
│
└── proxy.ts                    # middleware de Next: refresco de sesión Supabase
```

`public/` contiene solo `sw.js` y dos SVG de icono. **No hay imágenes de mapa de bits en
todo el repositorio**: los iconos son SVG o `lucide-react`, y `apple-icon.tsx` se genera
en tiempo de compilación.

---

## Convenciones detectadas

Todas inferidas del código, con conteo. Ninguna está escrita en `CLAUDE.md`.

### Exportación: named siempre, default solo cuando Next lo obliga

- **Regla**: un componente se exporta **con nombre**. `export default` aparece
  exclusivamente en archivos que el App Router exige que lo tengan.
- **Evidencia**: `src/components/ui/button.tsx:64` (`export function Button`).
  **62 default exports, y los 62 están en `src/app/`**: 45 `export default async function`,
  16 `export default function` y 1 reexport (`admin/@modal/loading.tsx`). Coincide con los
  61 archivos de ruta mas `manifest.ts` y `apple-icon.tsx`.
  **`export default` en `src/components/` o `src/lib/`: cero.**
- **Excepciones**: ninguna. Es la convención más limpia del repositorio.
- **Corolario**: 97 `export function` en archivos `.tsx` y un solo `export const` de
  componente. **Nunca `React.FC`**, 0 ocurrencias.

### Nomenclatura

- **Regla**: archivos y carpetas en **kebab-case sin excepción**; componentes en
  PascalCase; funciones y variables en **español**, camelCase.
- **Evidencia**: **0 archivos** de `src/` con mayúscula o guion bajo en el nombre.
  `CLAUDE.md` solo exige kebab-case para `src/components/ui/`; **el repositorio lo aplica
  a todo**.
- **Idioma**: el dominio va en español (`registrarMiembro`, `derivarEstadoMembresia`,
  `esRutaActiva`, `amortiguarBorde`) y los identificadores de la plataforma en inglés
  (`Props`, `children`, `className`, `onClose`). Las clases CSS también en español:
  `.buscador`, `.celdaEstado`, `.credencialEtiqueta`.
- **Excepción**: `src/app/comercios/(portal)/_components/verificacion-tool.tsx` mezcla
  español e inglés en un mismo nombre. 1 de 124 archivos `.tsx`.

### Colocación de componentes

- **Regla**: lo que usa una sola ruta vive en el `_components/` de esa ruta; lo
  reutilizable sube a `src/components/`. `CLAUDE.md` ya lo dicta para formularios;
  **el código lo aplica a todo componente de ruta**, no solo a formularios.
- **Evidencia**: **16 carpetas `_components/`**. Incluyen no-formularios:
  `comercio-card.tsx`, `resultado-miembro.tsx`, `escaner-qr.tsx`, `portal-nav.tsx`.
- **Excepción**: `src/app/login/login-form.tsx` está **suelto en la ruta**, sin
  `_components/`. Es el único de los seis formularios de acceso que lo hace; los otros
  cinco sí tienen carpeta. Parece descuido histórico, no decisión.

### Tipado de props

- **Regla dominante**: `type` local declarado sobre el componente. **Cero `interface` en
  todo `src/`.**
- **Dos formas conviven**:
  - **Alias con nombre**, `type XProps = {...}` o `type Props = {...}` justo encima:
    **49 ocurrencias**, de las que 37 llevan nombre propio y 12 el genérico `Props`.
    Domina en `src/components/ui/`. Evidencia: `src/components/ui/cifra.tsx:4`,
    `src/components/ui/alert.tsx:19`.
  - **Literal en línea en la desestructuración**, `}: { a: X; b: Y }`:
    **32 ocurrencias**. Domina en páginas y en componentes de una sola pantalla.
    Evidencia: `src/app/admin/miembros/page.tsx:68`,
    `src/components/ui/accion-estado.tsx:32`.
- **Regla implícita observada**: si el componente admite `className`, se usa alias con
  nombre; si es de un solo uso, literal en línea. No es absoluto, pero explica casi todos
  los casos.
- **Extensión de props nativas**: por intersección con el tipo del DOM, nunca por
  `interface extends`. Evidencia: `src/components/ui/card.tsx:7`
  (`HTMLAttributes<HTMLDivElement> & {...}`) y `src/components/ui/toggle.tsx:20`
  (`Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>`).
- **Unión discriminada para el polimorfismo botón/enlace**:
  `src/components/ui/button.tsx:34` (`ButtonProps = ComoBoton | ComoEnlace`). Es el patrón
  a copiar si un componente nuevo debe poder ser botón o enlace.

### Manejo de errores

- **En formularios**, que son el 100% de las mutaciones: el error llega en el estado de
  `useActionState` y se pinta como **banner global** al principio del formulario.
  Evidencia: `src/app/admin/miembros/_components/miembro-form.tsx:44`.
  **16 de 16 formularios** siguen este patrón.
- **`Field` acepta un `error`** (`src/components/ui/field.tsx:34`) y lo pinta junto al
  input con `aria-describedby` y `aria-invalid`. De los **78 usos de `Field`** en el
  repositorio, **solo 1 le pasa un `error`, y está en la galería de desarrollo**
  (`app/dev/ui/gallery.tsx:336`). En producto: 0. La capacidad existe y está muerta.
  Ver P4 de `API-CONTRACT.md`.
- **En lecturas de página**: el `error` de Supabase **se descarta**. El patrón universal es
  desestructurar solo `data` y renderizar el fallback vacío. Un fallo de red se ve como
  una lista vacía. `notFound()`, con 22 usos, cubre "no existe", no "no se pudo leer".
- **Frontera de error**: **un solo `error.tsx` en todo el repositorio**,
  `src/app/admin/error.tsx`. Registra en consola y ofrece `reset()`.
- **`console`**: 8 usos en producción, todos `console.error` o `console.warn` con prefijo
  entre corchetes (`[admin]`, `[pwa]`). **Cero `console.log`.**
- **`try/catch`**: solo 9 en todo `src/`, y todos envuelven una API del navegador que puede
  lanzar (`localStorage`, portapapeles, `vibrate`, cookies) o el envío de un correo.
  **La lógica de negocio nunca usa `try/catch`**: comprueba y devuelve.

### Estados de carga

- **Regla**: se usan las tres capas, cada una para lo suyo.
  1. `loading.tsx` con esqueleto compuesto de `src/components/ui/skeletons.tsx`
     (`SkeletonPageHeader`, `SkeletonTabla`, `SkeletonCifras`, `SkeletonAccesos`,
     `SkeletonBuscador`). Evidencia: `src/app/admin/loading.tsx`.
  2. `pending` de `useActionState` pasado a la prop `loading` del `Button`.
     Evidencia: `miembro-form.tsx:147`. **16 de 16 formularios.**
  3. `useOptimistic` cuando el resultado es predecible, es decir activar y desactivar.
     Evidencia: `src/components/ui/accion-estado.tsx:47`.
- **Cobertura real**: **6 `loading.tsx`**, todos bajo `/admin` (`admin/`, `admin/@modal/`,
  `comercios/`, `miembros/`, `planes/`, `usuarios/`). `bitacora`, `metricas`, las fichas de
  detalle, el Portal de Miembros y el Portal de Comercios **no tienen ninguno**.
- **`Suspense`**: solo 2 usos, ambos por obligación (`useSearchParams` en `RouteProgress` y
  en `activar-cuenta`). No se usa como recurso de diseño para escalonar la carga.

### Formularios

- **Regla**: `useActionState(accion, estadoInicial)` con la acción importada del
  `actions.ts` hermano, `<form action={formAction} noValidate>` y los estilos de
  `@/styles/formulario.module.css`.
- **Evidencia**: **16 archivos** usan `useActionState`, 32 apariciones del identificador.
  `noValidate` es sistemático: la validación de verdad está en el servidor.
- **Excepción**: `src/app/activar-cuenta/_components/activar-form.tsx` **no usa
  `useActionState`**. Lleva `useState` para el error, una máquina de estados propia
  (`verificando`, `listo`, `invalido`, `guardando`) y llama a Supabase desde el navegador.
  Es 1 de 17. Está justificado, porque no hay Server Action que invocar, pero significa que
  su manejo de error y de carga **no se parece a nada más del repositorio**.
- **`useFormStatus`: 0 usos.** El estado pendiente siempre viene de `useActionState`, no
  del contexto del formulario. Un hijo no puede saber si el formulario está enviándose:
  hay que pasarle el `pending` por prop.

### Estado del cliente

- Puntero: `CLAUDE.md`, "Estado externo = `useSyncExternalStore`, nunca `useState` mas
  `useEffect`". **Cumplido**: 6 módulos lo usan (`theme-provider`, `use-media-query`,
  `use-hidratado`, `use-preferencia-local`, `pwa/instalable`, `pwa/instalar-app`).
- **Lo que `CLAUDE.md` no dice y el código sí hace**: hay **12 archivos con `useEffect`** y
  en todos el efecto **sincroniza con un sistema externo**, nunca deriva estado. Evidencia
  del caso canónico: `src/components/theme/theme-provider.tsx:97`, con el comentario
  "Único efecto, y del tipo que corresponde". Hay 57 usos de `useState`, todos para estado
  local de interfaz: abierto o cerrado, valor de un campo controlado.
- **No hay store global.** Los únicos contextos de React del código de producto son
  `ToastContext` (`src/components/ui/toast.tsx:44`) y `ThemeContext`. Todo lo demás viaja
  por props o por la URL.

### La URL como estado

- **Regla**: filtros y búsqueda viven en `searchParams`, con un formulario `method="get"`.
  No hay estado de filtro en el cliente.
- **Evidencia**: `src/app/admin/miembros/page.tsx:99` documenta el porqué: la búsqueda
  queda en la URL, se puede compartir, sobrevive a un refresco y funciona sin JavaScript.
  6 páginas leen `searchParams`: miembros, comercios, bitácora, métricas y las tres de
  acceso, estas últimas solo para el parámetro de error.
- **Detalle que conviene conocer**: Next entrega un array si un parámetro se repite en la
  URL. Solo `miembros/(portal)/page.tsx:12` lo normaliza, con un helper `primero()`. Las
  otras cinco páginas tipan el parámetro como `string` y confiarían en un valor que puede
  llegar como array.

### Comentarios

- **Regla observada**: el comentario explica **por qué**, casi nunca qué. Muchos citan el
  fallo concreto que motivó la línea.
- **Evidencia**: **97 de 180 archivos `.ts` y `.tsx`, un 54%**, llevan bloque JSDoc o
  comentario de bloque. `src/app/admin/layout.tsx:11-24` explica por qué la ranura `@modal`
  está ahí; `src/components/ui/input.tsx:109` explica por qué **no** lleva `tabIndex={-1}`;
  `src/lib/supabase/database.types.ts:257-267` explica por qué se declaró un
  `Relationships`.
- **Consecuencia para quien edite**: borrar un comentario aquí borra la razón de una
  decisión que ya costó un bug. Si se cambia la línea, se actualiza el comentario.

---

## Patrones de datos

Detalle completo en `.claude/docs/API-CONTRACT.md`. Lo imprescindible:

- **Dos caminos y solo dos**: lectura directa desde el Server Component con `supabase-js`
  (**36 archivos** `page.tsx` y `layout.tsx` consultan la base) y escritura vía Server
  Action (12 archivos, 27 acciones).
  **Cero `fetch()` en todo `src/`.**
- **Sin caché declarada**: cero `revalidate`, `dynamic`, `unstable_cache` o `cache()`.
  La invalidación es manual, con `revalidatePath()` dentro de cada acción.
- **Dos clientes de Supabase, y la elección importa**:
  `createAdminClient()` (service role, **salta RLS**) se usa en **36 archivos de
  `src/app/`, todos bajo `/admin`**; `createClient()` (sesión, respeta RLS) se usa en los
  11 archivos de los portales de miembro y comercio y en las acciones de acceso. La regla
  de facto es: **el panel administrativo usa service role; los portales de usuario final,
  nunca**. Un archivo nuevo bajo `/miembros` o `/comercios` que importe `admin.ts` rompe
  esa frontera. `src/lib/supabase/admin.ts` lleva `server-only` para que el fallo sea de
  compilación y no de ejecución.
- **Paralelizar es la norma**: `Promise.all` sobre las consultas independientes, ya hecho
  en el commit `e1fc40a`. Evidencia: `src/app/admin/metricas/page.tsx:113-138` con seis
  consultas en un solo `Promise.all`. Encadenar `await` secuenciales sería una regresión.
- **Sin validador de esquemas.** No hay Zod ni equivalente. Cada acción lee el `FormData`
  con `String(formData.get('x') ?? '').trim()` y valida a mano, con un `return { error }`
  por cada regla. Es coherente en las 27 acciones, y es zona de solo lectura.
- **Fechas**: puntero a `CLAUDE.md`, sección "Fechas". El código lo cumple:
  `inicioDiaBogota`/`finDiaBogota` en los 6 filtros de rango, y `Date.UTC` mas
  `timeZone: 'UTC'` para las fechas civiles. Los helpers están en `src/lib/shared/fecha.ts`.

---

## Frontera Server/Client

Puntero: `CLAUDE.md`, "Páginas = Server Components con `requireRol`. `'use client'` solo
en hojas interactivas". Lo que el código añade:

- **48 módulos llevan la directiva `'use client'`**, sobre 180 archivos `.ts` y `.tsx`.
  Reparto exacto: 23 en `src/app/`, todos formularios o herramientas interactivas;
  11 en `src/components/ui/`; 5 en `shell/`; 3 en `pwa/`; 3 hooks sueltos; 2 en `theme/`;
  y 1 en `src/lib/`, que es `shared/haptica.ts`.
- **La directiva se pone lo más abajo posible del árbol.** Casos verificados donde
  **deliberadamente no** se puso, aunque parecería natural:
  - `src/components/ui/data-list.tsx` — comentario en la línea 7: "No lleva `'use client'`
    a propósito: así las páginas siguen siendo Server Components". `DataList` es el
    componente más usado en listas (9 páginas) y es de servidor.
  - **`src/components/ui/button.tsx` tampoco lo lleva**, y es el componente más usado del
    repositorio, presente en 34 archivos. Su línea 61 lo dice: "No lleva `'use client'`: no
    usa hooks". Añadirle un `onClick` lo convertiría en cliente y arrastraría medio árbol.
  - Igual: `card.tsx`, `layout.tsx`, `badge.tsx`, `alert.tsx`, `avatar.tsx`, `feedback.tsx`,
    `skeletons.tsx`, `spinner.tsx`, `cifra.tsx`, `form-card.tsx`, `comercio-logo.tsx`,
    `qr-code.tsx`, `pantalla-auth.tsx`, `whatsapp-button.tsx`.
    **16 de los 27 componentes de `ui/` son Server Components; solo 11 son de cliente.**
    Al añadir uno nuevo, la pregunta correcta no es "¿lo marco cliente?" sino "¿de verdad
    necesita estado?".
- **`src/lib/shared/haptica.ts` lleva `'use client'`.** Es el único archivo de `src/lib/`
  que lo lleva, y significa que **no se puede importar desde un Server Component**.
  Consumidores: `accion-estado.tsx:6` y `copiar.tsx:5`.
- **Barrera dura hacia el otro lado**: `src/lib/supabase/admin.ts` importa `server-only`.
  Su cabecera lo llama "barrera de compilación, no un ruego" y explica que un comentario
  no impide nada.
- **La ranura `@modal`**: puntero a `CLAUDE.md`, que ya explica por qué vive solo en
  `app/admin/layout.tsx`. Verificado hoy: **las 14 rutas de formulario tienen su gemela
  bajo `@modal`**, y existen `default.tsx` y `loading.tsx` de la ranura. El envoltorio es
  `OverlayRuta` (`src/components/shell/overlay-ruta.tsx`), que cierra con `router.back()`.
- **`AppShell` monta el árbol de cliente del panel**: `ToastProvider`, la paleta de
  comandos y la barra lateral. Los portales de miembro y comercio tienen **su propio chrome
  independiente** (`portal.module.css` y `portal-nav.tsx` en cada uno) y no comparten shell
  con el panel. Un cambio en `AppShell` **no** llega a los otros dos portales.

---

## Inventario de APIs internas del frontend

### `src/components/ui/` — 27 módulos, 57 exportaciones de valor

Catálogo y reglas de uso: `CLAUDE.md`, sección "Componentes: usa los que hay". Aquí van
**las firmas reales**, incluidas las que el catálogo de `CLAUDE.md` no nombra.
`S` = Server Component (sin `'use client'`), `C` = cliente.

| Módulo | Exporta | Props | S/C |
|---|---|---|---|
| `button.tsx` | `Button` | unión `ComoBoton \| ComoEnlace`. Base: `variant?: 'primary'\|'secondary'\|'ghost'\|'danger'\|'gold'`, `size?: 'sm'\|'md'\|'lg'`, `loading?`, `iconOnly?`, `fullWidth?`, `icon?`, `children?`, `className?`. Con `href` renderiza `Link` | C |
| | `ButtonVariant`, `ButtonSize`, `ButtonProps` | tipos públicos | |
| `spinner.tsx` | `Spinner` | `size?: 'sm'\|'md'\|'lg'`, `label?: string \| null` (null si el contenedor ya anuncia), `className?` | S |
| `field.tsx` | `Field` | `label: string`, `help?`, `error?: string \| null`, `optional?`, `children`, `className?` | C |
| | `useField()` | devuelve `{ id, describedBy, invalid }` para el input hijo | |
| `input.tsx` | `Input` | props nativas mas `numeric?`, `startIcon?`, `endIcon?`, `className?` | C |
| | `InputButton` | botón dentro del campo; hace `preventDefault` en `onPointerDown` | |
| | `Textarea`, `Select` | props nativas mas `numeric?` | |
| `toggle.tsx` | `Switch`, `Checkbox`, `Radio` | `Base & EntradaProps`; `Base = { label: ReactNode; description?: ReactNode; className? }`, `EntradaProps = Omit<InputHTMLAttributes, 'type'\|'className'>` | C |
| `segmented.tsx` | `SegmentedControl<T extends string>` | `options: ReadonlyArray<SegmentedOption<T>>`, `value: T`, `onChange`, `ariaLabel`, `size?`, `compactOnMobile?`, `indicatorHidden?`, `className?` | C |
| | `SegmentedOption<T>` | `{ value: T; label: string; icon?; disabled? }` | |
| `card.tsx` | `Card` | `HTMLAttributes<HTMLDivElement> &` `padding?: 'none'\|'sm'\|'md'\|'lg'`, `variant?: 'default'\|'sunk'\|'brand'`, `interactive?`, `children` | S |
| | `CardHeader`, `CardBody`, `CardFooter` | subcomponentes | |
| `form-card.tsx` | `FormCard` | `desnudo?`, `variant?: 'brand'`, `estrecha?`, `children` | S |
| `layout.tsx` | `Stack` | `direction?`, `gap?: SpaceStep`, `align?`, `justify?`, `wrap?` | S |
| | `Grid` | `min?: string`, `gap?: SpaceStep` | |
| | `Divider` | `label?`, `className?` | |
| | `Section` | `title`, `actions?`, `gap?`, `className?`, `children` | |
| | `PageHeader` | `title`, `description?`, `actions?`, `className?` | |
| | `SpaceStep` | `1..12`, el único vocabulario de espaciado admitido en props | |
| `badge.tsx` | `Badge` | `tone?: BadgeTone`, `size?: 'sm'\|'md'`, `icon?`, `children` | S |
| | `StatusBadge` | recibe el estado **ya derivado**, nunca la columna cruda | |
| | `VenceEn` | señal ámbar secundaria; no es un estado | |
| `avatar.tsx` | `Avatar` | `nombre`, `src?`, `size?: 'sm'\|'md'\|'lg'`, `brand?`, `decorativo?`, `className?` | S |
| | `iniciales(nombre)` | helper puro exportado, **sin test** | |
| `cifra.tsx` | `Cifra` | `etiqueta`, `valor: ReactNode`, `nota?`, `size?: 'md'\|'sm'`. **No formatea**: el valor llega ya formateado | S |
| `alert.tsx` | `Alert` | `tone?: 'info'\|'success'\|'warning'\|'danger'`, `title?`, `children?`, `actions?`, `className?` | S |
| | `AlertTone` | tipo público | |
| `toast.tsx` | `ToastProvider`, `useToast()` | `toast({ title, description?, tone?, duration?, action? })`. **Solo montado en `AppShell`**: `useToast` lanza fuera de `/admin` | C |
| | `ToastTone`, `ToastOptions` | tipos públicos | |
| `modal.tsx` | `Modal` | `open`, `onClose`, `title?`, `description?`, `footer?`, `width?`, `hideClose?`, `children?` | C |
| | `ConfirmDialog` | `open`, `onClose`, `onConfirm`, `title`, `description?`, `confirmLabel?`, `cancelLabel?`, `destructive?`, `loading?` | |
| `sheet.tsx` | `Sheet` | mismas props mas `detent?: 'medium'\|'large'`. Gestos con `proyectarMomento` | C |
| | `Detent` | tipo público | |
| `overlay.tsx` | `Overlay` | fachada que elige `Modal` o `Sheet` según el ancho. `open`, `onClose`, `title?`, `description?`, `footer?`, `width?`, `detent?` | C |
| `menu.tsx` | `DropdownMenu` | `trigger: ReactElement`, `align?: 'start'\|'end'`, `children` | C |
| | `MenuItem` | `onSelect?` \| `href?` \| `submit?`, mas `icon?`, `destructive?`, `disabled?`, `children` | |
| | `MenuSeparator`, `MenuLabel` | | |
| `feedback.tsx` | `Skeleton` | `width?`, `height?`, `radius?`, `variant?: 'block'\|'text'\|'circle'` | S |
| | `SkeletonText` | `lines?: number` | |
| | `ProgressBar` | `value`, `label?`, `className?` | |
| | `EmptyState` | `title`, `description?`, `icon?`, `actions?` | |
| | `ErrorState` | `title`, `description?`, `detail?`, `actions?` | |
| `skeletons.tsx` | `SkeletonPageHeader` `SkeletonTabla` `SkeletonBuscador` `SkeletonCifras` `SkeletonAccesos` | piezas compuestas para los `loading.tsx` | S |
| `data-list.tsx` | `DataList<T>` | `items`, `columns: ReadonlyArray<Column<T>>`, `getKey`, `rowHref?`, `actions?`, `alwaysShowActions?`, `loading?`, `error?`, `empty?`, `caption` (obligatorio) | S |
| | `Column<T>` | `{ key, header, cell, numeric?, primary?, hideOnMobile?, width? }` | |
| `accion-estado.tsx` | `AccionEstado` | `activo`, `accion: (fd: FormData) => void\|Promise<void>`, `campos: Record<string, string\|number>`, `etiquetaActivar`, `etiquetaDesactivar`, iconos opcionales. Usa `useOptimistic` | C |
| `copiar.tsx` | `Copiar` | `valor`, `children?`, `label?` | C |
| `pantalla-auth.tsx` | `PantallaAuth` | `subtitulo`, `pie?`, `children` | S |
| | `estilosAuth` | `{ formulario, alerta }`. **Obligatorio** para que la sacudida `:has(.alerta)` funcione | |
| `comercio-logo.tsx` | `ComercioLogo` | `logoUrl: string \| null`, `nombre`, `size?: number` | S |
| `qr-code.tsx` | `QrCode` | `value`, `size?: number`, `label?`. Único sitio con colores literales, a propósito | S |
| `whatsapp-button.tsx` | `WhatsAppButton` | `telefono`, `mensaje?`, `variant?: ButtonVariant` | S |

#### Componentes que solo usa la galería de desarrollo

Verificado por conteo de importaciones fuera de `src/components/ui/`. **11 componentes
del catálogo no se usan en ninguna pantalla de producto**, solo en
`src/app/dev/ui/gallery.tsx`, que hace `notFound()` en producción:

`Checkbox` · `Radio` · `Switch` · `Textarea` · `Modal` (directo; sí se usa a través de
`Overlay`) · `ConfirmDialog` · `ProgressBar` · `SkeletonText` · `MenuLabel` ·
`CardHeader` · `CardBody` · `CardFooter`

No es deuda: es superficie disponible y probada visualmente. Importa saberlo porque
**`ux-designer` puede proponer flujos con ellos sin coste de implementación**, y porque un
cambio en ellos no tiene consumidor real que lo valide.

#### Los cinco más usados

`Button` (34 archivos) · `PageHeader` (28) · `Input` (23) · `Field` (18) ·
`Alert` y `Stack` (17 cada uno). Cualquier cambio de firma en estos seis toca medio
repositorio.

### `src/components/` fuera de `ui/`

| Módulo | Exporta | Notas |
|---|---|---|
| `shell/app-shell.tsx` | `AppShell` | `user: { nombre, email, rolNombre, rolCodigo }`, `cerrarSesion`. Monta `ToastProvider`, barra lateral, barra inferior y paleta |
| `shell/nav-config.ts` | `navegacionPara(rol)`, `tabsPara(rol)`, `esRutaActiva(item, pathname)`, tipos `NavItem` `NavGroup` `TabItem` | **Funciones puras sin test.** `CLAUDE.md` avisa: lo que sale de `navegacionPara` hay que listarlo a mano en la hoja "Más" del móvil |
| `shell/command-palette.tsx` | `CommandPalette` | Único consumidor de `buscarMiembrosAction`. Usa `useTransition` |
| `shell/overlay-ruta.tsx` | `OverlayRuta` | Envoltorio de toda ruta interceptada. Cierra con `router.back()` |
| `shell/overlay-cargando.tsx` | `OverlayCargando` | Reexportado como `admin/@modal/loading.tsx` |
| `shell/route-progress.tsx` | `RouteProgress` | Barra de progreso de navegación. Requiere `Suspense` |
| `theme/theme-provider.tsx` | `ThemeProvider`, `useTheme()` | `{ mode, resolved, setMode, mounted }` |
| `theme/theme-script.tsx` | `ThemeScript`, `THEME_STORAGE_KEY`, tipos `ThemeMode` `ResolvedTheme` | Script anti-parpadeo |
| `theme/theme-toggle.tsx` | `ThemeToggle` | |
| `pwa/instalable.ts` | `suscribirInstalable`, `leerInstalable`, `leerInstalableEnServidor`, `lanzarInstalacion`, `esStandalone`, `esSafariEnIOS` | Store externo del evento de instalación |
| `pwa/instalar-app.tsx` | `InstalarApp` | |
| `pwa/registrar-sw.tsx` | `RegistrarSW` | Limpia cachés con prefijo `orum-` |
| `use-media-query.ts` | `useMediaQuery(consulta)`, `ESCRITORIO` (`'(min-width: 768px)'`) | |
| `use-hidratado.ts` | `useHidratado()` | `false` en servidor y durante la hidratación |
| `use-preferencia-local.ts` | `usePreferenciaLocal(clave, porDefecto?)` | Devuelve `[valor, establecer]` |

### `src/lib/` en zona de trabajo — utilidades públicas

`auth/`, `supabase/` y `correo/` quedan fuera: son contrato externo. Ver `SCOPE.md` §7.

| Módulo | Exporta | Test | Quién lo consume |
|---|---|---|---|
| `shared/fecha.ts` | `hoyISO()`, `inicioDiaBogota(f)`, `finDiaBogota(f)` | 3 casos | 6 sitios: bitácora, métricas y 4 acciones |
| `shared/motion.ts` | `SPRING_UI` `SPRING_MOVE` `SPRING_SHEET` `SPRING_FLICK`, `DECELERACION_NORMAL`, `proyectarMomento`, `amortiguarBorde`, `velocidadRelativa`, `prefiereMovimientoReducido`, tipo `SpringPreset` | 15 casos | `app-shell`, `modal`, `sheet`, `toast` |
| `shared/haptica.ts` | `toque()`, `exito()`, `error()` | **sin test** | Solo `toque`, en `accion-estado` y `copiar`. **`exito` y `error` no los usa nadie** |
| `shared/html.ts` | `escaparHtml(valor)` | 3 casos | Solo `lib/correo/` |
| `shared/password-fortaleza.ts` | `evaluarFortaleza(pw)`, `LONGITUD_MINIMA` (8), tipos `NivelFortaleza` `Fortaleza` | 10 casos | **Solo `admin/cuenta/password/`**. `activar-cuenta` no lo usa |
| `miembros/membresias.ts` | `derivarEstadoMembresia`, `venceProximamente`, `generarNumeroMembresia`, `calcularFechaFin`, `calcularFechaInicioRenovacion`, tipos `EstadoDerivado` `EstadoMembresia` `MotivoInactiva` | 23 casos | Toda pantalla que muestre estado |
| `miembros/membresia-vigente.ts` | `esMembresiaVigente` | 6 casos | |
| `miembros/buscar-miembros.ts` | `buscarMiembros(termino, limite?)`, `limpiarTermino(entrada)`, tipo `MiembroEncontrado` | **sin test** | `/admin/miembros` y la paleta |
| `miembros/requerir-miembro.ts` | `requireRolMiembro()`, `requireMiembroVigente()`, tipo `MiembroActual` | — | Layout y páginas del Portal de Miembros |
| `miembros/auth-miembro.ts` | `resolverCorreoPorNumeroMembresia` | — | `miembros/login/actions.ts` |
| `comercios/ventas.ts` | `calcularDescuento`, `calcularValorFinal` | 7 casos | `registrarVenta` y el formulario de confirmación |
| `comercios/promociones.ts` | `validarValorPromocion`, tipo `ResultadoValidacion` | 14 casos | `promociones-actions.ts` |
| `comercios/promocion-vigente.ts` | `esPromocionVigente` | 6 casos | Portal de Comercios y de Miembros |
| `comercios/beneficios-formato.ts` | `formatearBeneficio(tipoCodigo, valor)` | 6 casos | Tarjeta de comercio |
| `comercios/requerir-comercio.ts` | `requireRolComercio()` | — | Layout y acciones del Portal de Comercios |
| `metricas/metricas.ts` | `rangoUltimosDias`, `agruparMembresiasPorEmpleado`, `agruparVentasPorComercio`, `agruparVentasPorMiembroYComercio`, y 8 tipos | 10 casos | `/admin/metricas` |
| `bitacora/bitacora.ts` | `resumirEventoBitacora`, `registrarActividad`, tipos `DatosEvento` `AccionBitacora` `RegistrarActividadInput` | 8 casos | `/admin/bitacora` y 3 acciones |

**Total de tests: 13 archivos, 115 casos.** Todos de funciones puras, como manda
`CLAUDE.md`. `vitest.config.ts` limita el descubrimiento a `src/**/*.test.ts`, así que
**un test de componente ni siquiera se ejecutaría**.

---

## Herramientas de calidad

| Herramienta | Estado | Detalle |
|---|---|---|
| TypeScript | Instalado y estricto | `strict: true`. Verificación manual: `pnpm exec tsc --noEmit` |
| ESLint 9 | Instalado, **sin personalizar** | `eslint.config.mjs`: `core-web-vitals` mas `typescript` de `eslint-config-next`, y un `globalIgnores`. **Cero reglas propias.** Nada impide automáticamente un `className="orum-*"`, un color literal o un `@media` donde tocaba `@container` |
| Prettier | **No instalado** | El formato es consistente igualmente: 2 espacios, comillas simples, sin punto y coma, ancho de línea ~90. Se sostiene por disciplina, no por herramienta |
| Husky / lint-staged | **No instalados** | No hay hook de pre-commit. `.claude/settings.json` sí tiene hooks, pero invocan `graphify`, que **no está instalado en esta máquina** |
| Vitest 4 | Instalado | `environment: 'node'`, solo `src/**/*.test.ts`. 13 archivos, 115 casos |
| Tests de interfaz | **No existen** | Sin `@testing-library`, sin Playwright. `CLAUDE.md` lo declara deuda aceptada |
| CI | **No existe** | No hay `.github/`. Ningún check corre solo |
| Supabase CLI | En devDependencies | Permite regenerar `database.types.ts`, que hoy se mantiene a mano |

**Comando de verificación** (de `CLAUDE.md`, "Antes de dar algo por hecho"):

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

Los cuatro pasos son manuales. Nadie los ejecuta por ti.

---

## Deuda técnica observada

Severidad: **A** rompe una regla dura de `CLAUDE.md` o un contrato · **M** inconsistencia
con coste real · **B** duplicación o cabo suelto.

### A · Contradicciones con `CLAUDE.md`

La norma no se ajusta al código: se reporta la divergencia.

| Sev | Área | Descripción | Ubicación |
|---|---|---|---|
| A | Movimiento | `CLAUDE.md` prohíbe animar `width`, `height`, `top`, `left` y `margin`: "recalcula layout cada fotograma". **Cuatro transiciones lo hacen.** Tres llevan comentario que explica la intención, así que la divergencia parece deliberada, pero la regla no admite excepciones tal como está escrita | `components/shell/app-shell.module.css:56` (`transition: width` de la barra lateral) · `:390` (`transition: padding-left` de la columna) · `components/shell/route-progress.module.css:27` (`transition: width`) · `components/ui/feedback.module.css:65` (`ProgressBar`, `transition: width`) |
| A | Movimiento | Quinta ocurrencia, sin comentario que la justifique: el pulgar del `Switch` anima `width` | `components/ui/toggle.module.css:87-89` |
| A | Tokens | `CLAUDE.md` prohíbe literales de color, espaciado, radio y duración. **Cuatro literales fuera de la excepción sancionada** (`QrCode`): `background: #fff` y dos `rgba(10,10,12,…)` en el pulgar del switch; el halo dorado de la pantalla de acceso escrito como `rgba(191,160,99,…)`, que es `--gold-500` a mano; y `border: 1px solid #000` en los estilos de impresión del carnet | `components/ui/toggle.module.css:82,84-85` · `components/ui/pantalla-auth.module.css:43-44` · `app/miembros/(portal)/perfil/perfil.module.css:124` |
| A | Tokens | Duración y curva literales: `transition: width 600ms cubic-bezier(0.1, 0.6, 0.2, 1)`. Debería salir de `tokens.css` | `components/shell/route-progress.module.css:27` |
| A | Adaptación | `CLAUDE.md`: las páginas se adaptan preguntando por el contenedor `contenido`, porque un `@media` "se equivoca en ~200px justo donde importa". **64 `@media` frente a 10 `@container` en todo el repositorio.** Cuatro módulos de página que sí viven dentro del contenedor usan `@media (max-width: 640px)` | `app/admin/inicio.module.css:22` · `app/admin/miembros/miembros.module.css:14` · `app/admin/miembros/[id]/ficha.module.css:174,180` · `app/admin/cuenta/password/_components/password-form.module.css:78` |

**No son violaciones, verificado uno a uno**: los cuatro `box-shadow: none` son
declaraciones sueltas, no un `none` dentro de una lista de sombras; los tres
`outline: none` llevan sustituto explícito (`input.module.css:38` lo dice en el mismo
comentario); los `@media` de `portal.module.css` de ambos portales son chrome del propio
shell, que es quien **declara** el contenedor, así que ahí `@media` es lo correcto.

### M · Inconsistencias con coste real

| Sev | Área | Descripción | Ubicación |
|---|---|---|---|
| M | Fronteras de error | **Un solo `error.tsx` en todo el repositorio.** Una excepción no capturada en el Portal de Miembros, el Portal de Comercios, `/login` o `/activar-cuenta` cae en la pantalla de error por defecto de Next, sin marca, sin copy y sin salida. El Portal de Comercios es la herramienta de caja: el fallo ocurre delante del cliente | Existe `app/admin/error.tsx`; faltan en `app/miembros/`, `app/comercios/`, `app/login/`, `app/activar-cuenta/` y en la raíz |
| M | Estados de carga | **6 `loading.tsx`, todos bajo `/admin`.** Sin ellos, la navegación a `/admin/bitacora`, `/admin/metricas`, cualquier ficha de detalle, `/miembros` o `/comercios` se queda en la pantalla anterior hasta que el servidor responde, sin señal ninguna | Faltan en `admin/bitacora/`, `admin/metricas/`, `admin/miembros/[id]/`, `admin/comercios/[id]/`, `miembros/(portal)/`, `comercios/(portal)/` |
| M | Errores de lectura | El `error` de las consultas de Supabase **se descarta en todas las páginas**. Un fallo de red se presenta como "no hay resultados". El `EmptyState` miente | Patrón universal: `const { data } = await …` y luego `data ?? []` |
| M | Errores de formulario | `Field` acepta `error` y lo ata al input con `aria-describedby` y `aria-invalid`, pero de sus **78 usos solo 1 lo pasa**, y es la galería de desarrollo. Todo error es un banner arriba: con un formulario largo, hay que buscar a mano el campo culpable | `components/ui/field.tsx:34`; ver P4 de `API-CONTRACT.md` |
| M | Duplicación de consultas | **14 parejas** de página real y gemela `@modal` con el bloque de consultas **copiado literalmente**. Si una se toca y la otra no, el mismo formulario recibe opciones distintas según por dónde entres, y el bug solo aparece desde uno de los dos orígenes | `admin/miembros/nuevo/page.tsx:12-21` frente a `admin/@modal/(.)miembros/nuevo/page.tsx:22-31`, y 13 pares más |
| M | Formato duplicado | No existe `src/lib/shared/formato.ts`. La fecha civil legible está reimplementada **3 veces** con el mismo patrón `Date.UTC`, y el importe en pesos **4 veces** (2 con `Intl.NumberFormat`, 2 con `toLocaleString` en línea), mas 8 llamadas sueltas a `toLocaleString('es-CO')`. Cambiar el formato de moneda exige tocar 12 sitios | `app/admin/metricas/page.tsx:26,48` · `app/admin/miembros/[id]/page.tsx:77,88` · `app/miembros/(portal)/perfil/page.tsx:26` · `app/admin/planes/page.tsx:25` · `app/comercios/(portal)/_components/confirmar-venta-form.tsx:26` |
| M | Fecha duplicada | `hoyISO()` está reimplementada dos veces más, con el mismo cuerpo exacto. Una lo admite en su comentario ("Igual que hoyISO() en @/lib/shared/fecha") | `lib/metricas/metricas.ts:4` · `app/miembros/(portal)/perfil/page.tsx:32` |
| M | Contraseñas | `activar-cuenta` valida "mínimo 8" con un `8` literal y **no usa** `evaluarFortaleza` ni `LONGITUD_MINIMA`, que sí usa la otra pantalla de contraseña. Dos pantallas que piden lo mismo dan feedback distinto | `app/activar-cuenta/_components/activar-form.tsx:41` frente a `app/admin/cuenta/password/_components/password-form.tsx:43,72` |
| M | Tipos | **Dos tipos distintos con el mismo nombre `MiembroEncontrado`** y campos incompatibles (`nombre` frente a `nombreCompleto`, `estado` frente a `vigente`). TypeScript no avisa porque nunca coinciden en un archivo | `lib/miembros/buscar-miembros.ts:14` frente a `app/comercios/(portal)/actions.ts:10` |
| M | Tipos de base | `database.types.ts` **se mantiene a mano** (lo dice su propio comentario) y deja `Relationships: []` en 15 de 16 tablas. Cualquier `select` con embebido nuevo no compilará aunque la clave foránea exista. El CLI de Supabase ya está en devDependencies | `lib/supabase/database.types.ts:257-267` |
| M | searchParams | Solo 1 de 6 páginas normaliza el caso en que Next entrega un array porque el parámetro se repite en la URL. Las otras cinco lo tipan como `string` | `app/miembros/(portal)/page.tsx:12` normaliza; `admin/miembros/`, `admin/comercios/`, `admin/bitacora/`, `admin/metricas/` no |
| M | Raíz del sitio | `/` hace `redirect('/admin')` sin mirar el rol. Un miembro o un comercio que abra el dominio a secas acaba en el acceso administrativo con `?error=sin_permiso`, en vez de en su portal. El Portal Público que `CLAUDE.md` menciona no existe todavía | `app/page.tsx:8` |

### B · Cabos sueltos

| Sev | Área | Descripción | Ubicación |
|---|---|---|---|
| B | Código muerto | `haptica.exito()` y `haptica.error()` se exportan y **no los importa nadie**. Solo se usa `toque` | `lib/shared/haptica.ts:36,41` |
| B | Cobertura de test | `haptica.ts` no tiene test, aunque es zona de trabajo de `qa-tester`. `limpiarTermino` (`buscar-miembros.ts:31`) tampoco, y **sanea la entrada de un filtro `.or()` de PostgREST**: es la función pura con más razones para tener uno. `iniciales` (`avatar.tsx:10`) y las tres de `nav-config.ts` tampoco lo tienen | `lib/shared/haptica.ts` · `lib/miembros/buscar-miembros.ts:31` · `components/ui/avatar.tsx:10` · `components/shell/nav-config.ts:73,94,128` |
| B | Toasts | `ToastProvider` solo se monta en `AppShell`. `useToast()` **lanza** en los portales de miembro y comercio y en las pantallas de acceso. La restricción no está escrita en ningún sitio salvo el mensaje de la excepción | `components/shell/app-shell.tsx:72` · `components/ui/toast.tsx:50` |
| B | Colocación | `app/login/login-form.tsx` está suelto en la ruta; los otros cinco formularios de acceso viven en `_components/` | `app/login/login-form.tsx` |
| B | Nombres | Un solo archivo empieza con un comentario que repite su propia ruta; los otros 179 no | `app/comercios/(portal)/_components/verificacion-tool.tsx:1` |
| B | Restos | `globals.css` conserva un bloque de comentario describiendo tres reglas `.orum-*` ya borradas. Es historia útil, pero deja el prefijo prohibido buscable en el repositorio | `app/globals.css:542-544` |

### Deuda ya declarada y aceptada en `CLAUDE.md`

No son hallazgos nuevos. Se listan para que ningún agente las reporte como si lo fueran.

| Área | Estado |
|---|---|
| `experimental.viewTransition` habilitado pero **sin aplicar** en ninguna pantalla | Aceptada. Confirmado: `next.config.ts` lo activa y no hay un solo `<ViewTransition>` en `src/` |
| Sin pruebas automatizadas de interfaz | Aceptada. Además, `vitest.config.ts` limita el descubrimiento a `.test.ts`, así que hoy **no se ejecutaría** un test de componente aunque se escribiera |
| Sin verificación en dispositivo real: vista móvil, gestos de la hoja, instalación de la PWA, Core Web Vitals | Aceptada. **La automatización de navegador de esta máquina no consigue redimensionar la ventana: no lo intentes.** Pide una captura al usuario |
| El Portal de Miembros solo se ha visto en su pantalla de acceso | Aceptada. Requiere un miembro con membresía vigente, y esas credenciales no están aquí |

### Fuera de alcance de este equipo

- **`graphify` no está instalado en esta máquina.** Los hooks `PreToolUse` de
  `.claude/settings.json` lo invocan por nombre desde el `PATH` y fallan en silencio.
  `graphify-out/` está congelado el 19/08/2026 y **no puede regenerarse aquí**.
  Es zona prohibida (`SCOPE.md` §3): no leerlo ni citarlo.
- **`.claude/settings.local.json` conserva `PowerShell(git *)` preaprobado**, que abarca
  `git push --force` y `git reset --hard`. `SCOPE.md` §3b ya lo anota como observación
  pendiente. Ningún auditor tiene shell, así que no lo alcanza.
- Los hallazgos sobre las Server Actions van a `PROPUESTAS PARA BACKEND` de
  `API-CONTRACT.md`, nunca a un parche.

---

## Recomendaciones para agentes

**Para todos, antes de nada**: `CLAUDE.md` de la raíz manda. Este archivo no lo repite ni
lo matiza. Si los dos parecen chocar, gana `CLAUDE.md` y la divergencia se reporta como
deuda, no se resuelve reescribiendo la regla.

**Frontera**: `SCOPE.md`. Los doce archivos con `'use server'`, `src/lib/auth/`,
`src/lib/supabase/`, `src/lib/correo/`, `supabase/**` y `docs/**` son solo lectura. Lo que
exija tocarlos va a `PROPUESTAS PARA BACKEND`, sección ya abierta en `API-CONTRACT.md`.

| Agente | Lo que este análisis le impone |
|---|---|
| `tech-lead` | La tarea más rentable del repositorio no es visual: son las fronteras de error y los `loading.tsx` que faltan fuera de `/admin` (2 filas M). El diseño está **acotado por `API-CONTRACT.md` §4**: sin paginación, sin ordenación, sin filtro por estado. No planifiques una pantalla que los necesite sin escalar P1 o P2 primero |
| `ux-designer` | Lee `API-CONTRACT.md` §4 **antes** de escribir la spec. No hay paginación ni forma de saber si una lista se truncó; el filtro por estado de membresía **no existe**; no hay subida de archivos; no hay tiempo real; y `useToast()` **lanza** fuera de `/admin`. Los 11 componentes solo-galería son superficie disponible y gratis |
| `design-system-architect` | El sistema son `tokens.css` (145 propiedades), `globals.css` (mapeo por tema) y los 27 módulos de `ui/`. **16 de esos 27 son Server Components, `Button` incluido**: convertir uno en cliente por añadirle un `onClick` tiene coste, y en `Button` el coste es medio repositorio. Las cinco filas A de literales y de animación de layout son tu punto de partida |
| `state-data-architect` | No hay store, ni caché, ni librería de datos. El estado de servidor no vive en el cliente: `revalidatePath` mas `redirect`. La URL es el estado de filtro. `useSyncExternalStore` para todo lo externo, sin excepción |
| `frontend-implementer` | Exporta **con nombre**; `export default` solo si el App Router lo obliga. Kebab-case sin excepción, dominio en español. `type`, nunca `interface`. Al añadir una ruta de formulario, crea **las dos** páginas —la real y la gemela `@modal`— e importa el formulario con el alias `@/app/admin/…`. Después **reinicia el servidor de desarrollo**, o la interceptación falla en silencio. Si vas a formatear una fecha o un importe, mira antes las filas M de duplicación: hay 12 sitios esperando un helper compartido |
| `code-reviewer` | ESLint **no tiene ni una regla propia**: nada automatiza las prohibiciones de `CLAUDE.md`. Los literales de color, los `@media` donde tocaba `@container` y las animaciones de layout solo los ve un humano o tú. Los `error` de Supabase descartados en las páginas son sistemáticos, no puntuales |
| `security-auditor` | Los 12 archivos con `'use server'` recibieron la tanda OWASP (`2a89f87`…`87d6476`). Audítalos igual de a fondo, pero **todo hallazgo ahí se escala, no se aplica**. Empieza por dos hechos verificados: 36 páginas de `/admin` usan el cliente **service role**, que salta RLS; y las acciones devuelven `error.message` de Postgres directo a la interfaz |
| `performance-engineer` | La paralelización con `Promise.all` ya se hizo (`e1fc40a`); más de lo mismo es propuesta, no parche. Donde sí puedes trabajar: el sobrefetching de `miembros/(portal)/page.tsx` (§5 de `API-CONTRACT.md`) y las cuatro transiciones que animan propiedades de layout |
| `accessibility-auditor` | La base está: 113 atributos `aria-*`, `data-motion-esencial` en 9 sitios, 10 bloques `prefers-reduced-motion`, `tabIndex={-1}` erradicado a propósito. Los dos huecos reales: **ningún error de formulario se ata a su campo** aunque `Field` sepa hacerlo, y **solo 2 `@media (pointer: coarse)`** para el mínimo de 44px en filas anchas |
| `mobile-ux-specialist` · `apple-hig-specialist` | `DataList` ya evita el scroll horizontal. Vigila los cuatro módulos de página que usan `@media` en vez de `@container`: en móvil con la barra lateral en rail el ancho útil no es el del viewport. `useMediaQuery` y `ESCRITORIO` (`768px`) están en `src/components/use-media-query.ts` |
| `motion-ux-polish` | Presets y helpers en `src/lib/shared/motion.ts` (`SPRING_UI` `SPRING_MOVE` `SPRING_SHEET` `SPRING_FLICK`, `proyectarMomento`, `amortiguarBorde`). `CLAUDE.md` avisa de la forma correcta de `animate` en motion 12: la de valor único. La otra no lanza, simplemente no anima. Las cinco animaciones de propiedades de layout de la tabla A son tuyas |
| `qa-tester` | Tu zona es `src/lib/**/*.test.ts`, solo funciones puras. **Vitest solo descubre `.test.ts`**: un test de componente no se ejecutaría. Sin cubrir hoy: `limpiarTermino` (sanea un filtro de PostgREST y es la más urgente), `haptica`, `iniciales`, y las tres de `nav-config.ts` |
| `docs-handoff` | La documentación nueva va a `.claude/docs/`. `docs/**` es solo lectura: se cita, no se reescribe. `README.md` y `AGENTS.md` de la raíz están fuera de la zona de trabajo de `SCOPE.md` §1 |

### Cinco trampas verificadas hoy, que cuestan una sesión cada una

1. **La ranura `@modal` solo existe en `app/admin/layout.tsx`.** Una ruta interceptada
   nueva bajo otra sección no interceptará. Y tras mover o añadir rutas paralelas hay que
   **reiniciar el servidor de desarrollo**: el manifiesto queda obsoleto y falla en
   silencio, lo que parece un bug de código y no lo es.
2. **`useToast()` lanza fuera de `/admin`.** El provider vive dentro de `AppShell`.
3. **`src/lib/shared/haptica.ts` lleva `'use client'`.** Importarlo desde un Server
   Component rompe la compilación.
4. **`vitest` solo mira `src/**/*.test.ts`.** Un `.test.tsx` se escribe, se guarda, y
   nunca se ejecuta ni falla: pasa desapercibido.
5. **`database.types.ts` se mantiene a mano.** Un `select` con un embebido nuevo no
   compila hasta que se declara su `Relationships`, aunque la clave foránea exista en la
   base. El error que da (`could not find the relation`) parece de base de datos y es de
   tipos.
