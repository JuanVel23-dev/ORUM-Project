# ORUM — Reglas de diseño e interfaz

> **Lee esto antes de tocar una sola línea de interfaz.**
>
> Este archivo lo carga Claude Code automáticamente al abrir el proyecto. Existe
> porque ya pasó una vez: dos sesiones trabajaron en paralelo y construyeron dos
> sistemas de diseño incompatibles sobre los mismos archivos.
>
> **Dirección de arte vigente: v6 — «negro, crema y oro cálido»**, fijada
> el 22/09/2026 a partir de la guía de marca entregada por el cliente. Lo
> aplicado y lo medido está en
> [`.claude/docs/log/v6-crema-oro.md`](.claude/docs/log/v6-crema-oro.md).
>
> **Reemplaza formalmente a la v5** ([`.claude/docs/log/v5-negro-oro.md`](.claude/docs/log/v5-negro-oro.md),
> 15/09/2026), que había ido en la dirección contraria en las dos cosas que
> esta versión deshace. No es un vaivén de gusto de sesión: la v6 viene de una
> identidad de marca real del cliente (logo, paleta y tipografía nombrados por
> archivo), no de una preferencia de quien programaba ese día.
>
> Hereda de la v3, la v4 y la v5 todo lo que no nombra —la sombra en vez del
> trazo, el oro como respuesta al toque, las franjas tonales, las curvas y
> duraciones, la disciplina de los cuatro trabajos del oro— y cambia dos cosas
> de raíz, las mismas dos que la v5 había cambiado, ahora en la dirección
> opuesta:
>
> 1. **Los neutrales claros pasan de NEUTROS a CÁLIDOS**: el blanco puro de la
>    v5 vuelve a ser un crema (`#FAF6EC`). La franja negra **sigue siendo
>    negra en los dos temas** —eso NO cambia— y de hecho se corrigió un bug
>    real donde en tema claro no lo era (ver «Tonalidades» y el log v6, §3).
>    El oro **no se tocó**: se calibró el crema alrededor del oro ya probado.
> 2. **Dos familias tipográficas**: Playfair Display (títulos, vía
>    `--font-display`) + Montserrat (texto, vía `--font-sans`). El serif de
>    display vuelve al sistema, por nombre, porque la guía de marca del
>    cliente lo pide así.
>
> ⚠️ **Queda DEROGADA**: la regla de «una sola familia tipográfica» de la v5.
> Si la encuentras escrita en algún sitio, ese sitio está sin actualizar.
>
> ⚠️ **Los tokens `--cacao-*` siguen llamándose así y siguen sin ser
> marrones.** Son la franja negra, en los dos temas, sin excepción. El nombre
> se conservó a propósito para no dejar `var()` huérfanos; el renombrado sigue
> en «Deuda conocida».
>
> Cada dirección sustituye a la anterior
> ([`.claude/docs/DIRECCION-ARTE-v4.md`](.claude/docs/DIRECCION-ARTE-v4.md),
> [`.claude/docs/DIRECCION-ARTE-v3.md`](.claude/docs/DIRECCION-ARTE-v3.md),
> [`.claude/docs/DIRECCION-ARTE-claro.md`](.claude/docs/DIRECCION-ARTE-claro.md))
> **solo en lo que dice**; lo que no nombra sigue vigente. El detalle del porqué
> de cada decisión previa está en
> [`docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md`](docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md).
>
> Y las restricciones que el propietario levantó —presupuesto del oro, «serif
> solo en h1», sombra solo como jerarquía— están en
> [`.claude/docs/LICENCIA-CREATIVA-v4.md`](.claude/docs/LICENCIA-CREATIVA-v4.md),
> que **sigue vigente**. Lo que ahí NO se levantó es el contraste AA.
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
| Una **tercera** familia tipográfica | v6: Montserrat (`--font-sans`) y Playfair Display (`--font-display`), y ninguna más. El serif solo entra por `--font-display`. |
| `--gold-400` o `--gold-500` sobre una superficie clara | 1,61:1 y 2,03:1. Ni el 3:1 de texto grande. El oro brillante **solo vive sobre negro**. |
| `none` dentro de una lista de sombras | Invalida la declaración ENTERA en silencio. Usa `0 0 rgba(0,0,0,0)`. |
| `outline: none` sin sustituto | Deja la interfaz sin foco visible. |
| Color como único portador de significado | Siempre punto/icono **+ texto**. |
| `backdrop-filter` en filas de lista | Destroza el scroll en gama media. Solo en cromo fijo. |
| Que un formulario ponga su propia tarjeta | La superficie la pone quien lo usa. |
| Un **trazo en una superficie en reposo** | Lo que define una tarjeta, un modal, un menú, un toast o una tabla es **la sombra**. Si no se ve, sube de sombra — no le pongas borde. |
| Poner **sombra a un chip, una píldora o una fila de lista** | Es el modo de fallo de esta dirección: todo flota y nada pesa. **Flota solo lo que el dedo puede levantar.** |
| Quitar el borde a algo interactivo **sin dejarle foco visible** | Una sombra suave no cumple el 3:1 de WCAG 1.4.11 en el límite de un control. El foco es lo que sostiene ese criterio. |
| Quitarle el borde en reposo a un **campo de formulario** | La regla «sin bordes» es para **superficies**, no para controles de entrada: un `<input>` vacío sobre blanco puro es invisible. |
| Distinguir **una superficie de su fondo** con un tinte | Eso lo hace la sombra. La franja tonal (`--surface-alt`) separa **secciones**, que es otra cosa: a 1,08:1 no despega una tarjeta de nada. |
| Un **segundo grosor** de trazo | 1px, y punto. El único 2px del sistema es el de `:focus-visible`. |
| Sombra o desplazamiento animados en **filas de lista** | Se paga en móvil de gama media, que es donde más filas hay. Ahí el feedback es **opacidad**. |
| `:hover` **fuera de** `@media (hover: hover)` | En táctil el hover se queda pegado tras el toque. |

---

## Blanco, luz y sombra

La frase entera: **crema, ninguna línea, luz y sombra — y el oro aparece cuando
tocas algo.** El crema no es un fondo, es el material. Lo que lo separa en capas
es la luz.

### El crema no tiene escalones

En tema claro **`--bg`, `--surface` y `--surface-sunk` son el mismo `--w-0`**
—que desde la v6 es un **crema cálido `#FAF6EC`**; el blanco puro `#FFFFFF` de
la v5 queda retirado, no por volver a la v4 (aquel papel `#FDFCFA` era casi
blanco con un susurro cálido; este crema es visiblemente crema, a propósito,
porque así lo pide la guía de marca del cliente)—. La separación entre
superficies **no la da un gris más claro ni un trazo**: la da la sombra. Eso
no cambió con la v6 ni cambiará con la próxima versión que toque el color: es
el principio que sobrevive a cualquier paleta.

⚠️ **Esto NO lo derogan las franjas tonales**, y confundirlo es el error fácil:
`--surface-alt` separa **secciones**, no superficies. Dos franjas a 1,04:1 (v6;
era 1,08:1 en la v5) no despegan una tarjeta de su fondo — eso lo sigue
haciendo la sombra, y solo la sombra.

Consecuencia directa y buscada: **si una superficie no tiene sombra,
desaparece.** Cuando algo «se pierde» sobre el fondo no es un fallo del token:
es que a esa superficie le falta su escalón. **La respuesta es subir de sombra,
nunca devolverle un borde.**

La única excepción que conserva tinte es `--surface-hover`. **Es deliberadamente
tenue: 1,07:1 sobre crema** (v6; era 1,13:1 sobre blanco puro en la v5 — la
mezcla de tinta bajó de 6 % a 3,5 % porque al 6 % el filo dorado de
`Button variant="brand"` caía bajo el 3:1 de 1.4.11 contra este hover; ver
`.claude/docs/log/v6-crema-oro.md`). Por eso, donde el hover o la selección
sean la ÚNICA señal —fila de menú, opción de la paleta de comandos, destino
activo—, **hace falta un segundo canal**: el filo dorado que aparece
(`box-shadow: inset`, que no mueve la caja), las acciones que se revelan, o
`aria-current`. Nunca el color solo.

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

| Token | Valor en claro | Ratio sobre crema (v6) | Para qué |
|---|---|---|---|
| `--border-superficie` | `transparent` | — | El filo de una superficie. **Transparente en reposo**; lo repone `prefers-contrast: more` |
| `--border` | tinta al 55 % | 4,08:1 | Divisiones **dentro** de una superficie (cabeceras, pies, `Divider`), cromo fijo del shell, y el **borde en reposo de un control de entrada** |
| `--border-subtle` | tinta al 22 % | 1,62:1 | Hairlines de fila. No define nada |
| `--border-strong` | tinta plena | 17,47:1 | **Ya no se usa.** Es el valor al que alto contraste devuelve `--border-superficie` |

✅ **El borde en reposo de un control de entrada es `--border-control`, no
`--border`.** En claro valen lo mismo; en OSCURO `--border` da 1,92:1 contra la
tarjeta y reprobaba 1.4.11, así que el control sube a `--n-500` (3,19:1) sin
engordar los divisores. **Los criterios se comprueban por tema.**

**Grosor: 1px.** El 2px de «superficie principal» de la v2 desapareció con el
trazo. El único 2px que queda en el sistema es el de `:focus-visible`.

### Las dos excepciones, que no son negociables

1. **Un campo de formulario conserva borde en reposo.** `Input`, `Select`,
   `Textarea`, `Checkbox`, `Radio` y `Button secondary`. Sin él no hay forma de
   saber dónde se escribe. Va a `--border` (4,08:1 en claro, v6), por encima
   del 3:1 de WCAG 1.4.11. **En oscuro no llega**; ver el aviso de arriba.
2. **Todo control que recibe foco lleva su filo en `:focus-visible`.** Una sombra
   suave **no cumple** el 3:1 que 1.4.11 exige en el límite de un control
   interactivo. El foco no es decorativo: es lo que sostiene el criterio ahora
   que el borde en reposo se fue. Si quitas un borde y no dejas foco visible, has
   roto accesibilidad.

### La sombra hace todo el trabajo, así que tiene que poder

**Dos capas por escalón**: un contacto corto y oscuro que ancla el objeto al
fondo, y un halo amplio y muy suave que le da volumen. Lleva el tinte
`rgb 10/10/14` desde la v5, y **la v6 no lo tocó**: el crema nuevo no cambió
la temperatura de la sombra, solo la del fondo sobre el que se ve. El
principio sigue siendo el mismo —la sombra hereda la temperatura de la
paleta, nunca la contraria.

**Las geometrías y las opacidades no se tocaron** desde W1, ni con la v5 ni
con la v6. Sobre el crema se ven parecido a como se veían sobre el blanco
puro de la v5 — el salto grande fue el de la v4 (papel cálido) a la v5
(blanco puro); el de la v6 (blanco puro → crema) es menor.

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

⚠️ **Excepción: el Portal Público va SIEMPRE en claro** (encargo del
propietario, 25/09/2026). La fachada la ve gente en todo tipo de
dispositivos, y con el modo oscuro puesto las franjas crema salían negras.
`(publico)/layout.tsx` fija `data-theme="light"` en su envoltorio —la
contraparte del `data-theme="dark"` de `PantallaAuth`—, así que ahí no
aplican ni la preferencia del sistema ni el tema elegido. Los otros tres
portales siguen con los dos temas. Y su fondo es **blanco puro**
(`--blanco`, no el crema `--w-0`): `publico.module.css` remapea `--w-0` en
la fachada; las franjas tintadas siguen en crema.

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
  hairlines, **la respuesta al toque** (abajo), el titular de la franja negra y
  —donde el punto anterior lo habilite— la acción principal del recorrido del
  cliente.
- **Presupuesto: levantado.** El ≤5 % del área visible lo retiró el propietario
  en `LICENCIA-CREATIVA-v4.md`. El oro puede ocupar lo que la pantalla pida. Lo
  que **no** se levantó es el contraste.
- El oro de marca sobre el crema de la v6 **sigue prohibido** (1,89:1 — peor
  todavía que los 2,03:1 sobre el blanco puro de la v5, porque el crema es más
  oscuro). `--gold-600` sigue siendo el único tono que cumple los dos criterios
  en claro, y **no cambió de valor** con la v6: se recalibró el crema
  alrededor de él.

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

**Casi todo es un filo de 1px**, y salvo el segmento seleccionado y el indicador
de ruta activa **ninguno existe en reposo**: en una captura estática de la
pantalla quieta, el oro de interacción es cero.

**Y sigue sin codificar datos.** Dice «el sistema te está respondiendo», nunca
«este dato es así».

### Cuatro oros, y el error es usarlos al revés

El oro se reparte en cuatro trabajos. **No son intercambiables**, y el fallo
típico —poner el oro brillante sobre una superficie clara— es el que arruina la
accesibilidad de una pantalla entera de un plumazo.

**La regla física, en una línea: sobre NEGRO el oro brillante gana contraste;
sobre CREMA lo pierde.** Es la misma fórmula leída en direcciones opuestas, así
que ningún oro puede ser a la vez más brillante y más legible sobre un fondo
claro. Por eso la v6 **no tocó ninguno de los cuatro oros**: recalibró el
crema alrededor de ellos en vez de perseguir el brillo otra vez.

| Trabajo | Token | Ratio | Prohibición |
|---|---|---|---|
| **Display, solo sobre negro** | `--gold-400` | **12,27:1** sobre `--cacao-bg` · 11,69:1 sobre el fondo oscuro — sin cambio | ⛔ Sobre crema da **1,64:1** y sobre gris claro **1,54:1**. Ni el 3:1 de texto grande |
| **Marca · acción en oscuro** | `--gold-500` | 9,26:1 sobre el fondo oscuro · 8,25:1 de filo sobre la tarjeta — sin cambio | ⛔ Sobre crema da 1,89:1 |
| **Relleno de acción · filo** | `--gold-600` | **4,84:1** con texto `--tinta-1` (1.4.3) · **3,27:1** de filo sobre crema, 3,13 sobre gris claro, 3,07 sobre gris hondo, 3,04 sobre `--surface-hover`, 5,61 sobre la franja negra (1.4.11) | — |
| **Texto e iconos dorados** | `--gold-700` | 4,87:1 crema · 4,67:1 gris claro · **4,58:1 gris hondo** | Cumple sobre **las tres** — el margen sobre la más honda no cambió desde la v5 |
| Texto dorado sobre oscuro | `--gold-300` | 13,95:1 sobre el fondo · 14,64:1 sobre la franja negra — sin cambio | — |

**El titular dorado grande vive sobre la franja negra, nunca sobre un gris.**
El mismo oro que da 1,54:1 sobre gris claro da 12,27:1 sobre negro. La salida
accesible es también la más impactante.

**Dónde está el techo, y no es negociable**: `--gold-600` está a **0,07 puntos**
del suelo de 1.4.11 contra `--surface-alt-2` (era 0,08 en la v5 — el margen no
cambió casi nada, porque el crema se calibró exactamente para conservarlo). No
se puede subir el oro ni oscurecer `--w-100` sin recalcular ese par. Cualquier
cambio futuro en `--w-0`, `--w-100` o `--gold-600` obliga a recalcularlo antes
de tocar nada más.

**`--gold-700` no se movió desde la v5** y sigue cumpliendo AA sobre las tres
superficies claras. Un oro de texto legible sobre un fondo claro es oscuro por
obligación; el brillo se ve en la franja negra.

---

## Tonalidades: crema, grises, negro

**Los neutrales claros de ORUM son CÁLIDOS.** Esto deroga la regla NEUTRA de la
v5 (que a su vez había derogado la cálida de la v4, que a su vez había
derogado la fría de la v3). No es un vaivén de gusto: la v6 viene de una guía
de marca real del cliente, con la paleta nombrada por archivo.

Sigue vigente el encargo que las franjas resuelven: «fondos que no sean solo
blanco o negro» y que **los espacios vacíos de escritorio se veían feos**. El
vacío no sobraba: **le faltaba estructura**.

| Superficie | Token | Para qué |
|---|---|---|
| **Crema** `#FAF6EC` | `--bg` · `--surface` | Fondo y tarjeta. Sigue sin haber escalones entre ellos |
| **Gris claro** `#F7F1E4` | `--surface-alt` | Franja alterna. **1,04:1** contra el crema: separa **sin trazo** |
| **Gris hondo** `#F5EFDF` | `--surface-alt-2` | Relleno: hueco, carril, esqueleto. Superficie de relleno, no de párrafo |
| **Negro** `#0A0A0C` | `--cacao-bg` | La franja oscura. El único sitio donde vive el oro de display. Negra en los DOS temas — ver el aviso de abajo |

La separación de las franjas **bajó** de 1,08:1 (v5) a 1,04:1 (v6): el crema se
calibró para conservar el margen de `--gold-600` contra `--w-100` (ver «El
oro»), y eso no dejaba sitio para separar más las franjas sin romper ese par.

Herramienta: **`<Section tono="crema" | "honda" | "cacao">`**. ⚠️ **Los valores
de la prop conservan los nombres de la v4** (el componente está fuera del alcance
de esta tanda): `crema` es ahora gris claro, `honda` gris hondo y `cacao` negro.
Una franja **no es una tarjeta**: no lleva sombra ni borde, porque no está
levantada, está teñida.

⚠️ **CERRADO EN LA v6 — la franja `cacao` en tema claro tenía un bug real.**
`globals.css` mapeaba `--cacao-bg` a un marfil claro (`--champan-100`) SOLO en
tema claro, contradiciendo el propio comentario de la línea anterior en ese
archivo y contradiciendo este documento. Confirmado con el propietario: la
franja **negra no sigue al tema** —es negra en claro y en oscuro, igual que el
`QrCode`, sin excepción— y **remapea sus tokens de texto hacia dentro**, así
que lo que viva ahí no hay que vestirlo a mano. En oscuro se separa del fondo
por 1,05:1, así que sigue leyéndose como franja en vez de desaparecer. Detalle
en `.claude/docs/log/v6-crema-oro.md` §3.

**El tema oscuro NO cambió con la v6**, y **se audita aparte**: los criterios
de contraste se comprueban por tema, nunca una vez para los dos.

⚠️ **Al cambiar la temperatura o la claridad de la rampa cambia la luminancia, y
un ratio firmado deja de valer.** Ya ha costado tres veces: en la v4 el filo de
la placa de logo era `--n-400` y al pasar a cálido cayó a 2,81:1 (hubo que
añadir `--n-450`); en la v5 esos mismos cuatro números volvieron a moverse y
hubo que recalcularlos otra vez. **La v6 NO tocó la placa de logo** —vive en
`--n-*`, la rampa oscura, que no cambió— así que esos cuatro números se
quedan como estaban en la v5. **Ningún valor entra sin recalcular.**

✅ **`--text-3` y `--gold-700` sobre la superficie más honda**: reprobaban AA
en la v4 (4,18:1 y 4,21:1), se cerró en la v5 (4,59:1 y 4,58:1 sobre blanco
puro) y con la v6 se recalculó otra vez sobre el crema: **6,35:1 y 4,58:1**.
`--text-3` ganó margen (ahora tiene valor propio, ya no comparte token con la
rampa oscura); `--gold-700` se quedó en el mismo número exacto — no es
casualidad, fue el par que decidió dónde calibrar el crema. El margen sigue
siendo corto, así que **`--w-100` no puede oscurecerse** sin recalcular.

---

## Tipografía: DOS familias

⚠️ **ESTO DEROGA «UNA SOLA FAMILIA» DE LA v5.** Encargo literal de la guía de
marca del cliente: **Playfair Display** para títulos, **Montserrat** para
texto. No es un vaivén de gusto de sesión — es una identidad de marca
entregada por el cliente, con las dos familias nombradas por archivo.

**Montserrat** viste todo lo que no es titular ceremonial: nav, botones,
formularios, tablas, cuerpo de párrafo. Reemplaza a Plus Jakarta Sans en el
mismo rol exacto. Se carga con `next/font/google`, subconjunto latino,
`display: swap`, variable en `wght` (el sistema consume 400–800).

**Playfair Display** entra por primera vez desde que la v5 retiró a Fraunces.
Serif de contraste alto, con cursiva real (`style: ['normal', 'italic']`) —
los acentos en cursiva dorada del héroe y los títulos de sección dependen de
que sea un corte auténtico, no una oblicua sintética. Pesos 500–800.

| Token | Valor | Dónde |
|---|---|---|
| `--font-sans` | Montserrat | Todo lo que NO es titular ceremonial |
| `--font-display` | Playfair Display | Solo donde ya vivía antes: héroe, «así funciona», `Cifra`, la ficha de comercio, el carnet del socio |

`--font-display` sigue siendo la ÚNICA puerta por la que un serif puede
entrar a una pantalla: la lista de consumidores no creció con la v6, solo
cambió qué familia hay detrás de la puerta. Nada que no pidiera
`--font-display` antes lo hace ahora.

**Lo que sigue DEROGADO de la v4** (no vuelve con la v6): «nunca en
Administración», «nunca por debajo de 28px», «un acento por pantalla». Lo que
SÍ vuelve, porque la familia física es otra vez un serif de contraste alto:

- **Un serif de display necesita MENOS peso y tracking más abierto que un
  sans geométrico** — es el motivo inverso al que subió el peso en la v5. Un
  serif crea presencia con la modulación de sus astas; a 72px, 600 le basta.
  `hero-1` baja de 800 a **600** y su tracking se abre de −0,040 a **−0,032em**
  — de vuelta a los valores de la v4. `hero-2` y `hero-cifra` bajan igual, de
  700 a **600**.
- ⚠️ **`display-1` (48px) NO baja de peso.** Es la trampa fácil de esta
  versión: `.t-display-1` vive en `--font-sans` (Montserrat), no en
  `--font-display` — sigue siendo un sans geométrico, así que el motivo de la
  v5 para subirlo a 700 sigue siendo cierto. Se queda en 700 / −0,030em.
- **De `display-2` (36px) hacia abajo el peso 600 no se toca**: subirlo
  engordaría los encabezados de todas las páginas de Administración.
- **`hero` sigue separado de `display`.** La frontera sigue siendo de escala
  (72px contra 48px) Y ahora también de familia otra vez, pero son la MISMA
  frontera: lo que pide `--font-display` es lo que sube a `hero`.
- **El rango no cambia**: `hero-1` llega a 72px contra 15 de cuerpo, 4,8x.
- **`-webkit-font-smoothing: auto` vuelve** en `.t-hero-1/.t-hero-2/.t-hero-cifra`:
  Playfair Display pierde sus astas finas con `antialiased` en Chrome/macOS,
  el mismo motivo que en la v4. Los módulos que ya usaban `--font-display`
  (héroe público, `Cifra`, la ficha de comercio, el carnet) YA tenían esta
  propiedad escrita desde antes de la v5 — nunca se limpió al retirarla del
  sistema global, así que vuelve a ser correcta sin tocar esos archivos.
- **Coste medido** (`.next/static/media` tras `build`): **364 KB** de woff2 en
  total (todos los cortes de `unicode-range`), de los que aproximadamente
  **110 KB** están marcados para precarga. La v5 había bajado el presupuesto a
  57,6 KB / 26,6 KB con una sola familia; la v6 lo sube de vuelta al tener dos
  — es un costo aceptado por mandato explícito del cliente, no un descuido.

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
`size="display"` la pone en el peldaño ceremonial a 36–52px (peso 700).

**`<Section tono>`** es la herramienta tonal: `crema`, `honda` o `cacao`. ⚠️ Los
**nombres de los valores son heredados de la v4** y ya no describen su color:
`crema` = gris claro, `honda` = gris hondo, `cacao` = **negro**. Es lo que da
estructura a una pantalla ancha sin dibujar una línea. La franja `cacao` remapea
sus tokens de texto hacia dentro y es el único sitio del sistema donde el oro
brillante (`--gold-400`, `--gold-300`) es legal.

**`<PageHeader display>`** pone el `h1` en el peldaño `hero` a 44–72px (peso
800). Ya no es una cuestión de familia: es una cuestión de que 72px de titular en
una pantalla de caja es espacio robado a la tabla.

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
5. **La v6 solo se ha visto en el Portal Público** (landing y `/explorar`,
   24/09/2026, en el navegador del panel, a 1280px y emulando 390px). El resto
   de portales sigue sin mirarse: entraron por tokens, `tsc`, `eslint`, las
   pruebas y `next build` pasan, y los pares de contraste están calculados con
   la fórmula WCAG 2.1 desde los hex. En esta máquina las capturas con la
   página desplazada salen corridas; se mide con `getBoundingClientRect` o se
   agranda el viewport para capturar sin desplazar. Lo que hay que juzgar a ojo de la v6 está
   listado en
   [`.claude/docs/log/v6-crema-oro.md`](.claude/docs/log/v6-crema-oro.md) §8;
   el historial de la v5 sigue en
   [`.claude/docs/log/v5-negro-oro.md`](.claude/docs/log/v5-negro-oro.md).
6. **Los tokens `--cacao-*` se llaman así y son NEGROS.** Once tokens (tres crudos
   y ocho semánticos) conservan un nombre que ya no describe su valor. Se
   mantuvieron a propósito: varios módulos los consumen y un `var()` huérfano no
   falla, hereda en silencio. El renombrado a `--negro-*` / `--franja-*` es una
   tanda propia, y tiene que tocar `<Section tono="cacao">` a la vez.
7. ~~En tema oscuro `--border` reprobaba WCAG 1.4.11 en el borde de los
   controles.~~ **Cerrado**: existe `--border-control`, separado de `--border`.
   En claro vale lo mismo; en oscuro sube a `--n-500` (3,19:1 sobre la tarjeta,
   3,58 sobre el fondo, 3,39 sobre la banda). Lo usan `Input`/`Select`/
   `Textarea`, `Checkbox`/`Radio`, `SegmentedControl` y `Button secondary`. Un
   control de entrada nuevo **pide `--border-control`, no `--border`**.
8. ~~Tres copias a mano de la paleta seguían en los colores de la v4.~~
   **Cerrado desde la v5, y verificado que sigue cerrado en la v6**:
   `manifest.ts` fija su color a propósito al del TEMA OSCURO (es lo que se ve
   en la pantalla de arranque antes de resolver la preferencia real), que no
   cambió con la v6, así que no necesitó tocarse. `apple-icon.tsx` e
   `icon.svg` tampoco: su fondo (`--n-1000`) y su oro (`--gold-300/400/500/600`)
   son exactamente los mismos tokens, sin cambio de valor. Si la paleta vuelve
   a cambiar, revisar los tres a mano — ninguno puede leer una variable CSS.
9. ~~`--cacao-bg` en tema claro mapeaba a un marfil claro en vez de negro,
   contradiciendo `CLAUDE.md`.~~ **Cerrado en la v6**: era un bloque de
   `globals.css` con un comentario sin versión que citaba un encargo posterior
   nunca recogido aquí. Confirmado con el propietario, corregido. Detalle en
   `.claude/docs/log/v6-crema-oro.md` §3.
10. **Los comentarios de `escaparate.module.css`, `hero-publico.module.css` y
    otros módulos que consumen `--font-display` citan «Fraunces»** por nombre.
    Con la v6 eso vuelve a ser conceptualmente cierto (hay un serif de verdad
    otra vez, con las mismas propiedades de `font-feature-settings` y
    `-webkit-font-smoothing` que esos comentarios describían) pero el nombre
    de la familia que citan sigue siendo el viejo (Fraunces, no Playfair
    Display). No afecta al render — se limpia cuando se toque cada módulo.
