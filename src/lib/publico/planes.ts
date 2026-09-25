/* ==========================================================================
   LOS PLANES EN LA FACHADA  ·  el ahorro se CALCULA, no se escribe
   --------------------------------------------------------------------------
   El boceto aprobado decía «Ahorra 2 meses · el equivalente a 10 meses, con
   dos de regalo» junto a un anual de $250.000 y un mensual de $30.000. Las
   cuentas no salen: doce meses sueltos son $360.000, así que el anual ahorra
   $110.000 —algo más de tres meses y medio—. Un reclamo de precio que no casa
   con el precio que tiene al lado es lo primero que un cliente comprueba.

   Por eso aquí no hay ninguna cifra escrita a mano: el ahorro sale de
   `planes_membresia` cada vez que se pinta la página, y si mañana el
   administrador cambia un precio, el reclamo cambia con él.
   ========================================================================== */

/** Un plan tal y como sale de `planes_membresia` (solo columnas públicas). */
export type PlanCrudo = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_meses: number
}

export type PlanPublico = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracionMeses: number
  /** «mes», «año», «6 meses»: lo que va detrás de la barra del precio. */
  periodo: string
  /**
   * Pesos que se ahorran frente a pagar el plan de UN mes durante la misma
   * duración. `null` si no hay plan mensual con el que comparar o si no hay
   * ahorro (nunca se anuncia un ahorro de cero o negativo).
   */
  ahorro: number | null
  /** Precio mensual equivalente, redondeado al peso. `null` en el propio mensual. */
  mensualEquivalente: number | null
  /** El plan que la página destaca: el de mayor ahorro. Como mucho uno. */
  destacado: boolean
}

/** «$30.000». Pesos colombianos sin decimales, con punto de miles. */
export function formatearPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString('es-CO')}`
}

/** «mes», «año», «N meses». */
export function periodoDelPlan(meses: number): string {
  if (meses === 1) return 'mes'
  if (meses === 12) return 'año'
  if (meses % 12 === 0) return `${meses / 12} años`
  return `${meses} meses`
}

/**
 * Prepara los planes para la fachada: los ordena por duración y calcula el
 * ahorro de cada uno contra el plan mensual.
 *
 * Descarta los planes que no tienen sentido anunciar —precio o duración no
 * positivos—: un plan de $0 en la vitrina se lee como un error, no como un
 * regalo.
 */
export function prepararPlanes(planes: readonly PlanCrudo[]): PlanPublico[] {
  const validos = planes
    .filter((p) => p.precio > 0 && Number.isInteger(p.duracion_meses) && p.duracion_meses > 0)
    .sort((a, b) => a.duracion_meses - b.duracion_meses || a.precio - b.precio)

  /* La referencia es el plan de un mes MÁS BARATO, si hay varios: comparar
     contra el caro inflaría el ahorro. */
  const mensual = validos.find((p) => p.duracion_meses === 1)

  const preparados = validos.map((p): PlanPublico => {
    const esMensual = p.duracion_meses === 1
    const bruto = mensual && !esMensual ? mensual.precio * p.duracion_meses - p.precio : 0
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      duracionMeses: p.duracion_meses,
      periodo: periodoDelPlan(p.duracion_meses),
      ahorro: bruto > 0 ? bruto : null,
      mensualEquivalente: esMensual ? null : Math.round(p.precio / p.duracion_meses),
      destacado: false,
    }
  })

  /* El destacado se decide por ahorro RELATIVO, no absoluto: si no, un plan
     de tres años ganaría siempre solo por durar más. */
  let mejor: PlanPublico | null = null
  let mejorRatio = 0
  for (const plan of preparados) {
    if (plan.ahorro === null || !mensual) continue
    const ratio = plan.ahorro / (mensual.precio * plan.duracionMeses)
    if (ratio > mejorRatio) {
      mejor = plan
      mejorRatio = ratio
    }
  }
  if (mejor) mejor.destacado = true

  return preparados
}
