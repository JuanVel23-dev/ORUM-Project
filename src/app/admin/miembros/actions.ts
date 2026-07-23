'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual, type PerfilActual } from '@/lib/auth'
import { generarPassword } from '@/lib/password'
import {
  generarNumeroMembresia,
  calcularFechaFin,
  calcularFechaInicioRenovacion,
} from '@/lib/membresias'

type Admin = ReturnType<typeof createAdminClient>

/** Devuelve el perfil del actor si es empleado o super_admin activo; si no, null. */
async function exigirEmpleadoOAdmin(): Promise<PerfilActual | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo) return null
  if (actor.rolCodigo !== 'empleado' && actor.rolCodigo !== 'super_admin') return null
  return actor
}

/** empleados.id del actor, o null si es super_admin sin fila en empleados (D5). */
async function resolverEmpleadoId(admin: Admin, perfilId: string): Promise<number | null> {
  const { data } = await admin
    .from('empleados')
    .select('id')
    .eq('perfil_id', perfilId)
    .is('deleted_at', null)
    .maybeSingle()
  return data?.id ?? null
}

export type RegistrarMiembroState = {
  error?: string
  ok?: boolean
  numero?: string
  password?: string
  nombre?: string
}

/** Fecha de hoy en formato 'YYYY-MM-DD' (zona del servidor). */
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Registra un cliente (miembro) junto con su PRIMERA membresía (tipo=nueva).
 * Flujo: validar → crear usuario en Auth (correo real) → upsert perfil (rol
 * miembro) → insertar miembro (con número único, reintentando ante colisión) →
 * insertar membresía. Revierte todo si algún paso falla.
 */
export async function registrarMiembro(
  _prev: RegistrarMiembroState,
  formData: FormData,
): Promise<RegistrarMiembroState> {
  const actor = await exigirEmpleadoOAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  // 1) Leer y validar campos.
  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase()
  const telefono = String(formData.get('telefono') ?? '').trim() || null
  const direccion = String(formData.get('direccion') ?? '').trim() || null
  const ciudadRaw = String(formData.get('ciudad_id') ?? '').trim()
  const ciudad_id = ciudadRaw ? Number(ciudadRaw) : null
  const plan_id = Number(formData.get('plan_id'))
  const precio_pagado = Number(formData.get('precio_pagado'))

  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }
  if (!correo || !correo.includes('@')) return { error: 'Ingresa un correo electrónico válido.' }
  if (!Number.isInteger(plan_id)) return { error: 'Selecciona un plan de membresía.' }
  if (!Number.isFinite(precio_pagado) || precio_pagado < 0) {
    return { error: 'El precio pagado debe ser un número mayor o igual a 0.' }
  }

  const admin = createAdminClient()

  // 2) Cédula única entre miembros no eliminados.
  const { data: cedulaExiste } = await admin
    .from('miembros')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .maybeSingle()
  if (cedulaExiste) return { error: `Ya existe un miembro con la cédula ${cedula}.` }

  // 3) Plan activo y no eliminado.
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }

  // 4) Rol miembro.
  const { data: rolMiembro } = await admin.from('roles').select('id').eq('codigo', 'miembro').single()
  if (!rolMiembro) return { error: 'No se encontró el rol "miembro" en la base de datos.' }

  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const password = generarPassword()

  // 5) Crear usuario en Auth con el correo real.
  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email: correo,
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

  // Compensación ante fallos posteriores.
  const revertir = async () => {
    await admin.from('miembros').delete().eq('perfil_id', userId)
    await admin.from('perfiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  // 6) Perfil (rol miembro).
  const { error: errPerfil } = await admin
    .from('perfiles')
    .upsert({ id: userId, rol_id: rolMiembro.id, activo: true }, { onConflict: 'id' })
  if (errPerfil) {
    await revertir()
    return { error: `No se pudo crear el perfil: ${errPerfil.message}` }
  }

  // 7) Insertar miembro con número único (reintentar ante colisión 23505).
  const { count } = await admin.from('miembros').select('id', { count: 'exact', head: true })
  const seq = (count ?? 0) + 1

  let numero = ''
  let miembroId: number | null = null
  for (let intento = 0; intento < 5; intento++) {
    numero = generarNumeroMembresia(seq)
    const { data: filaMiembro, error: errMiembro } = await admin
      .from('miembros')
      .insert({
        perfil_id: userId,
        numero_membresia: numero,
        nombres,
        apellidos,
        cedula,
        telefono,
        direccion,
        ciudad_id,
        registrado_por: empleadoId,
      })
      .select('id')
      .single()

    if (!errMiembro && filaMiembro) {
      miembroId = filaMiembro.id
      break
    }
    // 23505 = unique_violation (número repetido): reintentar con otra parte aleatoria.
    if (errMiembro && errMiembro.code !== '23505') {
      await revertir()
      return { error: `No se pudo registrar el miembro: ${errMiembro.message}` }
    }
  }
  if (miembroId === null) {
    await revertir()
    return { error: 'No se pudo generar un número de membresía único. Intenta de nuevo.' }
  }

  // 8) Primera membresía (nueva).
  const fecha_inicio = hoyISO()
  const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_meses)
  const { error: errMembresia } = await admin.from('membresias').insert({
    miembro_id: miembroId,
    plan_id,
    tipo: 'nueva',
    estado: 'activa',
    fecha_inicio,
    fecha_fin,
    precio_pagado,
    vendido_por: empleadoId,
  })
  if (errMembresia) {
    await revertir()
    return { error: `No se pudo registrar la membresía: ${errMembresia.message}` }
  }

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
}

export type RenovarState = { error?: string }

/**
 * Renueva la membresía de un miembro: crea una nueva (tipo=renovada) enlazada a
 * la vigente, marca la anterior como 'vencida' y deja solo una 'activa'.
 */
export async function renovarMembresia(
  _prev: RenovarState,
  formData: FormData,
): Promise<RenovarState> {
  const actor = await exigirEmpleadoOAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const miembro_id = Number(formData.get('miembro_id'))
  const plan_id = Number(formData.get('plan_id'))
  const precio_pagado = Number(formData.get('precio_pagado'))
  if (!Number.isInteger(miembro_id)) return { error: 'Falta el identificador del miembro.' }
  if (!Number.isInteger(plan_id)) return { error: 'Selecciona un plan de membresía.' }
  if (!Number.isFinite(precio_pagado) || precio_pagado < 0) {
    return { error: 'El precio pagado debe ser un número mayor o igual a 0.' }
  }

  const admin = createAdminClient()

  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }

  // Membresía vigente (activa), si existe.
  const { data: vigente } = await admin
    .from('membresias')
    .select('id, fecha_fin')
    .eq('miembro_id', miembro_id)
    .eq('estado', 'activa')
    .order('fecha_fin', { ascending: false })
    .limit(1)
    .maybeSingle()

  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const fecha_inicio = calcularFechaInicioRenovacion(hoyISO(), vigente?.fecha_fin ?? null)
  const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_meses)

  const { error: errNueva } = await admin.from('membresias').insert({
    miembro_id,
    plan_id,
    tipo: 'renovada',
    estado: 'activa',
    fecha_inicio,
    fecha_fin,
    precio_pagado,
    vendido_por: empleadoId,
    membresia_anterior_id: vigente?.id ?? null,
  })
  if (errNueva) return { error: `No se pudo registrar la renovación: ${errNueva.message}` }

  // La anterior pasa a 'vencida' para mantener una sola activa.
  if (vigente) {
    await admin.from('membresias').update({ estado: 'vencida' }).eq('id', vigente.id)
  }

  revalidatePath(`/admin/miembros/${miembro_id}`)
  return {}
}
