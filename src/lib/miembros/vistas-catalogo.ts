/**
 * Las VISTAS del catálogo: qué conjunto de comercios se mira y en qué orden.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO ES UN EJE Y LA CATEGORÍA ES OTRO
 * ---------------------------------------------------------------------------
 * El encargo nº 10 pide elegir "por tipo de cosa: más recientes, más visitados,
 * favoritos, por categoría…". Puestos en una sola fila, eso se lee como cinco
 * opciones excluyentes del mismo rango, y no lo son: "Comida" y "Favoritos" se
 * pueden querer A LA VEZ, mientras que "Más recientes" y "Los que más usas" no.
 *
 * Así que son dos ejes y se subordinan en este orden:
 *
 *   1. VISTA     — qué conjunto miras y en qué orden. EXCLUYENTE. Vive arriba.
 *   2. CATEGORÍA — de qué tipo. Recorta lo que la vista ya eligió.
 *
 * La subordinación es asimétrica y por eso es la correcta: la categoría refina
 * cualquier vista ("tus favoritos de comida" es una frase con sentido), pero la
 * vista no refina una categoría ("comida de tus favoritos" es la misma frase
 * dicha al revés, y obligaría a la fila de categorías a saber de favoritos).
 *
 * Una vista es un par (conjunto + orden), no un ordenamiento suelto. Eso es lo
 * que permite que "Los que más usas" y "Tus favoritos" convivan aquí con "Más
 * recientes" sin mezclar ejes: los tres responden a la misma pregunta —«¿qué
 * lista quiero ver?»—, y ninguno responde a «¿de qué tipo?».
 *
 * Por qué "Los que más usas" NO puede ser un ordenamiento del catálogo entero:
 * `comercios_mas_usados` devuelve un top acotado, y un comercio sin ventas no
 * tiene valor de uso con el que ordenarse. Ordenar por algo que la mitad de las
 * filas no tiene no es ordenar, es inventar. Como conjunto sí es honesto.
 *
 * Todo esto es lógica pura: entran listas, salen listas. La fecha se recibe, no
 * se consulta.
 */

/** Las cuatro vistas. `todo` es el defecto y nunca aparece en la URL. */
export const VISTAS = ['todo', 'recientes', 'usados', 'favoritos'] as const

export type Vista = (typeof VISTAS)[number]

export const VISTA_POR_DEFECTO: Vista = 'todo'

/**
 * Lee `?ver=` de la URL. Entrada NO CONFIABLE: cualquiera puede escribir
 * `?ver=borrar-todo`.
 *
 * Un valor desconocido cae a `todo` en silencio, igual que hace el catálogo con
 * un `?categoria_id=abc`: el socio ve el catálogo completo, que es el peor caso
 * inofensivo. Fallar con error dejaría la pantalla en blanco por un parámetro
 * que probablemente venga de un enlace viejo.
 */
export function normalizarVista(valor: string | undefined | null): Vista {
  if (!valor) return VISTA_POR_DEFECTO
  return (VISTAS as readonly string[]).includes(valor) ? (valor as Vista) : VISTA_POR_DEFECTO
}

type ConIdYFecha = { id: number; createdAt: string | null }

/**
 * Marca de tiempo comparable. Una fecha ausente o ilegible se va al principio
 * de los tiempos para que NUNCA encabece "más recientes": un `null` arriba del
 * todo se leería como el comercio más nuevo del club, que es justo lo
 * contrario de lo que significa.
 */
function marcaDeTiempo(iso: string | null): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

/**
 * Aplica la vista sobre la lista ya filtrada por búsqueda, marca, ciudad y
 * categoría.
 *
 * - `todo`       → tal cual llega (la consulta ya la ordenó por nombre).
 * - `recientes`  → del más nuevo al más viejo.
 * - `favoritos`  → solo los marcados, en el orden en que llegan los ids
 *                  (la consulta los trae por `created_at` descendente: lo
 *                  último que marcaste, primero).
 * - `usados`     → solo los del top personal, **en el orden del top**, que es
 *                  el dato que la vista promete.
 *
 * Devuelve SIEMPRE un array nuevo: ordenar en el sitio mutaría la lista que la
 * página usa después para las estanterías.
 */
export function aplicarVista<T extends ConIdYFecha>(
  comercios: T[],
  vista: Vista,
  favoritos: readonly number[],
  masUsados: readonly number[],
): T[] {
  switch (vista) {
    case 'recientes':
      return [...comercios].sort((a, b) => marcaDeTiempo(b.createdAt) - marcaDeTiempo(a.createdAt))
    case 'favoritos':
      return ordenarPorIds(comercios, favoritos)
    case 'usados':
      return ordenarPorIds(comercios, masUsados)
    case 'todo':
      return [...comercios]
  }
}

/**
 * Los comercios cuyo id está en `ids`, **en el orden de `ids`** y sin repetir.
 *
 * Se recorre `ids` y no `comercios` porque el orden lo manda la lista de ids:
 * al revés se conservaría el orden alfabético de la consulta y la vista
 * mentiría sobre su criterio.
 *
 * Un id que no esté en `comercios` —un comercio desactivado, borrado o fuera
 * del filtro de categoría— simplemente no sale. No es un error: es lo que hace
 * que "tus favoritos de comida" funcione sin una consulta aparte.
 */
export function ordenarPorIds<T extends { id: number }>(
  comercios: T[],
  ids: readonly number[],
): T[] {
  const porId = new Map(comercios.map((c) => [c.id, c]))
  const salida: T[] = []
  const vistos = new Set<number>()

  for (const id of ids) {
    if (vistos.has(id)) continue
    vistos.add(id)
    const c = porId.get(id)
    if (c) salida.push(c)
  }

  return salida
}

/**
 * ¿Hay algo activo que convierta esta pantalla en un RESULTADO en vez de en la
 * portada del club?
 *
 * Es la puerta única de todo el contenido curado —portada, estanterías, top del
 * club—, y la vista cuenta: con `?ver=favoritos` el resultado ES el contenido, y
 * una selección al lado es exactamente la distracción que la regla ya evitaba
 * para la búsqueda.
 */
export function esCatalogoSinFiltrar(opciones: {
  busqueda: string
  marcaId: string | null | undefined
  ciudadId: string | null | undefined
  categoriaId: number | null
  vista: Vista
}): boolean {
  return (
    !opciones.busqueda &&
    !opciones.marcaId &&
    !opciones.ciudadId &&
    opciones.categoriaId === null &&
    opciones.vista === VISTA_POR_DEFECTO
  )
}
