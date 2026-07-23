import { randomInt } from 'node:crypto'

/**
 * Número de membresía de 8 dígitos: 4 secuenciales (orden del miembro) + 4
 * aleatorios. La parte secuencial identifica al miembro; la aleatoria evita que
 * sea adivinable. La unicidad se garantiza en BD (índice único) + reintento.
 *
 * @param seq        Correlativo del miembro (1, 2, 3, …).
 * @param aleatorio  Generador de la parte aleatoria (0–9999). Inyectable para pruebas.
 */
export function generarNumeroMembresia(
  seq: number,
  aleatorio: () => number = () => randomInt(0, 10000),
): string {
  const parteSeq = String(seq).padStart(4, '0').slice(-4)
  const parteRand = String(aleatorio() % 10000).padStart(4, '0')
  return parteSeq + parteRand
}

/** Suma `dias` a una fecha 'YYYY-MM-DD' y devuelve 'YYYY-MM-DD'. */
function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/**
 * Suma `duracionMeses` a `fechaInicio` ('YYYY-MM-DD'). Si el día no existe en el
 * mes destino (p. ej. 31 de enero + 1 mes), ajusta al último día de ese mes.
 */
export function calcularFechaFin(fechaInicio: string, duracionMeses: number): string {
  const [y, m, d] = fechaInicio.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  const objetivo = new Date(base)
  objetivo.setUTCMonth(objetivo.getUTCMonth() + duracionMeses)
  // Si el día se desbordó a otro mes, retroceder al último día del mes correcto.
  if (objetivo.getUTCDate() < d) {
    objetivo.setUTCDate(0)
  }
  return objetivo.toISOString().slice(0, 10)
}

/**
 * Fecha de inicio de una renovación: el día siguiente al fin de la membresía
 * vigente si aún no ha vencido (para no perder días pagados); si ya venció o no
 * hay anterior, empieza hoy. Todas las fechas en 'YYYY-MM-DD'.
 */
export function calcularFechaInicioRenovacion(hoy: string, finVigente: string | null): string {
  if (finVigente && finVigente >= hoy) {
    return sumarDias(finVigente, 1)
  }
  return hoy
}
