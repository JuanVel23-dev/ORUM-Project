'use server'

/*
  MODERACIÓN DE RESEÑAS  ·  solo el super administrador
  ---------------------------------------------------------------------------
  Escriben con la `service_role`, así que lo que aquí se comprueba ES la
  política:

    · `exigirSuperAdmin()` al entrar: un empleado (o nadie) no pasa. El actor
      de la bitácora sale de la sesión, nunca del formulario.
    · Los dos ids llegan del formulario (entrada no confiable) y se leen
      estrictos. Cada escritura filtra por `id` Y `comercio_id`: un par
      manipulado no casa ninguna fila, y se pide `.select('id')` para
      contestar «No se encontró la reseña.» en vez de dar por buena una
      escritura que no ocurrió.
    · La bitácora guarda QUIÉN hizo QUÉ sobre QUÉ reseña y de qué comercio,
      jamás el texto ni el autor. Es de mejor esfuerzo, como
      `registrarActividad`: si falla se registra y no se deshace la acción.
    · Solo se toca `respuesta_admin` (el trigger de la base fecha
      `respuesta_admin_at`); `respuesta_comercio` no se toca nunca.
*/

import { revalidatePath } from 'next/cache'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { leerComercioId, leerResenaId } from '@/lib/resenas/acciones'
import { revisarRespuesta, type ResenaState } from '@/lib/resenas/resenas'

const SIN_PERMISO = 'No tienes permiso para realizar esta acción.'
const SIN_RESENA = 'No se encontró la reseña.'

async function exigirSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  return actor && actor.activo && actor.rolCodigo === 'super_admin' ? actor.userId : null
}

type Ids = { resenaId: number; comercioId: number }

function leerIds(formData: FormData): Ids | null {
  const resenaId = leerResenaId(formData.get('resena_id'))
  const comercioId = leerComercioId(formData.get('comercio_id'))
  return resenaId === null || comercioId === null ? null : { resenaId, comercioId }
}

async function anotar(
  actorId: string,
  accion: 'eliminar' | 'responder' | 'quitar_respuesta',
  { resenaId, comercioId }: Ids,
) {
  const { error } = await createAdminClient()
    .from('bitacora_actividad')
    .insert({
      actor_id: actorId,
      accion,
      entidad: 'resena',
      entidad_id: resenaId,
      ...(accion === 'eliminar'
        ? { datos_anteriores: { comercio_id: comercioId } }
        : { datos_nuevos: { comercio_id: comercioId } }),
    })
  if (error) console.error('[resenas] bitácora:', error)
}

async function escribirRespuestaAdmin(
  formData: FormData,
  accion: 'responder' | 'quitar_respuesta',
  valor: (formData: FormData) => { ok: true; texto: string | null } | { ok: false; error: string },
  falloGenerico: string,
): Promise<ResenaState> {
  const actorId = await exigirSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const ids = leerIds(formData)
  if (!ids) return { error: SIN_RESENA }

  const v = valor(formData)
  if (!v.ok) return { error: v.error }

  const { data, error } = await createAdminClient()
    .from('resenas')
    .update({ respuesta_admin: v.texto })
    .eq('id', ids.resenaId)
    .eq('comercio_id', ids.comercioId)
    .select('id')

  if (error) {
    console.error('[resenas] respuesta de ORUM:', error)
    return { error: falloGenerico }
  }
  if (!data || data.length === 0) return { error: SIN_RESENA }

  await anotar(actorId, accion, ids)
  revalidatePath(`/admin/comercios/${ids.comercioId}`)
  return { ok: true }
}

/** Guarda (o reemplaza) la respuesta de ORUM a una reseña. */
export async function responderComoAdmin(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  return escribirRespuestaAdmin(
    formData,
    'responder',
    (f) => {
      const crudo = f.get('respuesta')
      const r = revisarRespuesta(typeof crudo === 'string' ? crudo : '')
      return r.ok ? { ok: true, texto: r.respuesta } : { ok: false, error: r.error }
    },
    'No pudimos guardar la respuesta. Inténtalo de nuevo.',
  )
}

/** Quita la respuesta de ORUM (la reseña se queda). */
export async function quitarRespuestaAdmin(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  return escribirRespuestaAdmin(
    formData,
    'quitar_respuesta',
    () => ({ ok: true, texto: null }),
    'No pudimos quitar la respuesta. Inténtalo de nuevo.',
  )
}

/** Borra la reseña para siempre. No se puede deshacer. */
export async function eliminarResena(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  const actorId = await exigirSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const ids = leerIds(formData)
  if (!ids) return { error: SIN_RESENA }

  const { data, error } = await createAdminClient()
    .from('resenas')
    .delete()
    .eq('id', ids.resenaId)
    .eq('comercio_id', ids.comercioId)
    .select('id')

  if (error) {
    console.error('[resenas] eliminar:', error)
    return { error: 'No pudimos eliminar la reseña. Inténtalo de nuevo.' }
  }
  if (!data || data.length === 0) return { error: SIN_RESENA }

  await anotar(actorId, 'eliminar', ids)
  revalidatePath(`/admin/comercios/${ids.comercioId}`)
  return { ok: true }
}
