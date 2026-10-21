'use server'

/*
  EL COMERCIO RESPONDE (O QUITA SU RESPUESTA) A UNA RESEÑA
  ---------------------------------------------------------------------------
  Escribe con la `service_role`, así que lo que aquí se comprueba ES la
  política:

    · El comercio sale SIEMPRE de la sesión (`obtenerMiComercio`), nunca del
      formulario. Del formulario solo llega el id de la reseña.
    · La reseña se busca con `id = la del formulario` Y `comercio_id = el
      mío`. Con un id ajeno el UPDATE no casa ninguna fila; se pide
      `.select('id')` y, si no vuelve nada, se contesta «No se encontró la
      reseña.». Un id manipulado es un no-op, no una escritura.
    · Solo se toca `respuesta_comercio`; el trigger de la base fecha
      `respuesta_comercio_at` y, como estrellas y mensaje no cambian, no
      reevalúa compra ni membresía. `respuesta_admin` no se toca nunca.
*/

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerMiComercio } from '@/lib/comercios/comercio-sesion'
import { revisarRespuesta, type ResenaState } from '@/lib/resenas/resenas'
import { leerResenaId } from '@/lib/resenas/acciones'

const SIN_RESENA = 'No se encontró la reseña.'
const SIN_COMERCIO = 'Esta cuenta no está vinculada a ningún comercio.'

async function escribirRespuesta(
  formData: FormData,
  valor: (formData: FormData) => { ok: true; texto: string | null } | { ok: false; error: string },
  falloGenerico: string,
): Promise<ResenaState> {
  const mi = await obtenerMiComercio()
  if (!mi) return { error: SIN_COMERCIO }

  const resenaId = leerResenaId(formData.get('resena_id'))
  if (resenaId === null) return { error: SIN_RESENA }

  const v = valor(formData)
  if (!v.ok) return { error: v.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('resenas')
    .update({ respuesta_comercio: v.texto })
    .eq('id', resenaId)
    .eq('comercio_id', mi.id)
    .select('id')

  if (error) {
    console.error('[resenas] respuesta del comercio:', error)
    return { error: falloGenerico }
  }
  if (!data || data.length === 0) return { error: SIN_RESENA }

  revalidatePath('/comercios')
  return { ok: true }
}

/** Guarda (o reemplaza) la respuesta del comercio a una de sus reseñas. */
export async function responderResena(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  return escribirRespuesta(
    formData,
    (f) => {
      const crudo = f.get('respuesta')
      const r = revisarRespuesta(typeof crudo === 'string' ? crudo : '')
      return r.ok ? { ok: true, texto: r.respuesta } : { ok: false, error: r.error }
    },
    'No pudimos guardar tu respuesta. Inténtalo de nuevo.',
  )
}

/** Quita la respuesta del comercio (la reseña se queda). */
export async function quitarMiRespuesta(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  return escribirRespuesta(
    formData,
    () => ({ ok: true, texto: null }),
    'No pudimos quitar tu respuesta. Inténtalo de nuevo.',
  )
}
