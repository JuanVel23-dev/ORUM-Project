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

Un formulario **no navega**. Se abre por encima:

- **Escritorio** → diálogo centrado
- **Móvil** → hoja inferior con detents (`medium` si el contenido cabe y conviene
  ver el fondo; `large` si solo sirve a pantalla completa)

Ambos salen del mismo componente: `<Overlay>`.

Se montan como **rutas interceptadas** (`@modal/(.)ruta`). Eso da gratis: el botón
atrás cierra, un enlace directo abre a pantalla completa, y la lista de detrás
conserva scroll y estado.

Cada ranura `@modal` necesita **su propio `loading.tsx`**. Sin él, Next cae al
`loading.tsx` de la sección y dibuja el esqueleto de la tabla dentro del hueco del
modal.

---

## Componentes: usa los que hay

Todo vive en `src/components/ui/`, en **kebab-case**. Antes de crear uno, mira si ya existe.

`Button` `Spinner` · `Field` `Input` `Select` `Textarea` `Switch` `Checkbox` `Radio`
`SegmentedControl` · `Card` `FormCard` `Stack` `Grid` `Section` `PageHeader` `Divider` ·
`Badge` `StatusBadge` `VenceEn` `Avatar` · `Alert` `Toast` · `Modal` `Sheet` `Overlay`
`DropdownMenu` · `Skeleton` `ProgressBar` `EmptyState` `ErrorState` · `DataList`
`AccionEstado` `Copiar`

**`DataList` sustituye a toda tabla.** Es una tabla semántica que CSS convierte en
tarjetas bajo 768px. Nunca scroll horizontal en móvil.

---

## Arquitectura que no cambia

- Páginas = **Server Components** con `requireRol`. `'use client'` solo en hojas interactivas.
- Mutaciones = **server actions**, con verificación de rol al entrar.
- Estado externo (tema, preferencias, media queries) = `useSyncExternalStore`,
  **nunca** `useState` + `useEffect` (dispara renders en cascada y el linter lo marca).
- Pruebas automatizadas **solo de funciones puras**. El resto se verifica a mano.

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
   de la PWA y Core Web Vitals.
