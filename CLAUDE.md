# ORUM — Reglas de diseño e interfaz

> **Lee esto antes de tocar una sola línea de interfaz.**
>
> Este archivo lo carga Claude Code automáticamente al abrir el proyecto. Existe
> porque ya pasó una vez: dos sesiones trabajaron en paralelo y construyeron dos
> sistemas de diseño incompatibles sobre los mismos archivos.
>
> **Dirección de arte vigente: v3 — «papel blanco, ninguna línea, luz y sombra
> — y el oro aparece cuando tocas algo»**, fijada el 14/09/2026 en
> [`.claude/docs/DIRECCION-ARTE-v3.md`](.claude/docs/DIRECCION-ARTE-v3.md).
>
> Es una **corrección de rumbo sobre la v2, no una vuelta atrás**: el papel
> blanco se queda, el oro se queda, la disciplina se queda. Lo que cambia es
> **qué separa una superficie de otra**: era el trazo de tinta, y ahora es la
> sombra. Un trazo negro es papelería; una sombra bien hecha es una pantalla.
>
> La v3 sustituye a
> [`.claude/docs/DIRECCION-ARTE-claro.md`](.claude/docs/DIRECCION-ARTE-claro.md)
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
| `none` dentro de una lista de sombras | Invalida la declaración ENTERA en silencio. Usa `0 0 rgba(0,0,0,0)`. |
| `outline: none` sin sustituto | Deja la interfaz sin foco visible. |
| Color como único portador de significado | Siempre punto/icono **+ texto**. |
| `backdrop-filter` en filas de lista | Destroza el scroll en gama media. Solo en cromo fijo. |
| Que un formulario ponga su propia tarjeta | La superficie la pone quien lo usa. |
| Un **trazo en una superficie en reposo** | Lo que define una tarjeta, un modal, un menú, un toast o una tabla es **la sombra**. Si no se ve, sube de sombra — no le pongas borde. |
| Poner **sombra a un chip, una píldora o una fila de lista** | Es el modo de fallo de esta dirección: todo flota y nada pesa. **Flota solo lo que el dedo puede levantar.** |
| Quitar el borde a algo interactivo **sin dejarle foco visible** | Una sombra suave no cumple el 3:1 de WCAG 1.4.11 en el límite de un control. El foco es lo que sostiene ese criterio. |
| Quitarle el borde en reposo a un **campo de formulario** | La regla «sin bordes» es para **superficies**, no para controles de entrada: un `<input>` vacío sobre papel blanco es invisible. |
| Distinguir superficies con **un gris más claro** | Esa jerarquía se retiró. `--w-100..400` ya no tienen consumidor. |
| Un **segundo grosor** de trazo | 1px, y punto. El único 2px del sistema es el de `:focus-visible`. |
| Sombra o desplazamiento animados en **filas de lista** | Se paga en móvil de gama media, que es donde más filas hay. Ahí el feedback es **opacidad**. |
| `:hover` **fuera de** `@media (hover: hover)` | En táctil el hover se queda pegado tras el toque. |

---

## Papel, luz y sombra

La frase entera: **papel blanco, ninguna línea, luz y sombra — y el oro aparece
cuando tocas algo.** El blanco no es un fondo, es el material. Lo que lo separa
en capas es la luz.

### El blanco no tiene escalones

En tema claro **`--bg`, `--surface` y `--surface-sunk` son el mismo `--w-0`**.
La separación entre superficies **no la da un gris más claro ni un trazo**: la
da la sombra.

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
| `--border` | tinta al 55 % | 4,42:1 | Divisiones **dentro** de una superficie (cabeceras, pies, `Divider`), cromo fijo del shell, y el **borde en reposo de un control de entrada** |
| `--border-subtle` | tinta al 22 % | 1,67:1 | Hairlines de fila. No define nada |
| `--border-strong` | `--n-1000` | 20,4:1 | **Ya no se usa.** Es el valor al que alto contraste devuelve `--border-superficie` |

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
el mismo susurro frío que los neutrales, rgb 20/20/28; con negro neutro el
conjunto envejece.

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
- `--gold-500` sobre blanco **sigue prohibido** (2,49:1). `--gold-600` sigue
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

Contrastes verificados — no los cambies sin recalcular:

| Uso | Token | Ratio |
|---|---|---|
| Texto dorado sobre oscuro | `--gold-300` | 13.0:1 |
| Marca sobre oscuro | `--gold-500` | 7.94:1 |
| Texto negro sobre oro | `--n-1000` | 7.94:1 |
| Texto dorado sobre claro | `--gold-700` | 5.44:1 |
| Focus/filos en claro | `--gold-600` | 3.66:1 |
| ⛔ `--gold-500` sobre blanco | | **2.49:1 — prohibido** |
| ✅ Relleno de acción `--gold-600` + texto tinta (`--n-1000`) | `--gold-600` | **5.40:1** texto/relleno — cumple 1.4.3. Borde/superficie: **3.66:1** en claro, **4.92:1** en oscuro, **5.02:1** en la tarjeta de acceso — cumple 1.4.11 en ambos temas. Firmado por `accessibility-auditor`, T5, 30/08/2026. Cálculo en `.claude/docs/T5-validacion-contraste.md`. **Ojo al presupuesto**: un CTA de ancho completo a 44-52px ronda el 6-8% del viewport móvil por sí solo — mídelo sobre captura real antes de dar el ≤5% por cumplido. |

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

Curvas y duraciones en `tokens.css`; resortes en `src/lib/shared/motion.ts`.

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
`SPRING_POP`, `SPRING_FLICK`, `SPRING_MATERIAL`, `SPRING_PRESS`, y `sinRebote()`
para derivar uno amortiguado de otro.

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

### Entrada escalonada de listas y rejillas

30–40 ms entre elementos, **tope de 8**. El tope es la parte importante, no el
paso: a partir de ahí el último llega tarde y se percibe como lentitud, no como
elegancia.

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

**`DataList` sustituye a toda tabla.** Es una tabla semántica que CSS convierte en
tarjetas bajo 768px. Nunca scroll horizontal en móvil.

**`<Card principal>`** sube un escalón de sombra (de `--shadow-card` a
`--shadow-raised`). Una por pantalla, y solo la que de verdad es el elemento
principal. No lo pongas «porque queda bien»: si dos tarjetas lo llevan, ninguna
lo lleva. Ya no es un trazo de 2px — ese lenguaje se retiró con la v3.

**`<Card sunk>`** se hunde con `--shadow-hundida` (una sombra `inset`) más un
hairline. No se tiñe: `--surface-sunk` es el mismo papel que todo lo demás.

**`escalonado` en `Stack` y `Grid`** da la entrada escalonada de §4.2 sin
plumbing: 35 ms de paso y tope de 8, resuelto con `nth-child`, así que funciona
con cualquier hijo sin clonar elementos.

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
