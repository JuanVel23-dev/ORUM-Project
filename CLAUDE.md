# ORUM — Reglas de diseño e interfaz

> **Lee esto antes de tocar una sola línea de interfaz.**
>
> Este archivo lo carga Claude Code automáticamente al abrir el proyecto. Existe
> porque ya pasó una vez: dos sesiones trabajaron en paralelo y construyeron dos
> sistemas de diseño incompatibles sobre los mismos archivos.
>
> Detalle completo del porqué de cada decisión:
> [`docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md`](docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md)

---

## Lo que ORUM es

Club de beneficios. Un solo producto: **la membresía mensual**. No hay niveles ni
planes premium. El estado de un miembro es **binario: paga o no paga**.

Cuatro portales: Público, Miembros, Administración y Herramienta de Comercios.

---

## Las cuatro reglas que mandan

Cuando dos opciones compitan, gana la que esté más arriba:

1. **Menor número de clics.** Si un formulario cabe en un overlay, no crea una página.
2. **Rendimiento.** Fluidez a 60fps, respuesta bajo 100ms.
3. **Buenas prácticas.** Accesible, tipado, sin regresiones.
4. **Detalle.** Animación, loader, micro-respuesta. Es lo que separa "correcto" de "caro".

---

## Prohibiciones duras

Romper cualquiera de estas es un bug, no una preferencia.

| Nunca | Por qué |
|---|---|
| `className="orum-*"` | Esa capa se eliminó. No existe. |
| Valores literales de color, espaciado, radio o duración | Todo sale de `src/styles/tokens.css` vía `var(--…)` |
| `style={{ … }}` para maquetar | Los estilos van en `.module.css`. Solo se admite inyectar tokens dinámicos. |
| Animar `width`, `height`, `top`, `left`, `margin` | Recalcula layout cada fotograma. Solo `transform` y `opacity`. |
| `none` dentro de una lista de sombras | Invalida la declaración ENTERA en silencio. Usa `0 0 rgba(0,0,0,0)`. |
| `outline: none` sin sustituto | Deja la interfaz sin foco visible. |
| Color como único portador de significado | Siempre punto/icono **+ texto**. |
| `backdrop-filter` en filas de lista | Destroza el scroll en gama media. Solo en cromo fijo. |
| Que un formulario ponga su propia tarjeta | La superficie la pone quien lo usa. |

---

## El oro

**El oro es color de MARCA, no de acción, y jamás codifica datos.**

- Botón primario = **tinta**: negro sobre claro, blanco sobre oscuro.
- El oro vive en: wordmark, indicador de ruta activa, anillo de focus, hairlines,
  y el CTA comercial del Portal Público.
- Presupuesto: **≤5% del área visible** por pantalla.

Contrastes verificados — no los cambies sin recalcular:

| Uso | Token | Ratio |
|---|---|---|
| Texto dorado sobre oscuro | `--gold-300` | 13.0:1 |
| Marca sobre oscuro | `--gold-500` | 7.94:1 |
| Texto negro sobre oro (CTA) | `--n-1000` | 7.94:1 |
| Texto dorado sobre claro | `--gold-700` | 5.44:1 |
| Focus/filos en claro | `--gold-600` | 3.66:1 |
| ⛔ `--gold-500` sobre blanco | | **2.49:1 — prohibido** |

Los neutrales llevan un susurro de **frío** (matiz ~240°). Sobre grises cálidos el
oro se lee beige y el conjunto envejece; sobre neutros fríos se lee metal.

---

## Estado de membresía

Un solo eje, binario. Derivado **siempre** con `derivarEstadoMembresia`:

```ts
esActiva = estado === 'activa' && fecha_fin >= hoy
```

**Nunca leas `membresias.estado` en crudo.** Esa columna tiene default `'activa'` y
nada la actualiza al vencer: mostrarías "Activa" en verde a quien lleva meses sin
pagar.

- **Activa** → verde, punto lleno
- **Inactiva** → rojo atenuado, punto **hueco** (la forma cambia, no solo el color),
  con el motivo como texto secundario
- **"Vence en N días"** no es un estado: sigue activa. Señal ámbar secundaria.

---

## Movimiento

Curvas y duraciones en `tokens.css`; resortes en `src/lib/motion.ts`.

- Por defecto `bounce: 0`. **El rebote se gana, no se regala**: solo tras un gesto
  con momento. Rebote gratuito se lee como juguete.
- Feedback en `pointerdown`, no en `click`.
- Gestos: seguimiento 1:1, resistencia elástica en los bordes, y al soltar se
  decide por **dónde iba** el gesto (`proyectarMomento`), no por dónde se soltó.
- Entrada y salida por el **mismo camino**.
- `prefers-reduced-motion` ≠ sin feedback: es un equivalente no vestibular.
  Lo que debe seguir animando (spinner, esqueleto, progreso) lleva
  `data-motion-esencial`.

---

## Formularios: overlay, no página

Un formulario **no navega**. Se abre por encima. **Sin excepciones**: también
cambiar la contraseña, que durante un tiempo tuvo página propia porque "no era
un formulario de una lista". Sí lo era.

Corolario: si una acción se hace y se cierra, **no merece un sitio fijo en la
barra lateral**. La barra es para los lugares donde se trabaja. "Mi contraseña"
ocupaba un grupo entero, con encabezado, para algo que se hace una vez cada
muchos meses — y encima ya estaba en el menú del avatar: la misma acción listada
dos veces en la misma pantalla.

Al sacar algo de la barra lateral, **comprueba el móvil**: allí no hay menú del
avatar (vive en el pie de la barra, que está oculta), así que la hoja "Más" es la
única puerta. Si el destino salía de `navegacionPara`, hay que listarlo a mano en
esa hoja o desaparece del teléfono.

Los dos modos:

- **Escritorio** → diálogo centrado
- **Móvil** → hoja inferior con detents (`medium` si el contenido cabe y conviene
  ver el fondo; `large` si solo sirve a pantalla completa)

Ambos salen del mismo componente: `<Overlay>`.

Se montan como **rutas interceptadas** (`@modal/(.)ruta`). Eso da gratis: el botón
atrás cierra, un enlace directo abre a pantalla completa, y la lista de detrás
conserva scroll y estado.

### La ranura `@modal` vive en `app/admin/layout.tsx`. Solo ahí.

Una ruta interceptada **solo intercepta si el layout que declara su ranura ya está
montado**. Cuando cada sección tenía la suya, el mismo formulario se comportaba de
dos maneras según de dónde vinieras: desde `/admin/miembros` se abría encima, pero
desde el panel de inicio —o la pestaña "Vender" del móvil— navegaba a la página
completa, porque `miembros/layout.tsx` todavía no existía en el árbol.

Por eso hay **una sola ranura**, en el layout del panel, y todos los formularios
cuelgan de ella:

```
app/admin/@modal/(.)miembros/nuevo/page.tsx
app/admin/@modal/(.)comercios/[id]/sucursales/nueva/page.tsx
```

Al añadir un formulario nuevo: crea la página real **y** su gemela bajo `@modal`.
Importa el formulario con el alias `@/app/admin/...`, nunca con `../../../..`:
esas páginas están cuatro niveles por debajo de la sección que las usa.

**Compruébalo en el navegador desde DOS orígenes** —su propia lista y el panel de
inicio—. La firma de que intercepta es `document.querySelector('dialog[open]')` con
el contenido anterior todavía montado detrás.

La ranura necesita **su propio `loading.tsx`**. Sin él, Next cae al `loading.tsx` de
la sección y dibuja el esqueleto de la tabla dentro del hueco del modal.

Tras mover o añadir rutas paralelas, **reinicia el servidor de desarrollo**: el
manifiesto de rutas queda obsoleto y la interceptación falla en silencio, lo que
parece un bug de código y no lo es.

---

## Componentes: usa los que hay

Todo vive en `src/components/ui/`, en **kebab-case**. Antes de crear uno, mira si ya existe.

`Button` `Spinner` · `Field` `Input` `Select` `Textarea` `Switch` `Checkbox` `Radio`
`SegmentedControl` · `Card` `FormCard` `Stack` `Grid` `Section` `PageHeader` `Divider` ·
`Badge` `StatusBadge` `VenceEn` `Avatar` `Cifra` · `Alert` `Toast` · `Modal` `Sheet`
`Overlay` `DropdownMenu` `MenuItem` · `Skeleton` `ProgressBar` `EmptyState` `ErrorState` ·
`DataList` `AccionEstado` `Copiar` · `PantallaAuth` `ComercioLogo` `QrCode` `WhatsAppButton`

**`DataList` sustituye a toda tabla.** Es una tabla semántica que CSS convierte en
tarjetas bajo 768px. Nunca scroll horizontal en móvil.

**`Cifra`** para todo número de negocio (etiqueta + valor tabular + nota). No la
reimplementes en la página: el panel de inicio ya lo hizo y hubo que extraerla.

**`MenuItem submit`** cuando la acción del menú es una server action: renderiza un
`<button type="submit">` dentro del `<form>` que envuelve al menú, así funciona sin
JavaScript. `MenuItem href` renderiza un `<Link>` — nunca un `<a>` dentro de un `<button>`.

**`PantallaAuth`** es la envoltura de TODA pantalla de acceso (administración y miembros).
Son dos puertas al mismo club: si una tuviera dirección de arte propia, parecería otra
empresa. Sus clases de formulario se toman de `estilosAuth`, no de un módulo local —
la sacudida al fallar usa `:has(.alerta)` y ambas clases deben salir del mismo módulo CSS.

**`QrCode` va en negro sobre blanco en los dos temas.** No es estética: invertirlo en
oscuro rompe el escaneo en algunos lectores, y el fallo ocurre en la caja del comercio
delante del cliente. Ese es el único sitio del sistema con colores literales.

---

## Arquitectura que no cambia

- Páginas = **Server Components** con `requireRol`. `'use client'` solo en hojas interactivas.
- Mutaciones = **server actions**, con verificación de rol al entrar.
- Estado externo (tema, preferencias, media queries) = `useSyncExternalStore`,
  **nunca** `useState` + `useEffect` (dispara renders en cascada y el linter lo marca).
- Pruebas automatizadas **solo de funciones puras**. El resto se verifica a mano.

### Dónde va cada cosa

`src/lib/` está organizado **por dominio**: `auth/` `miembros/` `comercios/` `metricas/`
`bitacora/` `shared/` `supabase/`. Nada suelto en la raíz de `lib`.

Los formularios de una ruta viven en su `_components/`. Los que comparten varias rutas
—`formulario.module.css`— viven en `src/styles/`: si una hoja compartida se guarda dentro
de una ruta, la primera reorganización rompe las otras ocho que la importaban.

### Adaptación al ancho: `@container`, no `@media`

`.main` del shell y el `<main>` del portal declaran `container-type: inline-size` con
`container-name: contenido`. Las páginas se adaptan preguntando por **ese** contenedor:

```css
@container contenido (max-width: 900px) { … }
```

El ancho útil del contenido no es el del viewport — cambia según la barra lateral esté
abierta o en rail. Un `@media` se equivoca en ~200px justo donde importa. Un `@container`
sin contenedor ancestro **nunca casa**: si escribes uno, comprueba que hay contenedor.

### Fechas

Dos casos distintos, y confundirlos desplaza un día:

- **`timestamptz` de la base** (`fecha_hora`): formatear en `America/Bogota`.
- **`'YYYY-MM-DD'` civil** (`fecha_fin`, rangos de filtro): construir con `Date.UTC(...)`
  y formatear en **`timeZone: 'UTC'`**. Leerla en Bogotá (UTC−5) la retrasa al día
  anterior; el carnet llegó a anunciar el vencimiento un día antes de tiempo.

---

## Accesibilidad: mínimos no negociables

- Contraste AA en todo texto (4.5:1; 3:1 en texto grande). Auditado: 0 fallos.
- `:focus-visible` visible en todo interactivo.
- Objetivos táctiles ≥44px.
- Un `<h1>` por pantalla, sin saltos de nivel.
- Un avatar junto a un nombre visible va `decorativo` (si no, el lector lo repite).

---

## Antes de dar algo por hecho

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

Y **míralo renderizado**. En esta sesión, medir con `getComputedStyle` durante una
transición dio tres diagnósticos falsos seguidos: en una pestaña que el navegador no
pinta, las transiciones no avanzan y siempre se lee el valor inicial. Una captura
fuerza el pintado; una medición, no.

## Requisitos de entorno

Node **≥22.13** (declarado en `.nvmrc` y `engines`). pnpm 11 usa `node:sqlite`, que no
existe antes. Con Node 20 el instalador falla con `No such built-in module`.

---

## Deuda conocida

1. Las transiciones de elemento compartido entre lista y ficha están habilitadas
   (`experimental.viewTransition`) pero **sin aplicar**.
2. Sin pruebas automatizadas de interfaz.
3. Sin verificar en dispositivo real: vista móvil, gestos de la hoja, instalación
   de la PWA y Core Web Vitals. La automatización de navegador de esta máquina
   **no consigue redimensionar la ventana** — no lo intentes, ya falló cinco veces;
   pide al usuario una captura o usa un dispositivo real.
4. El Portal de Miembros solo se ha visto en su pantalla de acceso: el resto exige un
   miembro con membresía vigente y esas credenciales no están disponibles aquí.
