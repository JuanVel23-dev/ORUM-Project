import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { normalizarHora, type DiaHorario, type HorarioSucursal } from './horario'

type Cliente = SupabaseClient<Database>

type FilaBase = Database['public']['Tables']['sucursal_horarios']['Row']

function aDiaHorario(f: FilaBase): DiaHorario {
  return {
    dia: f.dia,
    abre: normalizarHora(f.abre),
    cierra: normalizarHora(f.cierra),
    almuerzoDesde: normalizarHora(f.almuerzo_desde),
    almuerzoHasta: normalizarHora(f.almuerzo_hasta),
  }
}

/**
 * Los horarios de varias sucursales, por id. NUNCA lanza: si la tabla no
 * existe (el esquema se aplica a mano y el código puede llegar antes) o la
 * consulta falla, devuelve un mapa vacío y las fichas se pintan sin horario,
 * que es la verdad.
 */
export async function leerHorariosDeSucursales(
  cliente: Cliente,
  ids: readonly number[],
): Promise<Map<number, HorarioSucursal>> {
  const porSucursal = new Map<number, HorarioSucursal>()
  if (ids.length === 0) return porSucursal

  const { data, error } = await cliente
    .from('sucursal_horarios')
    .select('sucursal_id, dia, abre, cierra, almuerzo_desde, almuerzo_hasta')
    .in('sucursal_id', [...ids])
    .order('dia')
    .limit(ids.length * 8)
  if (error || !data) return porSucursal

  for (const fila of data) {
    const lista = porSucursal.get(fila.sucursal_id) ?? []
    lista.push(aDiaHorario(fila))
    porSucursal.set(fila.sucursal_id, lista)
  }
  return porSucursal
}

/** El horario de una sucursal; `[]` si no tiene o la tabla no existe. */
export async function leerHorarioDeSucursal(
  cliente: Cliente,
  sucursalId: number,
): Promise<HorarioSucursal> {
  const mapa = await leerHorariosDeSucursales(cliente, [sucursalId])
  return mapa.get(sucursalId) ?? []
}
