# Spec UX: carrusel destacado del Portal de Miembros
> ux-designer · 12/09/2026 · rama `mejora-diseno` · commit base `acf7cc0`
>
> Tarea **V9**. Cierra lo que `.claude/docs/PLAN-carrusel-destacados.md` dejó esbozado:
> el criterio de curaduría, los ocho estados, el copy, la jerarquía de la tarjeta, qué
> pasa al tocarla, la relación con la rejilla y el punto de montaje.
>
> **Lo que esta spec NO decide**: tokens, color, sombras, radios y niveles tipográficos
> (`design-system-architect`, con `T4-direccion-arte.md` §7.2 como base) · curvas y
> duraciones de A1–A3 (`motion-ux-polish`) · requisitos por dispositivo, geometría del
> gesto, zonas seguras y objetivos táctiles (`mobile-ux-specialist`, que corre en
> paralelo, y `PLAN-carrusel-destacados.md` §5) · CSS y código.

---

## 0. Objetivo del usuario, y el del propietario

**El socio**, al abrir la aplicación, está en modo explorar: «¿qué me da esto que pago?».
No busca un comercio concreto —eso lo hace a partir de la tercera visita y ya tiene su
campo de búsqueda arriba—. Quiere una respuesta **sin leer y sin tocar nada**.

**El propietario** lo dijo así: *«quiero atraer al cliente con solamente una mirada»*.
Traducido a algo verificable: **en el primer pantallazo, sin desplazar y sin tocar, el
socio tiene que poder reconocer al menos un aliado del club.** Reconocer, no leer una
lista. Eso es lo que el carrusel añade y lo que la rejilla, por buena que esté, no hace:
la rejilla se lee; una portada se mira.

Y el corolario que gobierna toda esta spec: **si el carrusel añade un clic, sobra.** Es
un atajo de mirada, no un paso del recorrido. Cero controles nuevos, cero parámetros de
URL nuevos, cero consultas nuevas.

---

## 1. La pregunta central: atraer con una mirada cuando solo hay logotipo

### 1.1 La decisión: se acepta **I2**, y se detalla

`PLAN` §3 propone que, sin foto, la capa de cubierta sea una superficie de material con
el logotipo centrado y grande, tratada como portada deliberada. **Se acepta.** Hoy es el
100 % de los casos (4 comercios, 0 promociones vigentes, ninguna columna de imagen), así
que no es un respaldo: es *el* diseño.

Lo que la convierte en decisión de producto y no en apaño, en cuatro puntos que son de mi
dominio:

**a) La cubierta no es un hueco de imagen: es el retrato de marca.** Es el único sitio del
producto donde el logotipo de un aliado se muestra a tamaño completo —en la rejilla mide
72×48, en la ficha 144—. Hoy el logotipo es **el único activo visual que un comercio
tiene**, y el trabajo de una portada es enseñar lo mejor que hay, no lamentar lo que
falta. Un logotipo grande, centrado, con aire y bien recortado **es** contenido.

**b) La anatomía es invariante en I1, I2 e I3.** Misma proporción de cubierta, mismas
posiciones de nombre, meta y ranura inferior. Solo cambia **el relleno de la cubierta**.
Esa es la única razón por la que una fila mezclada (E5) se lee uniforme, y la razón por la
que el día que llegue `portada_url` la foto entra **por datos y sin rediseñar nada**.

**c) En I2 no se añade ni una palabra dentro de la cubierta.** La tentación obvia es
rellenar el «vacío» con la categoría, un lema o el nombre repetido. Prohibido: haría de
I2 una tarjeta distinta de I1, y el día que la mitad tenga foto la fila sería un mosaico
de dos diseños. **El único contenido de la cubierta es la marca.**

**d) La ranura inferior nunca dice «Sin beneficio vigente hoy».** Ver §4.3. Repetir la
negación hasta seis veces en el primer pantallazo del portal es exactamente lo contrario
del encargo, y la misma frase seis veces se lee como catálogo roto, no como información.

### 1.2 Qué hace que E4 se vea deliberado y no a medio cargar

Cinco condiciones comprobables sobre una captura, sin necesidad de medir tokens:

1. Las cubiertas son **idénticas en geometría**: misma proporción, mismo radio, mismo
   material. Cuatro portadas iguales con cuatro marcas distintas se leen como colección;
   cuatro cajas desiguales, como error.
2. La primera tarjeta está **alineada con el `h1`, con el `h2` y con la rejilla** (el
   sangrado asimétrico de `SPEC-pantallas-miembros.md` §4.4 / N6). Es lo que hace que la
   fila pertenezca a la página y no parezca un widget pegado encima.
3. **La cubierta ocupa más área que todo el texto de la tarjeta junto.** Eso convierte la
   composición en «retrato + pie», una forma editorial conocida, en vez de «imagen que no
   cargó + texto».
4. **Ninguna tarjeta contiene un elemento con forma de beneficio si no tiene beneficio.**
   Ni píldora vacía, ni guion, ni «—». Silencio, no promesa.
5. **Nada dice que falta algo.** Ni «pronto habrá fotos», ni un icono de imagen, ni un
   marco punteado.

**Prueba de falsación, que el propietario puede hacer en treinta segundos**: enséñale la
pantalla a alguien que no conozca el producto y pregúntale *«¿falta algo aquí?»*. Si
responde «las fotos», I2 falló. Si responde «¿y qué descuentos tienen?», I2 funcionó: la
pregunta pasó a ser sobre el contenido, no sobre la interfaz.

### 1.3 Las cuatro alternativas que se descartan, y por qué

Se escriben para que nadie las reintroduzca creyendo que mejora algo.

| Alternativa | Por qué no |
|---|---|
| **La cifra del beneficio como protagonista de la cubierta** (cartel tipográfico: «2x1» gigante) | Muerta al nacer: **hoy hay 0 promociones vigentes**. Con datos de hoy todas las cubiertas quedarían en blanco, que es peor que el logotipo. Y con datos futuros la portada premiaría la cifra sobre la marca: un «-20 %» sin saber de quién no vende nada |
| **Cubiertas con color o patrón por categoría** | `categorias` es `id, nombre` y nada más (verificado en `database.types.ts`). Asignar colores en el frontend inventa un dato y lo fija sin gobierno: el día que exista `categorias.color` habría dos verdades. Ya está descartado en `SPEC-pantallas-miembros.md` §12 |
| **Fotografía de archivo genérica** (una mesa de restaurante cualquiera para «Gastronomía») | Es una mentira sobre un local que el socio va a visitar. Mata la primera palabra del encargo del rediseño —**confiable**— y es justo el fallo «genérico» que `T4` §10 mide. **No se hace ni como demo** |
| **Sin cubierta: tarjetas solo de texto, más grandes** | Eso ya existe y se llama `ComercioCardCompacta` en las dos estanterías. El propietario pidió imagen explícitamente, y una fila de texto no cambia nada «con una mirada» |

---

## 2. El criterio de curaduría

### 2.1 El problema que hay que resolver antes de elegir un criterio

Las dos estanterías que existen ya se quedaron los dos ejes obvios: **novedad**
(`created_at`) y **beneficio vigente** (`promociones`). Si el carrusel usa uno de los
dos, es una tercera copia de una estantería que ya está en la página. Y «destacado» como
dato editorial **no existe**: ninguna de las 16 tablas tiene columna de destacado, orden
ni prioridad. Ordenar por `id` no es destacar, es «insertado antes».

Así que el criterio se deriva de lo único honesto que queda: **cuál de estos aliados puede
mostrarse mejor hoy, y cuál le da al socio más razones para entrar.** Es la propiedad que
una portada necesita —a diferencia de una estantería, que necesita un eje temático—, y se
calcula entera con datos que ya llegan a `comerciosListado`.

### 2.2 El selector

Va en `src/lib/comercios/estanterias.ts`, junto a los otros dos, con la misma forma:
**función pura, umbrales exportados como constantes con nombre, sin `Date.now()` dentro.**
Entra en el lote de `qa-tester`.

```
seleccionarDestacados(comercios: ComercioListado[]): ComercioListado[]
```

**No recibe fecha.** No la necesita: `promociones` llega ya filtrada a vigentes por la
página, y el criterio no tiene ningún corte temporal propio. Una función pura sin reloj es
una función que se prueba sin congelar el tiempo.

**Filtro de entrada (duro, no puntúa):**

- **`logoUrl !== null`** tras `resolverLogoComercio` (cadena comercio → marca). Un
  comercio sin logotipo resoluble cae a I3 —la inicial sobre la placa—, y una portada
  cuyo protagonista es una letra no es una portada. **I3 existe como respaldo ante un
  logotipo que se rompe en ejecución, nunca como criterio de selección.**

**Orden (tres niveles explícitos, y dentro de cada uno dos desempates):**

| Nivel | Quiénes | Por qué ahí |
|---|---|---|
| 1 | Con **≥1 beneficio vigente**, por **número** de beneficios descendente | Es el dato que el socio vino a buscar, y una portada con cifra atrae más que una sin ella. **Se cuentan, no se comparan**: `comercio-card.tsx:194-200` ya explica por qué no se rankean por magnitud —un 30 %, un 2x1 y un regalo no son la misma unidad—. Contar cuántos hay es una medida honesta; decidir cuál es «mejor», no |
| 2 | Sin beneficio pero **con `descripcion`** | La descripción es la única frase que puede vender el comercio cuando no hay cifra, y es lo que rellena la ranura inferior (§4.3). Una tarjeta con frase está más terminada que una sin ella |
| 3 | El resto | Tiene logotipo y nombre: suficiente para una portada, insuficiente para adelantar a los otros dos |

Dentro de cada nivel: **`createdAt` descendente**, y a igualdad, **`nombre` ascendente**.
`nombre` y no `id` como desempate final: el orden tiene que ser estable y reproducible
entre renders, y `id` reintroduciría por la puerta de atrás el «insertado antes» que el
repositorio ya rechazó.

**Umbrales:**

```
MINIMO_DESTACADOS = 3
TOPE_DESTACADOS   = 6
```

**Por qué 3 y no 2.** Con dos tarjetas de 320px en un contenedor de escritorio de ~1050px
quedan ~390px de hueco a la derecha: se lee como error de maquetación, no como selección.
En móvil, un deslizamiento que termina en el primer empujón le enseña al dedo que ahí no
hay nada, y ese aprendizaje no se deshace. Con tres, la fila llena el ancho de escritorio
y en móvil hay siempre algo cortado en el borde derecho, que es la señal de «hay más».
**Dos elementos no son una selección; son dos elementos.**

**Por qué 6 y no 10.** `TOPE_ESTANTERIA` es 10 y **aquí se baja a propósito**: una
estantería es un atajo y puede ser larga; una portada es una selección y una selección de
diez no selecciona. Además son hasta seis cubiertas grandes en la primera pantalla que ve
el socio —coste real de descarga y de composición— y, por la regla de duplicación (§6),
cada una vuelve a salir abajo en la rejilla: pasar de seis significa que el socio recorre
diez nombres dos veces en la misma página. Seis es el máximo que sigue leyéndose como
«esto está elegido».

**Por qué NO hay `MINIMO_CATALOGO_DESTACADOS`, a diferencia de las novedades.**
`MINIMO_CATALOGO_NOVEDADES = 8` existe porque una estantería es un **atajo**: atajar hacia
algo que ya está a un dedo de distancia no es atajar. El carrusel **no es un atajo**, es
la portada: su valor no viene de comprimir una lista larga, viene de que el club se vea
como un club a primera vista. Con 4 aliados, la diferencia entre un portal que parece
vacío y uno que parece curado es **toda** presentación, y es justo lo que el propietario
pidió. Exigirle un catálogo de 8 dejaría el encargo sin entregar hoy y durante meses.

> **Nota para quien venga a «armonizar» los umbrales**: esta asimetría es deliberada y
> está argumentada. El carrusel se rige por `MINIMO_DESTACADOS`, que cuenta destacados; las
> estanterías por `MINIMO_CATALOGO_*`, que cuenta el catálogo. No son el mismo número
> porque no cumplen el mismo papel.

### 2.3 Lo que el criterio NO usa, y no se puede usar

Verificado contra `database.types.ts` y `API-CONTRACT.md` §4. **Nada de esto se especifica
como si existiera**: calificaciones, número de estrellas, distancia, tiempo de entrega,
«X socios lo usaron», popularidad, visitas, ventas por comercio, destacado editorial,
orden manual, icono o color de categoría. Ninguna tabla lo guarda y fingirlo sería mentir
en la pantalla cuyo único trabajo es generar confianza.

---

## 3. Flujo

```
Socio abre la aplicación (pestaña Inicio / PWA)
  └─ requireMiembroVigente()
       ├─ sin sesión / cuenta inactiva ──────────→ /miembros/login
       ├─ rol distinto ──────────────────────────→ /login?error=sin_permiso
       ├─ membresía no vigente ──────────────────→ /miembros/inactiva
       └─ socio vigente
            └─ /miembros (catálogo)
                 ├─ ¿hay filtros en la URL (q, categoria_id, marca_id, ciudad_id)?
                 │     └─ SÍ → el carrusel NO se renderiza. La rejilla es la pantalla
                 └─ NO
                      └─ seleccionarDestacados(comerciosListado)
                            ├─ 0 destacados ────→ E3: no se renderiza nada
                            ├─ 1–2 destacados ──→ E2: no se renderiza nada
                            └─ ≥3 destacados ───→ E1: portada + rejilla

                                 MIRADA (cero clics, cero gestos)
                                   ├─ reconoce una marca ──→ toca la tarjeta
                                   ├─ no le llama ─────────→ desliza (opcional)
                                   └─ nada le llama ───────→ sigue bajando a la rejilla
                                                             (nunca un callejón)

                                 Toca la tarjeta
                                   └─ /miembros/comercios/{id}[?volver=…]
                                        ├─ con beneficios → «Mostrar mi carnet»
                                        ├─ sin beneficios → «Ver otros comercios»
                                        └─ atrás (gesto o «‹ Comercios») → /miembros
```

**Puntos de abandono y su ruta de vuelta**, que son los que importan:

| Abandono | Qué lo recoge |
|---|---|
| Desliza y no le interesa ninguno | La rejilla completa está inmediatamente debajo, con su `h2` «Todos los comercios». El carrusel nunca es la única vía a nada (§6) |
| Toca una tarjeta y el comercio no tiene beneficio vigente | La ficha ya resuelve ese vacío con `EmptyState` + «Ver otros comercios» (`comercios/[id]/page.tsx:358-373`). **El carrusel no lo empeora porque su encabezado no prometió beneficios** (§5) |
| Vuelve de la ficha | Gesto atrás del sistema, o la barra «‹ Comercios». Los filtros y el scroll vertical viven en la URL, así que vuelven gratis. Lo que **no** vuelve es la posición horizontal del carrusel (§7.4) |

**Cero puntos de decisión nuevos.** El carrusel no introduce ningún control, ningún
desplegable, ninguna confirmación y ningún estado que el socio deba gestionar.

---

## 4. La tarjeta: jerarquía de los cuatro datos

### 4.1 El orden en que lee el ojo

El socio está a punto de decidir si le interesa un comercio. La pregunta que se hace en el
carrusel es **anterior** a la de la ficha: no es «¿qué me descuentan?» sino **«¿esto es
para mí?»**. De ahí sale el orden, y no del valor de cada dato por separado.

| # | Dato | Papel | Por qué ahí |
|---|---|---|---|
| **1** | **Cubierta** (foto en I1, logotipo en I2, inicial en I3) | Reconocer | Es preatentivo: ocupa más de la mitad de la tarjeta y es donde cae la mirada antes de que empiece la lectura. El reconocimiento de marca —«ah, ese sitio»— ocurre aquí, sin leer |
| **2** | **Nombre** | Identificar | Confirma o aporta lo que la cubierta insinuó. Es el primer texto y el más grande de la tarjeta |
| **3** | **Beneficio** (cuando existe) | Convencer | Es el dato **más valioso** y aun así **no es el primero que se lee**, porque una cifra sin saber de quién es no vende: «-20 %» no significa nada; «-20 % en Casa Duarte», sí |
| **4** | **Categoría y ciudad** | Descartar | Es un **filtro mental**, no un gancho: se lee al final y su trabajo es confirmar o matar el interés que ya crearon los tres anteriores. Por eso lleva el menor peso visual de la tarjeta |

### 4.2 Quién gana cuando compiten

- **Cubierta vs. nombre.** La cubierta gana el área; el nombre gana el suelo de
  legibilidad. Regla dura: **la cubierta nunca se encoge para que quepa el texto, y el
  texto nunca desborda la tarjeta.** El nombre reserva **dos líneas en todas las
  tarjetas** —para que las alturas de la fila coincidan— y se recorta a partir de la
  segunda.
- **Beneficio vs. categoría/ciudad.** Gana el beneficio. Son líneas distintas, así que no
  compiten por el mismo sitio; si a un ancho estrecho hay que sacrificar algo, **se retira
  la ciudad antes que la categoría**: la categoría discrimina, y hoy la ciudad es «Bogotá»
  en el 100 % de las tarjetas. **Se reutiliza la regla y el valor que la página ya
  calcula** (`mostrarCiudades`, `page.tsx:309-310`: solo si el catálogo tiene dos o más
  ciudades distintas). No se inventa una segunda regla para lo mismo.
- **Beneficio vs. cubierta.** El beneficio **nunca monta sobre la cubierta**. Dos razones,
  y la primera es normativa: `PLAN` §7 fija que ningún texto se apoya sobre la imagen,
  porque en cuanto haya fotos el contraste dejaría de ser propiedad de un token y pasaría a
  depender de lo que suba cada comercio. La segunda es de oficio: una cifra flotando sobre
  una foto es exactamente el aspecto genérico que `T4` §10 mide y rechaza.
- **Lo único que monta sobre la cubierta** es la placa del logotipo en I1, con su propio
  fondo opaco y su contraste ya firmado (`T4` §4.3). En I2 la placa **es** la cubierta. En
  I3 la placa lleva la inicial. **La marca está presente en los tres estados**, y eso es lo
  que hace que una fila mezclada tenga un ancla común (E5).

### 4.3 La ranura inferior: una cascada, no una frase fija

```
┌─────────────────────────────┐
│                             │
│      CUBIERTA (4:3)         │  ① reconocer
│   I1 foto · I2 logo · I3    │
│                             │
├─────────────────────────────┤
│  Casa Duarte                │  ② nombre · h3 · máx. 2 líneas
│  Gastronomía · Bogotá       │  ④ meta · ciudad solo si mostrarCiudades
│  ┌──────────┐               │  ③ ranura inferior · altura reservada
│  │  2x1     │               │
│  └──────────┘               │
└─────────────────────────────┘
```

| Prioridad | Condición | Qué ocupa la ranura |
|---|---|---|
| 1 | Tiene ≥1 beneficio vigente | **La insignia** con `formatearBeneficio(tipoCodigo, valor)` del **primero de la lista** (que llega ordenada por título, con la misma honestidad ya documentada en `comercio-card.tsx:194-200`). **Una sola insignia, sin «+N más»**: una portada da una razón, no un inventario. El inventario está en la ficha |
| 2 | Sin beneficio vigente, **con `descripcion`** | **Una línea de la descripción**, recortada a una. Es la única frase que puede vender el comercio cuando no hay cifra, y es un dato real que la rejilla ya usa: no se inventa nada. **Una línea y no dos**, para que las alturas de la fila coincidan |
| 3 | Sin beneficio y sin descripción | **Nada.** La ranura **conserva su altura reservada** —si no, la fila quedaría con tarjetas de dos alturas— y se queda vacía |

**Por qué el carrusel no escribe «Sin beneficio vigente hoy», que sí está en la rejilla y
en la ficha:**

1. **Su encabezado no promete beneficios** (§5), así que no hay nada que desmentir. La
   frase existe en la rejilla porque ahí el bloque inferior **es** el bloque de
   beneficios, con divisoria y todo: el hueco habría que explicarlo. En el carrusel la
   ranura es la razón para entrar, no un campo de beneficio.
2. **Repetirla hasta seis veces en el primer pantallazo del portal** es lo contrario del
   encargo. Seis veces la misma negación no informa: se lee como catálogo roto.
3. **No se oculta del producto.** Sigue en la tarjeta de la rejilla —donde el socio
   compara— y en la ficha —donde decide—, que son los dos sitios que
   `SPEC-pantallas-miembros.md` §4.6 ya justificó. Una portada que no menciona lo que no
   tiene no está mintiendo; estaría mintiendo si mostrara una píldora vacía o un «pregunta
   en el local», y ninguna de las dos se hace (§1.2, condición 4).
4. Y el orden del selector ayuda: el **nivel 1 pone delante a quien sí tiene beneficio**,
   así que las primeras tarjetas que el socio ve son las que tienen algo que enseñar. Hoy
   ese nivel está vacío y la cuestión es teórica.

---

## 5. Copy

### 5.1 Encabezado

**`h2`: «Conoce a tus aliados»**

Se mide contra las dos estanterías que ya existen —«Nuevos en el club / Los últimos
aliados que se sumaron» y «Beneficios del momento / Lo que puedes usar esta semana»— y
contra el encabezado de la pantalla («Beneficios del club»):

- **Misma voz**: «aliados» es la palabra de la casa para los comercios; «el club» para
  ORUM; el socio se trata de **tú**; presente de indicativo.
- **No repite ninguna de las dos.** Ni novedad ni temporalidad: invitación.
- **No promete un ranking**, que es lo único que el criterio no puede respaldar. «Los
  mejores», «Selección del club», «Destacados» o «Lo más popular» serían mentira: no hay
  columna que lo sostenga.
- **Funciona con 3 de 40 y con 4 de 4**, que es el requisito real: la frase no puede
  quedarse falsa cuando el club crezca ni cuando sea pequeño.
- **Un imperativo invita al toque**, y el toque es la única acción de la pieza.

Finalista descartado: **«Los aliados del club»**. Más sobrio y quizá más acorde al tono de
lujo, pero es un rótulo y no una invitación, y se parece demasiado al `h2` de la rejilla
(«Todos los comercios»), que es justo la confusión que §6 trata de evitar. Si el
propietario prefiere el tono sobrio, es un cambio de una línea y no arrastra nada.

**Lo que el encabezado no lleva**: ni «Ver todos» ni ningún enlace. No habría a dónde ir
que no fuera esta misma URL, y un enlace que no lleva a ninguna parte es peor que ninguno
(la regla ya está escrita en `estanterias.ts:12-15`). La rejilla completa está debajo.

**Y sí lleva encabezado, aunque una portada al estilo escaparate tiende a no llevarlo.**
Un desplazador horizontal sin rótulo sobre una rejilla es cromo sin explicar: el socio no
puede saber por qué están ahí esos seis. Además el `h2` es lo que sostiene la jerarquía de
encabezados de la página (un `h1`, `h2` por sección, `h3` por tarjeta) y lo que le da a
`Carril` su forma canónica.

### 5.2 Línea de apoyo: tres variantes, y dicen la verdad del criterio

`Carril` documenta su propia prop así: *«Segunda línea de la cabecera. Explica el criterio
de la selección»*. Como el criterio **cambia según los datos**, el texto también. Es el
estilo de la casa: `construirVacio` ya tiene cuatro variantes por la misma razón —«decir
siempre lo mismo desperdicia la única información útil que tenemos»—.

Se resuelve con una función pura al lado del selector, `apoyoDestacados(...)`, y se evalúa
**en este orden**:

| # | Condición | Apoyo |
|---|---|---|
| **A** | Al menos un destacado de la fila tiene beneficio vigente | **«Empezamos por los que hoy tienen beneficio»** |
| **B** | Ninguno tiene beneficio **y** los destacados son todo el catálogo del resultado | **«Por ahora son todos, y seguimos sumando»** |
| **C** | Ninguno tiene beneficio **y** hay más comercios en la rejilla | **«Aliados para conocer, y el resto está abajo»** |

- **A** enuncia el criterio literal del nivel 1 del selector. Solo aparece cuando hay una
  cifra visible en la fila, así que nunca señala algo que el socio no pueda ver.
- **B es el caso de hoy** (4 comercios, 0 promociones) y es la respuesta honesta a la
  duplicación: si la portada contiene el club entero, lo dice, y «seguimos sumando» pone
  la expectativa en su sitio. Es la misma voz que el vacío inicial ya usa —«Estamos
  sumando aliados al club. Vuelve pronto.»—. **Fingir una «selección» de cuatro sobre
  cuatro sería la única mentira posible en esta pieza, y esta línea la desactiva.**
- **C** resuelve en copy la pregunta «¿por qué veo esto dos veces?» sin gastar un enlace:
  señala la rejilla, que está inmediatamente debajo.
- Sin punto final, como las dos estanterías existentes.

**Sobre el número de B**: no se escribe la cifra («Cuatro aliados…») aunque sea
técnicamente exacta. `SPEC-pantallas-miembros.md` §12 prohíbe contadores porque sin
`count: 'exact'` un número puede mentir sobre el total, y aunque aquí el conteo de la fila
sí es exacto, el socio lo leería como «el club tiene cuatro». **Un número que se puede
malinterpretar en la pantalla que debe generar confianza no vale los píxeles.** «Por ahora
son todos» dice lo mismo sin poder mentir.

---

## 6. Relación con la rejilla: cómo se evita el «ya vi esto»

**La regla heredada se mantiene y no es negociable**: nada es alcanzable solo deslizando.
Todo lo que sale en el carrusel está también en la rejilla de la misma página. Se cumple
**por duplicación, no por enlace**, igual que las dos estanterías.

Cuatro mecanismos, y ninguno cuesta código:

1. **La rejilla se declara superconjunto.** Su `h2` dice «Todos los comercios». Un bloque
   rotulado «todos» hace que cualquier cosa por encima se lea como una vista *dentro* de
   él. La repetición dentro de un «todos» es lo esperado, no un defecto. Este mecanismo ya
   está construido y es el que hace que las estanterías no chirríen hoy.
2. **Silueta distinta, lectura distinta.** La tarjeta del carrusel es vertical, con
   cubierta 4:3 dominante y tres líneas de pie. La de la rejilla es horizontal: placa
   pequeña a la izquierda, nombre, marca, descripción a dos líneas, ciudades con pin,
   divisoria y bloque de beneficio anclado al fondo. **No comparten ni una proporción.**
3. **Preguntas distintas sobre el mismo comercio.** El carrusel responde «¿me llama?»
   (marca y una razón). La rejilla responde «¿me sirve?» (descripción, ciudades, todos los
   beneficios, comparables a la misma altura entre tarjetas). Ver dos veces un nombre no
   molesta cuando cada vista aporta algo que la otra no da.
4. **El apoyo dice la verdad cuando la portada es el catálogo entero** (variante B). La
   duplicación solo se siente como fallo cuando nadie la nombra.

**Prueba de una línea para el implementador**: tapa los dos encabezados. Si no puedes
decir por qué un comercio está arriba, el criterio o el apoyo están mal escritos.

**Y una decisión explícita: no hay deduplicación entre el carrusel y las estanterías.** Si
un comercio sale en la portada y también en «Nuevos en el club», sale dos veces. Quitarlo
de la estantería para evitar la repetición haría que la estantería **mintiera sobre su
criterio**: un aliado recién sumado ausente de «Nuevos en el club» es peor defecto que un
nombre repetido. Además las estanterías solo aparecen con catálogos de ocho o más, donde
una repetición se diluye.

---

## 7. Montaje, layout y navegación

### 7.1 Dónde se monta dentro de `(portal)/page.tsx`

**Orden nuevo:**

```
EncabezadoCatalogo      (h1 + overline + lede)
FiltrosForm             (búsqueda)
ChipsCategoria          (hoy no se renderiza: no hay categorías pobladas)
► CarruselDestacados    ◄ AQUÍ
Carril «Nuevos en el club»        (hoy no se renderiza)
Carril «Beneficios del momento»   (hoy no se renderiza)
Rejilla «Todos los comercios»
```

**Dos cosas se cumplen a la vez, y era el punto difícil:** el carrusel llega **antes de
cualquier contenido curado** —ninguna estantería lo precede, así que es portada de verdad—
y **la búsqueda no se mueve de su sitio**.

**Por qué la búsqueda se queda arriba** (aritmética a 375×667, sobre la tabla ya firmada
en `SPEC-pantallas-miembros.md` §4.2):

| Opción | Primer pantallazo | Veredicto |
|---|---|---|
| Carrusel **después** de los chips (elegida) | Tras los chips el acumulado es 300 (256 sin fila de chips, el caso de hoy). Cabecera del carrusel ~42 → la cubierta empieza sobre los 320–342 y **la primera tarjeta completa cabe entera** dentro de los 667, con una franja de la segunda asomando a la derecha | **La mirada recibe una portada completa y la herramienta sigue donde estaba** |
| Carrusel **antes** de la búsqueda | La portada empuja el campo de búsqueda a ~610–630px: prácticamente fuera del primer pantallazo | **Descartada.** El socio recurrente —el que abre la app para buscar «pizza»— tendría que desplazar media pantalla para encontrar el campo. Eso es un paso añadido, y la regla nº1 manda |
| Carrusel entre el lede y la búsqueda | Separa el lede del control que describe y hunde la búsqueda igual | Descartada |

Y el argumento de fondo: **la búsqueda es herramienta, no contenido.** Una portada de
revista no va antes del índice por estar antes en el papel: va antes de los artículos. La
regla que esta spec fija es «ningún contenido curado precede al carrusel», y se cumple.

> Los píxeles exactos los confirma una captura a 375×667, y **la verificación en
> dispositivo es de `mobile-ux-specialist` y del propietario**: la automatización de
> navegador de esta máquina no redimensiona la ventana. Aquí la aritmética justifica el
> orden de los bloques, no sustituye a la captura.

**Condición de renderizado, idéntica a la de las estanterías:**

```
const destacados = hayFiltros ? [] : seleccionarDestacados(comerciosListado)
```

**Con filtros activos el carrusel desaparece.** Misma regla y misma razón que las dos
estanterías: en modo búsqueda el resultado **es** el contenido, y una portada curada al
lado es una distracción. Consistencia por encima de ingenio: tres bloques deslizables con
tres condiciones distintas serían imposibles de predecir.

### 7.2 Composición por ancho

Esta sección decide **qué bloques hay y en qué orden**. Los anchos de tarjeta, el snap, el
sangrado, las zonas seguras y los objetivos táctiles están en `PLAN` §5 y los audita
`mobile-ux-specialist`. **No se repiten aquí.**

- **Punto de ruptura**: `@container contenido`, con los umbrales que la pantalla ya usa
  (560 y 900). Nunca `@media`: el ancho útil del contenido no es el del viewport y un
  `@media` se equivoca justo donde importa.
- **Móvil (< 560)**: una cubierta completa y una franja de la siguiente. La franja cortada
  es la única señal de «hay más» que la pieza necesita: ninguna flecha, ningún punto de
  paginación, ningún contador «1/6» —cromo que informa de la interfaz y no del club—.
- **Tableta (560–900)**: hereda el patrón móvil, no el de escritorio. Sigue siendo una
  fila deslizable porque con seis elementos, dos y media por pantalla mantienen el gesto
  útil; y por debajo de 768px de viewport sigue habiendo barra inferior, así que el pulgar
  manda.
- **Escritorio (≥ 900)**: sigue siendo **una fila**, alineada a la izquierda con el `h1`,
  el `h2` y la rejilla. **La pista no se centra** —una fila centrada de cuatro elementos se
  lee como error de maquetación— y **no se estira** para rellenar. Si la fila cabe, cabe;
  si desborda, la última tarjeta queda cortada en el borde `inline-end`. Las dos formas son
  correctas y **no hace falta una rama de layout**.
  - **Lo que NO se hace en escritorio: convertir el carrusel en una segunda rejilla.** Dos
    rejillas de los mismos elementos apiladas es la queja de §6 en su peor versión. La
    banda de portada conserva su propia silueta —una fila, alto fijo— para que se lea como
    portada y no como catálogo duplicado.
  - **Hover**: refuerza (realce y filo), **nunca añade**. Nada aparece al apuntar que no
    estuviera antes; si lo hiciera, la versión táctil perdería funcionalidad.

### 7.3 Alcance con ratón: un hueco que el plan no cubre

`PLAN` §5.3 dice «sin flechas de navegación: hay rueda, trackpad y teclado». **Eso es
falso para un ratón de rueda vertical sencilla**, que es mayoría en escritorio Windows: sin
rueda horizontal, sin trackpad y con la barra de desplazamiento oculta
(`scrollbar-width: none`), ese usuario **no puede mover la fila**. `Shift`+rueda funciona,
pero nadie lo descubre solo.

- **No es un bloqueo de contenido**, porque la regla de duplicación lo salva: todo está en
  la rejilla. Pero una fila que el ratón no puede mover se percibe como un control roto, y
  eso sí es un defecto.
- **Requisito de comportamiento que esta spec fija**: en escritorio, cuando la pista
  desborda, tiene que existir **un mecanismo de desplazamiento visible y accionable con un
  ratón sin rueda horizontal**. La barra de desplazamiento nativa fina, mostrada solo bajo
  `(pointer: fine)`, lo cumple y **no cuesta ni una línea de JavaScript**.
- Si `design-system-architect` considera que la barra visible es inaceptable, la
  alternativa son flechas, y **las flechas exigen saber si hay desbordamiento, o sea
  cliente**: entonces se paga ese coste con el argumento delante, en vez de dejar la fila
  inmóvil. En móvil y táctil no se muestra nada: el dedo ya sabe.
- **Cero manejo propio de teclas.** La fila no es un widget, es una lista de enlaces: el
  navegador ya desplaza la pista al tabular. No se capturan `←`/`→`, no se añade
  `tabindex` en la pista y no se añade `role` que no esté ya en `Carril`.

### 7.4 Navegación y URL

- **URL**: `/miembros`. **El carrusel no añade ni lee ningún `searchParam`.** No hay
  estado que sobreviva a un refresco porque no hay estado: la fila se deriva de los datos.
- **Destino de la tarjeta**: `/miembros/comercios/{id}` **con `?volver=`** cuando hay algo
  que conservar. Se usa **el mismo helper que ya existe** (`hrefFicha`, hoy privado en
  `comercio-card.tsx:59-67`), no una segunda copia: dos funciones que construyen el mismo
  enlace se desincronizan a la primera reorganización.
- **Consecuencia que hay que dejar escrita**: como el carrusel solo se renderiza **sin
  filtros**, `volver` será `null` en la práctica y el enlace saldrá limpio, sin parámetro.
  **Eso es lo correcto, no un bug** —`?volver=%2Fmiembros` es ruido en una URL que el socio
  puede pasar por WhatsApp—, y **el `volver` se pasa igual**: si algún día se relaja la
  regla de los filtros, el enlace ya funciona, y `null` produce el href limpio por sí
  solo. **Nunca se escribe el parámetro a mano.**
- **`?volver=` se valida otra vez al llegar** con `resolverVolverAlCatalogo`. Que el
  origen sea de confianza no hace de confianza al parámetro: viaja en una URL que
  cualquiera puede reescribir.
- **Botón atrás**: devuelve al catálogo con los filtros y el scroll vertical, porque los
  dos viven en la URL.
- **Lo que no vuelve: la posición horizontal del carrusel.** Se acepta y se documenta para
  que nadie lo «arregle»: reproducirlo exigiría estado de cliente y un escuchador de
  scroll en la primera pantalla del socio, y con un tope de seis tarjetas el coste máximo
  son dos deslizamientos. **No se convierte en Client Component por esto.**
- **Sin `view-transition-name` en las tarjetas del carrusel.** Un comercio que sale en la
  portada y en la rejilla tendría dos elementos con el mismo nombre en el mismo documento y
  la transición se rompe **sin avisar**. El nombre lo lleva solo la tarjeta de la rejilla,
  igual que ya se decidió para las estanterías.

---

## 8. Los ocho estados, E1–E8

### E1 · Tres o más destacados — el carrusel completo

- **Cuándo**: sin filtros en la URL y `seleccionarDestacados(...).length >= 3`.
- **Qué se muestra**: `h2` + apoyo + pista con 3 a 6 tarjetas, en el orden del selector
  (§2.2). Inmediatamente debajo, las estanterías que superen su umbral y la rejilla.
- **Copy**: «Conoce a tus aliados» + la variante A, B o C de §5.2.
- **Acciones**: tocar una tarjeta (única acción). Deslizar es opcional y no da acceso a
  nada exclusivo.

### E2 · Uno o dos destacados — **no se renderiza. Confirmado**

- **Cuándo**: `1 <= destacados.length <= 2`.
- **Qué se muestra**: **nada**. Ni encabezado, ni pista, ni hueco reservado. Esos
  comercios están en la rejilla, como todos.
- **Copy**: ninguno. Y explícitamente **no** se escribe «pronto habrá más destacados»:
  anunciar una sección ausente es cromo que habla de nosotros, no del club.
- **Por qué se confirma la decisión del plan**, con tres razones y no una:
  1. **Geometría**: dos tarjetas de 320px en un contenedor de ~1050px dejan ~390px de
     hueco. Se lee como error de maquetación, no como selección.
  2. **Aprendizaje del gesto**: un deslizamiento que se agota en el primer empujón le
     enseña al dedo que ahí no hay nada, y ese aprendizaje se traslada a las estanterías de
     abajo.
  3. **Honestidad de la pieza**: dos portadas no son una curaduría. Y el caso puede darse
     **con un catálogo grande** —por ejemplo 40 comercios de los que solo 2 tienen
     logotipo resoluble—, donde una portada de dos **tergiversa** el club. También ahí es
     correcto no renderizarla.
- **Y no se «rellena» bajando el filtro de logotipo para llegar a tres.** Tres portadas de
  las que dos son iniciales sobre una placa es peor que ninguna portada.

### E3 · Cero destacados

- **Cuándo**: el catálogo está vacío, **o** ningún comercio tiene logotipo resoluble, **o**
  hay filtros activos.
- **Qué se muestra**: **nada**. La rejilla es la pantalla —con su contenido o con el
  `EmptyState` que ya existe—.
- **Copy**: ninguno propio. El de la pantalla vacía lo pone `construirVacio`, que ya está
  escrito y verificado y **no se toca**.
- **Riesgo que hay que comprobar hoy, y no es un bug si ocurre**: si los cuatro comercios
  actuales no devolvieran logotipo por la cadena comercio → marca, el carrusel **no
  aparecería** y parecería que la tarea no se hizo. Entra como criterio de aceptación
  (§11).

### E4 · Ninguna tarjeta tiene foto — **el 100 % de los casos, hoy**

- **Cuándo**: `portada_url` no existe como columna. Es decir: siempre, hasta que B9 se
  ejecute.
- **Qué se muestra**: todas las cubiertas en **I2** —material con el logotipo centrado y
  grande—, con la anatomía invariante de §1.1 y las cinco condiciones de §1.2.
- **Copy**: el de E1. **Ni una palabra sobre imágenes que faltan.**
- **Acciones**: las de E1.
- **Este no es un estado degradado: es el estado que el propietario va a ver**, y la razón
  de que §1 sea la sección más larga de esta spec.

### E5 · Mezcla de tarjetas con foto y sin foto

- **Cuándo**: existe `portada_url` y solo algunos comercios la han subido.
- **Qué se muestra**: I1 e I2 **en la misma fila, sin reordenar**. La coherencia la da la
  anatomía invariante: misma proporción, misma placa de marca, mismo sitio para cada texto.
- **Decisión explícita: tener foto NO adelanta a nadie en el orden.** Sería tentador subir
  las fotos al frente para una primera pantalla más bonita, y está mal: convertiría un
  artefacto de calidad de datos —quién subió un archivo— en un ranking editorial, y
  **degradaría visualmente a un aliado con beneficio vigente frente a otro que solo subió
  una imagen**. El beneficio manda sobre la foto. Cuando B9 exista, la foto entra como
  desempate **dentro** de un nivel, nunca por encima de uno (§12).
- **Copy**: sin cambios. Las tres variantes de apoyo no dependen de las fotos.

### E6 · Una imagen no carga

- **Cuándo**: hay `portada_url` pero el servidor de terceros no responde, devuelve 404 o
  entrega algo que no es una imagen. Con tres `*_url` apuntando a hosts ajenos en el
  esquema, es cuestión de tiempo.
- **Qué se muestra**: **esa** tarjeta cae a I2. Las demás no cambian. **Jamás el icono de
  rotura** (D9).
- **Cómo se consigue sin JavaScript, y es requisito, no sugerencia**: la cubierta se
  construye **por capas**. El material de I2 con su logotipo es **siempre** la capa de
  fondo; la foto va encima. Si la foto falla, no pinta nada —porque su `alt` está vacío— y
  el material queda a la vista. Sin escuchador de error, sin `'use client'`, sin salto de
  layout: la proporción la fija el contenedor, no la imagen.
- **Copy**: la cubierta es **decorativa**, `alt=""`. El nombre del comercio está en texto
  justo debajo. Con `alt=""` un fallo de carga no pinta texto alternativo y no hay glifo de
  rotura que heredar seis veces en la primera pantalla del socio.

### E7 · Cargando

- **Cuándo**: navegación a `/miembros` mientras el servidor resuelve; lo cubre
  `(portal)/loading.tsx`, que ya existe.
- **Qué se muestra**: el esqueleto **gana el bloque del carrusel**, con la silueta real:
  una línea de `h2`, una de apoyo y **una cubierta completa más media**, con la misma
  proporción y el mismo radio. Esqueleto, nunca spinner. Como hoy, el dibujo va
  `aria-hidden` y el anuncio lo da el `role="status"` ya presente: **«Cargando los
  comercios…»**, que no se duplica ni se cambia.
- **El esqueleto toma las clases del componente real**, como ya hace con
  `comercio-card.module.css`, en vez de recrear la geometría a mano.
- **El conflicto que hay que resolver, y su resolución**: `loading.tsx` no recibe props, así
  que **no puede saber si habrá filtros** y por tanto si el carrusel se renderizará. Se
  dibuja **siempre**, y es la decisión correcta:
  - la entrada sin filtros es la dominante —es la pestaña «Inicio», el destino de la PWA y
    el de cada toque de la barra de navegación—, y no dibujarlo haría saltar **el caso
    dominante**;
  - con filtros, lo que se desplaza al resolverse es la rejilla, y **la búsqueda —donde
    está mirando el socio que filtra— no se mueve**, porque el carrusel va debajo de ella
    (§7.1). En móvil ese desplazamiento ocurre además fuera de la primera pantalla.
  - **Nota para el implementador: no lo «arregles» quitando el bloque.** El comentario de
    `loading.tsx:23-37` explica bien la regla general —no dibujar lo que no va a llegar—; el
    caso dominante es la excepción argumentada, y quitarlo cambia el salto de un caso raro
    a un caso permanente.

### E8 · Sin conexión

- **Cuándo**: el socio abre la aplicación sin red.
- **Qué se muestra**: la pantalla `/offline` que ya existe. **No hay carrusel en caché, y
  es deliberado**: el service worker nunca guarda HTML autenticado ni respuestas de
  Supabase. Una portada desde caché podría anunciar un beneficio que caducó ayer, que es
  justo el defecto que este rediseño cerró.
- **Copy**: el de `/offline`, sin cambios.
- **No se añade ninguna variante «carrusel en caché»**, ni con aviso.

### 8.1 Los otros cuatro estados canónicos, que E1–E8 no nombra

Se cierran aquí para que no queden huecos. Ninguno pide código nuevo.

| Estado | Resolución |
|---|---|
| **Vacío tras filtro** | **El carrusel nunca aparece sobre un resultado de cero**, porque con filtros no se renderiza (§7.1). El estado entero pertenece a la rejilla y lo cubre `construirVacio` con sus cuatro variantes ya escritas. **No se toca** |
| **Carga parcial** | **No se introduce.** El carrusel **no añade ninguna consulta**: se calcula en memoria sobre `comerciosListado`, que la página ya construye. Partir la pantalla en `<Suspense>` crearía cascadas de red para ganar décimas. Misma decisión que ya tomó `SPEC-pantallas-miembros.md` §4.9 |
| **Error recuperable / fatal** | El carrusel **no tiene fuente de datos propia**, así que no tiene estado de error propio: lo cubre `miembros/error.tsx`, con «Reintentar» y «Volver al catálogo». **Hueco conocido que esta spec nombra y no puede cerrar**: las consultas de la página ignoran `error`, así que un fallo de lectura devuelve cero filas → el carrusel no se renderiza (E3) y la rejilla muestra el vacío inicial. Está escalado como B6 y no es diseño intencionado |
| **Sin permiso** | `requireMiembroVigente()` redirige **antes de pintar**: sin sesión → `/miembros/login`; rol distinto → `/login?error=sin_permiso`; membresía no vigente → `/miembros/inactiva`. **La portada nunca se renderiza para un socio sin membresía vigente**, y eso es lo correcto: enseñarle una portada de aliados a quien la caja va a rechazar delante del cliente es el defecto que este producto ya cerró una vez |

---

## 9. Interacciones

| Elemento | Trigger | Resultado | Feedback al usuario |
|---|---|---|---|
| Tarjeta | `pointerdown` | — | Presión inmediata (A3 / `:active`). **En `pointerdown`, no en `click`** |
| Tarjeta | `click` / `Enter` | Navega a `/miembros/comercios/{id}[?volver=…]` | Presión, y el esqueleto de la ficha |
| Tarjeta | `hover` (puntero fino) | — | Realce y filo. **Refuerza, nunca revela nada nuevo** |
| Tarjeta | `Tab` | El navegador enfoca y **desplaza la pista** hasta ella | Anillo de foco **completo, sin recortar**, también en la primera y la última |
| Pista | Arrastre horizontal | Desplaza | Scroll nativo con snap de proximidad. **No atrapa el desplazamiento vertical de la página ni invade la banda del gesto «atrás»** |
| Pista | Rueda horizontal / trackpad / `Shift`+rueda | Desplaza | Igual |
| Pista | Ratón sin rueda horizontal (escritorio) | Desplaza arrastrando la barra nativa fina | §7.3. **Sin ella la fila es inmóvil para ese usuario** |
| Pista | `←` / `→` | **Nada propio.** No se capturan | La fila es una lista de enlaces, no un widget |
| Encabezado | cualquiera | **No es accionable.** Sin «Ver todos» | — |

**Lo que no existe y no se añade**: autoplay (roba el control, obliga a perseguir el
contenido y es fallo de WCAG 2.2.2 — y el propietario pidió atractivo, no movimiento
involuntario), puntos de paginación, contador «1/6», flechas por defecto, arrastre con
inercia propia, y cualquier acción secundaria dentro de la tarjeta: un botón dentro de un
enlace es marcado inválido y le roba el área de toque a la tarjeta entera.

---

## 10. Copy completo

| Ubicación | Texto |
|---|---|
| `h2` del carrusel | Conoce a tus aliados |
| Apoyo · variante A (algún beneficio en la fila) | Empezamos por los que hoy tienen beneficio |
| Apoyo · variante B (la fila es todo el catálogo — **hoy**) | Por ahora son todos, y seguimos sumando |
| Apoyo · variante C (hay más en la rejilla) | Aliados para conocer, y el resto está abajo |
| Nombre de la tarjeta | `comercios.nombre`, sin transformar, máx. 2 líneas |
| Línea de meta | `{Categoría}` · `{Ciudad}` — la ciudad solo si `mostrarCiudades` |
| Ranura · con beneficio | `formatearBeneficio(tipoCodigo, valor)` → «2x1», «20% de descuento», «$15.000 de descuento», «Regalo» |
| Ranura · sin beneficio, con descripción | `comercios.descripcion`, recortada a **una** línea |
| Ranura · sin beneficio, sin descripción | *(vacía, con la altura reservada)* |
| Texto alternativo de la cubierta | `""` — decorativa. El nombre va en texto debajo |
| Logotipo | `decorativo` (va junto a un nombre visible; si no, el lector lo anuncia dos veces) |
| Anuncio de carga | «Cargando los comercios…» — **el `role="status"` que ya existe**, no se añade otro |

**Textos que quedan explícitamente prohibidos en esta pieza:**

| Prohibido | Por qué |
|---|---|
| «Destacados», «Los mejores», «Selección del club», «Lo más popular» | Ninguna columna sostiene un ranking. Sería mentira, y en la pantalla cuyo trabajo es la confianza |
| «Ver todos» | No hay a dónde ir que no sea esta misma URL |
| «Sin beneficio vigente hoy» | §4.3. Sigue viva en la rejilla y en la ficha, que es donde tiene sentido |
| «Pregunta en el local», «Consulta tu beneficio» | La caja **rechaza** una promoción no vigente. Prometer lo que el sistema deniega delante del cliente es el defecto que D14 cerró |
| Cualquier cifra de total («4 aliados», «12 comercios») | Sin `count: 'exact'` un total puede mentir; §5.2 |
| «Pronto habrá fotos», «Imagen no disponible», «Sin imagen» | Convertiría I2 en una disculpa. I2 es el diseño |
| «Desliza para ver más», flechas dibujadas en texto | La tarjeta cortada en el borde ya lo dice. Instruir sobre el gesto es admitir que no se lee |

---

## 11. Casos límite

| Caso | Comportamiento |
|---|---|
| **Nombre larguísimo** («Restaurante y Parrilla El Rincón de la Abuela Mercedes») | Dos líneas y recorte. **La cubierta no se encoge y la tarjeta no crece**: las alturas de la fila tienen que coincidir |
| **Descripción larguísima** | Una línea en la ranura, recortada. La completa está en la ficha |
| **Descripción de dos palabras** («Café.») | Se muestra igual. Una frase corta es mejor que una ranura vacía, y no hay umbral de longitud: inventarlo sería juzgar la redacción de un aliado |
| **Nombre de categoría larguísimo** | La meta recorta; la ciudad se retira antes que la categoría (§4.2) |
| **10.000 comercios** | `.limit(100)` corta antes; el selector ve ≤100 y devuelve 6. Nada cambia |
| **Los 4 comercios de hoy sin logotipo resoluble** | `destacados = 0` → E3, sin carrusel. **No es un bug**; se comprueba antes de entregar (§13) |
| **Un logotipo transparente sobre fondo oscuro, o de proporción 4:1** | Lo resuelve la placa y su cadena de respaldo (`T4` §4.4). Ningún logotipo se ve roto, deformado ni invisible |
| **Un comercio sale en el carrusel y también en una estantería** | Sale dos veces, y es correcto: no hay deduplicación (§6) |
| **Sesión expirada mientras el socio desliza** | Nada especial: la siguiente navegación redirige al acceso. Sin tiempo real, sin canal y sin toasts en este árbol, no hay aviso posible |
| **Offline a mitad de página** | El HTML ya pintado se queda; el toque en una tarjeta lleva a `/offline`. Sin portada en caché (E8) |
| **`prefers-reduced-motion`** | La pieza sigue siendo usable y sigue habiendo feedback: no es «sin movimiento», es un equivalente no vestibular. El detalle es de `motion-ux-polish` y `PLAN` §4 |
| **Zoom de texto al 200 %** | El nombre y la meta crecen dentro de sus líneas reservadas; la cubierta conserva su proporción. Ningún texto queda cortado a media palabra |
| **El socio vuelve de la ficha** | Filtros y scroll vertical restaurados por la URL; posición horizontal del carrusel, no (§7.4) |

---

## 12. Notas para el implementador

1. **Cero consultas nuevas.** `seleccionarDestacados` se alimenta de `comerciosListado`,
   que `page.tsx` ya construye. Si alguien añade una consulta para esta pieza, algo se
   entendió mal.
2. **Los umbrales, constantes exportadas con nombre**, en `src/lib/comercios/estanterias.ts`,
   junto a las cinco que ya están: `MINIMO_DESTACADOS = 3`, `TOPE_DESTACADOS = 6`. Con su
   comentario de por qué son ese número, como los demás.
3. **`seleccionarDestacados` y `apoyoDestacados` son funciones puras y sin reloj.** Entran
   en el lote de `qa-tester`. Casos que hay que cubrir: 0, 1, 2, 3 y 7 destacados; todos sin
   logotipo; empate de `createdAt`; `createdAt` nulo o ilegible; un comercio con 3
   beneficios frente a otro con 1; las tres variantes de apoyo.
4. **Reutiliza `hrefFicha`**, hoy privado en `comercio-card.tsx:59-67`. Expórtalo o muévelo
   a `src/lib/comercios/` (zona de trabajo). **No escribas una segunda copia**, y no montes
   el `?volver=` a mano.
5. **Reutiliza `Carril` para el encabezado y la pista** si es posible: `CLAUDE.md` dice
   «usa los que hay», la cabecera `h2` + apoyo es exactamente la que hace falta y
   `CarrilPista` ya trae la geometría auditada —sangrado asimétrico, snap de proximidad,
   reserva del anillo de foco, `overscroll-behavior`—. Lo nuevo de verdad es **la tarjeta**.
   Si la pista necesita un tercer valor de `columnas`, es una ampliación aditiva; **duplicar
   su CSS en un módulo nuevo garantiza que los dos se desincronicen**.
6. **El encabezado y el apoyo deben quedar tipográficamente idénticos a las dos
   estanterías existentes.** Si la portada usara otros niveles, se leerían como dos sistemas.
7. **`h3` para el nombre de la tarjeta.** La jerarquía de la página queda: un `h1`
   (encabezado), `h2` del carrusel, `h2` de cada estantería, `h2` «Todos los comercios»,
   `h3` en cada tarjeta. **Sin saltos de nivel.**
8. **Cubierta por capas** (E6): material de I2 al fondo, foto encima, `alt=""`. Nunca un
   escuchador de `onError`.
9. **Sin `view-transition-name`** en estas tarjetas (§7.4).
10. **Puerta de renderizado idéntica a las estanterías**: `hayFiltros ? [] : seleccionar…`.
11. **Montaje**: entre `ChipsCategoria` y el primer `Carril` (§7.1).
12. **`loading.tsx` gana el bloque del carrusel**, y no se quita después (E7).
13. **Server Component.** Cero `'use client'`, cero bytes de JavaScript nuevos. Si algo de
    esta spec parece exigir cliente, está mal leído — salvo las flechas de §7.3, que son
    una alternativa explícitamente descartada por defecto.
14. **Ninguna tarjeta enlaza a una ruta que no existe.** `/miembros/comercios/[id]` ya
    existe (commit `2341cc7`). La lección está escrita en `comercio-card.tsx:37-56` y costó
    un 404 en cada tarjeta del catálogo.

---

## 13. Criterios de aceptación propios de esta spec

Se suman a los diez de `PLAN` §9; no los repiten.

1. Con los datos de hoy —4 comercios, 0 promociones— **el carrusel aparece** con las cuatro
   tarjetas en I2 y el apoyo **variante B**. Si no aparece, comprobar primero que
   `resolverLogoComercio` devuelve algo para los cuatro (E3).
2. Con **dos** destacados, **no aparece nada**: ni encabezado, ni hueco (E2).
3. El apoyo cambia a la **variante A** en cuanto exista una promoción vigente en la fila, y
   a la **C** si el catálogo crece por encima del tope.
4. **Ninguna tarjeta dice «Sin beneficio vigente hoy»**, y la rejilla de abajo **sí** sigue
   diciéndolo. Los dos a la vez, en la misma captura.
5. El enlace de la tarjeta sale **sin `?volver=`** en el catálogo sin filtros, y el texto
   `volver` **no está escrito a mano** en el código.
6. Sobre una captura a 375×667: **la primera cubierta completa entra sin desplazar** y el
   campo de búsqueda sigue visible arriba.
7. En escritorio con la fila desbordada, **un ratón de rueda vertical puede moverla** (§7.3).
8. La prueba de falsación de §1.2: alguien ajeno al producto no pregunta por las fotos.

---

## PROPUESTAS PARA BACKEND

Cruzan la frontera de `SCOPE.md` §2. **Ningún agente las ejecuta.** No se repite el SQL que
`PLAN` §8 y `PROPUESTA-BACKEND-imagenes.md` ya redactaron: aquí va **lo que el diseño haría
con ese dato**, que es lo que a esta spec le corresponde aportar.

### C1 · `comercios.portada_url` (= B9 del plan) — la que desbloquea el encargo literal

- **Qué habilita en esta spec**: el estado **I1** se activa **por datos**, sin reescribir la
  tarjeta. El encabezado y las tres variantes de apoyo **no cambian**.
- **El único cambio en el selector, y su límite**: tener foto entra como **desempate dentro
  de un nivel**, por delante de `createdAt` y por detrás del nivel. **Nunca por encima de un
  nivel**: un aliado con beneficio vigente no puede quedar detrás de otro que solo subió una
  imagen. Que la portada premie subir un archivo antes que ofrecer un beneficio invertiría
  el incentivo del producto.
- **Y una regla de contenido que hay que fijar cuando el dato exista**: la foto es del local
  o de sus productos, **nunca de archivo genérico** (§1.3). Sin esa regla, el primer aliado
  que suba una foto de banco de imágenes destruye la palabra «confiable» para todo el club.
- **Entretanto**: I2, que es el 100 % de los casos y está diseñado como estado de pleno
  derecho, no como espera.

### C2 · `comercio_imagenes` (= B12 del plan) — varias fotos por negocio

- **Qué habilita**: la **ficha** gana una galería. **El carrusel no cambia**: la tarjeta
  sigue mostrando **una** cubierta, la de `orden` más bajo. Un carrusel dentro de un
  carrusel no es proponible: dos ejes de deslizamiento anidados en la misma pieza son
  imposibles de manejar con el pulgar y roban el gesto vertical de la página.
- **Recomendación**: **C1 primero**. Una portada por comercio es el 90 % del efecto visual
  con el 10 % del trabajo, y hoy no hay contenido para llenar una galería.

### C3 · Curaduría editorial (= B5 de `SPEC-pantallas-miembros.md` §13)

- **Qué habilita**: con una columna `destacado`/`orden` en `comercios`, o una tabla de
  curaduría, el criterio **dejaría de derivarse** y el copy podría decir la verdad más
  fuerte que hoy no puede decir: **«Selección del club»**. Es el único encabezado que esta
  spec descartó por falta de dato, no por falta de ganas.
- **Qué mejora aporta**: el club podría poner delante a un aliado recién firmado, a uno con
  una campaña, o al que conviene destacar esta semana — decisiones de negocio que hoy la
  interfaz no puede representar de ninguna forma.
- **Riesgo que habría que gobernar**: un orden manual sin fecha de caducidad se fosiliza. Si
  se implementa, la portada debería tener **vigencia**, como las promociones.
- **Entretanto**: el escalonado de presentabilidad de §2.2, que se deriva de datos reales y
  se puede explicar en una línea de apoyo sin mentir.

### C4 · Magnitud comparable del beneficio

- **Qué habilita**: hoy el nivel 1 del selector ordena por **número** de beneficios porque
  no se pueden **comparar**: un 30 %, un 2x1 y un regalo no son la misma unidad
  (`comercio-card.tsx:194-200`). Con un valor normalizado —un ahorro estimado, o un rango—
  la portada podría poner delante el beneficio que más vale, que es lo que el socio querría.
- **Por qué la alternativa solo-frontend es peor**: cualquier normalización inventada en el
  cliente compararía magnitudes incomparables y produciría un orden que parece informado y
  no lo está.
- **Entretanto**: contar, no comparar. Y en la tarjeta, **una sola** insignia.

### C5 · Distinguir «no hay datos» de «falló la consulta» (= B6, ya escalado)

- **Cómo afecta a esta pieza**: un fallo de lectura devuelve cero filas, así que el carrusel
  simplemente **no aparece** (E3) y la rejilla dice «Aún no hay comercios». **Le estamos
  diciendo al socio que su club está vacío cuando lo que pasó es que la base no respondió.**
  Se anota aquí porque condiciona mis estados; la propuesta está ya redactada en
  `SPEC-pantallas-miembros.md` §13-B6 y no se duplica.
- **Entretanto**: nada que esta spec pueda hacer, y queda escrito para que nadie lea E3 como
  diseño intencionado cuando en realidad fue un error de red.

### C6 · Nada más

Todo lo demás de esta spec —el selector y sus dos umbrales, las tres variantes de apoyo, la
cascada de la ranura inferior, los ocho estados, el montaje, el `?volver=` y el bloque nuevo
del esqueleto— cabe íntegramente en `src/app/miembros/**` (sin Server Actions),
`src/components/**`, `src/styles/**` y `src/lib/comercios/`.
