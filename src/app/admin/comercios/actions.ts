'use server'

import { mensajeDeError } from '@/lib/shared/errores'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth/auth'
import { enviarCorreoInvitacion } from '@/lib/correo/correo'
import { construirEnlaceActivacion, urlBaseSitio } from '@/lib/auth/activacion'

/** Verifica que quien ejecuta la acción sea super_admin. */
async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

export type CrearComercioState = {
  error?: string
  ok?: boolean
  email?: string
}

/**
 * Lee y valida los campos comunes de un comercio desde el formulario.
 *
 * `marca_id` NO se lee ni se escribe: el selector de marca se retiró del
 * formulario (era confuso para el admin y `marcas` no tiene pantalla propia).
 * Las columnas y los datos siguen en la base. Por eso `editarComercio` tampoco
 * lo incluye en su `update`: mandarlo vacío borraría la marca de los comercios
 * que ya la tienen.
 */
function leerCamposComercio(formData: FormData) {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null
  const categoriaRaw = String(formData.get('categoria_id') ?? '').trim()
  // Un interruptor apagado no envía nada: la ausencia ES el `false`.
  const indexable = formData.get('indexable') === 'on'
  return {
    nombre,
    descripcion,
    categoria_id: categoriaRaw ? Number(categoriaRaw) : null,
    indexable,
  }
}

/**
 * Crea un comercio: invitación de Auth (enlace de un solo uso, sin contraseña
 * que emailar ni mostrar) → upsert de `perfiles` (rol comercio) → insert en
 * `comercios`. Si algo falla, se revierte lo anterior.
 */
export async function crearComercio(
  _prev: CrearComercioState,
  formData: FormData,
): Promise<CrearComercioState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const email = String(formData.get('correo') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { error: 'Ingresa un correo electrónico válido.' }

  const campos = leerCamposComercio(formData)
  if (!campos.nombre) return { error: 'El nombre del comercio es obligatorio.' }

  const admin = createAdminClient()

  const { data: rol } = await admin.from('roles').select('id').eq('codigo', 'comercio').single()
  if (!rol) return { error: 'No se encontró el rol "comercio" en la base de datos.' }

  const { data: creado, error: errAuth } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: urlBaseSitio() },
  })
  if (errAuth || !creado?.user) {
    const msg = /already been registered|already registered|exists/i.test(errAuth?.message ?? '')
      ? 'Ya existe un usuario con ese correo.'
      : mensajeDeError('No se pudo crear el usuario', errAuth)
    return { error: msg }
  }
  const userId = creado.user.id

  const revertir = async () => {
    await admin.from('perfiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  const { error: errPerfil } = await admin
    .from('perfiles')
    .upsert({ id: userId, rol_id: rol.id, activo: true }, { onConflict: 'id' })
  if (errPerfil) {
    await revertir()
    return { error: mensajeDeError('No se pudo crear el perfil', errPerfil) }
  }

  const { error: errComercio } = await admin.from('comercios').insert({
    perfil_id: userId,
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    categoria_id: campos.categoria_id,
    indexable: campos.indexable,
    activo: true,
  })
  if (errComercio) {
    await revertir()
    return { error: mensajeDeError('No se pudo registrar el comercio', errComercio) }
  }

  await enviarCorreoInvitacion({
    nombre: campos.nombre,
    correo: email,
    urlInvitacion: construirEnlaceActivacion(
      urlBaseSitio(),
      'comercio',
      creado.properties.hashed_token,
      creado.properties.verification_type,
    ),
  })

  revalidatePath('/admin/comercios')
  return { ok: true, email }
}

export type EditarComercioState = { error?: string; ok?: boolean }

/**
 * Edita nombre, descripción, categoría, indexable y (si cambió) el correo.
 * El logo ya no se toca aquí: se sube como archivo desde la pestaña de imágenes.
 */
export async function editarComercio(
  _prev: EditarComercioState,
  formData: FormData,
): Promise<EditarComercioState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  const perfilId = String(formData.get('perfil_id') ?? '')
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposComercio(formData)
  if (!campos.nombre) return { error: 'El nombre del comercio es obligatorio.' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('comercios')
    .update({
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      categoria_id: campos.categoria_id,
      indexable: campos.indexable,
    })
    .eq('id', id)
  if (error) return { error: mensajeDeError('No se pudieron guardar los cambios', error) }

  const correo = String(formData.get('correo') ?? '').trim().toLowerCase()
  const correoOriginal = String(formData.get('correo_original') ?? '').trim().toLowerCase()
  if (perfilId && correo && correo !== correoOriginal) {
    if (!correo.includes('@')) return { error: 'El correo electrónico no es válido.' }
    const { error: errCorreo } = await admin.auth.admin.updateUserById(perfilId, {
      email: correo,
      email_confirm: true,
    })
    if (errCorreo) {
      const msg = /already been registered|already registered|exists/i.test(errCorreo.message)
        ? 'Ese correo ya está en uso por otro usuario.'
        : mensajeDeError('No se pudo actualizar el correo', errCorreo)
      return { error: msg }
    }
  }

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  revalidatePath('/sitemap.xml')
  return { ok: true }
}

/** Activa o desactiva el comercio como aliado (`comercios.activo`, D2). */
export async function cambiarEstadoComercio(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/comercios')

  const admin = createAdminClient()
  await admin.from('comercios').update({ activo: activar }).eq('id', id)

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  redirect(`/admin/comercios/${id}`)
}

/** Activa o desactiva el acceso a la cuenta del comercio (`perfiles.activo`, D2). */
export async function cambiarEstadoAccesoComercio(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const perfilId = String(formData.get('perfil_id') ?? '')
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1 || !perfilId) redirect('/admin/comercios')

  const admin = createAdminClient()
  await admin.from('perfiles').update({ activo: activar }).eq('id', perfilId)

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  redirect(`/admin/comercios/${id}`)
}
