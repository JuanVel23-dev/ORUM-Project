# Auditoría de la Fase G — accesibilidad, movimiento y rendimiento

> Cierre del rediseño visual. Recoge lo que se midió, lo que se corrigió y lo
> que sigue necesitando verificación humana o un despliegue real.
>
> **Fecha:** 2026-08-09
> **Método:** auditoría automatizada en el navegador sobre `/dev/ui` (179
> elementos de texto, 54 interactivos) más revisión de código.

---

## Resumen

| Área | Antes | Después |
|---|---|---|
| Fallos de contraste (tema claro) | 41 | **0** |
| Fallos de contraste (tema oscuro) | 44 | **0** |
| Interactivos sin nombre accesible | 0 | 0 |
| Objetivos táctiles inutilizables | 1 | **0** |
| Imágenes sin `alt` | 0 | 0 |
| Saltos en la jerarquía de encabezados | 0 | 0 |

Cuatro defectos reales corregidos. Ninguno era visible a simple vista.

---

## Hallazgos corregidos

### 1. `--text-3` reprobaba AA en los DOS temas

El fallo más extendido: el color de texto terciario se usa en encabezados de
sección, etiquetas de campo, metadatos y pies, casi todo entre 11 y 12px,
donde WCAG exige **4.5:1**.

| | Antes | Ratio | Después | Ratio |
|---|---|---|---|---|
| Claro | `#8C8C97` | 3.22:1 ✗ | `#6B6B76` | **5.26:1** ✓ |
| Oscuro | `#6B6B76` | 3.77:1 ✗ | `#8C8C97` (`--n-400`) | **5.88:1** ✓ |

`--text-2` en oscuro subió a `--n-300` (**8.89:1**) para conservar el escalón
de jerarquía entre secundario y terciario.

Curiosidad del arreglo: los dos temas acabaron intercambiando valores. El gris
que era demasiado claro sobre blanco es exactamente el que hace falta sobre
negro, y viceversa.

### 2. Texto blanco fijo en el botón de peligro

`.danger` tenía `color: #fff`. Funciona sobre el rojo oscuro del tema claro
(`#C1121F`, 6.22:1) pero no sobre el rojo claro del tema oscuro (`#FF5A52`),
donde daba **3.07:1**.

Sustituido por `var(--text-on-accent)`, que ya resuelve por tema: blanco en
claro (6.22:1) y casi negro en oscuro (**6.44:1**). Es el mismo principio que
el CTA dorado, que lleva texto negro sobre el oro.

### 3. Botones aplastados a 2px de ancho

Los disparadores de menú dentro de `DataList` medían **2×36px**: existían, eran
enfocables y tenían nombre accesible, pero resultaban imposibles de pulsar.

Causa: la celda de acciones usa `width: 1%` —un truco clásico para que una
columna de tabla se encoja a su contenido— y además es `display: flex`. El
botón, con `flex-shrink` por defecto, se comprimía hasta desaparecer.

Corregido en el propio `Button` con `flex-shrink: 0`: un botón nunca debe
encogerse por debajo de su contenido. Si hace falta que ocupe el ancho, para
eso está `fullWidth`. Ahora miden 36×36.

### 4. Service worker sirviendo assets obsoletos en desarrollo

Encontrado *durante* la auditoría, y es el más instructivo.

Un cambio de CSS "no se aplicaba" pese a que el fuente y el build de producción
eran correctos. Sobrevivió a reiniciar el servidor, borrar `.next/dev` y borrar
`.next` entero. La causa era un service worker registrado en `localhost` que
interceptaba `/_next/static/*` con su regla cache-first.

El razonamiento original del SW era: *"los assets con hash de contenido no
pueden quedar obsoletos"*. Es cierto **en producción**, pero **Turbopack en
desarrollo reescribe los chunks en la misma ruta**, sin hash. La premisa no se
sostenía en dev.

Corregido en `RegistrarSW`: en desarrollo ya no solo se abstiene de registrar,
sino que **desregistra activamente** cualquier SW previo y borra sus cachés,
avisando por consola. El entorno se sanea solo en lugar de obligar a descubrir
el problema en las herramientas del navegador.

---

## Comprobado y correcto

**Nombres accesibles** — los 54 interactivos visibles tienen nombre. Ninguno
depende solo del `placeholder`. Los inputs de 1×1px que detecta el escáner son
los radios y checkboxes ocultos dentro de `SegmentedControl`, `Switch`,
`Checkbox` y `Radio`: el objetivo real es su `<label>`, que sí cumple 44px.

**Movimiento reducido** — 8 módulos CSS con animaciones y 8 puntos de control
en JS. Cuatro módulos llevan guarda propia; los otros cuatro dependen de la
regla global, que es exactamente lo que se busca:

- Se apagan: sacudida de error, aparición del icono de copiado.
- **Siguen animando** por llevar `data-motion-esencial`: spinner, esqueleto y
  barra de progreso. Un indicador de actividad congelado deja de informar de
  que algo está pasando, que es su única función.

**Transparencia reducida** — 6 usos de `backdrop-filter`, todos en cromo fijo
(barra lateral, barra superior, tab bar, paleta de comandos, fondo de modal,
tarjeta de login). **Ninguno en filas de lista ni en `DataList`**, que es donde
habría destrozado el scroll en un móvil de gama media. Cada uno tiene su
contraparte `prefers-reduced-transparency`.

**Jerarquía de encabezados** — un solo `<h1>` por pantalla, sin saltos de nivel.

---

## Pendiente de verificación humana

Nada de esto se puede medir con las herramientas disponibles aquí.

### Requiere dispositivo real

- **Vista móvil completa.** La tab bar, el rail de iconos y la conversión de
  tablas en tarjetas están implementados pero **nunca se han visto**: la
  herramienta de redimensionado del navegador no surtía efecto. Basta con
  estrechar la ventana por debajo de 768px.
- **Gestos.** El descarte de la hoja por arrastre y el swipe de los toasts
  dependen de la velocidad y del historial de eventos de puntero, que los
  arrastres sintéticos no reproducen. Necesitan dedo o ratón real.
- **Atajo ⌘K / Ctrl+K.** El teclado sintético no llega a la página; Chrome se
  queda el atajo. Con teclado real la página puede interceptarlo.
- **Rendimiento en gama media.** Si el `backdrop-filter` del cromo no rinde en
  un Android modesto, hay que degradarlo a superficie sólida.

### Requiere despliegue

- **Instalación de la PWA.** El service worker solo se registra en producción
  y necesita HTTPS. Sin verificar: el diálogo de instalación de Android, el
  recorte del icono maskable, la splash de iOS y la barra de estado translúcida.
- **Core Web Vitals.** El objetivo del spec es LCP < 1.8s, INP < 100ms y
  CLS < 0.05. La salida de Turbopack no publica el "First Load JS" por ruta, y
  medir en desarrollo infla las cifras. Hay que medirlo con Lighthouse sobre el
  despliegue.

### Requiere ojos

- **Revisión del movimiento en cámara lenta.** A velocidad real no se ven los
  saltos de interrupción ni las discontinuidades de velocidad. Es lo último que
  separa "animado" de "fluido", y no hay forma de automatizarlo.
- **Las pantallas del admin con datos reales.** Ninguna se ha visto renderizada:
  todas exigen sesión de Supabase. Compilan, tipan y pasan lint, pero cómo se
  ven con cien miembros de verdad está sin comprobar.

---

## Deuda conocida que sale de este rediseño

1. **`esPlanDestacado` es una heurística por nombre.** Un plan llamado «Oro» o
   «Premium» recibe el distintivo dorado. Debe sustituirse por una columna real
   (`planes_membresia.destacado`) cuando se toque el esquema.
2. **Las transiciones de ruta con elemento compartido no están aplicadas.**
   `experimental.viewTransition` está activado y validado, pero sin decidir qué
   elemento persiste entre pantallas una transición mal elegida es peor que
   ninguna.
3. **Sin pruebas automatizadas de interfaz.** La convención del proyecto es
   probar solo funciones puras (67 tests). Los componentes se verifican a mano.
