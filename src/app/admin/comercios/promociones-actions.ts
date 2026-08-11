'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth/auth'
import { validarValorPromocion } from '@/lib/comercios/promociones'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

export type PromocionState = { error?: string }

function leerCamposPromocion(formData: FormData):
  | {
      ok: true
      titulo: string
      descripcion: string | null
      tipo_beneficio_id: number
      valor: number | null
      fecha_inicio: string | null
      fecha_fin: string | null
    }
  | { ok: false; error: string } {
  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) return { ok: false, error: 'El título de la promoción es obligatorio.' }

  const tipoRaw = String(formData.get('tipo_beneficio_id') ?? '').trim()
  const tipo_beneficio_id = Number(tipoRaw)
  if (!Number.isInteger(tipo_beneficio_id) || tipo_beneficio_id < 1) {
    return { ok: false, error: 'Selecciona un tipo de beneficio.' }
  }

  const valorRaw = String(formData.get('valor') ?? '').trim()
  const valor = valorRaw ? Number(valorRaw) : null
  if (valorRaw && !Number.isFinite(valor)) return { ok: false, error: 'El valor debe ser un número.' }

  return {
    ok: true,
    titulo,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    tipo_beneficio_id,
    valor,
    fecha_inicio: String(formData.get('fecha_inicio') ?? '').trim() || null,
    fecha_fin: String(formData.get('fecha_fin') ?? '').trim() || null,
  }
}

export async function crearPromocion(_prev: PromocionState, formData: FormData): Promise<PromocionState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposPromocion(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()

  const { data: tipo } = await admin
    .from('tipos_beneficio')
    .select('id, codigo')
    .eq('id', campos.tipo_beneficio_id)
    .maybeSingle()
  if (!tipo) return { error: 'El tipo de beneficio seleccionado no existe.' }

  const validacion = validarValorPromocion(tipo.codigo as TipoBeneficioCodigo, campos.valor)
  if (!validacion.ok) return { error: validacion.error }

  const { error } = await admin.from('promociones').insert({
    comercio_id: comercioId,
    tipo_beneficio_id: campos.tipo_beneficio_id,
    titulo: campos.titulo,
    descripcion: campos.descripcion,
    valor: campos.valor,
    fecha_inicio: campos.fecha_inicio,
    fecha_fin: campos.fecha_fin,
    activo: true,
  })
  if (error) return { error: `No se pudo crear la promoción: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

export async function editarPromocion(_prev: PromocionState, formData: FormData): Promise<PromocionState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador de la promoción.' }
  if (!Number.isInteger(comercioId) || comercioId < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposPromocion(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()

  const { data: tipo } = await admin
    .from('tipos_beneficio')
    .select('id, codigo')
    .eq('id', campos.tipo_beneficio_id)
    .maybeSingle()
  if (!tipo) return { error: 'El tipo de beneficio seleccionado no existe.' }

  const validacion = validarValorPromocion(tipo.codigo as TipoBeneficioCodigo, campos.valor)
  if (!validacion.ok) return { error: validacion.error }

  const { error } = await admin
    .from('promociones')
    .update({
      tipo_beneficio_id: campos.tipo_beneficio_id,
      titulo: campos.titulo,
      descripcion: campos.descripcion,
      valor: campos.valor,
      fecha_inicio: campos.fecha_inicio,
      fecha_fin: campos.fecha_fin,
    })
    .eq('id', id)
    .eq('comercio_id', comercioId)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

/** Activa o desactiva una promoción (`promociones.activo`). */
export async function cambiarEstadoPromocion(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/comercios')
  if (!Number.isInteger(comercioId) || comercioId < 1) redirect('/admin/comercios')

  const admin = createAdminClient()
  const { error } = await admin.from('promociones').update({ activo: activar }).eq('id', id)

  if (!error) {
    revalidatePath(`/admin/comercios/${comercioId}`)
  }
  redirect(`/admin/comercios/${comercioId}`)
}
