# Plan detallado: carrusel destacado con tarjetas animadas

> 12/09/2026 · rama `mejora-diseno` · commit base `acf7cc0`
>
> Encargo del propietario: *«un carrusel donde se vean tarjetas con animación y se vea el
> logo, nombre del negocio, e imágenes del negocio o productos. Que sea más atractivo.
> Quiero atraer al cliente con solamente una mirada. Muy detallado en el celular y otros
> dispositivos.»*
>
> Tarea **V9** del plan de interfaz. Es una pieza nueva, no una variante del carril actual.

---

## 0. Lo que hay que saber antes de leer el resto

**Tres de los cuatro elementos pedidos se pueden construir hoy. El cuarto, no.**

| Elemento pedido | Estado |
|---|---|
| Carrusel | ✅ Hay base: `Carril` + `CarrilPista` ya resuelven el deslizamiento |
| Logo del negocio | ✅ `comercios.logo_url` + `ComercioLogo` + cadena de respaldo |
| Nombre del negocio | ✅ `comercios.nombre` |
| **Imágenes del negocio o productos** | ❌ **No existe la columna.** `comercios` tiene una sola imagen, `logo_url`. `promociones` no tiene ninguna |
| Animación | 🟡 Hoy solo `:active`. Es trabajo nuevo, y se hace **sin JavaScript** (§4) |

Ya lo advertí y el encargo se mantiene, así que **se construye entero**: la tarjeta se
escribe con su hueco de imagen desde el primer día, con tres estados de relleno, de modo que
el día que exista la columna **la foto entra por datos y no por una reescritura**.

El SQL que lo desbloquea está en §8. `SCOPE.md §2` pone `supabase/**` en solo lectura:
ningún agente lo ejecuta, lo corre una persona.

**Y un límite de contenido que decide el diseño**: hoy hay **4 comercios y 0 promociones
vigentes**. Un carrusel de 4 tarjetas en un escritorio de 1440px no se desliza: es una fila
corta. La pieza tiene que verse terminada con 3 elementos y con 10, y eso está en §6.

---

## 1. Qué es esta pieza, y en qué se diferencia del carril actual

`Carril` es una **estantería**: fila comprimida, tarjeta de 200px, sin imagen, subordinada
a la rejilla. Cumple su papel y **no se toca**.

Lo que se pide es otra cosa: la **primera cosa que el socio ve al abrir la aplicación**, con
peso de portada. Le llamo `CarruselDestacados`.

| | `Carril` (existe) | `CarruselDestacados` (nuevo) |
|---|---|---|
| Papel | Atajo secundario | **Primer impacto**, arriba del catálogo |
| Ancho de tarjeta | `--carril-tarjeta-w` = 200px | `--destacado-w`, y es responsivo (§5) |
| Contenido | Logo, nombre, una insignia | **Imagen + logo + nombre + categoría + beneficio** |
| Proporción | Alto libre | `aspect-ratio` fijo, para que no haya salto de layout |
| Animación | `:active` | Entrada escalonada, paralaje al deslizar, realce al enfocar (§4) |
| Tope | 10 | **6**: es una portada curada, no un catálogo |

**Regla heredada que se mantiene y no es negociable**: nada puede ser alcanzable solo
deslizando. Todo lo que salga en el carrusel tiene que estar también en la rejilla de la
misma página. Deslizar es un atajo, nunca el único camino.

---

## 2. Arquitectura: sigue siendo Server Component

`T4 §5.4` dejó escrita la regla: *«antes de poner `'use client'` en algo que vive dentro de
una lista, hay que decir cuántas veces se va a pagar»*.

Aquí el tope son 6 tarjetas, así que el coste sería acotado — **y aun así no se paga**, porque
toda la animación de §4 es CSS. Consecuencias concretas:

- Cero `'use client'`, cero hidratación, cero bytes de JavaScript añadidos al bundle.
- La animación corre en el compositor, no en el hilo principal. Es la diferencia entre 60fps
  y saltos en gama media.
- Funciona sin JavaScript, igual que el carril actual.
- **El deslizamiento sigue siendo scroll nativo.** No hay gesto propio: el navegador ya da
  seguimiento 1:1, resistencia elástica y proyección del momento del sistema operativo, que
  es la que el dedo espera. Reimplementarlo con `proyectarMomento` sería peor.

`prefiereMovimientoReducido()` de `src/lib/shared/motion.ts` es de cliente: aquí la
preferencia se respeta con `@media (prefers-reduced-motion: reduce)` en CSS, que además llega
antes del primer pintado.

---

## 3. La tarjeta: anatomía y los tres estados de la imagen

```
┌─────────────────────────────┐
│                             │  ← CAPA DE IMAGEN, aspect-ratio 4:3
│        (imagen)             │    object-fit: cover, sin salto de layout
│                             │
│  ╭────────╮                 │  ← velo en degradado desde abajo
│  │  LOGO  │  ‹-- placa      │    la placa monta sobre la imagen
├──╰────────╯─────────────────┤
│  Casa Duarte                │  ← nombre, --t-title-3
│  Gastronomía · Bogotá       │  ← meta, --t-caption
│  ┌──────────┐               │
│  │  -20 %   │               │  ← insignia del beneficio
│  └──────────┘               │
└─────────────────────────────┘
```

### Los tres estados de la capa de imagen

| # | Cuándo | Qué se pinta |
|---|---|---|
| **I1** | Hay foto (`portada_url`) | La foto, `object-fit: cover`, con el velo de §7 |
| **I2** | No hay foto, hay logo | **Hoy es el 100 % de los casos.** Superficie de material con `--gold-sheen` y `--edge-light`, con el logo centrado y grande. No es un hueco: es una portada tipográfica deliberada |
| **I3** | No hay ni foto ni logo | La inicial sobre la placa, `aria-hidden`, tratada como en `ComercioLogo` |

**I2 es la pieza de diseño de este plan**, no un apaño. Es lo que hace que el carrusel se vea
terminado hoy, con los datos de hoy, y lo que impide que el encargo quede bloqueado esperando
al backend. Tokens que ya existen y están sin estrenar: `--gold-sheen`, `--gold-halo`,
`--edge-light`, los cuatro niveles de sombra y `--radius-xl`.

**Nunca el icono de rotura.** D9 (`comercio-logo.tsx:40-43`) está abierto: Chrome puede pintar
el glifo de rotura junto al texto alternativo. Se cierra aquí o el carrusel lo hereda
multiplicado por seis, en la primera pantalla que ve el socio.

---

## 4. La animación, sin una línea de JavaScript

Cuatro movimientos. Todos `transform` u `opacity` — `CLAUDE.md` prohíbe animar `width`,
`height`, `top`, `left` y `margin` porque recalculan layout cada fotograma.

### A1 · Entrada escalonada
Al aparecer, las tarjetas suben y se revelan con un desfase de ~60 ms entre ellas. El índice
viaja como **token dinámico** (`style={{ '--i': i }}`), que es el único uso de `style` que la
norma admite: inyectar tokens, nunca maquetar.

- `transform: translateY()` + `opacity`, con `--ease-out`.
- `bounce: 0`: **el rebote se gana tras un gesto con momento**, y aquí no hay gesto. Rebote
  gratuito se lee como juguete.

### A2 · Paralaje al deslizar · **el que produce el efecto «caro»**
La imagen se desplaza dentro de su marco a distinta velocidad que la tarjeta, con
`animation-timeline: scroll(nearest inline)` — animaciones CSS guiadas por scroll.

- Corre en el compositor y **no cuesta ni un byte de JavaScript**.
- Donde el navegador no lo soporta, no pasa nada: la imagen se queda quieta. Mejora
  progresiva, no dependencia.
- Es el efecto que más se parece a lo que el propietario pide con «atraer con una mirada»,
  porque el movimiento aparece **como respuesta a su dedo**, no como una animación que se
  ejecuta sola.

### A3 · Realce al enfocar o apuntar
`transform: scale()` muy contenido + un nivel más de sombra + `--gold-hairline` en el filo.
Feedback en `pointerdown`, no en `click`, vía `:active` con `--escala-press`.

### A4 · Lo que NO se hace
- **Nada de autoplay.** Un carrusel que se mueve solo roba el control, obliga a perseguir el
  contenido y es un fallo de accesibilidad conocido (WCAG 2.2.2). El propietario pide
  atractivo, no movimiento involuntario.
- **Sin Ken Burns en bucle.** Un zoom perpetuo en seis tarjetas mantiene seis capas
  compuestas vivas: gasta batería y en gama media se nota.
- **Sin `backdrop-filter`.** Prohibición dura: destroza el scroll en filas de lista.

### Movimiento reducido
`prefers-reduced-motion` **no es «sin feedback»**: es un equivalente no vestibular.

- A1 pasa a ser solo `opacity`, sin desplazamiento.
- A2 se desactiva por completo.
- A3 sustituye la escala por un cambio de filo y sombra, que no implica movimiento.

---

## 5. El detalle por dispositivo · **móvil primero, 375×667**

### 5.1 Teléfono (≤ 480px)

| Aspecto | Decisión | Por qué |
|---|---|---|
| Ancho de tarjeta | `min(76cqi, 300px)` | A 375px da 285px de tarjeta y **62px de la siguiente**: es lo que dice «hay más» sin una flecha. A 320px da 243px y 49px de asomo, que sigue por encima del piso de 24px. **`cqi`, no `vw`** (corregido, ver §5.5) |
| Proporción de imagen | 4:3 | 16:9 a 285px de ancho da 160px de alto: la imagen se lee como una banda, no como una portada |
| Snap | **`x mandatory`** | **Corregido**: aquí sí, y es la divergencia deliberada respecto al `Carril`. Con una sola tarjeta visible a la vez, un flick corto bajo `proximity` puede dejarla a medio camino —el umbral de «cerca» lo define cada motor y difiere entre Chrome y Safari—, y media tarjeta de cada una es exactamente el efecto «roto» que se quiere evitar. `proximity` sigue siendo correcto en el `Carril`, que muestra varias a la vez |
| Sangrado | **Solo a `inline-end`** | Se hereda del carril y es la decisión más importante del componente: un sangrado simétrico mete contenido deslizable en la banda del gesto «atrás» —borde izquierdo en iOS, los dos en Android— y el socio **sale de la aplicación** arrastrando donde el diseño le invitó |
| Áreas seguras | `env(safe-area-inset-*)` en el relleno lateral | Con muesca, el sangrado no puede meterse bajo el radio de la pantalla |
| Desbordamiento | `overscroll-behavior-inline: contain` | El deslizamiento que llega al final no se propaga ni dispara el «atrás» del navegador |
| `touch-action` | **No se declara** | El navegador reparte el gesto solo. Tocarlo es exactamente lo que hace que la fila atrape el desplazamiento vertical de la página |
| Objetivos táctiles | Toda la tarjeta es el enlace, ≥44px sobrado | Y el `min-height` sube bajo `@media (pointer: coarse)` donde haga falta |
| Gama baja | Máximo **una** capa compuesta por tarjeta | Sin `filter`, sin desenfoque, sin sombras animadas |
| Peso | La imagen se dimensiona en CSS con proporción fija | Sin `aspect-ratio` hay salto de layout al cargar, que es el defecto que más se percibe en 3G |

### 5.2 Tableta (481–900px)
- Tarjeta a `min(46cqi, 340px)`: dos completas y una insinuada.
- Sigue siendo carrusel: con 6 elementos, dos por pantalla mantienen el gesto útil.
- **`@container contenido`, nunca `@media`**: el ancho útil no es el del viewport —cambia con
  el cromo del portal— y un `@media` se equivoca en ~200px justo donde importa.
- **Es el punto más ajustado de toda la tabla**: 40px de asomo. Pasa el piso de 24px pero no
  llega al objetivo de 48px. Primer sitio a mirar en captura real.

### 5.3 Escritorio (> 900px de contenedor) · **corregido**
- Tarjeta a 320px fijos.
- **La versión anterior de este plan decía que con 4 comercios «no hay nada que deslizar en
  1440px». Era falso**, y el error estaba en ignorar `--content-max`. `.main` topa en
  **1100px** (`tokens.css:336`, aplicado en `portal.module.css:243`), así que el contenido
  útil son **1052px** y la pista con su sangrado llega a **1076px** — nunca a 1440. Cuatro
  tarjetas piden `4×320 + 3×12 = 1316px` y **no caben**: caben **tres completas y un 29 % de
  la cuarta** (92px de asomo).
- Consecuencia: **en escritorio siempre hay algo que deslizar** salvo con ≤3 destacados. El
  asomo de 92px es justamente la señal de «hay más», así que el comportamiento es el
  correcto; lo que estaba mal era el razonamiento.
- La pista **no se centra**: queda alineada a la izquierda con el `h1` y la rejilla.
- Sin flechas de navegación, pero **la razón buena es otra**: no es que no haya desbordamiento
  —lo hay—, es que rueda, trackpad y teclado ya cubren el gesto en escritorio.

### 5.4 Horizontal en teléfono · **el caso que no cabe**
A 667×375, `min(76cqi, 300px)` topa en 300px, la imagen 4:3 mide 225px y la tarjeta completa
ronda los **324px de alto**. La altura útil tras la cabecera y la barra inferior —que a 667px
sigue visible, porque el umbral que la oculta es 768px— es de unos **215–260px**.

**La primera tarjeta no cabe sin desplazar**, que es lo contrario del encargo. Se capa por
**altura**, no por ancho:

```css
@media (orientation: landscape) and (max-height: 420px) {
  .pistaDestacados { --carril-tarjeta-w: min(52cqi, 220px); }
}
```

`@media` de altura no viola la regla de `CLAUDE.md`: esa regla es sobre adaptación al **ancho**,
y `container-type: inline-size` solo mide ancho — no hay forma de consultar la altura con
`@container` en este árbol. Si 220px sigue apretado, la alternativa es bajar la proporción a
16:9 **solo en esa consulta**, y eso lo aprueba `design-system-architect`.

### 5.5 `cqi`, no `vw` · **contradicción corregida**
La primera versión de este plan pedía `min(76vw, …)` dos líneas antes de exigir
«`@container contenido`, nunca `@media`». `vw` mide el viewport; `cqi` mide el contenedor, que
es lo que `.main` publica con `container-type: inline-size`. Hoy coinciden casi en todo el
rango porque el portal no tiene barra lateral — es una coincidencia de la topología actual,
no una garantía, y es exactamente el error que el propio plan advertía para `@media`.

### 5.6 Reutilizar la pista sin duplicar su CSS
`CarrilPista` ya resuelve sangrado, snap, `overscroll-behavior`, reserva del anillo de foco y
la ausencia deliberada de `touch-action`. Todo eso se hereda inyectando un **token dinámico**
que sobrescriba el ancho solo en esta instancia, que es el único uso de `style` que la norma
admite y el mismo patrón que ya usa el hero de `ComercioLogo`:

```css
.pistaDestacados {
  --carril-tarjeta-w: min(76cqi, 300px);
  scroll-snap-type: x mandatory;
}
@container contenido (min-width: 481px) { .pistaDestacados { --carril-tarjeta-w: min(46cqi, 340px); } }
@container contenido (min-width: 901px) { .pistaDestacados { --carril-tarjeta-w: 320px; } }
```

`--carril-tarjeta-w` sigue valiendo 200px para los dos consumidores actuales del `Carril`:
no se toca el token, se sobrescribe en una instancia.
- Estados de apuntado activos (A3), que en táctil no existen.

### 5.4 Teclado y lector de pantalla
- Cada tarjeta es un `<Link>`: **no se añade `tabindex`**. El navegador desplaza la pista al
  enfocar, y un `tabindex` en la pista metería una parada estéril antes del carrusel.
- El anillo de foco **no se puede recortar**: la pista reserva `padding-block` para los 2px de
  trazo más 2px de desplazamiento. Es la diferencia entre un carrusel navegable con teclado y
  uno que parece que no lo es.
- El logo va `decorativo` junto a un nombre visible: si no, el lector lo anuncia dos veces.
- La imagen de portada es decorativa (`alt=""`): el nombre del comercio está en texto al lado.
- Un solo `<h2>` para el carrusel, sin saltar niveles.

---

## 6. Los estados, incluidos los que hoy son el caso normal

| # | Situación | Qué se muestra |
|---|---|---|
| **E1** | ≥ 3 destacados | El carrusel completo |
| **E2** | 1–2 destacados | **No se renderiza el carrusel.** Dos tarjetas de portada no son una selección, y un carrusel de dos se lee como contenido faltante. Caen a la rejilla |
| **E3** | 0 destacados | Nada. La rejilla es la pantalla |
| **E4** | Ninguno con foto | **Hoy, el 100 %.** Todas en estado I2. Tiene que verse deliberado |
| **E5** | Mezcla con y sin foto | El riesgo de coherencia: I1 e I2 comparten proporción, radio y velo, así que la fila se lee uniforme |
| **E6** | Una imagen no carga | Se cae a I2 en esa tarjeta. **Nunca el icono de rotura** |
| **E7** | Cargando | El esqueleto imita la silueta real: bloque de imagen con su proporción, línea de nombre, línea de meta, insignia |
| **E8** | Sin conexión | No hay carrusel cacheado, y es correcto |

El umbral de E2 va a `estanterias.ts`, junto a `MINIMO_PROMOCIONES_DESTACADAS` y compañía, y
**es función pura**: entra en el lote de `qa-tester`.

---

## 7. El contraste, que es donde esto se rompe

En cuanto haya fotos, **el contraste deja de ser propiedad de un token** y pasa a depender de
cada imagen que suba cada comercio. `CLAUDE.md` fija AA con 0 fallos y eso no se negocia.

> **Regla de entrada, no mejora posterior**: ningún texto se apoya directamente sobre la
> imagen. El nombre, la meta y la insignia viven **bajo** la imagen, sobre `--surface` sólido.
> Lo único que monta sobre la foto es la placa del logo, que lleva **su propio fondo opaco** y
> ya tiene contraste firmado en `T4 §4.3`.
>
> El velo en degradado sobre la foto existe para que la placa no flote sobre un punto claro,
> y su extremo opaco se mide contra **negro y blanco puros** —los dos peores casos de una
> foto— cumpliendo en ambos.

Esa decisión —texto fuera de la imagen— es la que convierte un riesgo abierto en un número
que `accessibility-auditor` puede firmar sin ver las fotos.

**Presupuesto de oro**: la insignia del beneficio se repite seis veces. `T4 §3.2` Regla A
permite **una sola pieza de oro sólido por pantalla**: seis insignias doradas sólidas
**incumplen por conteo, sin necesidad de medir**. Van en tinta sobre superficie con filo
dorado, o en oro difuso dentro del 2 % de la Regla B. Lo decide `design-system-architect`.

---

## 8. Lo que necesita el backend · PROPUESTAS

`SCOPE.md §2`: `supabase/**` es solo lectura. **Ningún agente ejecuta esto.**

### B9 · La columna que desbloquea las fotos
```sql
alter table comercios add column portada_url text;
```
Una imagen por comercio, 4:3. Con esto, el estado I1 se activa **por datos**: la tarjeta ya
está escrita para recibirla.

### B12 🆕 · Imágenes de producto, si se quieren varias por negocio
```sql
create table comercio_imagenes (
  id bigserial primary key,
  comercio_id bigint not null references comercios(id),
  url text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```
El encargo dice «imágenes del negocio **o productos**», en plural. Una columna resuelve la
portada; varias fotos por negocio necesitan tabla. **Recomiendo empezar por B9**: una portada
por comercio es el 90 % del efecto visual con el 10 % del trabajo, y no hay contenido para
llenar una galería.

### B4 · El bucket · **sigue sin respuesta desde el 29/08**
Sin él, las portadas apuntarían a servidores de terceros, con los mismos tres problemas que
ya tienen los logos: desaparecen, no hay control de peso, y `next/image` es inviable. Un PNG
de 2 MB descargado entero para pintarse en una tarjeta de 300px, seis veces, en la primera
pantalla del socio.

---

## 9. Criterios de aceptación

1. Los cuatro comandos en verde (`tsc`, `eslint`, `vitest`, `next build`), con el código de
   salida comprobado. **`pnpm` no está en el PATH**: se usan los binarios de `node_modules\.bin`.
2. **Captura a 375×667 antes que ninguna otra.** Luego 768px y 1440px.
3. Server Component: cero `'use client'`, cero JavaScript nuevo en el bundle.
4. Con 4 comercios y ninguna foto, el carrusel **se ve terminado** (E4), no a medio cargar.
5. Con 2 destacados, el carrusel **no aparece** (E2).
6. El deslizamiento no atrapa el scroll vertical, y arrastrar desde el borde izquierdo **no
   saca de la aplicación**.
7. El anillo de foco se ve completo en la primera y en la última tarjeta, sin recorte.
8. Con `prefers-reduced-motion`, A2 desaparece y sigue habiendo feedback.
9. Cero literales: color, espaciado, radio y duración salen de `tokens.css`.
10. Ni una insignia dorada sólida de más: conteo sobre captura.
11. Ninguna tarjeta enlaza a una ruta que no existe. La lección de T15 está escrita en
    `comercio-card.tsx:42-49` y costó un 404 en cada tarjeta del catálogo.

---

## 10. Secuencia de agentes

| # | Agente | Entrega |
|---|---|---|
| 1 | `ux-designer` | Spec de la pieza: los ocho estados, el copy del encabezado, el criterio de curaduría y la jerarquía dentro de la tarjeta |
| 2 | `mobile-ux-specialist` | Requisitos por dispositivo y auditoría del `Carril` actual como base. **En paralelo con 1** |
| 3 | `frontend-implementer` | `CarruselDestacados` + `TarjetaDestacada` + el umbral en `estanterias.ts` + montaje en el catálogo |
| 4 | `accessibility-auditor` ∥ `design-system-architect` | WCAG y presupuesto de oro. En paralelo |
| 5 | `qa-tester` | Tests del umbral de E2 y de los selectores puros |
| 6 | `motion-ux-polish` | Ajuste fino de A1–A3 y del degradado del paralaje |

**Verificación visual**: la automatización de navegador de esta máquina **no consigue
redimensionar la ventana**. El paso a 375px lo confirma el propietario con una captura o un
dispositivo real. Ningún agente afirma haber visto nada renderizado.
