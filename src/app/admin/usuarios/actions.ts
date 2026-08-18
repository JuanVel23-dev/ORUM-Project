'use server'

import { revalidatePath } from 'next/cache'
import { generarPassword } from '@/lib/shared/password'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth/auth'
import { enviarCorreoBienvenida } from '@/lib/correo/correo'
import type { RolCodigo } from '@/lib/supabase/database.types'

/** Tipos de usuario que el admin puede crear en esta sección. */
type TipoUsuario = 'super_admin' | 'empleado'
const TIPOS_VALIDOS: TipoUsuario[] = ['super_admin', 'empleado']

export type CrearUsuarioState = {
  error?: string
  ok?: boolean
  email?: string
  password?: string
}

/** Verifica que quien ejecuta la acción sea super_admin. */
async function exigirSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') {
    return null
  }
  return actor.userId
}

/**
 * Crea un usuario (empleado o administrador).
 * Flujo: crear usuario en Auth → upsert de `perfiles` → insertar en `empleados`.
 * Si algo falla, se revierte para no dejar datos a medias.
 */
export async function crearUsuario(
  _prev: CrearUsuarioState,
  formData: FormData
): Promise<CrearUsuarioState> {
  if (!(await exigirSuperAdmin())) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const tipo = String(formData.get('tipo') ?? '') as TipoUsuario
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!TIPOS_VALIDOS.includes(tipo)) return { error: 'Selecciona un tipo de usuario válido.' }
  if (!email || !email.includes('@')) return { error: 'Ingresa un correo electrónico válido.' }

  const admin = createAdminClient()

  const { data: rol } = await admin
    .from('roles')
    .select('id')
    .eq('codigo', tipo as RolCodigo)
    .single()
  if (!rol) return { error: `No se encontró el rol "${tipo}" en la base de datos.` }

  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }

  // La cédula es el identificador de negocio: no se puede repetir.
  const { data: yaExiste } = await admin
    .from('empleados')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .maybeSingle()
  if (yaExiste) return { error: `Ya existe un empleado registrado con la cédula ${cedula}.` }

  const datosEmpleado = {
    nombres,
    apellidos,
    cedula,
    telefono: String(formData.get('telefono') ?? '').trim() || null,
  }

  const password = generarPassword()

  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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

  const { error: errEmpleado } = await admin
    .from('empleados')
    .insert({ perfil_id: userId, ...datosEmpleado })
  if (errEmpleado) {
    await revertir()
    return { error: `No se pudo registrar el empleado: ${errEmpleado.message}` }
  }

  await enviarCorreoBienvenida({
    nombre: `${nombres} ${apellidos}`.trim(),
    correo: email,
    password,
    rol: 'staff',
  })

  revalidatePath('/admin/usuarios')
  return { ok: true, email, password }
}

export type EditarUsuarioState = { error?: string }

/**
 * Edita los datos de un empleado/administrador y, opcionalmente, su correo de
 * acceso. No cambia el rol. El identificador interno (perfil_id / UUID) nunca cambia.
 */
export async function editarUsuario(
  _prev: EditarUsuarioState,
  formData: FormData
): Promise<EditarUsuarioState> {
  if (!(await exigirSuperAdmin())) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const perfilId = String(formData.get('perfil_id') ?? '')
  if (!perfilId) return { error: 'Falta el identificador del usuario.' }

  const admin = createAdminClient()

  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }

  // Unicidad de cédula, excluyendo al propio usuario que se edita.
  const { data: yaExiste } = await admin
    .from('empleados')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .neq('perfil_id', perfilId)
    .maybeSingle()
  if (yaExiste) return { error: `Ya existe otro empleado con la cédula ${cedula}.` }

  const { error } = await admin
    .from('empleados')
    .update({
      nombres,
      apellidos,
      cedula,
      telefono: String(formData.get('telefono') ?? '').trim() || null,
    })
    .eq('perfil_id', perfilId)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const emailOriginal = String(formData.get('email_original') ?? '').trim().toLowerCase()
  if (email && email !== emailOriginal) {
    if (!email.includes('@')) return { error: 'El correo electrónico no es válido.' }
    const { error: errEmail } = await admin.auth.admin.updateUserById(perfilId, {
      email,
      email_confirm: true,
    })
    if (errEmail) {
      const msg = /already been registered|already registered|exists/i.test(errEmail.message)
        ? 'Ese correo ya está en uso por otro usuario.'
        : `No se pudo actualizar el correo: ${errEmail.message}`
      return { error: msg }
    }
  }

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}

/** Activa o desactiva el acceso de un usuario (perfiles.activo). */
export async function cambiarEstadoAcceso(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const perfilId = String(formData.get('perfil_id') ?? '')
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!perfilId) redirect('/admin/usuarios')

  const admin = createAdminClient()
  await admin.from('perfiles').update({ activo: activar }).eq('id', perfilId)

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}
