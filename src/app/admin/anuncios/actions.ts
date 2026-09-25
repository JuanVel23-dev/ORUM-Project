'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth/auth'

export type AnuncioState = { error?: string; ok?: boolean }

const TITULO_MAXIMO = 120
const CUERPO_MAXIMO = 600

/** Verifica que quien ejecuta la acción sea super_admin. Calcado de planes/actions.ts. */
async function exigirSuperAdmin(): Promise<{ actorId: string } | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') return null
  return { actorId: actor.userId }
}

/** Refresca las cuatro superficies que leen anuncios. */
function refrescar(): void {
  revalidatePath('/admin/anuncios')
  revalidatePath('/')
  revalidatePath('/novedades')
  revalidatePath('/miembros')
  revalidatePath('/miembros/novedades')
}

/** Lee y valida los campos comunes de un anuncio desde el formulario. */
function leerCampos(formData: FormData):
  | {
      ok: true
      titulo: string
      cuerpo: string
      mostrarPublico: boolean
      mostrarMiembros: boolean
    }
  | { ok: false; error: string } {
  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) return { ok: false, error: 'El título es obligatorio.' }
  if (titulo.length > TITULO_MAXIMO) {
    return { ok: false, error: `El título no puede pasar de ${TITULO_MAXIMO} caracteres.` }
  }

  const cuerpo = String(formData.get('cuerpo') ?? '').trim()
  if (!cuerpo) return { ok: false, error: 'El cuerpo es obligatorio.' }
  if (cuerpo.length > CUERPO_MAXIMO) {
    return { ok: false, error: `El cuerpo no puede pasar de ${CUERPO_MAXIMO} caracteres.` }
  }

  const mostrarPublico = formData.get('mostrar_publico') === 'true'
  const mostrarMiembros = formData.get('mostrar_miembros') === 'true'
  if (!mostrarPublico && !mostrarMiembros) {
    return { ok: false, error: 'Elige al menos un portal donde mostrarla.' }
  }

  return { ok: true, titulo, cuerpo, mostrarPublico, mostrarMiembros }
}

export async function crearAnuncio(_prev: AnuncioState, formData: FormData): Promise<AnuncioState> {
  const actor = await exigirSuperAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin.from('anuncios').insert({
    titulo: campos.titulo,
    cuerpo: campos.cuerpo,
    mostrar_publico: campos.mostrarPublico,
    mostrar_miembros: campos.mostrarMiembros,
    activo: true,
    creado_por: actor.actorId,
  })
  if (error) return { error: `No se pudo crear la novedad: ${error.message}` }

  refrescar()
  return { ok: true }
}

export async function editarAnuncio(_prev: AnuncioState, formData: FormData): Promise<AnuncioState> {
  const actor = await exigirSuperAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador de la novedad.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('anuncios')
    .update({
      titulo: campos.titulo,
      cuerpo: campos.cuerpo,
      mostrar_publico: campos.mostrarPublico,
      mostrar_miembros: campos.mostrarMiembros,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  refrescar()
  return { ok: true }
}

/** Activa o desactiva un anuncio (anuncios.activo). Calcado de cambiarEstadoPlan. */
export async function cambiarEstadoAnuncio(formData: FormData): Promise<void> {
  const actor = await exigirSuperAdmin()
  if (!actor) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/anuncios')

  const admin = createAdminClient()
  await admin.from('anuncios').update({ activo: activar }).eq('id', id)

  refrescar()
  redirect('/admin/anuncios')
}
