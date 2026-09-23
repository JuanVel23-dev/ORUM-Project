# Dirección de arte v4 — el oro sobre crema · 14/09/2026

> **Encargo del propietario**, con cinco referencias que pidió inspeccionar.
> Sustituye a [`DIRECCION-ARTE-v3.md`](./DIRECCION-ARTE-v3.md) en lo que esta
> diga. Lo que no se nombre aquí sigue vigente.
>
> Las cinco se inspeccionaron en el navegador, leyendo sus estilos computados —
> no de oído.

---

## 0. Antes de nada: qué se toma y qué no

Lindt y Ferrero Rocher son marcas registradas con imagen comercial protegida.
**Se toma el LENGUAJE** —fondo cálido, oro, serif de display, aire, ritmo— que es
vocabulario de toda la categoría del lujo accesible y que nadie posee. **No se
toman** su logotipo, su tipografía propietaria (`Ferrero StrettoFondente`), su
rojo de marca ni composiciones reconocibles suyas. ORUM tiene que parecer ORUM,
no una página de chocolates.

---

## 1. El hallazgo que obliga a cambiar una decisión escrita

`CLAUDE.md` dice, desde el rediseño de agosto:

> «Los neutrales llevan un susurro de **frío** (matiz ~240°). Sobre grises
> cálidos el oro se lee beige y el conjunto envejece; sobre neutros fríos se lee
> metal.»

**Cuatro de las cinco referencias hacen exactamente lo contrario.** Medido:

| Sitio | Fondo | Tinta | Temperatura |
|---|---|---|---|
| **Ferrero Rocher** | `#FAF8F2` crema · oscuro `#2B1A15` | `#5C3327` chocolate | **Cálida** |
| **Podia** | `#FDFDFC` · oscuro `#1B1A18` | — | **Cálida** |
| **WildApricot** | `#FFF0E2` crema | `#411A50` | **Cálida** |
| **Agence Cartier** | `#BFBDA8` greige | `#010202` | **Cálida** |
| **Lindt** | blanco | `#555555` gris | Neutra |

Y ninguna envejece. La premisa de la que salió la regla fría era correcta para un
oro **metálico con barrido**; con un oro **plano** sobre crema, lo que pasa no es
que se lea beige: es que el conjunto se lee **apetecible**, que es justo lo que un
club de beneficios necesita.

**Decisión: los neutrales de ORUM pasan de fríos a CÁLIDOS**, y el
`--gold-sheen` —el barrido metálico, que sí exige frío— queda restringido al
wordmark, donde ya estaba.

| Token | v3 (frío, ~240°) | v4 (cálido) |
|---|---|---|
| `--bg` / `--surface` | `#ffffff` | `#FDFCFA` — papel, no pantalla |
| superficie alterna | — | `#FAF8F2` — crema, para separar secciones sin trazo |
| tinta | `#141418` (azulado) | `#1B1A18` — negro **cálido**, el de Podia |
| texto secundario | `#5b5b66` | marrón grisáceo, familia del `#5C3327` de Ferrero |
| sombras | rgb 20/20/28 (frío) | rgb 28/22/18 (cálido) |

⚠️ **Cada par se vuelve a auditar.** Cambiar la temperatura cambia la luminancia,
y los ratios firmados en `T5-validacion-contraste.md` dejan de valer tal cual.
Ningún valor entra sin recalcular su contraste.

---

## 2. El oro, corregido con lo que hacen ellos

### El titular dorado de Ferrero NO pasa accesibilidad. Medido.

`#D5AC5B` sobre su crema da **1,99:1**. No llega ni al 3:1 que WCAG pide para
texto grande — le falta un tercio. Es precioso y es inaccesible, y copiarlo tal
cual habría metido en ORUM un fallo AA en la primera pantalla.

**La salida es mejor que el original:** ese oro claro sobre **chocolate oscuro**
da **7,83:1**. Así que el titular dorado grande no vive sobre crema, vive sobre
una franja de cacao — que además es más impactante, porque el oro sobre oscuro
es el que se lee metal y no mostaza.

### Los cuatro oros, con su ratio medido

| Papel | Valor | Ratio | Para qué |
|---|---|---|---|
| **Display sobre oscuro** | `#D5AC5B` | **7,83:1** sobre `#2B1A15` | Titulares grandes en las franjas de cacao. **Nunca sobre claro** |
| **Relleno de acción** | `#A8812B` | **4,84:1** con texto tinta · **3,51:1** de filo | El botón primario del recorrido del cliente |
| **Texto e iconos en oro** | `#8A6D2F` | **4,75:1** sobre papel · **4,55:1** sobre crema | Etiquetas, iconos, texto dorado pequeño |
| **Filo / hairline** | `#A8812B` | **3,51:1** | El marco de 1px que aparece al señalar |

El oro de Lindt (`#917236`) se descartó por los pelos: **4,39:1** sobre papel, que
reprueba 4.5 por 0,11. `#8A6D2F` es el mismo color un punto más oscuro y sí pasa.

**El filo dorado de 1px** (`box-shadow: 0 0 0 1px #D5AC5B` en Ferrero, y su marco
fino alrededor del héroe) es el device más rentable de las cinco: cuesta nada,
se lee caro, y encaja exacto con la regla v3 de «el oro aparece cuando tocas
algo».

**El presupuesto del ≤5% no sube.** Un titular dorado es mucha área: si el héroe
lleva oro, la acción de esa pantalla va en tinta.

---

## 3. Tipografía: es lo que más va a cambiar la percepción

Las dos referencias de chocolate usan **serif de display**: Ferrero `Cormorant
Infant`, Lindt `Optima`. ORUM usa Inter para todo.

**Un serif de display para titulares hace más por el «se ve caro» que cualquier
animación.** Es el cambio de mayor rendimiento por esfuerzo de esta lista.

- **Display** → serif elegante, de contraste alto, solo en `h1` y cifras grandes.
  Del catálogo de Google Fonts para no añadir licencias: *Cormorant Garamond*,
  *Playfair Display* o *Fraunces*.
- **Interfaz y cuerpo** → se queda Inter. Un serif en un botón de 13px se lee
  amateur, y en la Herramienta de Comercios sería directamente un estorbo.
- **Tracking específico del tamaño**, que ya está en la norma y ahora importa más:
  el display serif quiere tracking **negativo** al crecer; Ferrero además abre el
  tracking en sus versalitas pequeñas.

⚠️ **Coste real:** una fuente más son bytes en la primera carga, en un teléfono de
gama media. Se carga **solo el peso que se use**, `display: swap`, y **jamás** en
la Herramienta de Comercios, que es una pantalla de trabajo.

---

## 4. Forma y profundidad

| Qué | Referencia | Para ORUM |
|---|---|---|
| **Radios** | WildApricot 16/24/30/39px | Los nuestros son pequeños. Subir el radio de tarjeta: lo redondo se lee amable, y encaja con los logos circulares |
| **Sombra ancha y suave** | Ferrero `0 10px 40px rgba(0,0,0,.1)` | Más extensión, poca opacidad. Es la dirección que la v3 ya tomó — se confirma |
| **Sin sombra, jerarquía por campos de color** | Agence Cartier (cero sombras) | Para secciones enteras: alternar papel / crema separa sin dibujar una sola línea |
| **Marco de filo dorado** | Ferrero | Para el carnet y el héroe |

---

## 5. Movimiento — con el marco de Emil Kowalski

La skill `emil-design-eng` da el criterio que faltaba: **la frecuencia decide si
algo anima**.

| Frecuencia | Decisión | En ORUM |
|---|---|---|
| Cientos de veces al día | **No animar nunca** | Abrir el carnet desde la barra inferior |
| Decenas | Reducir al mínimo | Hover de tarjeta, chips de filtro |
| Ocasional | Animación estándar | Overlay de ficha, toast, hoja |
| Rara / primera vez | Se puede deleitar | Alta de socio, marcar el primer favorito |

**Duraciones** (y las nuestras están largas):

| Elemento | Emil | Referencias medidas |
|---|---|---|
| Pulsación | 100–160 ms | Podia: **120 ms** |
| Desplegable, chip | 150–250 ms | Lindt: 200 ms |
| Overlay, hoja | 200–500 ms | Cartier: 450–550 ms |

**Curvas: las de CSS son flojas.** Se usan variantes fuertes, que es lo que hacen
las referencias:

```
--ease-out:     cubic-bezier(0.23, 1, 0.32, 1)      /* entradas */
--ease-in-out:  cubic-bezier(0.77, 0, 0.175, 1)     /* movimiento en pantalla */
--ease-hero:    cubic-bezier(0.645, 0.045, 0.355, 1) /* medido en Cartier */
```

**Nunca `ease-in` en interfaz.** Empieza lento justo en el instante que el usuario
más mira, y hace que 300 ms se sientan como 500.

Reglas de Emil que corrigen cosas que tenemos:

1. **Nada entra desde `scale(0)`.** En el mundo real nada aparece de la nada.
   Desde `scale(0.95)` + `opacity: 0`.
2. **`transition: all` es un bug de rendimiento.** Se enumeran las propiedades.
   Las cinco referencias lo usan y las cinco se equivocan: en Lindt hay **1097**
   elementos con `transition: all`.
3. **La salida más rápida que la entrada.** Lento donde el usuario decide, rápido
   donde el sistema responde.
4. **Escalonado de 30–80 ms**, no más: si tarda, se lee como lentitud.
5. **Desenfoque para tapar un cruce imperfecto**, por debajo de 20px — caro en
   Safari.
6. **Transiciones, no `@keyframes`, en lo que se dispara rápido**: una transición
   se reencamina a media animación, un keyframe reinicia desde cero.

---

## 6. Lo que NO cambia, otra vez

- `QrCode` negro sobre blanco en los dos temas.
- En **Administración** y en la **Herramienta de Comercios**: primario en tinta,
  sin serif de display, sin adornos. Son herramientas de trabajo.
- Contraste AA · `:focus-visible` en todo interactivo · ≥44px · un `<h1>` por
  pantalla · el color nunca como único portador.
- `@container contenido`, nunca `@media`.
- Todo desde `var(--…)`.
- `prefers-reduced-motion` con equivalente no vestibular.

---

## 7. El riesgo de esta dirección

La v2 fallaba por cuadrícula de cajas; la v3, por objetos levitando. Esta falla
por **parecer una tienda de chocolates en vez de un club de beneficios**.

La diferencia está en el trabajo que hace cada pantalla. Ferrero vende un antojo
y puede permitirse una pantalla entera de titular dorado. El socio de ORUM abre
el catálogo **para resolver algo**: saber dónde le hacen descuento hoy. El lujo va
en el **cromo y en el carnet**; la lista de comercios sigue siendo una lista
rápida de leer.

**Si una pantalla tarda más en decir su dato por culpa del oro, el oro sobra.**
