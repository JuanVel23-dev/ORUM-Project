/**
 * Fecha de hoy en formato 'YYYY-MM-DD' en la zona horaria del negocio
 * (America/Bogota), no la del servidor (que corre en UTC). Evita que
 * registros/renovaciones/ventas hechos por la tarde-noche salten al día
 * siguiente.
 */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

/**
 * Límite inferior del día `fecha` ('YYYY-MM-DD') en America/Bogota, como
 * timestamp ISO con offset explícito (-05:00, Colombia no tiene horario de
 * verano). Para comparar columnas `timestamptz` (p. ej. `ventas.fecha_hora`)
 * contra un rango de fechas de negocio: un string sin offset se interpreta
 * en la zona horaria de la sesión de Postgres (UTC), no en Bogotá, lo que
 * excluye registros hechos por la tarde-noche del "hoy" de negocio.
 */
export function inicioDiaBogota(fecha: string): string {
  return `${fecha}T00:00:00-05:00`
}

/** Límite superior del día `fecha` ('YYYY-MM-DD') en America/Bogota. Ver `inicioDiaBogota`. */
export function finDiaBogota(fecha: string): string {
  return `${fecha}T23:59:59.999-05:00`
}
