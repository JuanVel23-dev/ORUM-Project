'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'
import type { RolCodigo } from '@/lib/supabase/database.types'

/** Tipos de usuario que el admin puede crear en esta fase. */
type TipoUsuario = 'super_admin' | 'empleado' | 'comercio'
const TIPOS_VALIDOS: TipoUsuario[] = ['super_admin', 'empleado', 'comercio']

export type CrearUsuarioState = {
  error?: string
  ok?: boolean
  email?: string
  password?: string
}

/**
 * Genera una contraseña aleatoria segura, con al menos una minúscula, una
 * mayúscula, un número y un símbolo. Evita caracteres ambiguos (O/0, l/1).
 */
function generarPassword(longitud = 14): string {
  const minus = 'abcdefghijkmnpqrstuvwxyz'
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '23456789'
  const simbolos = '!@#$%*?-_'
  const todos = minus + mayus + nums + simbolos

  const elegir = (set: string) => set[randomInt(0, set.length)]

  const chars = [elegir(minus), elegir(mayus), elegir(nums), elegir(simbolos)]
  for (let i = chars.length; i < longitud; i++) chars.push(elegir(todos))

  // Mezcla (Fisher–Yates) para que los obligatorios no queden siempre al inicio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
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
 * Crea un usuario (empleado, administrador o comercio).
 * Flujo: crear usuario en Auth → upsert de `perfiles` → insertar en la tabla
 * específica. Si algo falla, se revierte para no dejar datos a medias.
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

  // Buscar el id del rol por su código.
  const { data: rol } = await admin
    .from('roles')
    .select('id')
    .eq('codigo', tipo as RolCodigo)
    .single()
  if (!rol) return { error: `No se encontró el rol "${tipo}" en la base de datos.` }

  // Validar campos específicos ANTES de crear el usuario en Auth.
  let datosEmpleado: { nombres: string; apellidos: string; cedula: string | null; telefono: string | null } | null =
    null
  let datosComercio: {
    nombre: string
    descripcion: string | null
    marca_id: number | null
    categoria_id: number | null
  } | null = null

  if (tipo === 'comercio') {
    const nombre = String(formData.get('comercio_nombre') ?? '').trim()
    if (!nombre) return { error: 'El nombre del comercio es obligatorio.' }
    const marca = String(formData.get('marca_id') ?? '').trim()
    const categoria = String(formData.get('categoria_id') ?? '').trim()
    datosComercio = {
      nombre,
      descripcion: String(formData.get('descripcion') ?? '').trim() || null,
      marca_id: marca ? Number(marca) : null,
      categoria_id: categoria ? Number(categoria) : null,
    }
  } else {
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

    datosEmpleado = {
      nombres,
      apellidos,
      cedula,
      telefono: String(formData.get('telefono') ?? '').trim() || null,
    }
  }

  const password = generarPassword()

  // 1) Crear usuario en Supabase Auth (confirmado, sin necesidad de correo).
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

  // Limpieza en caso de fallo posterior (borra perfil y usuario de Auth).
  const revertir = async () => {
    await admin.from('perfiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  // 2) Perfil (upsert: funciona exista o no un trigger que ya lo haya creado).
  const { error: errPerfil } = await admin
    .from('perfiles')
    .upsert({ id: userId, rol_id: rol.id, activo: true }, { onConflict: 'id' })
  if (errPerfil) {
    await revertir()
    return { error: `No se pudo crear el perfil: ${errPerfil.message}` }
  }

  // 3) Fila en la tabla específica.
  if (tipo === 'comercio' && datosComercio) {
    const { error: errComercio } = await admin
      .from('comercios')
      .insert({ perfil_id: userId, ...datosComercio })
    if (errComercio) {
      await revertir()
      return { error: `No se pudo registrar el comercio: ${errComercio.message}` }
    }
  } else if (datosEmpleado) {
    const { error: errEmpleado } = await admin
      .from('empleados')
      .insert({ perfil_id: userId, ...datosEmpleado })
    if (errEmpleado) {
      await revertir()
      return { error: `No se pudo registrar el empleado: ${errEmpleado.message}` }
    }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true, email, password }
}

export type EditarUsuarioState = { error?: string }

/**
 * Edita los datos de un usuario: nombres/cédula/teléfono (empleado) o nombre
 * (comercio), y opcionalmente el correo de acceso. No cambia el rol.
 * El identificador interno (perfil_id / UUID) nunca cambia.
 */
export async function editarUsuario(
  _prev: EditarUsuarioState,
  formData: FormData
): Promise<EditarUsuarioState> {
  if (!(await exigirSuperAdmin())) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const perfilId = String(formData.get('perfil_id') ?? '')
  const tipo = String(formData.get('tipo') ?? '')
  if (!perfilId) return { error: 'Falta el identificador del usuario.' }

  const admin = createAdminClient()

  if (tipo === 'comercio') {
    const nombre = String(formData.get('comercio_nombre') ?? '').trim()
    if (!nombre) return { error: 'El nombre del comercio es obligatorio.' }
    const { error } = await admin
      .from('comercios')
      .update({
        nombre,
        descripcion: String(formData.get('descripcion') ?? '').trim() || null,
      })
      .eq('perfil_id', perfilId)
    if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }
  } else {
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
  }

  // Correo (editable): solo se actualiza si cambió.
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
