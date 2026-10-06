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

/**
 * Suma (o resta) días a una fecha CIVIL 'YYYY-MM-DD' y devuelve otra igual.
 * Se hace en UTC a propósito: una fecha civil no tiene hora, y leerla en
 * Bogotá (UTC−5) la retrasaría un día (CLAUDE.md → «Fechas»).
 */
export function sumarDiasISO(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

/** La hora del día (0–23) en America/Bogota, para un instante dado. */
export function horaBogota(instante: Date): number {
  const hora = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(instante)
  return Number(hora)
}

/** El saludo según la hora: de 5 a 11, días; de 12 a 18, tardes; el resto, noches. */
export function saludoPorHora(hora: number): 'Buenos días' | 'Buenas tardes' | 'Buenas noches' {
  if (hora >= 5 && hora < 12) return 'Buenos días'
  if (hora >= 12 && hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
