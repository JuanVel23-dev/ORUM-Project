# W1 · Sombras visibles, logos circulares y suavidad Apple

> Encargo directo del propietario sobre la dirección de arte v3.
> Rama `mejora-diseno` · 14/09/2026 · `frontend-implementer`.
>
> Alcance tocado: `src/styles/tokens.css`, `src/app/globals.css`,
> `src/components/ui/**`, `CLAUDE.md`. **Nada de `src/app/miembros/**`,
> `admin/**`, `comercios/**` ni `(publico)/**`** — había dos agentes trabajando
> ahí en paralelo. Lo que habría querido tocar allí está al final, en
> «Frontera».

---

## A · Las sombras casi no se ven

### El diagnóstico

La primera escala de la v3 corrigió la **gramática** —dos capas por escalón,
tinte frío rgb 20/20/28, halo en vez de canto duro— y se quedó corta en
**amplitud**. Con el halo de `--shadow-1` a 8px de desenfoque y al 5 % de
opacidad, una tarjeta de papel blanco sobre un fondo de papel blanco no se
despegaba. Y eso no es un matiz estético: si la sombra es **lo único** que
recorta una superficie de otra (§2.1 quitó el borde en reposo), una sombra que
no se ve equivale a no tener superficie.

### Lo que se hizo

`src/styles/tokens.css` §6. Antes → después:

| Token | Antes | Ahora |
|---|---|---|
| `--shadow-0` | `0 1px 2px .05` | `0 1px 2px .10` |
| `--shadow-1` | `0 1px 2px .06`, `0 2px 8px .05` | `0 1px 2px .10`, `0 4px 12px .08` |
| `--shadow-2` | `0 2px 4px .07`, `0 8px 20px .07` | `0 2px 5px .12`, `0 10px 28px .10` |
| `--shadow-3` | `0 4px 8px .08`, `0 16px 40px .10` | `0 4px 10px .14`, `0 20px 52px .14` |
| `--shadow-4` | `0 8px 16px .10`, `0 32px 72px .14` | `0 8px 20px .18`, `0 40px 88px .20` |
| `--shadow-hundida` | `inset 0 1px 3px .07` | `inset 0 1px 3px .09` |

Todas en `rgba(20, 20, 28, α)`.

### Los cuatro criterios del encargo, uno por uno

1. **«Sigue siendo luz, no suciedad.»** Se subió **extensión antes que
   opacidad**: el halo de cada escalón desenfoca entre 1,5x y 2,5x más que
   antes, mientras la opacidad sube bastante menos en proporción. Esa es la
   diferencia material entre las dos cosas — la misma cantidad de negro
   concentrada junto al borde se lee como un cerco gris pegado; repartida sobre
   el doble de radio se lee como volumen. Las **dos capas** y el **tinte frío**
   se conservan intactos en los cinco escalones.

2. **«Superficie grande = sombra más gruesa.»** La progresión se hizo más
   ancha, no solo más fuerte: entre escalón y escalón el desenfoque del halo va
   ~2,2x y el desplazamiento ~2x. Chip (ninguna) < tarjeta (1) < tarjeta
   principal (2) < menú/toast (3) < modal/hoja (4) se distingue ahora de un
   vistazo, sin necesidad de poner dos objetos lado a lado. El mapeo semántico
   de `globals.css` **no cambió**: sigue habiendo cuatro peldaños y un
   componente sigue pidiendo `--shadow-flotante`, nunca `--shadow-3`.

3. **`none` dentro de una lista.** No se escribió ninguno. Los cinco escalones
   siguen siendo listas de una o dos entradas reales; `--edge` sigue valiendo
   `0 0 rgba(0,0,0,0)` y `--shadow-card` en oscuro sigue valiendo
   `0 0 rgba(0,0,0,0)`, que es la forma correcta de decir «sin sombra» dentro
   de una lista.

4. **El tema oscuro.** No se tocó, y estructuralmente no puede romperse por
   esto: en oscuro los cuatro peldaños semánticos están **remapeados** en
   `globals.css` a sombras negras densas propias, así que `--shadow-1..4` ni
   siquiera se consumen allí, y quien dibuja el límite es el anillo completo de
   `--edge-light` — que se deja exactamente como está, incluido el `inset 0 0 0
   1px` que la tanda anterior tuvo que convertir de chaflán en anillo. El único
   token de la escala clara que un componente pide en crudo y por tanto sí
   alcanza al oscuro es `--shadow-0` (`toggle.module.css`, el pulgar del
   interruptor): pasa de 5 % a 10 % de negro, o sea un pulgar **mejor**
   definido, no peor.

### Efecto lateral buscado en `--shadow-press`

`--shadow-press` mapea a `--shadow-0`, y sube con el resto. Es deliberado: al
pulsar, el objeto tiene que **bajar hasta tocar el fondo**, no apagarse. Si la
sombra desapareciera del todo, el gesto dejaría de leerse como hundimiento. Con
la escala nueva, lo pulsado conserva el contacto de `--shadow-1` y pierde su
halo — que es justo lo que ocurriría físicamente.

---

## B · Los logos de los comercios son circulares

### Lo que se hizo

`--placa-logo-ratio` pasa de `3 / 2` a **`1 / 1`**, y `.placa` pasa de
`--radius-xs` a **`--radius-full`**. Las **tres** variantes quedan circulares:

| Variante | Diámetro | Relleno | Interior | Radio |
|---|---|---|---|---|
| `tarjeta` | 72px | `--space-2` (8px) | 56px = 78 % | `--radius-full` |
| `hero` | 144px | `--space-4` (16px) | 112px = 78 % | `--radius-full` |
| `portada` | `min(50cqi, 176px)` | `--space-6` (24px) | ~75 % | `--radius-full` |

Las variantes **ya no declaran radio**. Antes `.hero` subía a `--radius-sm` y
`.portada` a `--radius-md` porque el radio de un rectángulo redondeado es una
proporción de su tamaño y 6px sobre 144 se leían como esquina viva. Con
`--radius-full` esa aritmética desaparece: un círculo es un círculo a cualquier
diámetro, y las tres escalas son por fin **la misma forma**.

### `contain` se queda, y por qué se deja escrito otra vez

`object-fit: contain`, no `cover`. Dentro de un círculo, un logotipo apaisado
deja aire arriba y abajo — correcto y preferible a cortar la marca: un 4:1 a
`cover` en un círculo pierde justo los lados, o sea el nombre. Esta decisión ya
se revirtió una vez en la historia de este componente, así que la cabecera del
módulo la razona entera con el argumento de por qué el diagnóstico original
(«un logo estirado delata un catálogo barato») era correcto y el remedio no.

### Las tres cosas que la forma obligó a ajustar

1. **El relleno sube en las tres variantes.** Dentro de un círculo el área
   utilizable no es el cuadro sino el **cuadrado inscrito**, que mide ~70,7 %
   del diámetro. Con el relleno anterior el contenido llegaba al 94 % y el filo
   curvo le recortaba las esquinas. Los tres rellenos dejan el contenido en
   torno al 75–78 %: por encima del cuadrado inscrito —un logotipo apaisado no
   usa sus esquinas y en el eje horizontal tiene el diámetro completo— pero ya
   lejos del recorte.

2. **`portada` baja de `min(60cqi, 196px)` a `min(50cqi, 176px)`,** y esto es
   geometría y no gusto. Con la placa apaisada, 60cqi de ancho eran 40cqi de
   alto y cabían en cualquier cubierta. Siendo círculo, 60cqi de ancho son
   **60cqi de alto**, y la celda mayor del collage del portal público es 16/9
   —56,25cqi de alto—: el círculo se habría salido y el `overflow: hidden` de
   la celda lo habría recortado por arriba y por abajo, que es exactamente el
   defecto que este componente existe para evitar. A 50cqi entra con holgura en
   16/9 y sobra sitio en las cubiertas 4/3 del carrusel. **Queda avisado en el
   módulo**: quien suba ese número, que lo mida contra la celda 16/9.

3. **Se retira el `calc` acoplado a la proporción.** `.placa` declaraba
   `line-height: calc(--placa-logo-w * 2/3 - --placa-pad * 2)` con un aviso de
   «si cambia la proporción, cambia también este 2/3». En vez de reescribir el
   2/3 por un 1/1 se retiró el acoplamiento entero: `line-height: 1` y el
   centrado lo hace `place-items: center`, que no necesita saber cuánto mide la
   caja. Una aritmética frágil menos que mantener.

### Lo que NO se tocó, por instrucción expresa

- **`alt=""`** sigue vacío, con su bloque de justificación intacto (D9 / camino
  2 de T4 §4.5): un `alt` con texto puede arrastrar el glifo de rotura de
  Chrome, y eso es lo único que no se acepta.
- **`QrCode`** sigue siendo un cuadrado negro sobre blanco en los dos temas. No
  se abrió el archivo para editarlo.
- El fondo, el filo y el color de la inicial siguen **fuera del tema**
  (`tokens.css` §11) y con sus contrastes firmados sin cambio.

La inicial de respaldo sube de `0.26` a `0.32` del diámetro: una letra pequeña
perdida en un rectángulo se leía como placa a medio cargar; al 32 % de un
círculo se lee como **monograma**. Sigue por debajo de la proporción de
`Avatar` (~0,36) para no tocar el filo, y el color no cambia, así que el 5,26:1
firmado se conserva y solo mejora por tamaño.

---

## C · Animaciones delicadas y suaves

El encargo pedía suavidad y señalaba el síntoma con precisión: «si algo tarda
440 ms en acusar un toque, es demasiado». El mecanismo ya era correcto —el
acuse ocurre en `:active`, que es `pointerdown` en CSS puro, y el hover que
levanta ya estaba bajo `@media (hover: hover)` en `Button` y `Card`—. Lo que
estaba mal eran **los dos tokens de la vuelta**, y están en la línea por la que
pasa el acuse de toda la interfaz (`globals.css` §4b).

| Token | Antes | Ahora | Por qué |
|---|---|---|---|
| `--dur-rebote` | 440ms | **320ms** | 440 queda por encima de la banda 0,3–0,4 s que la v3 §3.2 fija para un resorte crítico, y por encima de `SPRING_UI` (0,35 s), que es el vocabulario al que esta curva debe sonar igual. Tres cuartos de segundo de ida y vuelta sobre un botón se percibe como pereza, no como lujo. |
| `--ease-rebote` | `cubic-bezier(0.34, 1.56, 0.64, 1)` (~+12 %) | **`cubic-bezier(0.22, 1.2, 0.36, 1)`** (~+4 %) | «El rebote se gana»: soltar un botón no es un gesto con momento ni algo que aparece encima. El sobreimpulso se conserva —es lo que distingue una vuelta viva de una muerta— pero recortado hasta que se siente en vez de mirarse. |

`--ease-spring` **no se toca**: sigue en 1.56 y sigue siendo la curva del rebote
que sí se ganó. `--dur-press` (90 ms) y `--dur-fast` (180 ms) se quedan: la ida
del acuse tiene que ser instantánea y 180 ms con `--ease-out` —deceleración
fuerte, o sea entrada rápida y salida lenta— ya es la curva suave que el
encargo pide para el hover.

**No se añadió ni una regla de hover ni de press a ningún componente.** Se
auditaron los 26 módulos de `ui/`: los únicos que levantan o hunden son
`Button` y `Card`, y los dos ya tenían su hover bajo `@media (hover: hover)`,
su `:active` con `translate` + `--shadow-press`, su rama de
`prefers-reduced-motion` y `transform`/`opacity` como únicas propiedades. Los
demás `:hover` sin guarda (`Menu`, `Segmented`, `Toggle`, `DataList`,
`Input`) cambian **solo color u opacidad**, que no se queda pegado en táctil de
forma molesta y no necesita la guarda. Ampliar el diff ahí habría sido un
refactor de paso, no la tarea.

Resortes: `SPRING_UI` (bounce 0, 0,35 s) y `SPRING_MOVE` (bounce 0, 0,4 s) ya
cumplen la banda, y la interrumpibilidad ya está resuelta por
`leerTransformEnPantalla`, que lee el valor **en pantalla** y no el lógico.
`src/lib/shared/motion.ts` **no necesitó cambios** y no se tocó.

---

## D · `Agitar` — la pieza de agitación reutilizable

Archivos nuevos: `src/components/ui/agitar.tsx` y `agitar.module.css`.
**No se aplicó a ninguna pantalla**, según el encargo: la consume quien
construya los filtros.

### API

```tsx
import { Agitar } from '@/components/ui/agitar'

<button type="button" aria-pressed={activo} onClick={alternar}>
  <Agitar activo={activo}>
    <Filter size={16} aria-hidden="true" />
  </Agitar>
  Con promoción
</button>
```

| Prop | Tipo | Defecto | Qué hace |
|---|---|---|---|
| `activo` | `boolean` | `false` | Agita **una vez** en cada transición `false → true`. Nunca al apagarse. Nunca en el primer render. |
| `eje` | `'giro' \| 'lateral'` | `'giro'` | `giro` bascula (iconos con forma reconocible); `lateral` desvía en horizontal (números, texto corto). |
| `children` | `ReactNode` | — | Lo que se agita. |
| `className` | `string` | — | Se concatena; no sustituye. |

Es una prop **de estado, no un evento**: se le pasa el mismo booleano que ya
decide el aspecto de seleccionado. No hay que disparar, ni reiniciar, ni
limpiar un temporizador.

### Decisión 1 — que no se lea como error

Un temblor significa «contraseña incorrecta» en casi todas las interfaces. Para
que aquí signifique «seleccionado» se invierten las tres variables con las que
el ojo lo clasifica:

- **Muy corta**: `--dur-agitar` = 240 ms los cuatro golpes juntos. El temblor de
  error dura medio segundo o más.
- **Poca amplitud**: 6° de giro (o 2px de desvío) en el primer golpe, y cada
  golpe siguiente vale menos: −1, +0,7, −0,3, 0. El de error recorre 8–10px en
  ambos sentidos.
- **Sin repetición**: `animation-iteration-count` se queda en 1 y en ningún
  sitio hay un `infinite`. Una oscilación que se sostiene **es** una vibración,
  y una vibración es una alarma.

### Decisión 2 — el choque con «delicadas y suaves» del punto C

Resuelto por jerarquía, no por compromiso, y escrito en `CLAUDE.md` («Suave
siempre, seco una vez») y en la cabecera del componente:

> **Todo lo continuo es suave; el único gesto seco del sistema es el acento
> puntual de la selección.**

Lo que responde mientras el dedo está ahí —hundir, levantar, abrir, mover— es
suave por obligación. La agitación no pertenece a esa familia: no acompaña un
gesto, **celebra un resultado**, y ocurre una vez y se acaba. No es una
excepción que debilite la regla: **el acento funciona porque todo lo demás es
suave** — sobre un fondo igual de seco desaparecería en el ruido.

Dos fronteras que lo mantienen así: se aplica al **icono**, nunca a la
superficie que lo contiene (un chip entero temblando sacude el texto y se lee
como fallo de maquetación), y al **encender**, nunca al apagar (apagar un filtro
no celebra nada).

### Detalles de implementación que el consumidor debe conocer

- **Solo `rotate` y `translate`**, que son propiedades *independientes* de
  `transform`. No es cosmética: el acuse de presión global anima `scale` y el
  hover de una tarjeta anima `translate`; usando la propiedad independiente que
  toca, las tres se componen solas. Con `transform: rotate(...)` se pisarían.
- **`prefers-reduced-motion` la retira ENTERA.** Es la excepción consciente a
  la regla del proyecto de «equivalente no vestibular, no ausencia»: una
  oscilación de alta frecuencia y baja amplitud es movimiento vestibular puro y
  no hay versión de eso que no maree. El equivalente ya está en pantalla — el
  color, el relleno y el texto del estado seleccionado.
- **Obligación del consumidor:** `Agitar` **no puede ser el único portador** de
  la selección. Ni lo anuncia un lector de pantalla, ni existe con movimiento
  reducido, ni lo ve quien llegó con el filtro ya puesto. El estado se declara
  con `aria-pressed` (o `aria-current`) y se ve con color **+ texto**, siempre.
- Es `'use client'`, y solo por una razón: necesita recordar el valor anterior
  de `activo` para **no agitarse en el primer render**. Con CSS puro no hay
  forma de distinguir «montó encendido» de «se acaba de encender», y un temblor
  en cada carga de página es ruido. Usa el patrón de React de *ajustar estado
  durante el render* (`useState` + comparación, sin `useEffect`), así que no
  hay cascada de renders ni el linter tiene nada que decir.
- `children` viaja como **ranura**, así que un Server Component puede usarlo sin
  arrastrar su contenido al cliente. Aun así es **una raíz de hidratación por
  instancia**: va bien en una barra de filtros (media docena), **no** en cada
  fila de un catálogo de cien tarjetas.
- La duración es un **token** (`--dur-agitar`, `tokens.css` §8). Las amplitudes
  son propiedades locales del módulo (`--agitar-giro`, `--agitar-desvio`), por
  el mismo criterio que `--placa-pad`: son la geometría de esta pieza y el
  sistema no tiene —ni necesita— una escala de ángulos.

---

## Reglas duras: comprobación

| Regla | Estado |
|---|---|
| `:focus-visible` en todo interactivo | Sin cambios. No se tocó ninguna regla de foco; `Agitar` es un `<span>` envoltorio sin foco propio, el foco sigue en el control que lo contiene. |
| Campos de entrada conservan borde en reposo | Sin cambios. `input.module.css` no se tocó. |
| Targets ≥44px | Sin cambios. Ningún diámetro de la placa baja de 72px y `Agitar` no altera la caja del control (`display: inline-flex`, sin margen). |
| Contraste AA | Sin cambios de color. El único valor que se movió cerca de un ratio firmado es el tamaño de la inicial de la placa, que **sube** (5,26:1 se conserva y gana legibilidad). |
| `@container contenido`, nunca `@media` | No se añadió ninguna `@media` de ancho. Las tres que se tocaron o escribieron son de **capacidad** —`hover: hover`, `prefers-reduced-motion`— que es justo lo que `@media` debe seguir haciendo. |
| Todo desde `var(--…)` | Las amplitudes de `Agitar` son propiedades personalizadas locales, consumidas con `var()`; la duración es un token del sistema. |
| Oro ≤5 % y sin codificar datos | El oro no se tocó en ningún archivo. |

---

## Frontera: lo que vi y no toqué

No son propuestas para backend —nada de esto cruza a la zona de solo lectura de
`SCOPE.md`—, sino **trabajo de interfaz que pertenece a los otros dos agentes**
de esta tanda y que quedó fuera por la partición del encargo. Va aquí para que
QA no lo descubra como bug mío:

1. **`src/app/miembros/(portal)/loading.tsx:50-51`** dibuja el esqueleto de la
   placa con `height="calc(var(--placa-logo-w) * 2 / 3)"`, que era el alto
   derivado de la proporción 3:2. Con la placa circular ese esqueleto queda
   **apaisado donde el contenido real es un círculo de 72px**, así que el
   contenido salta al resolverse — exactamente lo que un esqueleto existe para
   evitar. Corrección: `height="var(--placa-logo-w)"` y `radius="var(--radius-full)"`
   (o `variant="circle"` de `Skeleton`, que ya existe y hace justo eso).
2. **Tres comentarios citan «440ms» como el valor de `--dur-rebote`** y ahora
   son falsos: `comercios/[id]/ficha.module.css:443`,
   `portal.module.css:395` y `_components/chips-categoria.module.css:58`. El
   **comportamiento sigue siendo correcto** —los tres consumen el token, no el
   literal—; lo que caducó es la prosa. Es `320ms` en los tres sitios.
3. **`_components/carrusel-destacados.module.css:271` y `:278` piden
   `var(--shadow-3)` en crudo**, componiéndolo además con `--shadow-raised`.
   `CLAUDE.md` lo prohíbe expresamente: los crudos no se remapean por tema, así
   que en oscuro esa tarjeta recibe una sombra clara que no se ve, y ahora
   además una notablemente más fuerte en claro. Debería ser
   `--shadow-flotante`.
4. **`_components/comercio-card.tsx:260`** invoca `ComercioLogo` sin `variante`
   dentro de lo que parece una fila compacta; conviene mirar cómo le sienta el
   círculo de 72px ahí, que antes era un rectángulo de 72x48 y ocupaba 24px
   menos de alto.

Ninguno de los cuatro se tocó.

---

## Verificación

Ejecutada a las 12:18–12:21 del 14/09/2026, con **dos agentes escribiendo en el
repositorio en paralelo** (`src/app/admin/**`, `src/app/miembros/**`,
`src/lib/imagenes/**`, `supabase/migrations/**`).

| Comando | Resultado |
|---|---|
| `tsc --noEmit` | **1 error**, y no es de esta tarea: `src/app/admin/comercios/imagenes-actions.ts:105` |
| `eslint .` | **limpio**, salida vacía, exit 0 |
| `vitest run --reporter=dot` | **249 pruebas en 20 archivos, todas pasan**, exit 0 |
| `next build` | **compila** («✓ Compiled successfully in 12.1s» — incluidos los dos módulos CSS nuevos) y después **falla en el type check por ese mismo error** |

### El error no es de W1, y esto es la comprobación

`src/app/admin/comercios/imagenes-actions.ts` es un archivo **nuevo y sin
seguimiento** creado por otro agente durante esta misma sesión, y es una
**Server Action**: `SCOPE.md` §2 y §5 lo ponen en zona de **solo lectura**, así
que no se toca ni para arreglarlo. El fallo es de tipos de Supabase —
`.update({ [campo]: resultado.url })` con clave computada, que TypeScript
ensancha a `{ [x: string]: string }` y el tipo generado rechaza con
`RejectExcessProperties`.

Se comprobó que es el único y que no arrastra nada de W1: al sacar ese archivo
del árbol, `tsc` deja de emitirlo y solo queda el import huérfano de
`gestor-imagenes.tsx` —otro archivo del mismo agente—; **ningún archivo de esta
tarea aparece en ninguna de las dos pasadas**. Y el diff de W1 son cuatro CSS,
un `.tsx` de `ui/`, `tokens.css`, `CLAUDE.md` y este registro: nada de eso puede
influir en el tipado de una consulta a Supabase.

**Queda abierto y no es de este alcance.** La corrección natural es tipar la
clave (`campo` como `'logo_url' | 'portada_url'`) en vez de dejarla como
`string`, pero la aplica quien tenga esa zona asignada.
