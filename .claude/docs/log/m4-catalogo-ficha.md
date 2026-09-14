# Log · m4-catalogo-ficha

> Una entrada por tarea terminada. Formato: `## <tarea>` + qué se hizo, qué quedó fuera y por qué.


---

## A · Papel, tinta y sombra (13/09/2026)

### Lo que quedó invisible, y cómo se resolvió

`grep -rn "surface-sunk\|--w-100\|--w-200\|--w-300\|--w-400"` sobre el alcance
devuelve **exactamente los dos sitios ya localizados**, los dos en el carrusel.
Ni la rejilla, ni la ficha, ni el cromo usaban la rampa `--w-*` directamente: la
pedían siempre por token semántico, que es lo que ha hecho que la fundación
llegue sola a casi todo.

| Sitio | Qué pasaba en claro | Resolución |
|---|---|---|
| `carrusel-destacados.module.css` `.cubierta` | `--surface-sunk` = `--w-0`: la cubierta 4:3 es el mismo papel que la tarjeta y que el fondo | Se **conserva** el token —en oscuro sigue siendo `--n-950` y ahí sí hunde— y se le da su trazo: la línea superior de `.pie` sube de `--border-subtle` a `--border` |
| `carrusel-destacados.module.css` `.capa` | Igual, y es la capa que de verdad se ve (cubre la cubierta entera) | Igual. El relleno opaco sigue haciendo falta: tapa la cubierta mientras el paralaje la desplaza |
| `portal.module.css` `.cabecera` | `--material` es blanco al 68 % sobre papel blanco: el cromo dejó de distinguirse por relleno | `border-bottom` de `--border-subtle` a `--border` |
| `portal.module.css` `.tabbar` | Igual, y debajo pasa la última fila del catálogo | `border-top` de `--border-subtle` a `--border` |
| `ficha.module.css` `.barraVuelta` | `--surface` sólido sobre `--bg`, que ahora es el mismo blanco | `border-bottom` de `--border-subtle` a `--border` |

**Por qué NO se le pone borde propio a la cubierta.** Sería una caja dentro de
una caja —la `Card` ya la enmarca por tres lados— y ese es literalmente el modo
de fallo de §6. Lo que le da vida en claro es el halo de oro difuso de `.capa`
(Regla B) más la placa del logotipo, que trae su propio filo (`--placa-logo-borde`,
que no sigue el tema a propósito).

**Lo que NO se tocó, y por qué es correcto ya:**

- `comercio-card` `.promociones` / `.sinBeneficio` y `ficha` `.beneficio + .beneficio`
  siguen en `--border-subtle`: son divisiones internas de una superficie ya
  definida, que es exactamente el uso que §2.2 le asigna.
- `.chip` se queda en `--border` (55 %). No sube a `--border-strong` aunque §2.2
  cite «botones con contorno»: son de cuatro a ocho píldoras en fila, y con
  tinta plena la fila se convierte en la cuadrícula de §6. La jerarquía la da el
  chip ACTIVO, que sí va a relleno de tinta plena.
- `.masFiltros` se queda en `--border-subtle`: es un divisor sobre el papel, no
  el filo de una superficie.

### La decisión del trazo de 2px

**Catálogo: NINGÚN elemento lleva 2px.** No es una omisión, es la respuesta.

La pantalla tiene 12 tarjetas de rejilla iguales, hasta 6 portadas iguales y dos
carriles de tarjetas iguales. Marcar una sería decir «este comercio es el
importante», es decir **codificar un dato con el trazo**, que es la misma
prohibición que rige para el oro. Marcarlas todas convierte la pantalla en una
cuadrícula y el grosor deja de significar nada. La jerarquía del catálogo ya está
resuelta por **tamaño** —la portada es 4:3 a 300-340px frente a tarjetas de
290px— y por **relleno** —el chip activo en tinta plena—, que son dos ejes que no
compiten con el trazo.

**Ficha: uno solo, la tarjeta de «Tus beneficios»** (`<Card principal>`). Es la
respuesta a la única pregunta por la que se entra a esta pantalla. Las tarjetas
de sede se quedan en 1px porque son una lista de iguales, y la rama VACÍA de
beneficios tampoco lo lleva: es `Card variant="sunk"`, o sea la ausencia de la
respuesta, y ascender un estado vacío a protagonista sería exactamente lo
contrario de lo que el trazo dice. Con los datos de prueba (0 promociones
vigentes) la ficha no tiene ningún 2px — y es lo correcto.

### Fuera / no hecho

- No se ha remedido el presupuesto de oro del botón «Mostrar mi carnet»
  (`variant="brand"`, 6,03 % a 375px según T4). Ni se amplía ni se reduce en
  esta tarea, y `CLAUDE.md` pide medirlo sobre captura real, que esta máquina no
  puede producir.

---

## B · Movimiento — 13/09/2026

> Entrada escrita por el orquestador: el agente completó el bloque y cayó al
> tope de sesión mientras lo registraba. Verificado leyendo el código.

### Hecho

- **Entrada escalonada** en rejilla y carriles, con el paso de 35 ms y tope,
  como pedía la dirección v2.
- **El `:hover` de todo el portal queda encerrado en `@media (hover: hover)`.**
  Se comprobó archivo por archivo: las siete apariciones restantes de `:hover`
  en el módulo están dentro de comentarios o ya anidadas. En táctil el hover no
  se va al levantar el dedo, y el realce se quedaba pegado.
- **El realce del carrusel se desdobló**: `:hover` bajo `@media (hover: hover)`,
  `:focus-visible` a todos los anchos. Antes compartían regla, así que la sombra
  apilada, el filo dorado y la elevación se ejecutaban también en táctil.
- **Se retiró el último literal de escala del portal.** `.tab:active` llevaba
  `0.94` a mano —uno de los supervivientes de los trece valores sueltos que
  `globals.css` §4b se escribió para retirar— y pasa a `--escala-press-sm`.
- **Y el tiempo, que era la otra mitad del problema.** `.tab` declara su propia
  lista de transiciones, que pisa la global donde `scale` va a `--dur-rebote`
  (440 ms elásticos). Sin acortar la ida, **la pestaña tardaba casi medio
  segundo en acusar el toque**: es el control que más se pulsa del portal y el
  que peor se sentía.
- Ninguna animación toca `width`, `height`, `top`, `left` ni `margin`. Los
  `scale: 1` y `translate: 0 0` que quedan son reposiciones, no valores de
  diseño.

## C · Lo que NO se tocó, y por qué

- **El umbral de estantería sigue en ≥8.** Con 4 comercios y 0 promociones
  vigentes no se renderiza ninguna y todas las tarjetas caen al estado vacío.
  Bajarlo para que «se vea mejor» sería falsear el diseño con los datos de hoy.
- **El presupuesto de oro del botón «Mostrar mi carnet» no se ha remedido**
  (`variant="brand"`, 6,03 % a 375px según T4). Ni se amplía ni se reduce aquí.
  `CLAUDE.md` exige medirlo sobre captura real, y esta máquina no la produce.
