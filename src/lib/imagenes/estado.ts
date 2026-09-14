/**
 * Estado que devuelve toda acción de subida de imagen.
 *
 * Vive en su propio archivo —y no junto a la acción— porque lo consume
 * también el control de cliente (`SubidaImagen`), y un archivo `'use server'`
 * solo puede exportar funciones asíncronas: un `export type` ahí obliga al
 * cliente a importar el módulo de servidor entero.
 */
export type EstadoSubida = {
  error?: string
  ok?: boolean
  /** URL resultante. La usa la vista previa para refrescarse sin recargar. */
  url?: string | null
}

export const ESTADO_SUBIDA_INICIAL: EstadoSubida = {}
