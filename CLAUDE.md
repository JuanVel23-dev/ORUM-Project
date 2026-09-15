# ORUM — Reglas de diseño e interfaz

> **Lee esto antes de tocar una sola línea de interfaz.**
>
> Este archivo lo carga Claude Code automáticamente al abrir el proyecto. Existe
> porque ya pasó una vez: dos sesiones trabajaron en paralelo y construyeron dos
> sistemas de diseño incompatibles sobre los mismos archivos.
>
> **Dirección de arte vigente: v4 — «el oro sobre crema»**, fijada el
> 14/09/2026 en
> [`.claude/docs/DIRECCION-ARTE-v4.md`](.claude/docs/DIRECCION-ARTE-v4.md).
>
> Hereda de la v3 todo lo que la v4 no nombra —la sombra en vez del trazo, el
> oro como respuesta al toque, la disciplina— y cambia tres cosas de raíz: los
> neutrales pasan de fríos a **cálidos**, entra un **serif de display** acotado
> a titulares, y el movimiento baja de duración y sube de fuerza de curva.
>
> ⚠️ **La regla de los neutrales fríos queda DEROGADA.** Si la encuentras
> escrita en algún sitio, ese sitio está sin actualizar.
>
> Lo aplicado y lo medido está en
> [`.claude/docs/log/x1-fundacion-v4.md`](.claude/docs/log/x1-fundacion-v4.md).
>
> Cada dirección sustituye a la anterior
> ([`.claude/docs/DIRECCION-ARTE-v3.md`](.claude/docs/DIRECCION-ARTE-v3.md),
> [`.claude/docs/DIRECCION-ARTE-claro.md`](.claude/docs/DIRECCION-ARTE-claro.md))
> **solo en lo que dice**; lo que no nombra sigue vigente. El detalle del porqué
> de cada decisión previa está en
> [`docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md`](docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md).
>
> Si algo de este archivo y algo de ese documento se contradicen, **gana este
> archivo**: aquí es donde la dirección se traduce a reglas, y aquí es donde se
> arregla la contradicción.

---

## Lo que ORUM es

Club de beneficios por membresía. Dos ejes que no se deben confundir:

- **El producto no es binario.** `planes_membresia` sostiene varios planes con
  precio y duración propios (`precio numeric`, `duracion_meses integer`), y
  `membresias.plan_id` apunta a uno de ellos. Que el carnet muestre `plan.nombre`
  (`src/app/miembros/(portal)/perfil/page.tsx:72`) es correcto, no un defecto.
- **El estado de la membresía sí es binario: vigente o no.** Se deriva siempre
  con `derivarEstadoMembresia` — ver "Estado de membresía" más abajo, que **no
  cambia** con esta revisión.

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
| Animar `width`, `height`, `top`, `left`, `margin` | Recalcula layout cada fotograma. Solo `transform` y `opacity`. **Única excepción: las View Transitions** — ver «Movimiento». |
| `transition: all` | Anima propiedades que no sabes que existen, incluidas las caras. Enumera. |
| `ease-in` en interfaz | Empieza lento justo en el instante que el usuario más mira. El token se eliminó. |
| Que algo entre desde `scale(0)` | En el mundo real nada aparece de la nada. Desde `0.95` + `opacity: 0`. |
| Serif de display en Administración o en Comercios | Son pantallas de trabajo. El serif es del recorrido del socio. |
| `none` dentro de una lista de sombras | Invalida la declaración ENTERA en silencio. Usa `0 0 rgba(0,0,0,0)`. |
| `outline: none` sin sustituto | Deja la interfaz sin foco visible. |
| Color como único portador de significado | Siempre punto/icono **+ texto**. |
| `backdrop-filter` en filas de lista | Destroza el scroll en gama media. Solo en cromo fijo. |
| Que un formulario ponga su propia tarjeta | La superficie la pone quien lo usa. |
| Un **trazo en una superficie en reposo** | Lo que define una tarjeta, un modal, un menú, un toast o una tabla es **la sombra**. Si no se ve, sube de sombra — no le pongas borde. |
| Poner **sombra a un chip, una píldora o una fila de lista** | Es el modo de fallo de esta dirección: todo flota y nada pesa. **Flota solo lo que el dedo puede levantar.** |
| Quitar el borde a algo interactivo **sin dejarle foco visible** | Una sombra suave no cumple el 3:1 de WCAG 1.4.11 en el límite de un control. El foco es lo que sostiene ese criterio. |
| Quitarle el borde en reposo a un **campo de formulario** | La regla «sin bordes» es para **superficies**, no para controles de entrada: un `<input>` vacío sobre papel blanco es invisible. |
| Distinguir **una superficie de su fondo** con un tinte | Eso lo hace la sombra. El tinte de la v4 (`--surface-alt`) separa **secciones**, que es otra cosa: a 1,04:1 no despega una tarjeta de nada. |
| Un **segundo grosor** de trazo | 1px, y punto. El único 2px del sistema es el de `:focus-visible`. |
| Sombra o desplazamiento animados en **filas de lista** | Se paga en móvil de gama media, que es donde más filas hay. Ahí el feedback es **opacidad**. |
| `:hover` **fuera de** `@media (hover: hover)` | En táctil el hover se queda pegado tras el toque. |

---

## Papel, luz y sombra

La frase entera: **papel blanco, ninguna línea, luz y sombra — y el oro aparece
cuando tocas algo.** El blanco no es un fondo, es el material. Lo que lo separa
en capas es la luz.

### El blanco no tiene escalones

En tema claro **`--bg`, `--surface` y `--surface-sunk` son el mismo `--w-0`**
—que desde la v4 es **papel cálido** `#FDFCFA`, no blanco puro—. La separación
entre superficies **no la da un gris más claro ni un trazo**: la da la sombra.

⚠️ **Esto NO lo deroga la franja tonal de la v4**, y confundirlo es el error
fácil: `--surface-alt` separa **secciones**, no superficies. Dos franjas a
1,04:1 no despegan una tarjeta de su fondo — eso lo sigue haciendo la sombra, y
solo la sombra.

Consecuencia directa y buscada: **si una superficie no tiene sombra,
desaparece.** Cuando algo «se pierde» sobre el fondo no es un fallo del token:
es que a esa superficie le falta su escalón. **La respuesta es subir de sombra,
nunca devolverle un borde.**

La única excepción que conserva tinte es `--surface-hover`. **Es deliberadamente
tenue: 1,02:1 sobre papel.** Por eso, donde el hover o la selección sean la ÚNICA
señal —fila de menú, opción de la paleta de comandos, destino activo—, **hace
falta un segundo canal**: el filo dorado que aparece (`box-shadow: inset`, que no
mueve la caja), las acciones que se revelan, o `aria-current`. Nunca el color
solo.

Un hundido **se hunde**: `--shadow-hundida`, que es una sombra `inset` — la misma
luz entrando al revés. No es un escalón negativo de la escala, porque no existe
tal cosa. Los dos únicos sitios donde el relleno sigue siendo información —y por
eso existe `--surface-hueco`— son el esqueleto de carga y el carril de la barra
de progreso: perfilar un esqueleto dibujaría el contorno exacto del contenido que
aún no ha llegado, y un esqueleto no debe prometer una forma que puede no
cumplirse.

### Fuera el trazo, y cómo se retiró

**Ninguna superficie lleva borde en reposo.** No se consiguió con
`border: none`, y el matiz importa: cada superficie declara

```css
border: 1px solid var(--border-superficie); /* vale `transparent` */
```

Dos cosas se ganan con eso. La caja **mide lo mismo** con filo y sin él, así que
devolverlo no desplaza un píxel. Y `@media (prefers-contrast: more)` los devuelve
**cambiando un token en un solo sitio** (`globals.css`, al final), lo que alcanza
también a los componentes que se escriban mañana. Una media query por módulo se
rompe el día que alguien la olvida, y el fallo es invisible para quien no usa ese
modo.

Lo que queda de trazo, y para qué:

| Token | Valor en claro | Ratio sobre papel | Para qué |
|---|---|---|---|
| `--border-superficie` | `transparent` | — | El filo de una superficie. **Transparente en reposo**; lo repone `prefers-contrast: more` |
| `--border` | tinta al 55 % | 4,16:1 | Divisiones **dentro** de una superficie (cabeceras, pies, `Divider`), cromo fijo del shell, y el **borde en reposo de un control de entrada** |
| `--border-subtle` | tinta al 22 % | 1,67:1 | Hairlines de fila. No define nada |
| `--border-strong` | tinta plena | 16,96:1 | **Ya no se usa.** Es el valor al que alto contraste devuelve `--border-superficie` |

**Grosor: 1px.** El 2px de «superficie principal» de la v2 desapareció con el
trazo. El único 2px que queda en el sistema es el de `:focus-visible`.

### Las dos excepciones, que no son negociables

1. **Un campo de formulario conserva borde en reposo.** `Input`, `Select`,
   `Textarea`, `Checkbox`, `Radio` y `Button secondary`. Sin él no hay forma de
   saber dónde se escribe. Va a `--border` (4,42:1), muy por encima del 3:1 de
   WCAG 1.4.11 — lo que se le quitó es el aire de papelería, no la visibilidad.
2. **Todo control que recibe foco lleva su filo en `:focus-visible`.** Una sombra
   suave **no cumple** el 3:1 que 1.4.11 exige en el límite de un control
   interactivo. El foco no es decorativo: es lo que sostiene el criterio ahora
   que el borde en reposo se fue. Si quitas un borde y no dejas foco visible, has
   roto accesibilidad.

### La sombra hace todo el trabajo, así que tiene que poder

**Dos capas por escalón**: un contacto corto y oscuro que ancla el objeto al
fondo, y un halo amplio y muy suave que le da volumen. No es negra pura — lleva
el mismo tinte que los neutrales, y con la v4 ese tinte es **cálido**:
**rgb 28/22/18**. Con negro neutro el conjunto envejece, y con un tinte azulado
bajo una tarjeta de papel cálido la sombra se lee como un cerco gris pegado al
borde en vez de como volumen.

**Regla de grosor: la superficie grande se lee más gruesa.**

| Peldaño semántico | Escalón | Quién |
|---|---|---|
| — | ninguno | chip, píldora, badge, fila de lista, segmento |
| `--shadow-card` | 1 | tarjeta, tabla, fila-tarjeta en móvil |
| `--shadow-raised` | 2 | tarjeta principal, tarjeta apuntada |
| `--shadow-flotante` | 3 | menú, toast, popover |
| `--shadow-overlay` | 4 | modal, hoja, paleta de comandos |

Más `--shadow-press` (el contacto sin el halo: lo que queda bajo el dedo) y
`--shadow-hundida` (la `inset`).

**La escala subió en W1 (14/09/2026)**: la primera v3 acertó la gramática y se
quedó corta de amplitud — sobre papel blanco la tarjeta no se despegaba, que es
la premisa entera de esta dirección. Se subió **extensión antes que opacidad**
(el halo desenfoca 1,5–2,5x más; la opacidad sube bastante menos en
proporción), porque una sombra concentrada y opaca se lee como cerco gris y la
misma cantidad de negro repartida sobre el doble de radio se lee como volumen.
Si el gris se ve **como gris**, alguien subió opacidad donde tocaba subir radio.
Valores exactos y razonamiento: `tokens.css` §6.

**Pide siempre el token semántico, nunca `--shadow-3` crudo.** Los crudos no se
remapean por tema: `Menu` y `Toast` pedían el crudo y en tema oscuro no tenían
sombra alguna.

**La prohibición de `none` en listas de sombras importa ahora el doble**, porque
**todos** los escalones tienen dos entradas. Un `none` dentro invalida la
declaración ENTERA en silencio y la pantalla se queda sin una sola sombra.
`--edge` sigue valiendo `0 0 rgba(0,0,0,0)`. Un `box-shadow: none` que sea el
valor **completo** de la declaración sí es legal.

### La disciplina de la sombra: el riesgo real

La v2 fallaba por cuadrícula de cajas. **Esta falla por lo contrario: que todo
flote y nada pese.** Si cada tarjeta, cada chip y cada píldora lleva sombra, la
pantalla es una sopa de objetos levitando y se pierde la jerarquía igual que se
perdía con los bordes.

**La sombra es jerarquía, no decoración. Un chip no lleva sombra. Una fila de
lista no lleva sombra. Flota lo que el dedo puede levantar.**

Si al mirar una captura todo parece despegado del fondo, **sobran sombras — y la
respuesta es quitar, no añadir oro.**

### El tema oscuro NO se retira

Priorizar el claro no es eliminar el oscuro: el menú de tema existe, hay usuarios
con la preferencia puesta y `prefers-color-scheme` sigue mandando en quien no ha
elegido.

**El claro es donde se diseña y se juzga.** En oscuro una sombra negra sobre
fondo negro no se ve, así que allí el material lo declara **`--edge`**, que con
la v3 pasó de ser un chaflán superior a un **anillo completo de luz**: es el
sustituto del borde que se retiró, y sin él un menú `--surface` sobre una tarjeta
`--surface` se quedaba sin ningún límite. Los cuatro peldaños semánticos existen
también en oscuro, con la misma gramática de dos capas y mucha más opacidad.

**Cada cambio se audita en SU tema.** Los criterios de contraste se comprueban
por tema, nunca una vez para los dos.

---

## El oro

**El oro es color de MARCA siempre.** Es color de acción **solo** donde se
indica abajo, y solo mientras el par relleno/texto cumpla los dos ratios de
contraste de esta sección. Donde no se cumplan, sigue siendo tinta.

**Jamás codifica datos.**

- **Panel de Administración y Herramienta de Comercios**: botón primario =
  **tinta**, negro sobre claro, blanco sobre oscuro. No cambia.
- **Portal de Miembros y las seis pantallas de acceso**: el botón primario
  puede usar relleno dorado con texto en tinta, **condicionado** a que el par
  concreto cumpla a la vez:
  - **4.5:1** entre el texto y el relleno (WCAG 1.4.3).
  - **3:1** entre el borde del relleno y la superficie que lo rodea, en **los
    dos temas** donde se use (WCAG 1.4.11).

  Si el par no llega a esos dos números, el primario de esa pantalla **vuelve
  a tinta**. No hay apaño de borde que sustituya la medición, y no se aprueba
  con una estimación: solo con el ratio firmado por `accessibility-auditor`.
- El oro vive en: wordmark, indicador de ruta activa, anillo de focus,
  hairlines, **la respuesta al toque** (abajo) y —donde el punto anterior lo
  habilite— la acción principal del recorrido del cliente. (La versión anterior
  citaba "el CTA comercial del Portal Público" como única excepción: ese portal
  y ese CTA nunca se construyeron. Se retira la referencia).
- Presupuesto: **≤5% del área visible** por pantalla.
- El oro de marca sobre papel **sigue prohibido** (2,53:1). `--gold-600` sigue
  siendo el único tono que cumple los dos criterios en claro.

### El oro es la respuesta al toque

Con la v3 el oro gana un papel nuevo, y es un cambio importante: deja de ser solo
marca y pasa a ser **la señal de que el sistema te está respondiendo**.

| Estado | Qué pasa |
|---|---|
| **Reposo** | Sin filo. Solo sombra |
| **Señalado / enfocado / arrastrado** | Aparece un filo de 1px en `--brand-edge` y la sombra sube un escalón |
| **Activo / seleccionado** | Filo dorado + relleno de `--surface-hover` |
| **Favorito marcado** | El corazón se llena de **rojo**. Aquí el color SÍ es dato, y por eso no va en oro: es el único sitio donde el color dice algo que el oro no puede decir |

El token es **`--filo-activo`** (`0 0 0 1px var(--brand-edge)`), y va en
`box-shadow`, no en `border`: así no toca la caja y puede aparecer y desaparecer
sin mover el contenido. Se compone en lista con la sombra:

```css
box-shadow: var(--filo-activo), var(--shadow-raised), var(--edge);
```

**El presupuesto no sube, y conviene entender por qué.** Casi todo es un filo de
1px, y salvo el segmento seleccionado y el indicador de ruta activa **ninguno
existe en reposo**: en una captura estática de la pantalla quieta, el oro de
interacción es cero. Que el filo aparezca solo al señalar significa que en reposo
el oro ocupa **menos** que en la v2, no más.

**Y sigue sin codificar datos.** Dice «el sistema te está respondiendo», nunca
«este dato es así».

### Cuatro oros, y el error es usarlos al revés

La v4 reparte el oro en cuatro trabajos. **No son intercambiables**, y el fallo
típico —poner el oro claro sobre una superficie clara— es el que arruina la
accesibilidad de una pantalla entera de un plumazo.

| Trabajo | Token | Ratio | Prohibición |
|---|---|---|---|
| **Display, solo sobre cacao** | `--gold-400` | **7,83:1** sobre `--cacao-bg` · 8,90:1 sobre el fondo oscuro | ⛔ Sobre papel da **2,07:1** y sobre crema **1,99:1**. Ni el 3:1 de texto grande |
| **Marca · acción en oscuro** | `--gold-500` | 7,30:1 sobre el fondo oscuro · 6,62:1 de filo sobre la tarjeta | ⛔ Sobre papel da 2,53:1 |
| **Relleno de acción · filo** | `--gold-600` | **4,84:1** con texto `--tinta-1` (1.4.3) · **3,51:1** de filo sobre papel, 3,36 sobre crema, 3,11 sobre crema honda, 4,63 sobre cacao (1.4.11) | — |
| **Texto e iconos dorados** | `--gold-700` | 4,75:1 sobre papel · 4,55:1 sobre crema | ⛔ Sobre **crema honda** da 4,21:1. Ahí se usa `--gold-800` (6,22:1) |
| Texto dorado sobre oscuro | `--gold-300` | 12,20:1 sobre el fondo · 10,74:1 sobre cacao | — |

**El titular dorado grande vive sobre una franja de cacao, nunca sobre crema.**
Ese es el hallazgo de la v4 y no es un capricho: el mismo oro que da 1,99:1
sobre crema da 7,83:1 sobre cacao — y además ahí se lee **metal** en vez de
mostaza. La salida accesible resultó ser también la más impactante.

**El margen se estrechó y hay que saberlo**: el par de acción pasó de 5,40 a
4,84 (1.4.3) y de 3,66 a 3,51 (1.4.11). Siguen cumpliendo, pero ya no hay
holgura para «oscurecer un poco el papel». Cualquier cambio en `--w-0` o en
`--gold-600` obliga a recalcular **ese par** antes de tocar nada más.

**Ojo al presupuesto**: un CTA de ancho completo a 44-52px ronda el 6-8% del
viewport móvil por sí solo, y un titular dorado es mucha más área que eso.
**Si el héroe lleva oro, la acción de esa pantalla va en tinta.** Mídelo sobre
captura real antes de dar el ≤5% por cumplido.

---

## Tonalidades: papel, crema, cacao

**Los neutrales de ORUM son CÁLIDOS.** La v3 decía lo contrario —«un susurro de
frío, matiz ~240°»— y **esa regla queda derogada**: cuatro de las cinco
referencias medidas para la v4 hacen exactamente lo opuesto y ninguna envejece.
La premisa fría era correcta para un oro *metálico con barrido*; con un oro
**plano** sobre crema el conjunto no se lee beige, se lee apetecible. El barrido
metálico (`--gold-sheen`) sí sigue queriendo frío, y por eso **sigue acotado al
wordmark**.

Encargo que esto resuelve, en palabras del propietario: «tonalidades, fondos que
no sean solo blanco o negro» — y, sobre escritorio, que **los espacios vacíos se
veían feos**. El vacío no sobraba: **le faltaba estructura**.

| Papel | Token | Para qué |
|---|---|---|
| **Papel** `#FDFCFA` | `--bg` · `--surface` | Fondo y tarjeta. Sigue sin haber escalones entre ellos |
| **Crema** `#FAF7F0` | `--surface-alt` | Franja alterna. **1,04:1** contra el papel: separa **sin trazo** |
| **Crema honda** `#F3EEE3` | `--surface-alt-2` | Relleno: hueco, carril, esqueleto. **No lleva texto tenue** |
| **Cacao** `#2B1A15` | `--cacao-bg` | La franja oscura. El único sitio donde vive el oro de display |

Herramienta: **`<Section tono="crema" | "honda" | "cacao">`**. Una franja **no es
una tarjeta**: no lleva sombra ni borde, porque no está levantada, está teñida.
Si llevara filo volveríamos a la cuadrícula de cajas que hundió la v2.

La franja de **cacao no sigue al tema** —es cacao en claro y en oscuro, igual que
el `QrCode`— y **remapea sus tokens de texto hacia dentro**, así que lo que viva
ahí no hay que vestirlo a mano.

**El tema oscuro también es cálido**, y **se audita aparte**: los criterios se
comprueban por tema, nunca una vez para los dos.

⚠️ **Al cambiar la temperatura cambia la luminancia, y un ratio firmado deja de
valer.** Pasó de verdad en esta tanda: el filo de la placa de logo era `--n-400`
y con la rampa fría daba 3,33:1; el `--n-400` cálido cae a **2,81:1** y reprueba
1.4.11. Hubo que añadir `--n-450`. Ningún valor entra sin recalcular.

⛔ **Crema honda no admite `--text-3` ni `--gold-700`** (4,18:1 y 4,21:1). Es
superficie de relleno, no de párrafo. Si necesitas texto tenue ahí, sube a
`--text-2`. Y no se arregla aclarando `--tinta-3`: sus 4,71:1 sobre papel **ya
son el mínimo**.

---

## Tipografía: dos familias, y la frontera importa

**Un serif de display hace más por el «se ve caro» que cualquier animación.** Es
el cambio de mayor rendimiento por esfuerzo de toda la v4 — y solo funciona si
está acotado.

| Familia | Token | Dónde |
|---|---|---|
| **Fraunces** (serif) | `--font-display` | **Solo** `h1` y cifras grandes, vía `.t-hero-1` `.t-hero-2` `.t-hero-cifra`, `<PageHeader display>` y `<Cifra size="display">` |
| **Inter** | `--font-sans` | Todo lo demás: interfaz, cuerpo, botones, etiquetas, tablas |

- ⛔ **Nunca en Administración ni en la Herramienta de Comercios.** Son pantallas
  de trabajo. Por eso el serif **no cuelga de `.t-display-*`**, que el panel sí
  consume: si colgara, el panel se lo llevaría entero sin pedirlo.
- ⛔ **Nunca por debajo de ~28px.** Un serif a 13px en un botón se lee amateur, y
  sus astas finas dejan de cubrir el píxel.
- **Un acento por pantalla.** Repetido deja de ser acento.
- **El rango subió**, que era el encargo: el extremo era 40px contra 15 de
  cuerpo (2,7x) y ahora `hero-1` llega a 72px (4,8x). Un sistema tipográfico sin
  rango no tiene jerarquía, tiene tamaños.
- **Tracking específico del tamaño**, y ahora es obligatorio, no un refinamiento:
  se cargó **solo el eje `wght`** de Fraunces porque el eje óptico costaba 30 KB
  medidos —casi el doble del archivo— así que el ajuste por tamaño lo hacen a
  mano los tres trackings `hero` de `tokens.css`. Negativo al crecer
  (−0,032em a 72px), y **positivo al encoger**: `--t-overline-tracking` subió a
  0,09em porque las mayúsculas a 11px sin aire se leen como una mancha.
- **Coste**: 35,8 KB, subconjunto latino, `display: swap`, fallback Georgia.

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

Curvas y duraciones en `tokens.css`; resortes en `src/lib/shared/motion.ts`.

### Regla cero: la FRECUENCIA decide si algo anima

Antes de elegir duración o curva, cuenta cuántas veces al día alguien va a ver
esto. Es lo que la v4 añade al marco anterior, y manda sobre todo lo demás.

| Frecuencia | Decisión | En ORUM |
|---|---|---|
| Cientos de veces al día | **No animar nunca** | Abrir el carnet desde la barra inferior |
| Decenas | Al mínimo | Hover de tarjeta, chips de filtro |
| Ocasional | Estándar | Overlay de ficha, toast, hoja |
| Rara / primera vez | Se puede deleitar | Alta de socio, primer favorito |

Una animación preciosa en algo que se hace 200 veces al día son 200 esperas, y
se percibe como lentitud mucho antes de que alguien la llame bonita.

### Duraciones y curvas (v4: bajan las unas, suben las otras)

| Banda | Valor | Token |
|---|---|---|
| Pulsación | 100–160 ms | `--dur-instant` 100 · `--dur-press` 90 · `--dur-rebote` 200 |
| Desplegable, chip | 150–250 ms | `--dur-fast` 140 · `--dur-base` 220 |
| Overlay, hoja | 200–500 ms | `--dur-slow` 320 · `--dur-page` 420 |
| **Salida** | ~0,65x de la entrada | `--dur-salida` 150 · `salidaDe()` en JS |
| Escalonado | 30–80 ms | `--escalonado` 40 · `retardoEscalonado()` |

```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)      /* entradas */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)     /* movimiento en pantalla */
--ease-hero:   cubic-bezier(0.645, 0.045, 0.355, 1)/* recorridos largos */
```

Las de CSS son flojas; estas están medidas en las referencias. **`--ease-in` se
eliminó del sistema**, no se dejó «por si acaso»: una curva que empieza lenta
arranca justo en el instante en que el usuario más mira, y hace que 300 ms se
sientan como 500.

### Cinco correcciones de la v4 que son bugs si se incumplen

1. **Nada entra desde `scale(0)`.** En el mundo real nada aparece de la nada.
   Desde `0.95`–`0.92` con `opacity: 0` haciendo el trabajo de ocultar.
2. **`transition: all` es un bug de rendimiento.** Enumera las propiedades. Y
   ojo con declarar **la misma propiedad dos veces** en una lista separada por
   comas: gana la última y la primera no se aplica nunca — sin aviso.
3. **La salida más rápida que la entrada.** Lento donde el usuario decide,
   rápido donde el sistema responde: cerrar ya está decidido.
4. **Escalonado de 30–80 ms, y con tope.** El tope importa más que el paso: sin
   él, la fila 25 llega casi un segundo tarde.
5. **Transiciones, no `@keyframes`, en lo que se dispara rápido.** Una
   transición se reencamina a media animación; un keyframe reinicia desde cero.
   Excepción legítima: cuando el elemento se **intercambia** (React desmonta uno
   y monta otro) no hay valor de partida que transicionar, y ahí el keyframe es
   lo correcto.

**Para animar un número** (un desplazamiento, un progreso) la forma correcta de
`motion` es la de valor único:

```ts
animate(desde, hasta, { ...SPRING_SHEET, onUpdate: (v) => colocar(v) })
```

`animate(callback, [desde, hasta], opciones)` **no existe** en motion 12: no lanza
excepción, simplemente no anima. La hoja inferior se abría y se quedaba en su
posición cerrada —asomando solo el tirador— y nada en consola lo delataba.

### Las siete reglas, y ninguna es opcional

El encargo pide explícitamente movimiento de estilo Apple. Traducido a reglas
ejecutables (todas salen de *Designing Fluid Interfaces*, WWDC 2018):

1. **Responder en `pointerdown`, no en `click`.** En cuanto aparece latencia, la
   sensación de manipulación directa se cae por un precipicio. En CSS puro el
   equivalente exacto es **`:active`**, que el navegador enciende al APRETAR.
2. **Resortes, no duraciones.** Por defecto **críticamente amortiguado**
   (`bounce: 0`, respuesta 0,3–0,4 s). El rebote se gana — ver abajo.
3. **Interrumpible siempre.** Una animación en curso se puede agarrar y
   revertir, y se anima **desde el valor en pantalla**, nunca desde el lógico.
   Arrancar del lógico hace saltar el elemento al destino antes de volver, y ese
   salto se ve por bueno que sea el resorte. Para eso está
   **`leerTransformEnPantalla`**.
4. **Entrada y salida por el mismo camino, y ancladas al origen.** Lo que nace de
   una tarjeta crece **desde esa tarjeta** (`transform-origin`), no desde el
   centro de la pantalla. Para calcularlo, **`origenDesde`** (función pura: recibe
   cajas, no elementos).
5. **Materializar, no fundir.** Una superficie translúcida entra animando
   **desenfoque y escala a la vez**, para que se lea como un material que llega y
   no como una opacidad que sube. `SPRING_MATERIAL` y `pasosMaterial`. Aplicado
   hoy en el velo del modal y en la tarjeta de acceso. **Es la única excepción
   viva a «solo transform y opacity» fuera de las View Transitions**, y se
   sostiene porque son UNA capa, UNA vez, y ya promocionadas por su
   `backdrop-filter` en reposo. **No se copia a nada que se repita.**
6. **Solo `transform` y `opacity`** en todo lo demás.
7. **`prefers-reduced-motion` ≠ sin feedback**: es el equivalente no vestibular
   (fundido corto en vez de viaje, sin rebote, sin paralaje). Lo que debe seguir
   animando —spinner, esqueleto, progreso— lleva `data-motion-esencial`.
   **`transicionSegunPreferencia(preset)`** elige por ti, y existe para que nadie
   vuelva a escribir dos llamadas a `animate` duplicadas: la rama de
   accesibilidad se queda sin actualizar cuando se toca la otra, y el fallo solo
   lo ve quien tiene la preferencia puesta.

- Gestos: seguimiento 1:1, resistencia elástica en los bordes
  (`amortiguarBorde`), y al soltar se decide por **dónde iba** el gesto
  (`proyectarMomento`), no por dónde se soltó.

Presets disponibles: `SPRING_UI` (por defecto), `SPRING_MOVE`, `SPRING_SHEET`,
`SPRING_POP`, `SPRING_FLICK`, `SPRING_MATERIAL`, `SPRING_PRESS`, `sinRebote()`
para derivar uno amortiguado de otro, y **`salidaDe()`** para derivar la versión
de salida de un preset de entrada: mismo carácter, 0,65x de duración y **sin
rebote** —un sobreimpulso al salir deja el objeto pasándose de su destino justo
antes de desaparecer, y el ojo lo lee como un tirón—.

Curvas en la forma que espera `motion`: `EASE_OUT`, `EASE_IN_OUT`, `EASE_HERO`.
Si cambias una, **cambia su gemela de `tokens.css` en el mismo commit**: que la
misma animación se sienta distinta según la escriba CSS o JS es el peor tipo de
incoherencia, porque no se ve en el código, solo en pantalla.

### Presionar hunde, apuntar levanta

Un botón que al pulsarse baja 2px y se queda solo con el contacto de su sombra
—pierde el halo— comunica **físicamente** lo que un cambio de color solo comunica
por convención. Y ocurre en `:active`, que es la regla 1 en CSS puro.

- **Pulsación**: `translate: 0 2px` + `--shadow-press`. En `:active`.
- **Hover**: `translate: 0 -2px` + **`--filo-activo`** + el escalón siguiente de
  sombra, **solo bajo `@media (hover: hover)`**. En táctil el hover se queda
  pegado tras el toque.
- Se anima `translate`, que es propiedad independiente de `transform`: así no
  pisa las transformaciones que ya use el componente y ambas se componen solas.
  Y **no se acumula con `scale`**: quien use `translate` repone `scale: 1`, que
  además desactiva la regla global de `globals.css` §4b.
- **Solo se levanta lo que ya estaba elevado.** `Button secondary` y `ghost` son
  tinta sobre papel: darles sombra al pulsar los haría subir justo cuando se les
  empuja.
- **Techo, y no es negociable**: nada de sombra ni desplazamiento animados en
  filas de lista largas. Ahí el feedback es **opacidad**, porque el que paga la
  factura es un móvil de gama media y es donde más filas hay.

### El rebote

Por defecto `bounce: 0`. **`bounce: 0.2` está permitido** en entradas de
overlay, confirmaciones y aparición de tarjetas. **Sigue prohibido** en
navegación y en cambios de estado de datos: ahí el rebote se lee como juguete.

La vuelta del acuse de presión —`--dur-rebote` / `--ease-rebote`, la que pasa
por `globals.css` §4b y alcanza a todo lo pulsable— vale **200 ms con ~+4 % de
sobreimpulso**. Estuvo en 440 ms y +12 %, luego en 320, y la v4 la baja a 200:
la banda de **pulsación** es 100–160 ms —Podia mide 120— y 320 era el resto de
una escala calibrada para resortes de overlay, no para el acuse de un botón.
Es el gesto más frecuente de la aplicación, y la regla cero manda hacia abajo.
`--ease-spring` **sí** conserva el 1.56 — ese es el rebote de lo que se gana.

### Suave siempre, seco una vez

Las dos peticiones conviven así, y el orden importa:

- **Todo lo continuo es suave.** Lo que responde mientras el dedo está ahí
  —hundir, levantar, abrir, mover— usa entrada rápida y salida decelerada
  (`--ease-out`) o un resorte sin rebote. Sin excepciones.
- **El único gesto seco es el acento puntual de la selección** (`Agitar`). No
  acompaña un gesto: celebra un resultado, ocurre una vez y se acaba.

No es un compromiso entre dos estilos: **el acento funciona porque todo lo demás
es suave.** Sobre un fondo igual de seco desaparecería en el ruido. Por eso se
aplica al **icono**, nunca a la superficie que lo contiene, y al **encender**,
nunca al apagar.

### Entrada escalonada de listas y rejillas

**`--escalonado`, que vale 40 ms**, con **tope de 8**. La banda es 30–80 y el
tope es la parte importante, no el paso: a partir de ahí el último llega tarde y
se percibe como lentitud, no como elegancia. El paso **sale del token**, no se
escribe a mano: estaba escrito siete veces en `layout.module.css` y otra vez,
distinto (22 ms), en el menú.

Ya resuelto y listo para usar: prop `escalonado` en `Stack` y `Grid`, y por
filas en `DataList` (`PASO_MS` / `MAX_ESCALONADAS`). Úsalo en la **primera
pintura** de una rejilla, no en cada actualización: escalonar una lista que el
usuario ya tenía delante le hace esperar otra vez por algo que ya había leído.

### Transiciones de elemento compartido — la excepción a «no animes la caja»

Aquí arriba está escrito que animar `width`, `height`, `top`, `left` o `margin`
es un bug. Una View Transition interpola exactamente eso: el navegador lleva la
caja del elemento de su geometría vieja a la nueva. **Es la única excepción, y
está acotada.**

Por qué no es la misma factura: lo que se interpola no es el elemento, es una
**instantánea** suya. El navegador saca una foto del estado viejo y otra del
nuevo, las coloca en una capa propia fuera del árbol de layout y las anima en el
compositor, sin recalcular nada en el hilo principal en ningún fotograma. Animar
`width` a mano, en cambio, obliga al motor a rehacer layout y pintado sesenta
veces por segundo, arrastrando a los hermanos. **Sigue prohibido a mano.**

**Dónde SÍ se usan, y hoy es un solo sitio:** rejilla del catálogo de miembros ↔
ficha del comercio. La placa del logotipo y el bloque nombre+marca son el mismo
objeto en las dos pantallas, con la misma disposición —placa a la izquierda,
texto a la derecha—, y solo cambian de tamaño y de posición.

**Dónde NO**, y no es una lista provisional:

- **Catálogo → carnet** y **ficha → carnet**. No hay ningún objeto en común: el
  carnet es el documento del socio, no el comercio. Ver volar la placa de un
  aliado hacia el carnet inventaría un parentesco que no existe.
- **Carrusel de portada → ficha** y **estanterías (`ComercioCardCompacta`) →
  ficha**. Un comercio puede salir a la vez en la portada, en una estantería y
  en la rejilla, y **dos elementos con el mismo `view-transition-name` vivos en
  el mismo documento anulan la transición entera, en silencio**. El nombre lo
  lleva solo la rejilla, que es la única lista exhaustiva.
- **Filtrar o cambiar de categoría dentro del catálogo.** Es la misma pantalla
  cambiando de contenido: morfar tarjetas que se reordenan produce vuelos
  cruzados. Ahí el patrón es la entrada escalonada.
- **Cualquier cruce de la frontera de sesión** (acceso → portal).

La regla que decide: **continuidad de objeto real**. El mismo objeto persiste y
se transforma. Un cambio de pantalla no basta. Una transición de elemento
compartido donde no hay continuidad se lee como un error de la aplicación, y eso
es peor que no tener ninguna.

**El mecanismo es nuestro, no del framework.** `experimental.viewTransition`
**no se consume en ninguna parte de Next 16.2.11**: existe en `config-schema.js`
y en el default, y ningún módulo del router lo lee. `<ViewTransition>` de React
—que el canary vendorizado sí exporta— se monta y no dispara nada: compila,
tipa, pasa lint y build, y `document.startViewTransition` no se llama ni una vez.
Es el mismo fallo mudo que `animate(callback, [desde, hasta])` en motion 12.

Por eso el nombre lo escriben los propios elementos con `style`
(`transicionComercio()` genera el valor desde el `id`, nunca desde el índice de
la lista, que cambia al filtrar) y quien llama a `document.startViewTransition`
es `TransicionesDeRuta`: **un solo componente de cliente por portal, con un
escuchador delegado**. Envolver cada tarjeta habría hidratado cien raíces en el
catálogo.

Detalle que no es obvio: `router.push` no espera a que React pinte, así que el
callback devuelve una promesa que solo se resuelve cuando `usePathname` cambia —
y con un plazo máximo, porque sin él una navegación fallida dejaría la página
congelada bajo la instantánea vieja.

**No se puede verificar desde la automatización de esta máquina.** Su Chrome
reporta `document.visibilityState === 'hidden'` incluso con foco, y la
especificación aborta toda View Transition en ese estado
(`Transition was aborted because of invalid state`). Es la misma causa de fondo
que la nota de «Antes de dar algo por hecho» sobre medir transiciones aquí. Se
comprueba en un navegador de verdad, mirando.

**Cómo se escriben.** Nunca un `view-transition-name` suelto en un
`.module.css`: en navegación de cliente, quien llama a
`document.startViewTransition` es React, y solo si hay un `<ViewTransition>` en
el árbol que cambia. Un nombre suelto compila, pasa el lint y no anima jamás
—y además el hash del módulo CSS lo renombraría—. La puerta única es
`<TransicionCompartida>` (`src/components/ui/transicion-compartida.tsx`), y el
nombre se deriva del **`id` del dato**, nunca del índice de la lista: el índice
cambia al filtrar y el par deja de casar justo cuando el usuario ha filtrado.

**Movimiento reducido**: resuelto en `globals.css` §4c y §5, no en el
componente. El morfo de la caja se anula y queda un fundido cruzado — equivalente
no vestibular, nunca ausencia de feedback. No puede resolverse en el componente
porque estas pantallas son Server Components y detectarlo exigiría hidratar cien
tarjetas para escribir un atributo.

**Ojo**: la red de seguridad de `prefers-reduced-motion` de `globals.css` §5 usa
`*`, que **no casa con un pseudoelemento** `::view-transition-*`. Cualquier
transición nueva necesita su tratamiento accesible escrito a mano; no lo hereda.

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
· `Agitar`

**`Agitar`** envuelve un icono y lo agita **una vez** cuando su prop `activo`
pasa de `false` a `true` — el acento de «seleccionado» en un filtro. Se le pasa
el mismo booleano que ya pinta el estado; no hay que disparar nada. No se agita
al montar ni al apagarse. Lee su cabecera antes de usarlo: una agitación
significa «error» en casi todas las interfaces, y lo que la convierte aquí en
«seleccionado» es que sea corta, pequeña y **sin repetición**. Y **nunca es el
único portador**: `prefers-reduced-motion` la retira entera, así que el estado
tiene que verse igual con color, texto y `aria-pressed`.

**`ComercioLogo` pinta un CÍRCULO** en sus tres variantes (`tarjeta` 72px,
`hero` 144px, `portada` responsiva). `object-fit` se queda en **`contain`**: un
logotipo apaisado deja aire arriba y abajo, y eso es preferible a recortar la
marca. Si alguien propone `cover` «para llenar el círculo», el porqué de que no
está escrito en `comercio-logo.module.css`.

**`DataList` sustituye a toda tabla.** Es una tabla semántica que CSS convierte en
tarjetas bajo 768px. Nunca scroll horizontal en móvil.

**`<Card principal>`** sube un escalón de sombra (de `--shadow-card` a
`--shadow-raised`). Una por pantalla, y solo la que de verdad es el elemento
principal. No lo pongas «porque queda bien»: si dos tarjetas lo llevan, ninguna
lo lleva. Ya no es un trazo de 2px — ese lenguaje se retiró con la v3.

**`<Card sunk>`** se hunde con `--shadow-hundida` (una sombra `inset`) más un
hairline. No se tiñe: `--surface-sunk` es el mismo papel que todo lo demás.

**`escalonado` en `Stack` y `Grid`** da la entrada escalonada sin plumbing:
`--escalonado` de paso y tope de 8, resuelto con `nth-child`, así que funciona
con cualquier hijo sin clonar elementos.

**`Cifra`** para todo número de negocio (etiqueta + valor tabular + nota). No la
reimplementes en la página: el panel de inicio ya lo hizo y hubo que extraerla.
`size="display"` la pone en el serif a 36–52px — **solo en el recorrido del
socio**, nunca en Administración ni en Comercios.

**`<Section tono>`** es la herramienta tonal de la v4: `crema`, `honda` o
`cacao`. Es lo que da estructura a una pantalla ancha sin dibujar una línea. La
franja de `cacao` remapea sus tokens de texto hacia dentro y es el único sitio
del sistema donde el oro de display es legal.

**`<PageHeader display>`** pone el `h1` en el serif a 44–72px. Mismo límite: la
puerta del socio y su recorrido, no las pantallas de trabajo.

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

Y al **consultar** un rango contra una columna `timestamptz`, nunca una cadena suelta:

```ts
.gte('fecha_hora', inicioDiaBogota(desde))   // NO `${desde} 00:00:00`
.lte('fecha_hora', finDiaBogota(hasta))      // src/lib/shared/fecha.ts
```

Sin offset explícito Postgres la interpreta en la zona de la sesión (UTC), y todo lo
ocurrido después de las **7pm hora Colombia** cae en el día siguiente y desaparece del
filtro. No falla ruidosamente: devuelve menos filas. Estuvo vivo en seis sitios.

---

## Accesibilidad: mínimos no negociables

- Contraste AA en todo texto (4.5:1; 3:1 en texto grande). Auditado: 0 fallos.
- `:focus-visible` visible en todo interactivo.
- Objetivos táctiles ≥44px. **Lo que se ve y lo que se toca son cosas distintas**: si
  el control debe verse pequeño (el ojo de la contraseña, el botón de copiar), amplía
  el área con un `::after` centrado de `var(--tap-min)` en vez de agrandar el botón.
  Para filas anchas —menús, interruptores— sube el `min-height` bajo
  `@media (pointer: coarse)`: en escritorio la densidad es una virtud.
- **Un botón dentro de un campo no debe robarle el foco.** `onPointerDown` con
  `preventDefault`. Sin eso, en un móvil el teclado se cierra al tocarlo y parece que
  el control está roto.
- **Nunca `tabIndex={-1}` en algo accionable.** No lo "mueve al final" del orden de
  tabulación: lo saca por completo. El ojo de la contraseña estuvo así, y con teclado
  no había forma de revelarla.
- Un `<h1>` por pantalla, sin saltos de nivel.
- Un avatar junto a un nombre visible va `decorativo` (si no, el lector lo repite).

---

## Antes de dar algo por hecho

```bash
pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm test && pnpm build
```

**`next lint` ya no existe en Next 16.** El comando es `pnpm exec eslint .` —el
script `lint` de `package.json` ya apunta a `eslint`, pero sin la ruta no
recorre el proyecto entero, así que el `.` no es opcional—.

Si `pnpm` no está en el `PATH` (es el caso en la máquina de desarrollo actual),
los cuatro binarios se invocan desde `node_modules`:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd .
.\node_modules\.bin\vitest.cmd run --reporter=dot
.\node_modules\.bin\next.cmd build
```

Y **míralo renderizado**. En esta sesión, medir con `getComputedStyle` durante una
transición dio tres diagnósticos falsos seguidos: en una pestaña que el navegador no
pinta, las transiciones no avanzan y siempre se lee el valor inicial. Una captura
fuerza el pintado; una medición, no.

## Configuración de herramientas

`.claude/settings.json` **se comparte con todo el equipo**, así que no puede contener
rutas de una máquina concreta. Los hooks invocan `graphify` por nombre, resolviéndolo
desde el `PATH`; antes apuntaban a `C:/Users/<usuario>/.local/bin/graphify.EXE`, que
solo existía en un portátil y fallaba en cualquier otro clon del repositorio.

Lo que sea propio de tu máquina va en **`.claude/settings.local.json`**, que está en
`.gitignore`. Es la convención de Claude Code: `settings.json` compartido,
`settings.local.json` personal.

---

## Requisitos de entorno

Node **≥22.13** (declarado en `.nvmrc` y `engines`). pnpm 11 usa `node:sqlite`, que no
existe antes. Con Node 20 el instalador falla con `No such built-in module`.

---

## Deuda conocida

1. ~~Las transiciones de elemento compartido entre lista y ficha están
   habilitadas pero sin aplicar.~~ **Cerrado (M5)**: el par rejilla ↔ ficha ya
   las lleva. Queda **sin verificar en navegador**: esta máquina no pinta.
   Y un dato incómodo de recordar: en Next 16.2.11 la bandera
   `experimental.viewTransition` **no hace nada** —solo existe en el esquema de
   configuración—. Lo que hace que funcione es que Next vendoriza un React
   canary que ya exporta `ViewTransition`. No la quites sin comprobarlo, pero
   tampoco cuentes con ella.
2. Sin pruebas automatizadas de interfaz.
3. Sin verificar en dispositivo real: vista móvil, gestos de la hoja, instalación
   de la PWA y Core Web Vitals. La automatización de navegador de esta máquina
   **no consigue redimensionar la ventana** — no lo intentes, ya falló cinco veces;
   pide al usuario una captura o usa un dispositivo real.
4. El Portal de Miembros solo se ha visto en su pantalla de acceso: el resto exige un
   miembro con membresía vigente y esas credenciales no están disponibles aquí.
