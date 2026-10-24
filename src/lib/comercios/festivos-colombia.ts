/**
 * Festivos de Colombia, calculados (Ley Emiliani, Ley 51 de 1983) para
 * cualquier año: no hay tabla que mantener a mano.
 *
 * Todo trabaja con fechas CIVILES 'YYYY-MM-DD' y se opera en UTC: ver
 * CLAUDE.md → «Fechas». Leer una fecha civil en la zona local la desplaza.
 */

const DIA_MS = 86_400_000

function aIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function utc(anio: number, mes: number, dia: number): number {
  return Date.UTC(anio, mes - 1, dia)
}

/** Domingo de Pascua (algoritmo gregoriano anónimo), en ms UTC. */
function pascua(anio: number): number {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return utc(anio, mes, dia)
}

/** Si ya es lunes se queda; si no, pasa al lunes siguiente. */
function alLunes(ms: number): number {
  const diaSemana = new Date(ms).getUTCDay() // 0 = domingo
  const falta = (8 - diaSemana) % 7
  return ms + falta * DIA_MS
}

/** Los festivos del año, ordenados, como fechas civiles. */
export function festivosColombia(anio: number): string[] {
  const p = pascua(anio)
  const fechas = [
    // Fijos
    utc(anio, 1, 1),
    utc(anio, 5, 1),
    utc(anio, 7, 20),
    utc(anio, 8, 7),
    utc(anio, 12, 8),
    utc(anio, 12, 25),
    // Trasladados al lunes siguiente
    alLunes(utc(anio, 1, 6)),
    alLunes(utc(anio, 3, 19)),
    alLunes(utc(anio, 6, 29)),
    alLunes(utc(anio, 8, 15)),
    alLunes(utc(anio, 10, 12)),
    alLunes(utc(anio, 11, 1)),
    alLunes(utc(anio, 11, 11)),
    // Semana Santa (no se traslada)
    p - 3 * DIA_MS,
    p - 2 * DIA_MS,
    // Dependen de la Pascua y pasan al lunes
    alLunes(p + 39 * DIA_MS),
    alLunes(p + 60 * DIA_MS),
    alLunes(p + 68 * DIA_MS),
  ]
  return fechas.sort((a, b) => a - b).map(aIso)
}

const CACHE = new Map<number, Set<string>>()

/** ¿Es festivo en Colombia esta fecha civil 'YYYY-MM-DD'? */
export function esFestivoColombia(fecha: string): boolean {
  const anio = Number(fecha.slice(0, 4))
  if (!Number.isInteger(anio)) return false
  let set = CACHE.get(anio)
  if (!set) {
    set = new Set(festivosColombia(anio))
    CACHE.set(anio, set)
  }
  return set.has(fecha)
}
