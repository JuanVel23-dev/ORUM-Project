'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'

async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

export type SucursalState = { error?: string }

/** Lee y valida los campos de sucursal. `nombre` obligatorio en app (D4). */
function leerCamposSucursal(formData: FormData):
  | { ok: true; nombre: string; direccion: string | null; telefono: string | null; ciudad_id: number }
  | { ok: false; error: string } {
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) return { ok: false, error: 'El nombre de la sucursal es obligatorio.' }

  const ciudadRaw = String(formData.get('ciudad_id') ?? '').trim()
  const ciudad_id = Number(ciudadRaw)
  if (!Number.isInteger(ciudad_id) || ciudad_id < 1) return { ok: false, error: 'Selecciona una ciudad.' }

  return {
    ok: true,
    nombre,
    direccion: String(formData.get('direccion') ?? '').trim() || null,
    telefono: String(formData.get('telefono') ?? '').trim() || null,
    ciudad_id,
  }
}

export async function crearSucursal(_prev: SucursalState, formData: FormData): Promise<SucursalState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposSucursal(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin.from('sucursales').insert({
    comercio_id: comercioId,
    nombre: campos.nombre,
    direccion: campos.direccion,
    telefono: campos.telefono,
    ciudad_id: campos.ciudad_id,
    activo: true,
  })
  if (error) return { error: `No se pudo crear la sucursal: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

export async function editarSucursal(_prev: SucursalState, formData: FormData): Promise<SucursalState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador de la sucursal.' }
  if (!Number.isInteger(comercioId) || comercioId < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposSucursal(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('sucursales')
    .update({
      nombre: campos.nombre,
      direccion: campos.direccion,
      telefono: campos.telefono,
      ciudad_id: campos.ciudad_id,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

/** Activa o desactiva una sucursal (`sucursales.activo`). */
export async function cambiarEstadoSucursal(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/comercios')
  if (!Number.isInteger(comercioId) || comercioId < 1) redirect('/admin/comercios')

  const admin = createAdminClient()
  const { error } = await admin.from('sucursales').update({ activo: activar }).eq('id', id)

  if (!error) {
    revalidatePath(`/admin/comercios/${comercioId}`)
  }
  redirect(`/admin/comercios/${comercioId}`)
}
