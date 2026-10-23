/**
 * Días de la semana en que vale una promoción (`promociones.dias_semana`).
 *
 * Numeración ISO: lunes = 1 … domingo = 7, la misma de `extract(isodow …)` en
 * Postgres, que es con la que la base repite esta comprobación. `null` =
 * sin restricción, vale todos los días.
 */
export type DiasPromocion = number[] | null

export const DIAS_SEMANA = [
  { numero: 1, corto: 'Lun', largo: 'lunes' },
  { numero: 2, corto: 'Mar', largo: 'martes' },
  { numero: 3, corto: 'Mié', largo: 'miércoles' },
  { numero: 4, corto: 'Jue', largo: 'jueves' },
  { numero: 5, corto: 'Vie', largo: 'viernes' },
  { numero: 6, corto: 'Sáb', largo: 'sábado' },
  { numero: 7, corto: 'Dom', largo: 'domingo' },
] as const

/** Día de la semana ISO (1–7) de una fecha CIVIL 'YYYY-MM-DD'. Se lee en UTC: ver CLAUDE.md → «Fechas». */
export function diaDeSemanaISO(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaJs = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() // 0 = domingo
  return diaJs === 0 ? 7 : diaJs
}

/**
 * Deja la lista en su forma guardada: ordenada, sin repetidos y solo con días
 * 1–7. Vacía, o con los siete días, es «sin restricción» (`null`): guardar
 * las dos cosas distintas haría que la misma promoción se viera de dos modos.
 */
export function normalizarDias(dias: readonly number[] | null | undefined): DiasPromocion {
  if (!dias) return null
  const unicos = [...new Set(dias.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort(
    (a, b) => a - b,
  )
  return unicos.length === 0 || unicos.length === 7 ? null : unicos
}

/** Lee las casillas marcadas del formulario (`formData.getAll('dias_semana')`). */
export function leerDiasDelFormulario(valores: readonly string[]): DiasPromocion {
  return normalizarDias(valores.map((v) => Number(v)))
}

/** ¿Vale la promoción en esta fecha civil? */
export function aplicaEnFecha(dias: DiasPromocion | undefined, fecha: string): boolean {
  if (!dias || dias.length === 0) return true
  return dias.includes(diaDeSemanaISO(fecha))
}

const MAYUSCULA = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const nombreLargo = (numero: number) => DIAS_SEMANA[numero - 1].largo

/** «Solo martes y jueves», «De lunes a viernes»; `null` si vale todos los días. */
export function textoDias(dias: DiasPromocion | undefined): string | null {
  const lista = normalizarDias(dias)
  if (!lista) return null

  const seguidos = lista.every((d, i) => i === 0 || d === lista[i - 1] + 1)
  if (seguidos && lista.length >= 3) {
    return `De ${nombreLargo(lista[0])} a ${nombreLargo(lista[lista.length - 1])}`
  }

  // De lunes a viernes el nombre no cambia en plural; sábado y domingo sí.
  const plurales = lista.map((d) => (d >= 6 ? `${nombreLargo(d)}s` : nombreLargo(d)))
  const cola = plurales.length > 1 ? ` y ${plurales[plurales.length - 1]}` : ''
  const cabeza = plurales.length > 1 ? plurales.slice(0, -1).join(', ') : plurales[0]
  return MAYUSCULA(`solo ${cabeza}${cola}`)
}
