'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import type { MetodoRegistroVenta } from '@/lib/supabase/database.types'

export type MiembroEncontrado = {
  id: number
  nombreCompleto: string
  numeroMembresia: string
  vigente: boolean
  membresiaId: number | null
  planNombre: string | null
}

export type BuscarMiembroState = {
  error?: string
  miembro?: MiembroEncontrado
  metodo?: MetodoRegistroVenta
}

/** Busca un miembro por número de membresía vía la función segura `buscar_miembro_comercio` (RF-21/RF-22). */
export async function buscarMiembro(
  _prev: BuscarMiembroState,
  formData: FormData,
): Promise<BuscarMiembroState> {
  await requireRolComercio()

  const numero = String(formData.get('numero_membresia') ?? '').trim()
  const metodo: MetodoRegistroVenta = formData.get('metodo') === 'qr' ? 'qr' : 'numero'

  if (!/^\d{8}$/.test(numero)) {
    return { error: 'Ingresa un número de membresía válido (8 dígitos).' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('buscar_miembro_comercio', { p_numero: numero })
    .maybeSingle()

  if (error) {
    return { error: 'No se pudo verificar el miembro. Intenta de nuevo.' }
  }
  if (!data) {
    return { error: 'No se encontró un miembro con ese número.' }
  }

  return {
    metodo,
    miembro: {
      id: data.miembro_id,
      nombreCompleto: `${data.nombres} ${data.apellidos}`.trim(),
      numeroMembresia: data.numero_membresia,
      vigente: data.vigente,
      membresiaId: data.membresia_id,
      planNombre: data.plan_nombre,
    },
  }
}
