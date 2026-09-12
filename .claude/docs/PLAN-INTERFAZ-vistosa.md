# Plan: interfaz «atractiva y vistosa» + cierre de lo que falta

> Escrito el 12/09/2026 · rama `mejora-diseno` · commit base `acf7cc0`
>
> Encargo del propietario: *«no lo quiere simple, quiere que se vea muy bien la interfaz
> además de ser atractiva y vistosa. Y más Miembros, que es lo que utilizarán los
> clientes»*, con investigación de **Rappi, DiDi y similares** para tomar elementos.
>
> Complementa —no sustituye— a `PLAN-CONTINUACION-miembros.md`, que sigue siendo la
> auditoría vigente de T8–T28. Este documento añade la capa visual y reordena la
> secuencia para que la capa visual no llegue tarde.
>
> **No se ha modificado código de producto al escribirlo.**

---

## Resumen en una página

1. **El 80 % de lo que hace «vistosa» a Rappi es fotografía, y ORUM no tiene ninguna.**
   El esquema guarda **una sola imagen por comercio** (`comercios.logo_url`) y una por marca.
   No hay foto de portada, ni de producto, ni imagen de promoción, ni icono de categoría:
   `categorias` tiene exactamente dos columnas, `id` y `nombre`. Verificado sobre
   `database.types.ts`.
2. **Por eso el encargo se parte en dos pistas.** La **Pista A** es todo lo que se puede
   hacer sin una imagen nueva: profundidad, escala, movimiento, densidad y ceremonia.
   Llega lejos —más de lo que parece— pero **no llega a Rappi**. La **Pista B** es la que
   sí llega, y empieza por una columna en la base de datos, no por CSS.
3. **«Vistosa» choca de frente con la dirección de arte firmada hace trece días.**
   `T4-direccion-arte.md §10` define «lujoso» como *«el lujo lo llevan el aire, el material
   y el filo, no la cantidad de oro»* y prohíbe explícitamente «degradados arbitrarios» y
   «sombras difusas de librería». La Regla A permite **una sola pieza de oro sólido por
   pantalla**. Rappi es lo contrario: saturación, banda promocional, color de marca a
   sangre. **Esto es una decisión del propietario, no un detalle de implementación**, y
   está en §6 como puerta V0.
4. **Lo que NO hay que hacer, y es el riesgo real de este encargo**: añadir degradados y
   bandas a un catálogo con **4 comercios y 0 promociones vigentes**. El resultado de
   decorar el vacío no es «vistoso», es una carcasa llamativa sin nada dentro — y se lee
   peor que la sobriedad actual. La densidad visual necesita contenido que hoy no existe.

---

## 1. La investigación: qué hacen Rappi, DiDi y los demás

Fuentes al final. Doce patrones, y para cada uno qué hace ORUM hoy.

### 1.1 Los patrones, uno por uno

| # | Patrón | Qué es, en concreto | ORUM hoy |
|---|---|---|---|
| **P1** | **Estantería horizontal** (*shelf*, carrusel) | Fila que se desliza con `scroll-snap`, tarjeta comprimida, sangra hasta el borde para insinuar que sigue | ✅ **YA EXISTE**: `Carril` + `CarrilPista` + `estanterias.ts`, dos estanterías en el catálogo |
| **P2** | **Chips de categoría** | Fila horizontal de filtros, uno activo, sin desplegables | ✅ **YA EXISTE**: `chips-categoria.tsx` |
| **P3** | **Insignia de descuento** | La cifra grande y sola: «-40 %», «2x1». Es el elemento de más peso visual de toda la tarjeta | 🟡 **PARCIAL**: `Badge tone="gold" size="sm"` con `formatearBeneficio`. Es **pequeño y discreto**; en Rappi es lo que grita |
| **P4** | **Banda promocional** (*hero banner*) | Carrusel de imágenes a sangre arriba del todo, con paginación por puntos | ❌ **NO EXISTE, y no puede existir**: no hay ninguna imagen que poner |
| **P5** | **Portada del comercio** (*store cover*) | Foto 16:9 del local o del producto, que es el 70 % de la tarjeta | ❌ **NO EXISTE**: no hay columna |
| **P6** | **Cabecera que colapsa** (*collapsing / stretchy header*) | La portada se encoge al desplazar y deja un título compacto pegado arriba | ❌ No aplica sin P5 |
| **P7** | **CTA pegajoso inferior** | La acción principal fija abajo: no hay que desplazarse para actuar | 🟡 En la ficha el botón está **en el flujo**, no fijo |
| **P8** | **Fila de datos duros** | Tiempo de entrega · calificación · distancia, con iconos, bajo el nombre | 🟡 ORUM tiene categoría y ciudades. **No tiene ni calificación ni distancia** —ni las tablas para ellas— |
| **P9** | **Esqueletos con la silueta real** | El cargando dibuja la forma exacta de lo que viene | ✅ **YA EXISTE** y está bien hecho (`(portal)/loading.tsx`) |
| **P10** | **Micro-interacciones** | El carrito rebota, la confirmación celebra. Feedback en `pointerdown` | 🟡 Parcial: `:active` con `--escala-press`. **Cero celebración** |
| **P11** | **Navegación inferior persistente** | Pestañas siempre visibles con icono + texto | ✅ **YA EXISTE**: `PortalTabBar` |
| **P12** | **Color de marca a sangre** | DoorDash rojo, Swiggy naranja, Rappi fucsia. Bloques de color saturado como estructura | ❌ **PROHIBIDO** por `T4 §3.2` Regla C: el oro nunca es fondo de una superficie de contenido |

### 1.2 La lectura honesta de esa tabla

**ORUM ya tiene la estructura de Rappi.** Estanterías, chips, esqueletos, barra inferior:
los cuatro patrones estructurales están construidos y ninguno es el que falta.

**Lo que le falta es lo que Rappi no dibuja: lo fotografía.** La riqueza visual de esas
aplicaciones no sale del CSS, sale de que cada restaurante sube veinte fotos de sus platos.
Quítale las fotos a Rappi y queda una lista de nombres con chips encima — que es
exactamente el catálogo de ORUM hoy.

**Y hay una diferencia de modelo de negocio que no se puede copiar**: Rappi vende
productos con precio, así que tiene cifras, fotos y urgencia por naturaleza. ORUM vende
**pertenencia**. Su objeto emocional no es un plato: es el carnet. Esa es la pieza donde
conviene gastar la munición visual, y es justamente **T16, que está sin tocar**.

---

## 2. Cómo se traduce «vistosa» sin romper el contraste

El riesgo técnico de todo este encargo cabe en una frase: **texto sobre imagen**.

En cuanto entren fotos (Pista B), el contraste deja de ser una propiedad del token y pasa a
depender de **cada imagen que suba cada comercio**, que es contenido que ORUM no controla.
`CLAUDE.md` fija AA con 0 fallos y `T4 P4` dice que el contraste no se negocia.

La técnica establecida es el **velo** (*scrim*): una capa semitransparente entre la imagen y
el texto. Las cinco opciones, con su compromiso:

| Técnica | Qué hace | Compromiso |
|---|---|---|
| **Velo plano** | Capa uniforme sobre toda la imagen | Fiable y aburrido; apaga la foto entera |
| **Velo en degradado** | Opaco donde va el texto, transparente arriba | **La recomendada**: conserva la foto y protege el texto. Exige calibrar la opacidad |
| **Franja sólida** | Bloque opaco solo detrás del texto | Conserva casi toda la imagen; rígido con texto largo |
| **Espacio limpio** | Colocar el texto donde la foto ya es plana | La más bonita y la menos controlable: depende de cada foto |
| **Desenfoque** | Difuminar el fondo bajo el texto | Funciona; `backdrop-filter` está **prohibido en filas de lista** por `CLAUDE.md` |

**Regla que propongo para ORUM, y que es la que hay que añadir a la norma:**

> **Ningún texto se apoya nunca directamente sobre una imagen de terceros.** O va en una
> franja sólida de `--surface`, o sobre un velo en degradado cuyo extremo opaco se mide
> contra **negro y blanco puros** —los dos peores casos posibles de una foto— y cumple
> 4,5:1 en ambos. Si una imagen no permite las dos cosas, el texto sale de la imagen.

Eso convierte un riesgo abierto en un número verificable, que es lo que `accessibility-auditor`
puede firmar. Sin esta regla, la Pista B mete un fallo de accesibilidad por cada foto.

---

## 3. PISTA A — lo que se puede hacer ya, sin una imagen nueva

Ocho tareas. Ninguna depende del backend. Todas son aditivas y **ninguna toca el panel**
(premisa P1).

### V1 · El carnet como el objeto de la aplicación · **la más importante**
- **Agente**: `ux-designer` → `frontend-implementer` · Absorbe **T16**
- ORUM vende pertenencia, y el carnet es la única pantalla donde eso se toca. Hoy
  `perfil/page.tsx` está **sin tocar**: es un bloque de formulario a ancho de página.
- `T4 §7.4` ya lo especifica como objeto con `--radius-xl` y filo metálico. Es el sitio
  legítimo de la pieza de oro sólido de la Regla A, y el único donde la ceremonia no
  compite con nada.
- El QR **sigue negro sobre blanco en los dos temas**. No es estética: invertirlo rompe el
  escaneo en la caja del comercio delante del cliente.

### V2 · La cifra del beneficio, al tamaño que le corresponde (P3)
- Es el cambio con mejor relación impacto/coste de todo el plan.
- Hoy el descuento es un `Badge size="sm"`. En Rappi la cifra es el elemento de más peso de
  la tarjeta. Subirla a un nivel tipográfico de titular dentro de la tarjeta cambia la
  percepción del catálogo entero **sin una sola imagen**.
- Cuidado con la Regla C: la insignia **no puede ser el segundo relleno dorado sólido** de
  la pantalla. Si el carnet ya gastó la pieza sólida, la cifra va en tinta sobre superficie
  con filo dorado, o en oro difuso dentro del presupuesto del 2 %.

### V3 · Profundidad y material, que están construidos y sin estrenar
- `T4 §1.1` y `§1.2` documentan **tokens declarados y jamás consumidos** y capacidades cuyo
  único consumidor es la galería de desarrollo. Hay cuatro niveles de sombra, `--edge-light`,
  `--gold-sheen`, `--gold-halo` y una escala de radios completa.
- Es riqueza visual ya pagada y sin usar: elevación real en las tarjetas, filo de luz en el
  borde superior de las superficies, jerarquía de cuatro planos en vez de dos.
- **Sin degradados nuevos**: `T4 §10` prohíbe los arbitrarios y solo admite `--gold-sheen` y
  `--gold-hairline`.

### V4 · CTA pegajoso en la ficha (P7)
- Hoy «Mostrar mi carnet» va en el flujo. Fijarlo abajo en móvil es la convención de Rappi,
  DiDi y Uber Eats por la misma razón: no hay que desplazarse para actuar.
- Interacción con `CLAUDE.md`: el CTA de ancho completo ya ronda el 6–8 % del viewport, y la
  Regla A da un techo del 7,5 %. **Hay que medirlo sobre captura real**, porque fijo y
  siempre visible ya no es «el primer pantallazo», es todos.

### V5 · Una estantería más, con la curaduría que el esquema permite
- `estanterias.ts` ya sostiene dos. El esquema permite al menos una más sin columnas nuevas:
  «Vence pronto» derivada de `promociones.fecha_fin`, que además introduce **urgencia real**,
  que es el motor de las bandas de Rappi y aquí sale de un dato que ya existe.
- Condicionado a `RUP-5`: los carriles compiten con «menor número de clics» y entran con
  condiciones.

### V6 · Movimiento, que hoy es casi inexistente · absorbe **T26** y **T6**
- **Cero `view-transition-name` en todo `src/`**, con `experimental.viewTransition` activado
  desde hace semanas. La transición de elemento compartido catálogo → ficha es lo que hace
  que una aplicación se sienta caro, y la ficha —construida hoy— por fin da el elemento
  compartido que antes no existía.
- La placa del logo es el candidato obvio: es el mismo objeto en las dos pantallas.
- `bounce: 0` sigue mandando: el rebote se gana tras un gesto con momento.
- Y la celebración que hoy no existe (P10): el carnet al abrirse es el único sitio donde una
  micro-celebración no es ruido.

### V7 · La cabecera del catálogo con más ceremonia
- `T4 §7.2` pide cinco niveles tipográficos en el primer pantallazo. Es el saludo al socio y
  hoy es un `h1` y poco más. Sin imagen: escala, aire y un dato propio del socio.

### V8 · Cerrar los dos defectos visuales vivos
- **D9** (`comercio-logo.tsx:40-43`): Chrome puede pintar el glifo de rotura junto al texto
  alternativo. Es el logo de un aliado roto delante del socio, y está escrito en el código
  como pendiente desde T12.
- **D2** (`theme-script.tsx:29`), con la contradicción de evidencia de `§2.3` por resolver.

### Hasta dónde llega la Pista A

Llega a **elegante, cuidada y con carácter**. No llega a *vistosa* en el sentido de Rappi,
porque eso es densidad de imagen y aquí no hay imágenes. Conviene decirlo antes de
construir, no después.

---

## 4. PISTA B — la que sí llega a Rappi, y empieza en la base de datos

**Nada de esto es una tarea de frontend.** `SCOPE.md §2` pone `supabase/**` en solo lectura:
va a `PROPUESTAS PARA BACKEND` y la lleva una persona.

### B4-bis · Alojar imágenes · **ya estaba propuesto y sigue sin respuesta**
`PROPUESTA-BACKEND-imagenes.md` lleva desde el **29/08** esperando el sí y la prioridad
(**Q1**). Es la dependencia que bloquea la mitad de este encargo:
- Hoy los logos apuntan a servidores de terceros: desaparecen cuando al comercio le da por
  reorganizar su web, y no hay control de peso ni formato.
- `next/image` es **inviable** mientras los dominios sean arbitrarios. Con un bucket, es una
  línea de `next.config.ts`.
- Recomendación de la propuesta: **excluir SVG** en la primera versión, porque un SVG en un
  bucket público del mismo origen es superficie de XSS.

### B9 🆕 · Portada del comercio — **la columna que desbloquea el aspecto Rappi**
```sql
alter table comercios add column portada_url text;
```
Una imagen 16:9 por comercio. Es **el** cambio que convierte el catálogo en lo que el
propietario está pidiendo: habilita P5 (portada), P6 (cabecera que colapsa) y da a la
tarjeta el 70 % de superficie visual que hoy no tiene.
**Con la regla del velo de §2 como condición de entrada, no como mejora posterior.**

### B10 🆕 · Imagen e icono de categoría
```sql
alter table categorias add column icono text, add column imagen_url text;
```
`categorias` tiene hoy **dos columnas**. Los chips son texto porque no hay nada más que
poner. Con icono, la fila de chips pasa a leerse como la de Rappi.

### B11 🆕 · Banda promocional editorial (P4)
Una tabla de piezas destacadas con imagen, vigencia y destino. Es lo que ORUM no puede
improvisar desde el frontend: sin curaduría, una banda héroe es un hueco decorado.
Emparenta con **B5** de `PLAN-rediseno-miembros.md` (destacados e iconografía).

### B1 · Paginación con total · sigue en prioridad alta
Si el catálogo se llena de imágenes, traer 100 filas sin paginar deja de ser gratis.

---

## 5. Cómo se ordena todo, incluido lo que ya faltaba

Se integra con la ruta crítica de `PLAN-CONTINUACION-miembros.md`. Lo ya cerrado desde ese
documento: **C0** (árbol en verde, 10 commits), **T15** (ficha, `2341cc7`), **P1** («Premium»
se queda), **P3** (la PWA es del socio, `acf7cc0`).

```
V0  ██ PUERTA: ¿cuánto se rompe de la dirección de arte? ██   ← §6, decide el resto
P2  ██ PUERTA: aprobación del acceso rediseñado ██
Q1  ██ PUERTA: ¿se lleva la propuesta de imágenes al backend? ██  ← abre la Pista B
      ↓
V8  defectos visuales vivos (D9, D2)   ║   T17  inactiva + loading de la ficha
      ↓
V1/T16  EL CARNET  ← la pieza emocional; la más importante de todo el plan
      ↓
V2  la cifra del beneficio   ║   V3  profundidad y material   ║   V7  cabecera
      ↓
T7-bis  ██ PUERTA DURA: segundo diff de CLAUDE.md ██  ← sin esto, T19 revierte el diseño
      ↓
V4  CTA pegajoso   ║   V5  tercera estantería
      ↓
T14-bis  punto de control visual, CON DATOS SEMBRADOS
      ↓
FASE 3   T18 ║ T19 ║ T20 ║ T21 ║ T22 ║ T23   [seis auditores en paralelo]
      ↓  corrección por severidad  →  T24 (condicional a T20)
T25  qa-tester  ← y la deuda: 4 módulos puros sin un solo test
      ↓
V6/T26  movimiento y transición de elemento compartido
      ↓
T27  coherencia visual  →  T28  documentación
```

### Por qué este orden

1. **V0 antes que cualquier píxel.** Si la respuesta es «rompe lo que haga falta», la mitad
   de las tareas cambian de forma. Preguntarlo después es tirar el trabajo.
2. **El carnet antes que el catálogo.** Es donde ORUM puede ser inimitable sin una sola
   foto, y está sin tocar. El catálogo sin imágenes tiene techo; el carnet no.
3. **T7-bis antes de FASE 3, igual que en el plan anterior.** Es `R3`: con la norma a medias,
   `code-reviewer` reportará el carnet y los carriles como violaciones y el implementador los
   revertirá obedientemente.
4. **T14-bis con datos sembrados.** Hay **4 comercios y 0 promociones vigentes**: ninguna
   estantería se renderiza. Pedir juicio estético sobre eso es pedirlo sobre el estado vacío,
   y es también la razón por la que decorar antes de tener contenido es la trampa de este
   encargo.
5. **El movimiento al final.** `CLAUDE.md` es explícito: solo cuando hay algo que animar.
   Ahora por fin lo hay.

---

## 6. Puertas del propietario

### V0 🆕 · ¿Cuánta dirección de arte se sacrifica por «vistosa»?

**Es la decisión de la que dependen todas las demás.** `T4-direccion-arte.md` se firmó hace
trece días y define lo contrario de Rappi, con estas reglas:

- **Regla A**: una sola pieza de oro sólido por pantalla, ≤7,5 % del lienzo.
- **Regla C**: el oro **nunca** es fondo de superficie de contenido; nunca dos rellenos
  sólidos compitiendo.
- **§10**: prohibidos «degradados arbitrarios» y «sombras difusas de librería». El lujo lo
  lleva «el aire, el material y el filo, no la cantidad».

Tres salidas, y hay que elegir una:

| | Qué implica |
|---|---|
| **A · Respetar la norma** | Pista A completa. Queda elegante y con carácter, más densa que hoy. **No queda como Rappi**, y el techo lo pone la falta de imágenes, no la norma |
| **B · Ampliar la norma en lo acotado** ← recomendada | Se sube el techo de la Regla A para el carnet, entra el velo en degradado de §2, y la cifra del beneficio gana un nivel. Se revisa `T4` en un diff con cada cambio argumentado. **El contraste AA no se toca** |
| **C · Rehacer la dirección de arte** | Color de marca a sangre, bandas, saturación. Es un `T4` nuevo y **contradice la no-regresión del panel (P1)**, porque los tokens son globales. Coste alto y riesgo de dos sistemas incompatibles otra vez |

### Q1 · ¿Se lleva la propuesta de imágenes al backend, y con qué prioridad?
Abierta desde el 29/08. **Sin un sí, la Pista B no existe y «vistosa» tiene techo.** Es la
pregunta más consecuente del plan.

### P2 · ¿Se aprueba el acceso rediseñado?
Sigue abierta. Seis pantallas escritas y **nadie las ha visto renderizadas**.

---

## 7. Lo que este plan NO hace

- **No rediseña el panel ni la Herramienta de Comercios** (premisa P1). Todo es aditivo y
  ningún token cambia de valor.
- **No toca las doce Server Actions**, ni `src/lib/auth`, `supabase`, `correo`, ni `docs/`
  (`SCOPE.md §2`).
- **No inventa datos que no existen**: sin calificaciones, sin distancia, sin tiempo de
  entrega. ORUM no tiene esas tablas y fingirlas sería mentir en la pantalla.
- **No mete `next/image`** hasta que exista el bucket (`R10`).
- **No copia el color de marca de nadie.** El fucsia de Rappi y el naranja de DiDi son sus
  activos; ORUM tiene oro sobre neutros fríos, que es más difícil de llevar y más difícil
  de confundir.

---

## PROPUESTAS PARA BACKEND — resumen

| # | Qué | Prioridad | Estado |
|---|---|---|---|
| **B4** | Bucket de logos (`PROPUESTA-BACKEND-imagenes.md`) | **Alta** | Sin respuesta desde el 29/08 (**Q1**) |
| **B9** 🆕 | `comercios.portada_url` | **Alta** | Desbloquea el aspecto Rappi |
| **B10** 🆕 | `categorias.icono` + `imagen_url` | Media | Hoy la tabla tiene 2 columnas |
| **B11** 🆕 | Tabla de piezas destacadas para la banda promocional | Media | Sin curaduría, la banda es un hueco decorado |
| **B1** | Paginación con total | Alta | Sube si entran imágenes |
| **B7** | Nombre del plan en la verificación del comercio | Cerrada | P1 resuelta: se queda visible |

---

## Fuentes de la investigación

- [Designing Accessible Text Over Images — Smashing Magazine](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) — las cinco técnicas de velo y sus compromisos. Base de la regla de §2.
- [The loyalty UX checklist: what most brands get wrong — Voucherify](https://www.voucherify.io/blog/loyalty-programs-ux-and-ui-best-practices) — el «cockpit» del socio, visibilidad del beneficio, fricción en el canje.
- [Top 10 inspiring food delivery app UI/UX designs — UIStudioz](https://uistudioz.com/blog/top-10-inspiring-food-delivery-app-ui-ux-designs/) — técnicas concretas de DoorDash, Deliveroo, Zomato, Swiggy, Glovo.
- [Food Delivery App Mobile Design Examples — Mobbin](https://mobbin.com/explore/mobile/app-categories/food-delivery-app) y [Carousel UI Design — Mobbin](https://mobbin.com/glossary/carousel) — catálogo de patrones y nomenclatura.
- [Future trends in food delivery app development — Adaptify](https://beadaptify.com/blog/future-trends-in-food-delivery-app-development/) — CTA pegajoso, cabecera que colapsa, jerarquía por contraste.
- [Making Gradient Backgrounds Accessible — Instant Gradient](https://instantgradient.com/blog/accessible_gradient_guide) — medir el punto de menor contraste, no el promedio.
- [User Interfaces of Great Loyalty Apps — DevTeam.Space](https://www.devteam.space/blog/features-of-a-great-loyalty-app-user-interface/) — carnet virtual como prueba de pertenencia.
- [Rappi — Wikipedia](https://en.wikipedia.org/wiki/Rappi) y [How DiDi Adapts to Latin America — Latinvex](https://latinvex.com/how-didi-adapts-to-latin-americas-era-of-digital-platforms/) — contexto de producto.

**Límite de esta investigación, dicho explícitamente**: no se abrieron las aplicaciones de
Rappi ni DiDi para inspeccionarlas. Los patrones salen de fuentes de diseño publicadas y de
catálogos de patrones, no de una auditoría directa de sus interfaces. Si quieres la
comparación tomada de la aplicación real, hace falta un dispositivo con ellas instaladas.
