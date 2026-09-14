/**
 * Favoritos del socio (encargo nº 3): parte pura.
 *
 * Aquí NO se consulta nada y no se escribe nada. La lectura vive en la página y
 * la escritura en la server action, que es la única que puede sacar el
 * `miembro_id` de la sesión.
 *
 * Lo que sí vive aquí: validar el id que llega del cliente, y decidir qué entra
 * en la estantería "Tus favoritos" y en "Los que más usas".
 */

/** Filas de `comercios_mas_usados`, reducidas a lo que esta capa necesita. */
export type FilaMasUsado = { comercio_id: number; usos: number }

/**
 * Cuántos comercios entran en cada estantería personal.
 *
 * Ocho, el mismo tope que el resto de carriles del portal salvo el de la
 * portada. Más allá el carril deja de ser un atajo y se convierte en una
 * segunda rejilla puesta de lado; y todo lo que sale aquí está también en la
 * rejilla de abajo, así que nada se pierde por recortar.
 */
export const TOPE_ESTANTERIA_PERSONAL = 8

/**
 * Cuántos pide la vista "Los que más usas" a la base.
 *
 * Más generoso que la estantería porque la vista SÍ es exhaustiva: es la lista
 * completa que el socio pidió ver, no un adelanto. Sigue acotado: nadie tiene
 * un historial de compras en cincuenta comercios distintos en un club de
 * beneficios, y un límite abierto convertiría una función de agregación en un
 * escaneo sin techo.
 */
export const TOPE_VISTA_MAS_USADOS = 50

/**
 * ¿Es un id de comercio plausible?
 *
 * Se aplica a lo que llega del NAVEGADOR, que no es de confianza ni viniendo de
 * un botón propio: la server action es un endpoint HTTP y se puede invocar a
 * mano. La política de la base vuelve a comprobarlo todo; esto solo evita
 * mandarle basura y evita un `NaN` convertido en `null` por PostgREST, que
 * borraría la fila equivocada.
 *
 * `Number.isSafeInteger` y no `isFinite`: `bigint` no es, pero `1e21` sí sería
 * finito y no cabe en un `integer` de Postgres.
 */
export function esIdComercioValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0
}

/**
 * Los favoritos que están en el catálogo cargado, en el orden en que llegan los
 * ids —o sea, lo último marcado primero— y como mucho `tope`.
 *
 * Un favorito cuyo comercio ya no está activo no sale, y eso es deliberado: la
 * fila de `favoritos` sigue existiendo (el socio no la borró), pero anunciar un
 * comercio que ya no atiende sería mandarlo a una puerta cerrada.
 */
export function seleccionarFavoritos<T extends { id: number }>(
  comercios: readonly T[],
  idsFavoritos: readonly number[],
  tope: number = TOPE_ESTANTERIA_PERSONAL,
): T[] {
  const porId = new Map(comercios.map((c) => [c.id, c]))
  const salida: T[] = []
  const vistos = new Set<number>()

  for (const id of idsFavoritos) {
    if (salida.length >= tope) break
    if (vistos.has(id)) continue
    vistos.add(id)
    const c = porId.get(id)
    if (c) salida.push(c)
  }

  return salida
}

/**
 * "Los que más usas": el top personal, en el orden que da la base y acotado.
 *
 * Descarta las filas sin usos por la misma razón que el top del club: una
 * sección que dice "los que más usas" con un comercio de cero visitas dentro
 * miente, y es el tipo de mentira que el socio detecta al instante porque habla
 * de su propia vida.
 */
export function seleccionarMasUsados<T extends { id: number }>(
  comercios: readonly T[],
  filas: readonly FilaMasUsado[] | null | undefined,
  tope: number = TOPE_ESTANTERIA_PERSONAL,
): T[] {
  if (!filas || filas.length === 0) return []
  return seleccionarFavoritos(
    comercios,
    filas.filter((f) => f.usos > 0).map((f) => f.comercio_id),
    tope,
  )
}
