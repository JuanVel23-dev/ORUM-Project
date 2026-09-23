/**
 * Qué entra en cada estantería del catálogo, y sobre todo **cuándo no entra
 * ninguna**.
 *
 * Una estantería que repite la rejilla entera no comprime nada: la estorba. Y
 * un carrusel esconde contenido detrás de un gesto que mucha gente nunca hace,
 * así que en una pantalla cuyo propósito es descubrir, mal puesto REDUCE el
 * descubrimiento. De ahí los umbrales: son la condición para que deslizar sea
 * un atajo y no un peaje.
 *
 * Regla que estas funciones no pueden garantizar por sí solas y que la página
 * debe respetar: **nada alcanzable solo deslizando**. Todo lo que sale en una
 * estantería sale también en la rejilla, en la misma página. Por eso las
 * cabeceras no llevan "Ver todos": no habría a dónde ir que no fuera esta
 * misma URL, y un enlace que no lleva a ninguna parte es peor que ninguno.
 *
 * Funciones puras: entran datos, salen datos. Sin `Date.now()` dentro —la
 * fecha se recibe— para que se puedan probar.
 */

/** Mínimo de comercios en el resultado para que "Nuevos en el club" aparezca. */
export const MINIMO_CATALOGO_NOVEDADES = 8

/** De esos, cuántos tienen que ser realmente recientes. */
export const MINIMO_RECIENTES = 4

/** Hasta cuándo un comercio cuenta como "nuevo". */
export const DIAS_NOVEDAD = 90

/** Mínimo de promociones vigentes para que "Beneficios del momento" aparezca. */
export const MINIMO_PROMOCIONES_DESTACADAS = 3

/** Y en cuántos comercios distintos deben estar repartidas. */
export const MINIMO_COMERCIOS_CON_PROMOCION = 2

/** Ninguna estantería muestra más de esto. */
export const TOPE_ESTANTERIA = 10

const MS_POR_DIA = 24 * 60 * 60 * 1000

type ConFecha = { createdAt: string | null }
type ConPromociones = { promociones: unknown[] }

/**
 * "Nuevos en el club": los comercios más recientes, de más a menos.
 *
 * Devuelve lista vacía —o sea, la estantería no se renderiza— si el catálogo
 * es corto o si no hay novedades de verdad. Por debajo de
 * `MINIMO_CATALOGO_NOVEDADES` la rejilla completa cabe en dos pantallazos, y un
 * atajo hacia algo que ya está a un dedo de distancia no es un atajo.
 *
 * Es la única curaduría que este producto puede ofrecer con honestidad:
 * "Destacados" no existe porque ninguna tabla tiene columna de destacado,
 * orden ni prioridad, y ordenar por `id` no es destacar, es "insertado antes".
 */
export function seleccionarNovedades<T extends ConFecha>(comercios: T[], ahora: Date): T[] {
  if (comercios.length < MINIMO_CATALOGO_NOVEDADES) return []

  const corte = ahora.getTime() - DIAS_NOVEDAD * MS_POR_DIA
  const recientes = comercios.filter((c) => marcaDeTiempo(c.createdAt) >= corte)
  if (recientes.length < MINIMO_RECIENTES) return []

  return [...comercios]
    .sort((a, b) => marcaDeTiempo(b.createdAt) - marcaDeTiempo(a.createdAt))
    .slice(0, TOPE_ESTANTERIA)
}

/**
 * "Beneficios del momento": los comercios que hoy tienen algo que ofrecer.
 *
 * Con menos de `MINIMO_PROMOCIONES_DESTACADAS` promociones, o concentradas en
 * un solo comercio, la estantería sería una tarjeta y media: eso ya lo enseña
 * la rejilla mejor.
 */
export function seleccionarBeneficiosDelMomento<T extends ConPromociones>(
  comercios: T[],
): T[] {
  const conPromociones = comercios.filter((c) => c.promociones.length > 0)
  if (conPromociones.length < MINIMO_COMERCIOS_CON_PROMOCION) return []

  const total = conPromociones.reduce((suma, c) => suma + c.promociones.length, 0)
  if (total < MINIMO_PROMOCIONES_DESTACADAS) return []

  return conPromociones.slice(0, TOPE_ESTANTERIA)
}

/**
 * `created_at` llega como `timestamptz` de Postgres, no como fecha civil: se
 * interpreta como instante, no se recorta a 'YYYY-MM-DD'. Una fila sin fecha
 * —o con una ilegible— se trata como la más antigua posible en vez de romper
 * la ordenación con un `NaN`, que en un comparador deja el array en un orden
 * arbitrario y silencioso.
 */
function marcaDeTiempo(valor: string | null): number {
  if (!valor) return Number.NEGATIVE_INFINITY
  const ms = new Date(valor).getTime()
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms
}

/* ==========================================================================
   LA PORTADA  ·  "Conoce a tus aliados"
   --------------------------------------------------------------------------
   No es una tercera estantería. Las dos de arriba se quedaron los dos ejes
   temáticos honestos —novedad y beneficio vigente—, así que repetir uno de
   ellos sería enseñar la misma fila con otro rótulo.

   El criterio es otro: CUÁL DE ESTOS ALIADOS SE PUEDE MOSTRAR MEJOR HOY. Es lo
   que una portada necesita —una estantería necesita un tema; una portada,
   presentabilidad— y se calcula entero con datos que ya llegan al catálogo:
   cero consultas nuevas.

   "Destacado" como dato editorial NO EXISTE: ninguna tabla tiene columna de
   destacado, orden ni prioridad, y ordenar por `id` no es destacar, es
   "insertado antes". Por eso el encabezado no dice "Los mejores" ni "Selección
   del club": no hay columna que lo sostenga.
   ========================================================================== */

/**
 * Mínimo de destacados para que la portada se renderice.
 *
 * TRES, y no dos, por tres razones que se suman:
 *
 *  1. Geometría: dos tarjetas de 320px en un contenedor de ~1050px dejan
 *     ~390px de hueco a la derecha. Se lee como error de maquetación, no como
 *     selección.
 *  2. Aprendizaje del gesto: un deslizamiento que se agota en el primer
 *     empujón le enseña al dedo que ahí no hay nada, y ese aprendizaje se
 *     traslada a las estanterías de abajo.
 *  3. Honestidad: dos portadas no son una curaduría. Y el caso puede darse con
 *     un catálogo grande —40 comercios de los que solo 2 tienen logotipo
 *     resoluble—, donde una portada de dos TERGIVERSA el club.
 *
 * Lo que NO se hace para llegar a tres: bajar el filtro del logotipo. Tres
 * portadas de las que dos son una inicial sobre una placa es peor que ninguna
 * portada.
 */
export const MINIMO_DESTACADOS = 3

/**
 * Tope de la portada. SEIS, mientras `TOPE_ESTANTERIA` es diez, y la asimetría
 * es deliberada: una estantería es un atajo y puede ser larga; una portada es
 * una selección, y una selección de diez no selecciona.
 *
 * Además son hasta seis cubiertas grandes en la primera pantalla que ve el
 * socio —coste real de descarga y de composición— y cada una vuelve a salir
 * abajo en la rejilla: pasar de seis significa que el socio recorre diez
 * nombres dos veces en la misma página.
 */
export const TOPE_DESTACADOS = 6

/*
  Y por qué NO hay `MINIMO_CATALOGO_DESTACADOS` a imagen de las novedades:
  `MINIMO_CATALOGO_NOVEDADES = 8` existe porque una estantería es un ATAJO, y
  atajar hacia algo que ya está a un dedo de distancia no es atajar. La portada
  no es un atajo: su valor no viene de comprimir una lista larga, viene de que
  el club se vea como un club a primera vista. Con 4 aliados, la diferencia
  entre un portal que parece vacío y uno que parece curado es TODA
  presentación. Exigirle un catálogo de 8 dejaría la pieza sin entregar.

  No se armonizan los umbrales: el carrusel cuenta DESTACADOS, las estanterías
  cuentan CATÁLOGO. No son el mismo número porque no cumplen el mismo papel.
*/

type Presentable = ConFecha &
  ConPromociones & {
    nombre: string
    descripcion: string | null
    /** Ya resuelto por `resolverLogoComercio`: comercio -> marca -> null. */
    logoUrl: string | null
  }

/**
 * Los aliados de la portada, en el orden en que se muestran.
 *
 * **No recibe fecha, y no la necesita**: las promociones llegan ya filtradas a
 * vigentes por la página, y el criterio no tiene ningún corte temporal propio.
 * Una función pura sin reloj es una función que se prueba sin congelar el
 * tiempo.
 *
 * **Filtro de entrada, duro y sin puntuación**: hace falta logotipo resoluble.
 * Un comercio sin logotipo cae a la inicial sobre la placa, y una portada cuyo
 * protagonista es una letra no es una portada. La inicial sigue existiendo como
 * respaldo ante un logotipo que se rompe en ejecución, nunca como criterio de
 * selección.
 *
 * **Orden, en tres niveles explícitos:**
 *
 *  1. Con al menos un beneficio vigente, por NÚMERO de beneficios, de más a
 *     menos. Se cuentan, no se comparan: un 30 %, un 2x1 y un regalo no son la
 *     misma unidad (el porqué está escrito en `comercio-card.tsx`). Contar
 *     cuántos hay es una medida honesta; decidir cuál es "mejor", no.
 *  2. Sin beneficio pero con descripción: es la única frase que puede vender el
 *     comercio cuando no hay cifra, y es lo que rellena la ranura inferior de
 *     la tarjeta. Una tarjeta con frase está más terminada que una sin ella.
 *  3. El resto: tiene logotipo y nombre —suficiente para una portada,
 *     insuficiente para adelantar a los otros dos—.
 *
 * Dentro de cada nivel, `createdAt` descendente y, a igualdad, `nombre`
 * ascendente. `nombre` y NO `id` como desempate final: el orden tiene que ser
 * estable y reproducible entre renders, e `id` reintroduciría por la puerta de
 * atrás el "insertado antes" que este criterio rechaza.
 *
 * Devuelve lista vacía —o sea, la portada no se renderiza— por debajo de
 * `MINIMO_DESTACADOS`.
 */
export function seleccionarDestacados<T extends Presentable>(comercios: T[]): T[] {
  const presentables = comercios.filter((c) => tieneLogo(c.logoUrl))
  if (presentables.length < MINIMO_DESTACADOS) return []

  return [...presentables]
    .sort((a, b) => {
      const porNivel = nivelDePresentacion(a) - nivelDePresentacion(b)
      if (porNivel !== 0) return porNivel

      const porBeneficios = b.promociones.length - a.promociones.length
      if (porBeneficios !== 0) return porBeneficios

      const porFecha = marcaDeTiempo(b.createdAt) - marcaDeTiempo(a.createdAt)
      if (porFecha !== 0) return porFecha

      return a.nombre.localeCompare(b.nombre, 'es')
    })
    .slice(0, TOPE_DESTACADOS)
}

/**
 * La segunda línea de la cabecera, que **dice la verdad del criterio**.
 *
 * Tres variantes porque el criterio cambia con los datos, igual que
 * `construirVacio` tiene cuatro por la misma razón: decir siempre lo mismo
 * desperdicia la única información útil que tenemos.
 *
 * - **A** enuncia el criterio literal del nivel 1, y solo aparece cuando hay
 *   una cifra visible en la fila: nunca señala algo que el socio no pueda ver.
 * - **B** es el caso de hoy —4 comercios, 0 promociones vigentes— y es la
 *   respuesta honesta a la duplicación con la rejilla: si la portada contiene
 *   el club entero, lo dice. Fingir una "selección" de cuatro sobre cuatro
 *   sería la única mentira posible en esta pieza.
 * - **C** resuelve en copy la pregunta "¿por qué veo esto dos veces?" sin
 *   gastar un enlace: señala la rejilla, que está inmediatamente debajo.
 *
 * Sin cifras y sin punto final, como las dos estanterías. No se escribe
 * "Cuatro aliados…" aunque el conteo de la fila sea exacto: el socio lo leería
 * como "el club tiene cuatro", y un número que se puede malinterpretar en la
 * pantalla que debe generar confianza no vale los píxeles.
 */
export function apoyoDestacados(
  destacados: ConPromociones[],
  /** Cuántos comercios hay en el resultado completo, o sea en la rejilla. */
  comerciosDelResultado: number,
): string {
  if (destacados.some((c) => c.promociones.length > 0)) {
    return 'Empezamos por los que hoy tienen beneficio'
  }

  /* `>=` y no `===`: si alguien llamara con una fila que no sale de este
     resultado, la variante honesta sigue siendo "son todos" solo cuando no
     queda nada más abajo. Nunca promete una rejilla que no existe. */
  return destacados.length >= comerciosDelResultado
    ? 'Por ahora son todos, y seguimos sumando'
    : 'Aliados para conocer, y el resto está abajo'
}

/** 1 = con beneficio · 2 = con descripción · 3 = el resto. Ver `seleccionarDestacados`. */
function nivelDePresentacion(comercio: Presentable): number {
  if (comercio.promociones.length > 0) return 1
  if ((comercio.descripcion ?? '').trim() !== '') return 2
  return 3
}

/*
  `resolverLogoComercio` ya normaliza la cadena vacía a `null`, así que esta
  comprobación es redundante HOY. Se escribe igual porque el filtro de entrada
  de la portada es lo único que separa una fila de retratos de marca de una fila
  de iniciales: si mañana alguien alimenta el selector con `logo_url` en crudo
  —una columna que rellena un administrador a mano—, un solo espacio en blanco
  pasaría un `!== null` y la portada se degradaría sin que nada falle.
*/
function tieneLogo(logoUrl: string | null): boolean {
  return (logoUrl ?? '').trim() !== ''
}
