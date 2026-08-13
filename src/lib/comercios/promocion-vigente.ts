/**
 * Vigencia de una promoción: debe estar activa y, si tiene fechas límite, hoy
 * debe caer dentro del rango. Fechas nulas = sin límite. Formato 'YYYY-MM-DD'.
 */
export function esPromocionVigente(
  activo: boolean,
  fechaInicio: string | null,
  fechaFin: string | null,
  hoy: string,
): boolean {
  if (!activo) return false
  if (fechaInicio && hoy < fechaInicio) return false
  if (fechaFin && hoy > fechaFin) return false
  return true
}
