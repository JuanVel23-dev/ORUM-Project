# Dirección de arte v2 — papel, tinta y oro · 13/09/2026

> **Encargo del propietario.** Sustituye a la dirección anterior en lo que esta
> sección diga, y solo en eso. Lo que no se nombre aquí sigue vigente.
>
> Existe por la misma razón que `CLAUDE.md`: la última vez que dos sesiones
> interpretaron por su cuenta «el estilo», salieron dos sistemas incompatibles
> sobre los mismos archivos. Aquí la dirección se fija **a nivel de token**, no
> de adjetivo.

---

## 1. La frase

**Papel blanco, trazo de tinta, sombra real y un filo de oro.**

No es minimalismo suave: es una página impresa. El blanco no es un fondo, es el
material. La separación entre superficies **no la da un gris más claro**, la da
un trazo negro y una sombra que se ve. El oro no decora: marca.

## 2. Lo que cambia, y el token exacto

### 2.1 El blanco deja de tener escalones

Hoy la jerarquía en claro se construye con tres grises (`--bg` gris muy claro,
`--surface` blanco, `--surface-sunk` gris). Eso es lo contrario del encargo.

| Token | Antes | Ahora | Por qué |
|---|---|---|---|
| `--bg` | `--w-50` | `--w-0` | El suelo es papel, no gris |
| `--surface` | `--w-0` | `--w-0` | Sin cambio: ya era blanco |
| `--surface-sunk` | `--w-100` | `--w-0` con trazo | Un hundido se dibuja, no se tiñe |
| `--surface-hover` | `--w-100` | tinta al 6 % | **Única excepción**: el hover necesita un cambio de relleno perceptible sin mover nada. **Corregido tras M1**: la primera versión decía `--w-50`, que sobre papel da un 1,5 % de diferencia de luminosidad —menos visible que el `--w-100` que sustituía—. Tinta al 6 % da ~6 %, y pertenece a la familia de los tres trazos |

Consecuencia directa y buscada: **si una tarjeta no tiene borde, desaparece.**
Eso obliga a que toda superficie se declare, que es justo el punto.

### 2.2 El trazo es tinta

| Token | Antes | Ahora | Uso |
|---|---|---|---|
| `--border-strong` | `--w-400` | `--n-1000` | El trazo que define una superficie. Tarjetas, campos, botones con contorno |
| `--border` | `--w-300` | `--n-1000` al 55 % | Separadores dentro de una superficie ya definida |
| `--border-subtle` | `--w-200` | `--n-1000` al 22 % | Filas de lista, divisiones internas |

Los tres son el **mismo** color a distinta presencia. Un borde gris y otro negro
en la misma pantalla se leen como dos sistemas.

**Grosor:** 1px por defecto. **2px solo** en la superficie principal de la
pantalla (el carnet, la tarjeta de veredicto) y en el estado `:focus-visible`.
Tres grosores distintos convierten el trazo en ruido.

### 2.3 La sombra se ve

La escala actual (`--shadow-1..4`) es sombra difusa de interfaz translúcida:
mucho desenfoque, poca opacidad, sin desplazamiento. Sobre papel con trazo de
tinta no se ve nada.

La escala nueva desplaza, desenfoca poco y **no es negra pura**: lleva el mismo
susurro frío de los neutrales, o el conjunto envejece.

```
--shadow-1: 0 2px 0 rgba(20, 20, 28, 0.10)
--shadow-2: 0 3px 0 rgba(20, 20, 28, 0.14), 0 6px 16px rgba(20, 20, 28, 0.08)
--shadow-3: 0 6px 0 rgba(20, 20, 28, 0.16), 0 12px 28px rgba(20, 20, 28, 0.10)
--shadow-4: 0 10px 0 rgba(20, 20, 28, 0.18), 0 24px 56px rgba(20, 20, 28, 0.14)
```

**La prohibición de `none` en listas de sombras sigue viva y ahora importa más**,
porque estas listas tienen dos entradas. Un `none` dentro invalida la
declaración ENTERA en silencio y la pantalla se queda sin una sola sombra.
`--edge` sigue valiendo `0 0 rgba(0,0,0,0)`.

### 2.4 El oro, igual de escaso

**Nada de esto habilita más oro.** El presupuesto sigue siendo **≤5 % del área
visible** y el oro **sigue sin codificar datos**. Lo que cambia es que sobre
papel blanco con trazo negro el oro **resalta más con menos cantidad**: donde
antes hacía falta un filo de 2px, ahora basta 1px.

Dónde vive, sin añadidos: wordmark · indicador de ruta activa · anillo de foco ·
hairlines · y la acción principal del recorrido del cliente, con los ratios ya
firmados (`--gold-600` en claro, texto `--n-1000`, 5,40:1 y 3,66:1).

⛔ **Sigue prohibido `--gold-500` sobre blanco** (2,49:1). Que el fondo sea ahora
más blanco lo empeora, no lo mejora.

---

## 3. El tema oscuro NO se retira

El encargo dice «priorizar el tema claro». Priorizar no es eliminar: el menú de
tema existe, hay usuarios con la preferencia puesta, y `prefers-color-scheme`
sigue mandando en quien no ha elegido.

La regla operativa: **el claro es donde se diseña y se juzga.** El oscuro tiene
que seguir siendo correcto y accesible, pero deja de ser el tema de referencia.
En oscuro el trazo de tinta no funciona —negro sobre negro— así que allí el
borde sigue siendo el filo claro de hoy y la elevación sigue siendo `--edge`.

**Cada cambio se audita en SU tema.** Los criterios de contraste se comprueban
por tema, nunca una vez para los dos.

---

## 4. Movimiento: «mucha animación», con tres reglas que no se tocan

El encargo pide movimiento abundante. Se concede, y se acota — porque animación
abundante mal hecha es exactamente lo que hace que una interfaz se sienta barata
y lenta, que es el resultado contrario al buscado.

### 4.1 Lo que sigue siendo intocable

1. **Solo `transform` y `opacity`.** Animar `width`, `height`, `top`, `left` o
   `margin` recalcula el layout en cada fotograma. Esta sesión ya encontró dos
   sitios donde ocurría.
2. **`prefers-reduced-motion` no es «sin feedback»**, es un equivalente no
   vestibular: el cambio ocurre igual, por opacidad o color, sin desplazamiento.
   Lo que debe seguir animando —spinner, esqueleto, progreso— lleva
   `data-motion-esencial`.
3. **Entrada y salida por el mismo camino.**

### 4.2 Lo que se amplía

| Antes | Ahora |
|---|---|
| El rebote se gana, solo tras gesto con momento | **`bounce: 0.2` permitido** en entradas de overlay, confirmaciones y aparición de tarjetas. Sigue prohibido en navegación y en cambios de estado de datos |
| Animación puntual | **Entrada escalonada** de listas y rejillas: 30–40 ms entre elementos, tope de 8 —a partir de ahí el último llega tarde y se percibe como lentitud, no como elegancia |
| Sin transiciones de ruta | **View Transitions**: ya están habilitadas (`experimental.viewTransition`) y con **cero** `view-transition-name` en todo `src/`. Es la deuda nº1 y la que más cambia la percepción |

### 4.3 Lo que el trazo y la sombra permiten, y antes no

La sombra desplazada da un vocabulario de movimiento que la sombra difusa no
tenía: **presionar hunde**. Un botón que al pulsarse baja 2px y pierde su sombra
comunica físicamente lo que un cambio de color solo comunica por convención.

- **Pulsación**: `translateY(2px)` + sombra a la mitad. En `pointerdown`, nunca
  en `click` —**cuando lo resuelve JavaScript**. En CSS puro el equivalente es
  `:active`, que es lo que ya usaba el repositorio y lo que aplican las
  primitivas: no existe un selector de `pointerdown`.
- **Hover en escritorio**: `translateY(-2px)` + sombra al siguiente escalón.
  **Solo bajo `@media (hover: hover)`** — en táctil el hover se queda pegado.
- **Techo**: en móvil de gama media esto se paga. Nada de sombra animada en
  filas de lista largas; ahí el feedback es opacidad.

---

## 5. Lo que NO cambia

- `QrCode` negro sobre blanco en los dos temas. El fallo ocurre en la caja
  delante del cliente.
- El primario de **Administración** y de la **Herramienta de Comercios** sigue
  siendo tinta. Sobre papel blanco eso ahora es aún más natural.
- Contraste AA en todo texto · `:focus-visible` en todo interactivo · objetivos
  ≥44px · un `<h1>` por pantalla · el color nunca como único portador.
- `@container contenido`, nunca `@media`, para adaptación de ancho.
- Todo color, espaciado, radio y duración desde `var(--…)`.

---

## 6. Riesgo a vigilar

El trazo negro sobre blanco tiene un modo de fallo propio: **la pantalla se
convierte en una cuadrícula de cajas**. Si todo lleva borde, el borde deja de
significar «esto es una superficie».

La disciplina: **una cosa a la vez lleva el trazo de 2px**, lo demás lleva 1px o
nada. Si al mirar una captura no sabes cuál es el elemento principal, sobran
bordes — y la respuesta es quitar, no añadir oro.
