/*
  MOVER UNA PIEZA UN PUESTO  ·  puro
  ---------------------------------------------------------------------------
  Lo usan las listas que el administrador ordena con dos flechas: el carrusel
  de la portada y la galería de un comercio.
*/

/**
 * El orden que queda al mover una pieza un puesto: `-1` hacia el principio,
 * `1` hacia el final. Devuelve `null` si no hay nada que mover (la pieza no
 * está, o ya está en ese extremo).
 */
export function ordenTrasMover(
  ids: readonly number[],
  id: number,
  sentido: -1 | 1,
): number[] | null {
  const desde = ids.indexOf(id)
  const hasta = desde + sentido
  if (desde === -1 || hasta < 0 || hasta >= ids.length) return null
  const nuevo = [...ids]
  nuevo[desde] = ids[hasta]
  nuevo[hasta] = ids[desde]
  return nuevo
}
