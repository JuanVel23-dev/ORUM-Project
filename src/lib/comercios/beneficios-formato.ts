import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

/** Texto amigable para mostrar un beneficio en el portal de miembros. */
export function formatearBeneficio(tipoCodigo: TipoBeneficioCodigo, valor: number | null): string {
  switch (tipoCodigo) {
    case 'porcentaje':
      return `${valor ?? 0}% de descuento`
    case 'monto_fijo':
      return `$${(valor ?? 0).toLocaleString('es-CO')} de descuento`
    case 'dos_por_uno':
      return '2x1'
    case 'regalo':
      return 'Regalo'
  }
}
