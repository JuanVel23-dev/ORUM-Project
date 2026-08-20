'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth/auth'
import { enviarCorreoInvitacion } from '@/lib/correo/correo'

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

/** Lee y valida los campos comunes de un comercio desde el formulario. */
function leerCamposComercio(formData: FormData) {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null
  const marcaRaw = String(formData.get('marca_id') ?? '').trim()
  const categoriaRaw = String(formData.get('categoria_id') ?? '').trim()
  const logo_url = String(formData.get('logo_url') ?? '').trim() || null
  return {
    nombre,
    descripcion,
    marca_id: marcaRaw ? Number(marcaRaw) : null,
    categoria_id: categoriaRaw ? Number(categoriaRaw) : null,
    logo_url,
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

  const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data: creado, error: errAuth } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${urlBase}/activar-cuenta?rol=comercio` },
  })
  if (errAuth || !creado?.user) {
    const msg = /already been registered|already registered|exists/i.test(errAuth?.message ?? '')
      ? 'Ya existe un usuario con ese correo.'
      : `No se pudo crear el usuario: ${errAuth?.message ?? 'error desconocido'}`
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
    return { error: `No se pudo crear el perfil: ${errPerfil.message}` }
  }

  const { error: errComercio } = await admin.from('comercios').insert({
    perfil_id: userId,
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    marca_id: campos.marca_id,
    categoria_id: campos.categoria_id,
    logo_url: campos.logo_url,
    activo: true,
  })
  if (errComercio) {
    await revertir()
    return { error: `No se pudo registrar el comercio: ${errComercio.message}` }
  }

  await enviarCorreoInvitacion({
    nombre: campos.nombre,
    correo: email,
    urlInvitacion: creado.properties.action_link,
  })

  revalidatePath('/admin/comercios')
  return { ok: true, email }
}

export type EditarComercioState = { error?: string }

/** Edita nombre, descripción, marca, categoría, logo_url y (si cambió) el correo. */
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
      marca_id: campos.marca_id,
      categoria_id: campos.categoria_id,
      logo_url: campos.logo_url,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

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
        : `No se pudo actualizar el correo: ${errCorreo.message}`
      return { error: msg }
    }
  }

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  redirect(`/admin/comercios/${id}`)
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
