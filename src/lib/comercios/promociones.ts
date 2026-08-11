import type { TipoBeneficioCodigo } from '../supabase/database.types'

export type ResultadoValidacion = { ok: true } | { ok: false; error: string }

/**
 * Valida `promociones.valor` según el tipo de beneficio (D5):
 * - porcentaje: obligatorio, 0 < valor <= 100.
 * - monto_fijo: obligatorio, valor > 0.
 * - dos_por_uno / regalo: debe quedar vacío (null).
 */
export function validarValorPromocion(
  tipoCodigo: TipoBeneficioCodigo,
  valor: number | null,
): ResultadoValidacion {
  if (tipoCodigo === 'porcentaje') {
    if (valor === null || !Number.isFinite(valor)) {
      return { ok: false, error: 'El porcentaje de descuento es obligatorio para este tipo de promoción.' }
    }
    if (valor <= 0 || valor > 100) {
      return { ok: false, error: 'El porcentaje debe ser mayor a 0 y menor o igual a 100.' }
    }
    return { ok: true }
  }

  if (tipoCodigo === 'monto_fijo') {
    if (valor === null || !Number.isFinite(valor)) {
      return { ok: false, error: 'El monto del descuento es obligatorio para este tipo de promoción.' }
    }
    if (valor <= 0) {
      return { ok: false, error: 'El monto debe ser mayor a 0.' }
    }
    return { ok: true }
  }

  // dos_por_uno y regalo no llevan valor.
  if (valor !== null) {
    return { ok: false, error: 'Este tipo de promoción no debe tener un valor.' }
  }
  return { ok: true }
}
