'use server'

/*
  IMAGEN DE UN ANUNCIO · archivo aparte, igual que imagenes-actions.ts de
  comercios: la subida de archivos es superficie nueva y se audita como tal.
*/

import { revalidatePath } from 'next/cache'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import { subirImagen } from '@/lib/imagenes/subir'
import { BUCKET_IMAGENES_ANUNCIOS, rutaImagenAnuncio } from '@/lib/imagenes/rutas'
import { LIMITE_IMAGENES_COMERCIOS } from '@/lib/imagenes/validacion'
import type { EstadoSubida } from '@/lib/imagenes/estado'

/** Mismo criterio que `exigirSuperAdmin` de `actions.ts`. No se relaja aquí. */
async function actorSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') return null
  return actor.userId
}

const SIN_PERMISO = 'No tienes permiso para realizar esta acción.'

function refrescar(anuncioId: number): void {
  revalidatePath('/admin/anuncios')
  revalidatePath(`/admin/anuncios/${anuncioId}/editar`)
  revalidatePath('/')
  revalidatePath('/novedades')
  revalidatePath('/miembros')
  revalidatePath('/miembros/novedades')
}

/**
 * Sustituye la imagen de un anuncio. La columna solo se escribe DESPUÉS de
 * que la subida haya ido bien: si Storage falla, `imagen_url` se queda
 * exactamente como estaba.
 */
export async function guardarImagenAnuncio(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const anuncioId = Number(formData.get('id'))
  if (!Number.isInteger(anuncioId) || anuncioId < 1) {
    return { error: 'Falta el identificador de la novedad.' }
  }

  const admin = createAdminClient()

  const { data: anuncio } = await admin
    .from('anuncios')
    .select('id, imagen_url')
    .eq('id', anuncioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!anuncio) return { error: 'La novedad ya no existe.' }

  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_IMAGENES_ANUNCIOS,
    ruta: (ext) => rutaImagenAnuncio(anuncioId, ext),
    limite: LIMITE_IMAGENES_COMERCIOS,
  })
  if (!resultado.ok) return { error: resultado.error }

  const { error } = await admin
    .from('anuncios')
    .update({ imagen_url: resultado.url })
    .eq('id', anuncioId)

  if (error) {
    return {
      error: `La imagen se subió pero no se pudo guardar en la novedad: ${error.message}. Se conserva la anterior.`,
    }
  }

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'anuncio',
    entidadId: anuncioId,
    campo: 'imagen_url',
    urlAnterior: anuncio.imagen_url,
    urlNueva: resultado.url,
  })

  refrescar(anuncioId)
  return { ok: true, url: resultado.url }
}
