'use server'

/*
  FOTO DEL SOCIO, DESDE EL PANEL

  `miembros.foto_url` y no `perfiles.avatar_url`: un miembro puede existir sin
  cuenta (`perfil_id` es nullable), y la foto tiene que poder estar antes que
  el acceso.

  Autorización: `super_admin` o `empleado` activos — el mismo criterio con el
  que `src/app/admin/miembros/actions.ts` deja registrar y editar miembros. Es
  quien atiende en el mostrador, que es donde se toma la foto.
*/

import { revalidatePath } from 'next/cache'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import { subirImagen } from '@/lib/imagenes/subir'
import { BUCKET_AVATARES, rutaFotoMiembro } from '@/lib/imagenes/rutas'
import { LIMITE_AVATARES } from '@/lib/imagenes/validacion'
import type { EstadoSubida } from '@/lib/imagenes/estado'

async function actorDelPanel(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo) return null
  if (actor.rolCodigo !== 'super_admin' && actor.rolCodigo !== 'empleado') return null
  return actor.userId
}

export async function guardarFotoMiembro(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorDelPanel()
  if (!actorId) return { error: 'No tienes permiso para realizar esta acción.' }

  const miembroId = Number(formData.get('id'))
  if (!Number.isInteger(miembroId) || miembroId < 1) {
    return { error: 'Falta el identificador del miembro.' }
  }

  const admin = createAdminClient()

  const { data: miembro } = await admin
    .from('miembros')
    .select('id, foto_url')
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) return { error: 'El miembro ya no existe.' }

  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_AVATARES,
    ruta: (ext) => rutaFotoMiembro(miembroId, ext),
    limite: LIMITE_AVATARES,
  })
  if (!resultado.ok) return { error: resultado.error }

  const { error } = await admin
    .from('miembros')
    .update({ foto_url: resultado.url })
    .eq('id', miembroId)

  if (error) {
    return {
      error: `La foto se subió pero no se pudo guardar en el miembro: ${error.message}. Se conserva la anterior.`,
    }
  }

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'miembro',
    entidadId: miembroId,
    campo: 'foto_url',
    urlAnterior: miembro.foto_url,
    urlNueva: resultado.url,
  })

  revalidatePath('/admin/miembros')
  revalidatePath(`/admin/miembros/${miembroId}`)
  revalidatePath(`/admin/miembros/${miembroId}/foto`)
  // El carnet del socio muestra esta misma foto.
  revalidatePath('/miembros/perfil')
  return { ok: true, url: resultado.url }
}
