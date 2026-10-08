'use server'

/*
  EL SOCIO CAMBIA SU PROPIA FOTO

  La regla que sostiene esta acción: el identificador del miembro NO se lee
  del formulario. Se deriva de la sesión. Si viniera del cliente, cualquiera
  podría cambiar la foto del carnet de otro socio enviando otro `id`, y ningún
  control de la interfaz lo impediría.

  La política de la base ya restringe la escritura a la carpeta propia; esto
  es la misma verdad expresada del lado de la aplicación, no un duplicado
  ocioso: aquí se usa el cliente `service_role`, que ignora RLS.
*/

import { mensajeDeError } from '@/lib/shared/errores'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import { borrarObjeto, borrarPorUrlPublica, subirImagen } from '@/lib/imagenes/subir'
import { BUCKET_AVATARES, nuevaClaveFoto, rutaFotoMiembro } from '@/lib/imagenes/rutas'
import { LIMITE_AVATARES } from '@/lib/imagenes/validacion'
import { CAMPO_DECLARACION, declaracionAceptada } from '@/lib/imagenes/derechos'
import type { EstadoSubida } from '@/lib/imagenes/estado'

export async function guardarMiFoto(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  // Redirige al acceso si no hay sesión de miembro. No hace falta comprobar
  // que la membresía esté vigente: cambiar la foto no es un beneficio.
  const perfil = await requireRolMiembro()

  // Antes de leer el archivo y de tocar Storage: sin declaración no se sube nada.
  if (!declaracionAceptada(formData.get(CAMPO_DECLARACION))) {
    return { error: 'Confirma que eres tú quien aparece en la foto y que tienes derecho a usarla.' }
  }

  const admin = createAdminClient()

  const { data: miembro } = await admin
    .from('miembros')
    .select('id, foto_url')
    .eq('perfil_id', perfil.userId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) return { error: 'No encontramos tu ficha de socio.' }

  // Una clave por subida: la ruta no se puede adivinar (ver `rutaFotoMiembro`).
  const clave = nuevaClaveFoto()
  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_AVATARES,
    ruta: (ext) => rutaFotoMiembro(miembro.id, ext, clave),
    limite: LIMITE_AVATARES,
  })
  if (!resultado.ok) return { error: resultado.error }

  const { error } = await admin
    .from('miembros')
    .update({ foto_url: resultado.url, foto_declaracion_at: new Date().toISOString() })
    .eq('id', miembro.id)

  if (error) {
    // La foto anterior sigue en el carnet: no hay estado a medias. La nueva,
    // ya subida, se borra para no dejar un archivo huérfano.
    await borrarObjeto(admin, BUCKET_AVATARES, resultado.ruta)
    return {
      error: mensajeDeError('Subimos la foto pero no pudimos guardarla en tu carnet', error, 'Se conserva la anterior.'),
    }
  }

  // Guardada la nueva, la anterior sobra. Se borra por la dirección que tenía.
  await borrarPorUrlPublica(admin, BUCKET_AVATARES, miembro.foto_url)

  await registrarCambioImagen(admin, {
    actorId: perfil.userId,
    entidad: 'miembro',
    entidadId: miembro.id,
    campo: 'foto_url',
    urlAnterior: miembro.foto_url,
    urlNueva: resultado.url,
    contexto: { origen: 'portal_miembro' },
  })

  revalidatePath('/miembros/perfil')
  // El carnet vive en el layout del portal: sin esto, al cerrar la ventana
  // seguiría enseñando la foto anterior hasta recargar.
  revalidatePath('/miembros', 'layout')
  revalidatePath(`/admin/miembros/${miembro.id}`)
  return { ok: true, url: resultado.url }
}
