'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import type { MetodoRegistroVenta } from '@/lib/supabase/database.types'
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { hoyISO } from '@/lib/shared/fecha'

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

export type RegistrarVentaState = { error?: string; ok?: boolean }

/**
 * Registra la venta (RF-21/RF-22): valida que la sucursal y la promoción sean
 * del propio comercio, recalcula el descuento en servidor (no confía en el
 * valor que mandó el formulario) y luego inserta en `ventas`.
 */
export async function registrarVenta(
  _prev: RegistrarVentaState,
  formData: FormData,
): Promise<RegistrarVentaState> {
  const actor = await requireRolComercio()

  const miembroId = Number(formData.get('miembro_id'))
  const membresiaIdRaw = String(formData.get('membresia_id') ?? '')
  const membresiaId = membresiaIdRaw ? Number(membresiaIdRaw) : null
  const sucursalId = Number(formData.get('sucursal_id'))
  const promocionIdRaw = String(formData.get('promocion_id') ?? '')
  const promocionId = promocionIdRaw ? Number(promocionIdRaw) : null
  const metodoRegistro: MetodoRegistroVenta = formData.get('metodo_registro') === 'qr' ? 'qr' : 'numero'
  const valorCompra = Number(formData.get('valor_compra'))
  const valorDescuentoInput = Number(formData.get('valor_descuento'))

  if (!Number.isInteger(miembroId) || miembroId < 1) {
    return { error: 'Falta el identificador del miembro.' }
  }
  if (!Number.isInteger(sucursalId) || sucursalId < 1) {
    return { error: 'Selecciona la sucursal.' }
  }
  if (!Number.isFinite(valorCompra) || valorCompra < 0) {
    return { error: 'El valor de la compra debe ser un número mayor o igual a 0.' }
  }
  if (!Number.isFinite(valorDescuentoInput) || valorDescuentoInput < 0) {
    return { error: 'El valor del descuento debe ser un número mayor o igual a 0.' }
  }

  const supabase = await createClient()

  const { data: comercio } = await supabase
    .from('comercios')
    .select('id')
    .eq('perfil_id', actor.userId)
    .maybeSingle()
  if (!comercio) return { error: 'No se encontró el comercio asociado a esta cuenta.' }

  const { data: sucursal } = await supabase
    .from('sucursales')
    .select('id')
    .eq('id', sucursalId)
    .eq('comercio_id', comercio.id)
    .eq('activo', true)
    .maybeSingle()
  if (!sucursal) return { error: 'La sucursal seleccionada no es válida.' }

  let valorDescuento = 0
  if (promocionId) {
    const { data: promo } = await supabase
      .from('promociones')
      .select('id, comercio_id, tipo_beneficio_id, valor, activo, fecha_inicio, fecha_fin')
      .eq('id', promocionId)
      .maybeSingle()
    if (!promo || promo.comercio_id !== comercio.id) {
      return { error: 'La promoción seleccionada no es válida.' }
    }

    const { data: tipo } = await supabase
      .from('tipos_beneficio')
      .select('codigo')
      .eq('id', promo.tipo_beneficio_id)
      .single()

    if (!tipo || !esPromocionVigente(promo.activo, promo.fecha_inicio, promo.fecha_fin, hoyISO())) {
      return { error: 'Esa promoción ya no está vigente.' }
    }

    valorDescuento =
      tipo.codigo === 'porcentaje' || tipo.codigo === 'monto_fijo'
        ? calcularDescuento(tipo.codigo, promo.valor ?? 0, valorCompra)
        : valorDescuentoInput
  }

  const valorFinal = calcularValorFinal(valorCompra, valorDescuento)

  const { error: errVenta } = await supabase.from('ventas').insert({
    miembro_id: miembroId,
    membresia_id: membresiaId,
    sucursal_id: sucursalId,
    promocion_id: promocionId,
    valor_compra: valorCompra,
    valor_descuento: valorDescuento,
    valor_final: valorFinal,
    metodo_registro: metodoRegistro,
    registrada_por_perfil: actor.userId,
  })
  if (errVenta) return { error: `No se pudo registrar la venta: ${errVenta.message}` }

  return { ok: true }
}
