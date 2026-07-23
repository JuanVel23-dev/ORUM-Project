'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'

export type PlanState = { error?: string }

/** Verifica que quien ejecuta la acción sea super_admin. */
async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

/** Lee y valida los campos comunes de un plan desde el formulario. */
function leerCampos(formData: FormData):
  | { ok: true; nombre: string; descripcion: string | null; precio: number; duracion: number }
  | { ok: false; error: string } {
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) return { ok: false, error: 'El nombre del plan es obligatorio.' }

  const precio = Number(formData.get('precio'))
  if (!Number.isFinite(precio) || precio < 0) {
    return { ok: false, error: 'El precio debe ser un número mayor o igual a 0.' }
  }

  const duracion = Number(formData.get('duracion_meses'))
  if (!Number.isInteger(duracion) || duracion < 1) {
    return { ok: false, error: 'La duración debe ser un número entero de meses (mínimo 1).' }
  }

  return {
    ok: true,
    nombre,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    precio,
    duracion,
  }
}

export async function crearPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin.from('planes_membresia').insert({
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    precio: campos.precio,
    duracion_meses: campos.duracion,
    activo: true,
  })
  if (error) return { error: `No se pudo crear el plan: ${error.message}` }

  revalidatePath('/admin/planes')
  redirect('/admin/planes')
}

export async function editarPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return { error: 'Falta el identificador del plan.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('planes_membresia')
    .update({
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      precio: campos.precio,
      duracion_meses: campos.duracion,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  revalidatePath('/admin/planes')
  redirect('/admin/planes')
}

/** Activa o desactiva un plan (planes_membresia.activo). */
export async function cambiarEstadoPlan(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id)) redirect('/admin/planes')

  const admin = createAdminClient()
  await admin.from('planes_membresia').update({ activo: activar }).eq('id', id)

  revalidatePath('/admin/planes')
  redirect('/admin/planes')
}
