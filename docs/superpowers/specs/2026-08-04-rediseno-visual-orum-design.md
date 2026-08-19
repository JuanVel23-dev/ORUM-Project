# ORUM — Rediseño visual completo: sistema de diseño, movimiento y PWA

> Documento de diseño para evaluación. Define **qué** se va a construir y **por qué**,
> antes de escribir código. No es un plan de tareas (ese se deriva de aquí una vez aprobado).
>
> **Fecha:** 2026-08-04
> **Alcance:** rediseño integral de la capa visual e interactiva, empezando por lo ya
> implementado (login, cuenta y Portal de Administración completo). Prepara el terreno
> para el Portal Público, el Portal de Miembros y la Herramienta de Comercios.
> **Objetivo del cliente:** profesionalismo, calidad, elegancia, lujo. Interfaz amigable
> e intuitiva. Paleta dorado / negro / blanco. Instalable en móvil. Nivel Apple.

---

## 0. Diagnóstico del punto de partida

Lo que hay hoy funciona, pero la capa visual está en estado "andamio":

| Problema | Evidencia | Consecuencia |
|---|---|---|
| Tipografía por defecto de sistema antiguo | `globals.css:29` → `font-family: Arial, Helvetica` | Anula el trabajo de Geist ya cargado en `layout.tsx`. Todo se lee como formulario interno. |
| Cero movimiento | No existe un solo `transition`, `@keyframes` ni `:active` en `globals.css` | La interfaz se siente muerta. Sin feedback de presión. |
| Estilos inline dispersos | `admin/layout.tsx:19-52`, `admin/page.tsx:11-35`, y en casi todas las páginas | No escala, imposible mantener consistencia, no responde a breakpoints. |
| Navegación no responsive | `admin/layout.tsx:20` → header flex con 6 enlaces + email + botón | Se desborda en móvil. Sin menú móvil, sin estado activo, sin jerarquía. |
| Sin estados de carga reales | Único feedback: texto del botón en `login-form.tsx:51` | Percepción de lentitud. Sin `loading.tsx`, sin skeletons, sin optimistic UI. |
| Tablas sin tratamiento móvil | `.orum-table` en `globals.css:173` | Scroll horizontal roto justo donde los empleados van a usar la app. |
| Focus accesible pero feo | `outline: 2px solid` duro, `globals.css:102` | Detalle visible que delata falta de acabado. |
| Color sin identidad | `--orum-primary: #2563eb` | Es el azul por defecto de una plantilla, no una marca. |

**Lectura:** la funcionalidad existe; la percepción de calidad no. Y como el Portal Público
es la cara comercial que vende la membresía, esta deuda se vuelve crítica ahora.

---

## 1. Filosofía de diseño

Cuatro principios rectores, en orden de prioridad cuando entren en conflicto:

1. **Menor número de clics.** Cada acción frecuente debe estar a un gesto de distancia.
   Vender una membresía no puede costar 4 navegaciones.
2. **Rendimiento.** Fluidez a 60fps y respuesta bajo 100ms. Un lujo que tartamudea no es lujo.
3. **Buenas prácticas.** Accesible, semántico, tipado, sin regresiones de arquitectura.
4. **Detalles.** Animaciones, loaders, micro-respuestas. Es lo que separa "correcto" de "caro".

Y una regla que gobierna la estética de lujo:

> **El lujo se comunica por restricción, no por decoración.**
> Oro que aparece en todas partes deja de significar algo. Oro que aparece en un solo
> filo, en el indicador de la pestaña activa y en el borde de una tarjeta enfocada, se
> lee como acabado de precisión.

---

## 2. Sistema de color

> **Revisión del 2026-08-04.** Esta sección sustituye una versión anterior que proponía
> neutrales **cálidos** y el oro como color de acción. Ambas decisiones eran incorrectas
> y se corrigen abajo con la justificación medida (§2.1 y §2.2). Los tokens cambian.

### 2.1 Dos correcciones críticas

**Corrección 1 — los neutrales van neutros o levemente fríos, no cálidos.**

El oro vive en el matiz ~45°. Sobre grises **cálidos** (~40°) la relación es *análoga*:
el fondo absorbe el oro y el conjunto lee **beige/sepia** — el aspecto de vestíbulo de
hotel de los noventa. Sobre neutros con un susurro de frío (~240°, saturación mínima) hay
contraste de temperatura y el oro deja de leerse como beige para **leerse como metal**.
Es lo que hacen las casas de joyería: oro contra fondos neutros profundos, nunca contra crema.

**Corrección 2 — el oro es color de marca, NO color de acción.**

Hay que separar dos roles que se confunden siempre:

- **Color de marca:** identidad. Logo, filos, cromo, momentos ceremoniales.
- **Color de acción:** interacción. Botones, enlaces, focus, selección, estados.

El oro es un mal color de acción, por tres razones medibles:

1. **No aguanta contraste en claro.** `#BFA063` sobre blanco da **2.49:1** — por debajo
   del **3:1** que WCAG exige incluso para un anillo de focus. Un focus dorado en modo
   claro es inaccesible, no discutible.
2. **Colisiona con la semántica de "por vencer".** Luminancia del oro `#BFA063` = **0.371**;
   la de un ámbar de advertencia `#F0912E` = **0.390**. Son casi idénticas: **en escala de
   grises son el mismo color**. Para el ~8% de hombres con deficiencia de visión cromática,
   un badge "Plan Oro" y uno de "membresía por vencer" serían indistinguibles. En un
   sistema de membresías el estado de vencimiento es *el* dato crítico.
3. **El oro no se lee como interactivo.** Nadie ha aprendido que "lo dorado se pulsa".

**Regla resultante — y es la decisión de color más importante del proyecto:**

> ## Acción = tinta. Marca = oro.

Botón primario **negro** sobre claro, **blanco** sobre oscuro. Es lo que hace el lujo real:
el botón de comprar de Chanel, Hermès y Apple es negro, no dorado. El oro aparece en el
logotipo, en el filo, en el detalle — y por eso se percibe como precioso. La escasez *es*
el mecanismo del lujo.

El oro queda reservado para: wordmark, indicador de ruta activa, anillo de focus (en su
variante oscura), tier del plan, y **un único CTA dorado** en el momento comercial
(el "Adquirir membresía" del Portal Público), donde el oro *es* el mensaje.

Beneficio colateral: libera la franja cálida del espectro para las métricas de la Fase 4.
Una paleta dorado-dominante hace series de datos amarillo/naranja/ocre indistinguibles.

### 2.2 Neutrales — la base

Escala única, matiz ~240°, saturación 4–8%. Ni cálida ni fría de forma evidente: lo justo
para que el oro reaccione como metal.

```css
/* Oscuros */
--n-1000: #0A0A0C;  /* fondo raíz (dark) */
--n-950:  #101013;  /* superficie nivel 1 */
--n-900:  #16161A;  /* tarjeta */
--n-850:  #1D1D22;  /* elevada / hover */
--n-800:  #26262C;  /* borde sutil */
--n-700:  #33333A;  /* borde */
--n-600:  #4A4A53;  /* borde fuerte, deshabilitado */
--n-500:  #6B6B76;  /* texto terciario */
--n-400:  #8C8C97;  /* texto secundario (dark) */
--n-300:  #ADADB8;
--n-200:  #CECED6;
--n-100:  #E6E6EB;
--n-50:   #F4F4F7;  /* texto primario (dark) — nunca blanco puro */

/* Claros */
--w-0:    #FFFFFF;  /* tarjeta (light) */
--w-50:   #FBFBFC;  /* fondo raíz (light) */
--w-100:  #F4F4F6;  /* superficie hundida */
--w-200:  #E9E9ED;  /* borde sutil */
--w-300:  #DCDCE2;  /* borde */
--w-400:  #C4C4CC;  /* borde fuerte */
```

Texto primario en oscuro es `#F4F4F7`, no `#FFFFFF`: el blanco puro sobre negro puro
produce halo y fatiga visual. Apple nunca lo usa.

### 2.3 Oro — la rampa

Desaturado respecto al oro puro. `#FFD700` lee a casino; este lee a joyería.

```css
--gold-200: #EFE0BC;  /* halos, fondo de badge en dark */
--gold-300: #E3D0A4;  /* TEXTO dorado sobre negro */
--gold-400: #D4BC85;  /* focus ring en dark */
--gold-500: #BFA063;  /* ORO DE MARCA */
--gold-600: #9E8244;  /* focus ring y filos en light */
--gold-700: #7D6733;  /* TEXTO dorado sobre blanco */
--gold-800: #5C4B25;  /* texto dorado enfático en light */
```

Contrastes calculados:

| Combinación | Ratio | Veredicto |
|---|---|---|
| `gold-300` sobre `n-1000` | 13.0:1 | ✓ AAA — texto dorado en oscuro |
| `gold-500` sobre `n-1000` | 7.94:1 | ✓ AAA |
| `n-1000` sobre `gold-500` | 7.94:1 | ✓ AAA — **texto negro sobre oro** (CTA comercial) |
| `gold-700` sobre `w-0` | 5.44:1 | ✓ AA — texto dorado en claro |
| `gold-600` sobre `w-0` | 3.66:1 | ✓ 3:1 — válido para focus/filos, **no para texto** |
| `gold-500` sobre `w-0` | 2.49:1 | ✗ **prohibido en modo claro** |

### 2.4 El oro metálico

En los momentos ceremoniales el oro no es plano: lleva un barrido que simula luz sobre metal.

```css
--gold-sheen: linear-gradient(135deg,
  #E3D0A4 0%,    /* luz */
  #BFA063 38%,   /* cuerpo */
  #9E8244 62%,   /* sombra */
  #D4BC85 100%); /* reflejo de retorno */

/* Filo de luz de 1px, como el chaflán pulido de un iPhone */
--gold-hairline: linear-gradient(90deg,
  transparent, rgba(227,208,164,.55) 20%, rgba(227,208,164,.55) 80%, transparent);
```

En hover el gradiente se desplaza ~8%: el brillo "viaja". Tres líneas de CSS que se leen
como acabado de producto.

**Trampa del modo claro:** una hairline dorada de 1px sobre blanco a 2.49:1 es casi
invisible y parece un artefacto de renderizado. En claro los filos dorados usan
`gold-600` y solo en el elemento **activo**; el resto de bordes son neutros.
En modo claro el lujo lo cargan el **espacio y la tipografía**, no las líneas doradas.

### 2.5 Reglas de uso del oro (no negociables)

| Permitido | Prohibido |
|---|---|
| Wordmark ORUM | Botones primarios de la app (esos son tinta) |
| Indicador de ruta/pestaña activa | Enlaces de texto |
| Anillo de focus (`gold-400` dark / `gold-600` light) | Texto con `gold-500` sobre blanco |
| Tier del plan (Oro / Premium) | **Estados de membresía** (esos son semánticos) |
| Hairlines de 1px en superficies oscuras | Rellenar fondos de página o tarjetas |
| CTA comercial del Portal Público | Más de **un** elemento dorado compitiendo por pantalla |
| Filo superior del cromo translúcido | Iconografía completa en dorado |

**Presupuesto: ≤ 5% del área visible por pantalla.**

### 2.6 Colores de acción (tinta)

```css
/* Light */
--action:        #141418;  /* botón primario: negro sobre claro */
--action-hover:  #26262C;
--action-fg:     #FFFFFF;

/* Dark */
--action:        #F4F4F7;  /* botón primario: blanco sobre oscuro */
--action-hover:  #E6E6EB;
--action-fg:     #0A0A0C;

/* Enlaces de texto — azul de sistema, el único patrón que todo el mundo ya conoce */
--link-light: #1D5FD1;
--link-dark:  #5B9DFF;
```

### 2.7 Colores semánticos

Los estados **deben** separarse del oro. La estrategia es una **brecha de croma**: el oro
es de baja saturación, los semánticos son de saturación alta. Y sobre todo, la regla dura
del punto §2.1.2.

```css
/* Light — verificados ≥ 5:1 sobre blanco */
--success-light: #137A3B;  /* 5.42:1 */
--warning-light: #A85508;  /* 5.29:1 — naranja quemado, claramente más rojo que el oro */
--danger-light:  #C1121F;  /* 6.22:1 */
--info-light:    #1D5FD1;

/* Dark — sobre --n-1000 */
--success-dark: #45D67C;
--warning-dark: #F0912E;  /* 8.29:1 */
--danger-dark:  #FF5A52;
--info-dark:    #5B9DFF;
```

> ### Regla dura: ningún estado se codifica solo con color.
> Todo estado lleva **punto + icono + texto**. La justificación no es teórica: `gold-500`
> (L=0.371) y `warning-dark` (L=0.390) son indistinguibles en escala de grises. El color
> refuerza el significado; nunca lo transporta solo.

### 2.8 Mapa de estados de ORUM

> **Revisión.** Una versión anterior proponía cinco estados de membresía. El modelo de
> negocio real es **binario: activa o inactiva, según el pago.** Corregido abajo.

#### El eje es binario

La BD define cuatro valores en el enum `estado_membresia`
(`src/lib/supabase/database.types.ts:337`), pero colapsan a dos de cara al usuario:

```
activa                            →  ACTIVA
vencida | cancelada | suspendida  →  INACTIVA  (+ motivo como dato secundario)
```

**El badge es binario; el motivo es texto adyacente, nunca otro color.** Un empleado
escanea una lista de cientos de miembros buscando una sola cosa: ¿paga o no paga?
Varios colores compitiendo hacen ese escaneo más lento, no más informado.

| Badge | Claro | Oscuro | Marca visual |
|---|---|---|---|
| **Activa** | `#137A3B` | `#45D67C` | ● Activa |
| **Inactiva** | `#C1121F` atenuado | `#FF5A52` atenuado | ● Inactiva · *motivo* |

*Atenuado* = fondo tenue al 8% + icono y texto en el color pleno. **Nunca un bloque rojo
saturado:** si el 40% de la base está inactiva, una lista con 120 bloques rojos produce
fatiga de alarma y el badge deja de leerse.

Se descarta el gris para "Inactiva" a propósito: el gris comunica "inerte, ignórame", y un
miembro inactivo es justo lo contrario — es la oportunidad de renovación. Debe verse.

#### "Por vencer" no es un estado

Una membresía a 12 días de vencer **está activa**. Darle su propio badge sería mentir
sobre el estado. Va como **señal secundaria**: badge verde "Activa" + texto
`Vence en 12 días` con tratamiento ámbar sutil al lado. Conserva el valor comercial
(renovación = ingreso) sin romper el modelo binario ni añadir un color al eje.

#### ⚠ Riesgo de datos que afecta directamente a la UI

`membresias.estado` es una columna **almacenada** con default `'activa'`, y en
`src/lib/membresias.ts` no existe nada que la cambie a `'vencida'` al pasar `fecha_fin`
(solo hay `generarNumeroMembresia`, `calcularFechaFin` y `calcularFechaInicioRenovacion`).

Consecuencia: una membresía vencida hace meses sigue con `estado = 'activa'`, y la
interfaz mostraría **"Activa" en verde a alguien que no paga**. Es el peor fallo posible
en este producto, porque un empleado decide sobre ese badge.

**La UI no puede confiar en la columna. Debe derivar:**

```ts
esActiva = estado === 'activa' && fecha_fin >= hoy
```

Acción propuesta: función pura `derivarEstadoMembresia(estado, fechaFin, hoy)` en
`src/lib/membresias.ts`, cubierta con Vitest como las otras tres, consumida por **todo**
badge de estado.

Postura recomendada sobre el modelo: **`estado` guarda la intención administrativa**
(cancelada / suspendida son decisiones humanas reales) **y la vigencia siempre se
deriva de `fecha_fin`.** Así no se depende de un cron que puede fallar o retrasarse.

*Esto es lógica de negocio, no de presentación: queda señalado como prerrequisito de la
Fase E, pendiente de aprobación explícita.*

#### ~~El segundo eje: tier del plan~~ — ELIMINADO (2026-08-09)

> **Corrección de producto.** Este documento proponía un segundo eje: el nivel del plan,
> marcado en oro (`Plan Oro / Premium` dorado, planes base en neutro). Era la única
> expresión cromática de peso que le quedaba al oro.
>
> **ORUM vende UN solo servicio: la membresía mensual.** No hay niveles y no está previsto
> que los haya. Con un único producto, una etiqueta de nivel muestra el mismo valor en
> todas las filas: ocupa ancho y no informa de nada.

Eliminados en consecuencia: el componente `PlanTierBadge`, la heurística
`esPlanDestacado` (y sus 5 tests) y la **columna "Plan" de la lista de miembros**. Ese
ancho se lo queda el estado, que es lo único que de verdad se escanea ahí.

**Queda un solo eje: paga o no paga.** El diseño se simplifica, no se empobrece.

#### ¿Y el oro?

Se repliega a donde su escasez lo hace valioso: wordmark, indicador de ruta activa,
anillo de focus, hairlines y el CTA comercial del Portal Público.

Esto no es una pérdida — es la regla de §2.1 llevada hasta el final. El oro nunca debió
codificar datos; su trabajo es la identidad. Un sistema con menos oro y mejor colocado se
lee más caro que uno donde el oro aparece en cada fila de una tabla.

Si algún día se venden varios niveles, la solución correcta **no** es recuperar la
heurística por nombre, sino añadir una columna real `planes_membresia.destacado`.

### 2.9 Los tres modos: claro, oscuro y automático

Los tres son de primera clase. **Automático es el valor por defecto.**

| Superficie | Comportamiento |
|---|---|
| **Panel de Administración** | 3 modos. Por defecto automático. |
| **Portal de Miembros** | 3 modos. Por defecto automático. |
| **Portal Público** | **Oscuro fijo.** Es una superficie de marca con dirección de arte; no se negocia con el sistema operativo. |

**Implementación:**

1. `<html data-theme="light|dark">` resuelto por un **script inline en `<head>`** que se
   ejecuta antes del primer pintado. Sin esto hay un flash blanco en cada carga con tema
   oscuro — el error más visible y más común de los conmutadores de tema.
2. La preferencia guardada tiene **tres** valores (`system` / `light` / `dark`), no dos.
   `system` es un estado real, no la ausencia de elección.
3. `color-scheme: light dark` para que los controles nativos, las barras de scroll y los
   selectores de fecha sigan el tema. Sin esto aparece un date-picker blanco en modo oscuro.
4. **`<meta name="theme-color">` duplicado con `media`:**
   ```html
   <meta name="theme-color" content="#FBFBFC" media="(prefers-color-scheme: light)">
   <meta name="theme-color" content="#0A0A0C" media="(prefers-color-scheme: dark)">
   ```
   Crítico en PWA: es lo que tiñe la barra de estado del móvil en modo standalone. Sin
   esto la app instalada se ve con una franja del color equivocado en la parte superior.
5. **Escucha activa** de `matchMedia('(prefers-color-scheme: dark)')` mientras el modo es
   `system`, para que la app cambie sola cuando el iPhone pasa a modo noche por la tarde.
6. **Transición animada de 220ms** limitada a `background-color`, `color` y `border-color`.
   Nunca a todas las propiedades: animar `transform` o layout en un cambio de tema produce
   un salto. Los saltos bruscos de brillo son además un problema de accesibilidad reconocido.
7. **Control segmentado de 3 posiciones** (Auto / Claro / Oscuro) con indicador deslizante,
   no un interruptor binario. Un toggle de dos estados no puede expresar "automático".
8. La imagen del wordmark y los iconos se sirven con `currentColor` o variantes por tema —
   un PNG dorado fijo se rompe en uno de los dos fondos.

---

## 3. Tipografía

### 3.1 Elección de fuente

Tres caminos, con recomendación:

| Opción | A favor | En contra |
|---|---|---|
| **`system-ui` / `-apple-system`** | En iPhone/Mac entrega **SF Pro real**: literalmente la tipografía de Apple, gratis, con óptica y kerning perfectos. Cero peso de red. | En Windows/Android entrega Segoe UI / Roboto → la marca se ve distinta en cada dispositivo. |
| **Inter Variable auto-hospedada** ✅ | Consistencia total entre dispositivos. Variable (un archivo, todos los pesos). Diseñada para UI, con tabular-nums y features tipográficas ricas. ~28KB subset latin. | No es SF; hay que hospedarla y hacer subsetting. |
| **Mantener Geist** | Ya está instalada. Grotesca limpia y correcta. | Menos refinada en tamaños pequeños; menos features (sin ajustes ópticos reales). |

**Recomendación: Inter Variable**, auto-hospedada, subset latin, `font-display: swap`.
Es lo que da consistencia de marca sin sacrificar carácter.

**Acento de lujo (opcional, a decidir):** una serif de alto contraste **solo** para el
wordmark ORUM y para cifras destacadas del dashboard. Las casas de lujo se apoyan en la
serif; Apple no. Usarla exclusivamente como marca —nunca en UI— captura ambas cosas.

### 3.2 Escala tipográfica

Cada tamaño lleva su propio *tracking* y *leading*. Un `letter-spacing` único para toda la
app está mal en algún sitio, siempre: los títulos grandes necesitan tracking **negativo**
(al crecer, las letras se separan ópticamente) y el texto pequeño necesita tracking
ligeramente **positivo**.

| Token | Tamaño | Interlínea | Tracking | Peso | Uso |
|---|---|---|---|---|---|
| `display-1` | `clamp(2rem, 5vw, 2.5rem)` | 1.05 | −0.022em | 600 | Héroes, cifras del dashboard |
| `display-2` | `clamp(1.5rem, 3.5vw, 2rem)` | 1.10 | −0.020em | 600 | Título de página |
| `title-1` | 1.5rem | 1.20 | −0.015em | 600 | Encabezado de sección |
| `title-2` | 1.25rem | 1.25 | −0.010em | 600 | Título de tarjeta |
| `title-3` | 1.0625rem | 1.35 | −0.005em | 600 | Subtítulo, encabezado de lista |
| `body` | 0.9375rem | 1.55 | 0 | 400 | Texto general |
| `callout` | 0.875rem | 1.50 | 0 | 500 | Etiquetas, botones |
| `footnote` | 0.8125rem | 1.45 | 0.005em | 400 | Texto de apoyo |
| `caption` | 0.75rem | 1.35 | 0.010em | 500 | Metadatos |
| `overline` | 0.6875rem | 1.20 | 0.060em | 600 | Encabezados de sección (mayúsculas) |

**Detalles obligatorios:**
- `font-variant-numeric: tabular-nums` en **toda** cifra que se alinee en columna:
  números de membresía, cédulas, montos, fechas, contadores. Sin esto las columnas bailan.
- `font-optical-sizing: auto`.
- Espaciado en `rem`/`em`, nunca px fijos, para que el layout escale con el tamaño de
  texto del usuario.

---

## 4. Espacio, forma y profundidad

### 4.1 Rejilla de espaciado — base 4pt

```
--space-1: 4px    --space-5: 20px   --space-9:  48px
--space-2: 8px    --space-6: 24px   --space-10: 64px
--space-3: 12px   --space-7: 32px   --space-11: 80px
--space-4: 16px   --space-8: 40px   --space-12: 96px
```

Ningún valor de espaciado fuera de esta escala. Si un diseño "necesita" 13px, el diseño
está mal, no la escala.

### 4.2 Radios

```
--radius-xs:  6px    /* chips, badges */
--radius-sm: 10px    /* inputs, botones */
--radius-md: 14px    /* tarjetas */
--radius-lg: 20px    /* modales, hojas */
--radius-xl: 28px    /* superficies héroe */
--radius-full: 999px /* píldoras, avatares */
```

**Regla de radios anidados:** `radio_interno = radio_externo − padding`. Un elemento de
radio 10 dentro de una tarjeta de radio 14 con 4px de padding encaja ópticamente; con
radios iguales se ve un desajuste que el ojo detecta aunque no sepa nombrarlo.

### 4.3 Sombras

En claro, sombras en capas (una cercana y nítida + una lejana y difusa) — nunca una sola
sombra plana:

```css
--shadow-1: 0 1px 2px rgba(10,10,11,.06), 0 1px 1px rgba(10,10,11,.04);
--shadow-2: 0 2px 4px rgba(10,10,11,.06), 0 4px 12px rgba(10,10,11,.08);
--shadow-3: 0 8px 24px rgba(10,10,11,.12), 0 2px 6px rgba(10,10,11,.08);
--shadow-4: 0 24px 64px rgba(10,10,11,.18), 0 8px 20px rgba(10,10,11,.10);
```

**En oscuro las sombras no funcionan** (negro sobre negro no se ve). La elevación en el
tema oscuro se comunica con **superficie más clara + hairline superior de luz**:

```css
.elevated-dark {
  background: var(--ink-850);
  border: 1px solid var(--ink-700);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04); /* filo de luz superior */
}
```

### 4.4 Materiales translúcidos

Las barras (superior, lateral, tab bar) y las hojas modales son **capas de material**, no
franjas opacas. El contenido pasa por debajo.

```css
.material-chrome {
  background: color-mix(in srgb, var(--surface) 68%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
}
```

Reglas:
- **Nunca apilar dos materiales translúcidos claros** — la legibilidad colapsa.
- Superficies grandes = más blur y sombra más profunda que los chips pequeños.
- En el borde donde el contenido se cruza con la barra flotante, usar un **degradado de
  desvanecido** (scroll edge effect), no una línea divisoria de 1px.
- Al abrir una hoja/modal, animar **blur y escala juntos** — el material "se materializa"
  en vez de simplemente aparecer con opacidad.
- Respetar `prefers-reduced-transparency`: sustituir por superficie sólida sin blur.

---

## 5. Movimiento — el núcleo de la sensación Apple

Aquí es donde se gana o se pierde la comparación con Apple. La diferencia no es "tener
animaciones", es **cómo se comportan bajo la mano del usuario**.

### 5.1 Los cinco comportamientos que hay que respetar

1. **Respuesta en `pointerdown`, no en `click`.** El botón reacciona en el instante de la
   presión. Esperar al `click` se siente muerto.
2. **Manipulación directa 1:1.** Lo que se arrastra queda pegado al dedo, respetando el
   punto exacto donde se agarró.
3. **Interrumpibilidad.** Toda animación se puede agarrar y revertir a mitad de vuelo,
   sin esperar a que termine. Esto obliga a animar siempre desde el **valor actual en
   pantalla**, nunca desde el valor objetivo — de lo contrario hay un salto visible.
4. **Traspaso de velocidad.** Al soltar un gesto, la animación continúa exactamente a la
   velocidad del dedo. Sin costura entre arrastrar y animar.
5. **Proyección de momento.** Un flick no salta al punto más cercano al soltar, sino al
   más cercano a **donde el gesto iba a llegar**:
   `destino = posición + (velocidad/1000) · 0.998 / (1 − 0.998)`

Los puntos 3, 4 y 5 son imposibles con `transition` de CSS o `@keyframes`. Requieren
**resortes** (springs).

### 5.2 Tokens de movimiento

**Curvas y duraciones (para lo no gestual: hover, color, aparición simple):**

```css
--ease-out:      cubic-bezier(0.16, 1, 0.3, 1);    /* deceleración fuerte — el sello Apple */
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);
--ease-in:       cubic-bezier(0.7, 0, 0.84, 0);

--dur-instant: 100ms;  /* feedback de presión */
--dur-fast:    180ms;  /* hover, color, opacidad */
--dur-base:    260ms;  /* entradas de UI */
--dur-slow:    400ms;  /* hojas, modales */
--dur-page:    500ms;  /* transición de ruta */
```

**Resortes (para todo lo que el usuario pueda tocar):**

Apple parametriza con dos valores humanos, no con masa/rigidez/amortiguación:
*damping* (rebote) y *response* (rapidez).

| Uso | Bounce | Duration | Razón |
|---|---|---|---|
| UI general (por defecto) | `0` | `0.35s` | Críticamente amortiguado: llega y se queda. Sin rebote. |
| Reposicionar elemento | `0` | `0.40s` | |
| Hoja / drawer | `0.2` | `0.35s` | |
| Tras un flick con momento | `0.2` | `0.40s` | El rebote solo se gana si hubo momento en el gesto |

**Regla:** el rebote se **gana**, no se regala. Un menú que solo apareció no rebota;
una tarjeta que lanzaste sí. Rebote gratuito = juguete, no lujo.

### 5.3 Catálogo de movimiento por elemento

| Elemento | Comportamiento |
|---|---|
| **Botón** | `scale(0.97)` en `pointerdown` a 100ms. Hover: elevación + barrido del gradiente. Loading: el spinner sustituye al texto **sin cambiar el ancho** (cero layout shift). |
| **Input** | Focus: anillo dorado que crece desde 0 con `ease-out`, no aparece de golpe. Error: shake horizontal de 6px, 3 oscilaciones, 280ms. |
| **Fila de tabla/lista** | Entrada escalonada de 20ms entre filas (máx. 10 filas escalonadas). Hover: fondo + revelación de acciones inline. |
| **Tarjeta** | Entrada: `opacity 0→1` + `translateY(8px→0)` + `scale(0.98→1)`. |
| **Modal (desktop)** | Escala desde 0.96 con blur del fondo entrando en paralelo. Sale por el mismo camino. |
| **Hoja (móvil)** | Sube desde abajo, arrastrable con 1:1, rubber-band en el tope, cierre por proyección de momento. Backdrop se oscurece proporcionalmente al arrastre. |
| **Menú / popover** | `transform-origin` en el **botón que lo disparó**, no en su centro. Escala desde ahí. |
| **Toast** | Entra desde el borde, se apila, se descarta con swipe con traspaso de velocidad. |
| **Tab bar / sidebar** | El indicador dorado **se desliza** entre ítems (elemento compartido), no parpadea de uno a otro. |
| **Transición de ruta** | Cross-fade + desplazamiento sutil de 8px. Barra de progreso dorada de 2px arriba si tarda >150ms. |
| **Pull-to-refresh (móvil)** | Resistencia progresiva, indicador que se llena con el arrastre. |

### 5.4 Consistencia espacial

Si algo desaparece por un camino, debe volver a aparecer por el mismo. Una hoja que entra
desde abajo se descarta hacia abajo. Un panel que entra por la derecha sale por la derecha.
Las curvas de ida y vuelta son espejo (bézier inverso). Entrar por un lado y salir por
otro desorienta.

### 5.5 Rendimiento del movimiento

- **Solo `transform` y `opacity`.** Nada de animar `width`, `height`, `top`, `left`,
  `margin` o `box-shadow` (usar un pseudo-elemento con opacidad para sombras animadas).
- `will-change` solo justo antes del movimiento, retirado al terminar.
- `backdrop-filter` únicamente en chrome fijo (barra superior, tab bar, modales).
  **Nunca** en elementos de lista — mata el scroll en gama media.
- Listas largas: `content-visibility: auto` + `contain-intrinsic-size`.
- Presupuesto: **INP < 100ms**. Por encima de eso, la sensación de directo "se cae por un
  precipicio" y ninguna animación bonita lo compensa.

### 5.6 Movimiento reducido

`prefers-reduced-motion` **no** significa "sin feedback": significa un equivalente no
vestibular. Se sustituyen desplazamientos y resortes por cross-fades cortos, se elimina
todo overshoot, y se conservan los cambios de opacidad y color que ayudan a comprender.
Esto se implementa **dentro de los componentes**, no como un parche global al final.

---

## 6. Navegación y arquitectura de pantalla

### 6.1 App Shell adaptativo

| Ancho | Estructura |
|---|---|
| **≥1024px** | Sidebar fija de 264px, translúcida, colapsable a rail de 72px (solo iconos, con tooltips). Barra superior mínima con búsqueda global y avatar. |
| **768–1023px** | Sidebar en rail de iconos por defecto, expandible por hover/tap sobre el contenido. |
| **<768px** | Barra superior mínima (marca + búsqueda + avatar) + **tab bar inferior translúcida** de máx. 5 destinos, en la zona del pulgar. |

La tab bar se adapta al rol: un **empleado** ve `Inicio · Miembros · Buscar · Vender · Más`;
un **super_admin** ve `Inicio · Miembros · Comercios · Buscar · Más`. No se muestran
destinos a los que el rol no puede entrar.

Los ítems de navegación se nombran por **lo que contienen**, no con paraguas vagos.

### 6.2 Wayfinding

Toda pantalla responde cuatro preguntas: dónde estoy (título + ruta activa resaltada),
a dónde puedo ir (nav persistente), qué hay aquí (jerarquía visual clara), cómo salgo
(retroceso siempre disponible, nunca una pantalla trampa).

### 6.3 Menor número de clics — las decisiones concretas

Los tres flujos que más se repiten hoy y su coste actual:

| Flujo | Hoy | Objetivo |
|---|---|---|
| Vender membresía | Inicio → Miembros → Nuevo → formulario = **3 navegaciones** | **1 acción** desde cualquier pantalla |
| Consultar estado de un miembro | Navegar → buscar → abrir ficha = **3 pasos** | **1 paso**: buscar en el shell, estado visible en el resultado |
| Renovar membresía | Navegar → buscar → ficha → renovar = **4 pasos** | **2 pasos**: acción inline desde el resultado de búsqueda |

Mecanismos que lo consiguen:

1. **Paleta de comandos (⌘K / Ctrl+K).** Busca miembros por número, cédula o nombre, y
   ejecuta acciones ("vender membresía", "nuevo comercio"). Un atajo sustituye tres clics.
2. **Búsqueda global en el shell**, no en una página aparte. Resultados con estado de
   membresía visible sin entrar a la ficha.
3. **Acciones inline en listas** (renovar, activar/desactivar) sin abandonar la pantalla,
   con `useOptimistic` para que la UI responda al instante.
4. **Botón de acción persistente**: FAB en móvil, botón primario fijo en escritorio, para
   el flujo estrella de cada sección.
5. **Formularios que no estorban:** autofocus en el primer campo, Enter envía, validación
   en `blur` (no al enviar), errores junto al campo, y la contraseña autogenerada con
   copia a un clic y confirmación háptica/visual.

### 6.4 Tablas → listas responsive

`.orum-table` se sustituye por un componente `DataList` con dos presentaciones sobre la
misma fuente de datos:

- **≥768px:** tabla real, con encabezado pegajoso, ordenación, cifras tabulares y
  acciones que se revelan al hover de la fila.
- **<768px:** tarjetas apiladas, con el dato identificador como título, dos o tres campos
  de apoyo, y acciones tras un swipe lateral o un menú de tres puntos.

Nunca scroll horizontal en móvil.

### 6.5 Estados de carga y vacío

- Un `loading.tsx` por ruta con **skeletons que replican el layout real** (no un spinner
  genérico centrado). El esqueleto tiene un barrido de brillo sutil.
- Streaming con `Suspense` para que la estructura aparezca antes que los datos.
- Estados vacíos con ilustración mínima, una frase clara y la acción que lo resuelve.
- Estados de error con causa comprensible y botón de reintento — nunca un stack trace.

---

## 7. Inventario de componentes

Se construyen sobre **CSS Modules** (ver §9), con `motion` para lo gestual.

**Fundaciones:** tokens de color, espaciado, tipografía, radios, sombras, movimiento,
z-index, blur. Reset moderno. Proveedor de tema sin parpadeo.

**Primitivos:**
`Button` (primary/secondary/ghost/danger · sm/md/lg · loading · icon-only) ·
`Input` `Textarea` `Select` `Field` `Label` `HelpText` `ErrorText` ·
`Switch` `Checkbox` `Radio` `SegmentedControl` ·
`Card` `Surface` `Divider` ·
`Badge` `Pill` `StatusDot` ·
`Avatar` `Skeleton` `Spinner` `ProgressBar` ·
`Tooltip` `Toast` `Alert` ·
`Modal` `Sheet` `Popover` `DropdownMenu` `ConfirmDialog` ·
`Tabs` `Breadcrumb` `Pagination` ·
`SearchField` `CommandPalette` ·
`DataList` (tabla ↔ tarjetas) · `EmptyState` · `StatTile` (dashboard Fase 4).

**Layout:**
`AppShell` · `Sidebar` · `TabBar` · `TopBar` · `PageHeader` · `Section` · `Stack` · `Grid`.

---

## 8. PWA — instalable y persistente en el móvil

Requisito explícito del cliente: *"que se pueda descargar la página y permanezca en el móvil"*.

### 8.1 Qué se implementa

- **Manifest** vía `src/app/manifest.ts` (API nativa de Next.js, sin dependencias):
  `name: "ORUM"`, `short_name: "ORUM"`, `display: "standalone"`,
  `theme_color: #0A0A0B`, `background_color: #0A0A0B`, orientación `portrait` en móvil.
- **Iconos:** 192, 512 y variante **maskable** (Android recorta el icono; sin maskable
  se ve un cuadrado feo dentro del círculo). Más `apple-touch-icon` de 180×180.
- **Shortcuts del manifest:** accesos directos desde el icono de la app a
  "Registrar miembro" y "Buscar miembro". Mantener pulsado el icono → acción en 1 toque.
- **Service worker:** precache del app shell + estrategia network-first para datos.
  **Nunca cachear respuestas de Supabase con sesión.** Página de fallback offline.
- **iOS específico:** `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style: black-translucent`, y splash screens generadas
  por tamaño de dispositivo (iOS no las genera solo).
- **Safe areas:** `viewport-fit=cover` + `env(safe-area-inset-bottom)` en la tab bar,
  para que no quede bajo la barra de gestos del iPhone.
- **Prompt de instalación propio:** capturar `beforeinstallprompt` y ofrecer un banner
  discreto y descartable, no el genérico del navegador.
- **Detección de `standalone`** para ajustar el header y ocultar el prompt cuando ya está
  instalada.

### 8.2 Limitaciones reales de iOS (hay que decirlo de frente)

- Safari **no** dispara `beforeinstallprompt`. En iPhone la instalación es manual:
  Compartir → "Añadir a pantalla de inicio". Hay que **enseñar ese gesto** con una hoja
  ilustrada la primera vez, detectando iOS + Safari + no-standalone.
- Notificaciones push en iOS: requieren iOS 16.4+ **y** que la app esté instalada.
- El almacenamiento de una PWA en iOS puede purgarse tras semanas sin uso. No se puede
  depender de él para datos críticos.

Nada de esto impide cumplir el requisito, pero conviene que el cliente lo sepa antes.

### 8.3 Herramienta

**Recomendación: Serwist** (sucesor mantenido de `next-pwa`, compatible con App Router).
Alternativa sin dependencia: service worker escrito a mano (~80 líneas) — viable, pero
hay que gestionar versionado de caché y actualizaciones manualmente. Serwist reduce el
riesgo de servir una versión obsoleta y quedar sin forma fácil de invalidarla.

---

## 9. Decisiones técnicas

### 9.1 Estrategia de estilos: **CSS Modules**

| Opción | Veredicto |
|---|---|
| **CSS Modules** ✅ | Cero runtime, scoping automático, funciona perfecto con React Server Components, sin cambios de build (Next.js ya lo soporta y el proyecto ya tiene `page.module.css`). Encaja con la postura de stack mínimo del proyecto. |
| Tailwind | Rápido, pero es una migración grande, ensucia el JSX en componentes con mucho estado visual, y el sistema de tokens de este diseño (rampas, materiales, gradientes metálicos) vive mejor en CSS puro. |
| CSS-in-JS | Descartado: runtime en cliente, fricción con RSC. |

Los tokens viven en `globals.css` como custom properties; cada componente trae su
`.module.css` que solo consume tokens. **Regla dura: ningún valor literal de color,
espaciado o duración fuera de la capa de tokens.**

### 9.2 Librería de animación: **`motion`** (1 dependencia)

Es la única dependencia que voy a defender, y la justificación es concreta: los
comportamientos de §5.1 puntos 3, 4 y 5 —interrumpir a mitad de vuelo, traspasar
velocidad, proyectar momento— **no se pueden hacer con CSS**. Sin ellos el resultado
serán "animaciones bonitas", no la sensación Apple que pide el cliente.

- Paquete: `motion` (sucesor de Framer Motion). Import mini ≈ 5KB para lo básico.
- Se usa **solo donde aporta**: gestos, hojas, listas, transiciones de ruta. Hover,
  color y presión siguen siendo CSS puro (más barato y suficiente).
- Alternativa sin dependencia: resortes a mano sobre `requestAnimationFrame`. Es
  factible pero significa reimplementar interpolación, traspaso de velocidad e
  interrupción. Más código propio y más superficie de bugs, para ahorrar 5KB.

### 9.3 Transiciones de ruta

Next.js 16 expone soporte experimental de la **View Transitions API**, que permite
transiciones de elemento compartido entre rutas de forma nativa. Se validará en la
Fase C; si el soporte no es estable, el plan B es una transición con `motion` en el
layout, que da el mismo resultado visual con más código.

### 9.4 Lo que NO cambia

La arquitectura de datos se queda intacta: server components con `requireRol`, server
actions en `actions.ts`, `useActionState` en formularios, `admin.ts` aislado en servidor.
Este rediseño es de la capa de presentación. Ningún flujo de negocio, esquema de BD ni
regla de autorización se toca.

---

## 10. Rendimiento y accesibilidad

**Presupuestos (medidos, no estimados):**

| Métrica | Objetivo |
|---|---|
| LCP | < 1.8s |
| INP | < 100ms |
| CLS | < 0.05 |
| JS inicial (admin) | < 120KB comprimido |
| Fluidez de gestos | 60fps sostenidos en gama media |

**Tácticas:** RSC por defecto y `'use client'` solo en hojas interactivas · streaming con
Suspense · fuente variable auto-hospedada con subset y `swap` · imágenes por
`next/image` · `content-visibility` en listas largas · `backdrop-filter` acotado a chrome fijo.

**Accesibilidad — no opcional:**
- `:focus-visible` con anillo dorado de 2px y offset. **Nunca `outline: none`** sin
  sustituto.
- Objetivos táctiles ≥ 44×44px, con ~10px de holgura de acierto.
- Contraste AA mínimo en todo texto (ver tabla §2.3); AAA donde sea posible.
- Soporte de `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`.
- Navegación completa por teclado, incluida la paleta de comandos y los modales
  (focus trap, Escape, retorno del foco al disparador).
- Roles ARIA correctos en modales, menús y tablas; `aria-live` para toasts y resultados
  de acciones.
- Etiquetas asociadas a cada control; errores anunciados, no solo coloreados.

---

## 11. Plan de ejecución por fases

Cada fase deja la app **funcionando y desplegable**. No hay una fase intermedia rota.

| # | Fase | Contenido | Entregable |
|---|---|---|---|
| **A** | **Fundaciones** | Tokens completos (color, tipo, espacio, radios, sombras, movimiento). Reset. Temas claro/oscuro con toggle sin parpadeo. Tipografía instalada. | `globals.css` reescrito + proveedor de tema. Sin cambios de pantalla aún. |
| **B** | **Primitivas** | Los componentes de §7, con sus variantes, estados de carga, y movimiento. Página interna de galería para revisarlos todos juntos. | `src/components/ui/**` + `/dev/ui` |
| **C** | **App Shell** | Sidebar + tab bar + top bar translúcido, navegación por rol, estado activo animado, paleta de comandos, búsqueda global, transiciones de ruta, barra de progreso. | `admin/layout.tsx` reconstruido |
| **D** | **Login y Cuenta** | Rediseño completo de `/login` y `/admin/cuenta/password`. Es la primera impresión del producto. | 2 pantallas terminadas |
| **E** | **Panel de Administración** | Migración pantalla por pantalla: Inicio, Miembros (lista/ficha/nuevo/editar/renovar), Comercios (+sucursales +promociones), Usuarios, Planes. Tablas → `DataList`. Skeletons por ruta. Acciones inline optimistas. | Todo el admin rediseñado |
| **F** | **PWA** | Manifest, iconos, service worker, splash de iOS, safe areas, prompt de instalación, guía de instalación para iPhone, modo offline. | App instalable en iOS y Android |
| **G** | **Pulido y auditoría** | Movimiento reducido, contraste, teclado, lectores de pantalla, medición de Core Web Vitals, revisión del movimiento en cámara lenta, prueba en dispositivos reales. | Informe de auditoría + correcciones |

**Orden defendido:** A y B primero porque sin fundaciones cada pantalla nueva nace
inconsistente y hay que rehacerla. C antes que las pantallas porque el shell define el
espacio en el que viven. D antes que E porque el login es barato, visible, y sirve de
validación del sistema completo con riesgo bajo antes de comprometerse a 15 pantallas.

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **El oro se ve barato.** Es el fallo más probable de una paleta dorada. | Rampa con variantes por fondo, oro como material con barrido (no color plano), presupuesto ≤5% del área, y prohibiciones explícitas (§2.5). Validación visual al final de la Fase A antes de escalar. |
| **`backdrop-filter` degrada el scroll** en Android de gama media. | Acotado a chrome fijo. Medición en dispositivo real en Fase G, con degradación a superficie sólida si no rinde. |
| **La PWA en iOS decepciona** por sus límites de plataforma. | Documentado arriba (§8.2) y comunicado al cliente antes de empezar, no después. |
| **La migración pantalla a pantalla deja la app mezclada** entre estilo viejo y nuevo. | Las fases A–C no rompen nada (los tokens viejos siguen resolviendo). En la Fase E se migra por secciones completas, no a medias. |
| **Alcance creciente.** Rediseñar invita a "ya que estamos, cambiemos el flujo". | Este rediseño no toca lógica de negocio. Cualquier cambio funcional se anota y se decide aparte. |

---

## 13. Decisiones que necesito de ti

1. **Tipografía** — ¿Inter Variable (consistencia total, recomendada), `system-ui`
   (SF real en Apple, distinta en Windows), o mantener Geist?
2. **Serif de acento** — ¿Añadimos una serif de alto contraste solo para el wordmark y
   cifras destacadas, o todo grotesca?
3. ~~**Tema por defecto del admin**~~ — **Resuelto (§2.9):** automático en admin y en el
   Portal de Miembros; oscuro fijo en el Portal Público por dirección de arte.
4. **Dependencia `motion`** — ¿aprobada, o prefieres estrictamente cero dependencias
   nuevas asumiendo un resultado menos fluido en gestos?
5. **Logo** — ¿existe logo/manual de marca de ORUM? Si no, propongo un wordmark
   tipográfico con el filo dorado, que además resuelve el icono de la PWA.
6. **Alcance de esta tanda** — ¿arrancamos por fases A→D (fundaciones + primitivas +
   shell + login) para que puedas evaluar el resultado real antes de comprometer las
   ~15 pantallas de la Fase E?

---

## 14. Referencias

- Contexto de negocio: [`Contexto_ORUM_txt`](../../../Contexto_ORUM_txt)
- Estado del proyecto: [`docs/ROADMAP.md`](../../ROADMAP.md)
- Base de conocimiento aplicada: *Designing Fluid Interfaces* (WWDC 2018),
  *The Details of UI Typography* (WWDC 2020), *Designing Audio-Haptic Experiences*,
  *Principles of Great Design* (WWDC 2026).
