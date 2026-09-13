import { createAdminClient } from '@/lib/supabase/admin'

/*
  Lecturas del pozo de números de registro. Las mutaciones (cargar un rango,
  eliminar un número libre, asignar uno al registrar) viven en las server
  actions; aquí solo las consultas que alimentan la pantalla de gestión y el
  formulario de alta.
*/

export type FiltroPozo = 'disponibles' | 'asignados' | 'todos'

export type NumeroRegistro = {
  numero: string
  /** Nombre del miembro si está asignado; `null` si está libre. */
  asignadoA: string | null
  creadoAt: string
}

export type ResumenPozo = {
  disponibles: number
  asignados: number
}

/** Techo de filas que la pantalla de gestión trae de una vez. */
const TOPE_LISTADO = 5000

/** Cuántos números hay libres y cuántos ya se entregaron. */
export async function resumirPozo(): Promise<ResumenPozo> {
  const admin = createAdminClient()
  const [{ count: disponibles }, { count: asignados }] = await Promise.all([
    admin
      .from('numeros_registro')
      .select('numero', { count: 'exact', head: true })
      .is('miembro_id', null),
    admin
      .from('numeros_registro')
      .select('numero', { count: 'exact', head: true })
      .not('miembro_id', 'is', null),
  ])
  return { disponibles: disponibles ?? 0, asignados: asignados ?? 0 }
}

type FilaConMiembro = {
  numero: string
  creado_at: string
  miembros: { nombres: string; apellidos: string } | { nombres: string; apellidos: string }[] | null
}

/** Números del pozo para la pantalla de gestión, ordenados y según el filtro. */
export async function listarNumerosRegistro(filtro: FiltroPozo): Promise<NumeroRegistro[]> {
  const admin = createAdminClient()

  let consulta = admin
    .from('numeros_registro')
    .select('numero, creado_at, miembros(nombres, apellidos)')
    .order('numero')
    .limit(TOPE_LISTADO)

  if (filtro === 'disponibles') consulta = consulta.is('miembro_id', null)
  if (filtro === 'asignados') consulta = consulta.not('miembro_id', 'is', null)

  const { data } = await consulta

  return ((data ?? []) as FilaConMiembro[]).map((fila) => {
    const rel = fila.miembros
    const m = Array.isArray(rel) ? rel[0] : rel
    return {
      numero: fila.numero,
      asignadoA: m ? `${m.nombres} ${m.apellidos}`.trim() : null,
      creadoAt: fila.creado_at,
    }
  })
}

/** Números libres (solo la cadena), para el desplegable del formulario de alta. */
export async function listarNumerosDisponibles(): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('numeros_registro')
    .select('numero')
    .is('miembro_id', null)
    .order('numero')
    .limit(TOPE_LISTADO)
  return (data ?? []).map((f) => f.numero)
}
