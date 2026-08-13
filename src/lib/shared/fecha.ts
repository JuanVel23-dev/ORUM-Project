/**
 * Fecha de hoy en formato 'YYYY-MM-DD' en la zona horaria del negocio
 * (America/Bogota), no la del servidor (que corre en UTC). Evita que
 * registros/renovaciones/ventas hechos por la tarde-noche salten al día
 * siguiente.
 */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}
