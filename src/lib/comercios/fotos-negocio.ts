/*
  LAS FOTOS DEL NEGOCIO  ·  el tope y su cuenta (puro)
  ---------------------------------------------------------------------------
  Encargo del propietario (04/10/2026): el comercio cambia su logotipo y sus
  fotografías desde su portal, y «máximo pueda poner 8 fotografías».

  Las fotos de un comercio viven en dos sitios de la base, y los dos cuentan:

    · LA PORTADA — `comercios.portada_url`. Una sola: la foto grande de la
      ficha y la de la tarjeta del directorio.
    · LA GALERÍA — las filas de `comercio_imagenes`.

  El tope es del TOTAL: la portada y hasta siete más, o ninguna portada y
  ocho de galería. El logotipo no cuenta: no es una fotografía.

  Vive aquí, y no en el componente ni en la acción, porque lo necesitan los
  dos y tienen que decir el mismo número: la interfaz para no ofrecer una
  novena, y el servidor para rechazarla si alguien la manda igualmente.
*/

export const TOPE_FOTOS_NEGOCIO = 8

/** Una pieza de la galería, tal como la necesita la interfaz. */
export type FotoNegocio = { id: number; url: string }

/** Cuántas fotos tiene ya el comercio, contando la portada. */
export function fotosUsadas(portadaUrl: string | null, enGaleria: number): number {
  return (portadaUrl ? 1 : 0) + Math.max(0, enGaleria)
}

/** Cuántas más puede añadir. Nunca negativo, aunque el panel haya subido de más. */
export function cuposLibres(portadaUrl: string | null, enGaleria: number): number {
  return Math.max(0, TOPE_FOTOS_NEGOCIO - fotosUsadas(portadaUrl, enGaleria))
}
