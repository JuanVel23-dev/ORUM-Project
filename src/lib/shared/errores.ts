/*
  Qué le decimos al usuario cuando la base de datos falla.

  El `message` de un error de Postgres / PostgREST nombra tablas, columnas y
  restricciones («duplicate key value violates unique constraint
  "miembros_cedula_key"»): a quien lo lee no le sirve y a quien busca puntos
  débiles le dibuja el esquema. El detalle va al log del servidor, que es donde
  lo necesita quien depura; al usuario le llega una frase que dice qué falló.

  La única excepción son los mensajes que el propio proyecto escribe en la base
  con `raise exception` (SQLSTATE `P0001`), como los de `fn_validar_venta`:
  están redactados para una persona («La promocion ya no esta vigente») y es
  justo lo que el cajero necesita ver.
*/

/** SQLSTATE que Postgres asigna a un `raise exception` sin código propio. */
const CODIGO_RAISE = 'P0001'

type ErrorDeBase = { message?: string; code?: string } | null | undefined

/**
 * Frase para el usuario a partir de un error de la base.
 *
 * @param prefijo  Qué se intentaba hacer, sin punto final: «No se pudo crear el plan».
 * @param error    El error tal como lo devuelve Supabase.
 * @param sufijo   Frase que sigue, para lo que el usuario puede hacer: «Se conserva la anterior.».
 */
export function mensajeDeError(prefijo: string, error: ErrorDeBase, sufijo = ''): string {
  console.error(`[bd] ${prefijo}`, error)

  const propio = error?.code === CODIGO_RAISE && error.message ? error.message.trim() : ''
  const base = propio ? `${prefijo}: ${propio}` : prefijo
  const cerrada = /[.!?]$/.test(base) ? base : `${base}.`

  return sufijo ? `${cerrada} ${sufijo}` : cerrada
}
