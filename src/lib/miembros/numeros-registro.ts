/**
 * Números de registro predefinidos ("pozo").
 *
 * A diferencia del generador anterior, el número de un miembro ya no se inventa
 * al registrarlo: sale de un conjunto que el administrador carga por adelantado
 * (los carnés físicos vienen numerados). Aquí vive solo la lógica pura —qué es
 * un número válido y cómo se expande un rango—; la persistencia y la asignación
 * están en las server actions.
 */

/** Formato del número de registro: exactamente 8 dígitos. */
const FORMATO = /^\d{8}$/

/**
 * Tope de números por carga. Un rango se escribe en dos campos; un cero de más
 * en "hasta" pediría crear millones de filas. El tope obliga a partir cargas
 * grandes en tandas conscientes.
 */
export const MAX_NUMEROS_POR_CARGA = 2000

/** ¿Es una cadena de exactamente 8 dígitos? */
export function esNumeroRegistroValido(valor: string): boolean {
  return FORMATO.test(valor)
}

export type RangoExpandido =
  | { ok: true; numeros: string[] }
  | { ok: false; error: string }

/**
 * Expande un rango inclusivo `desde`–`hasta` a la lista de números de 8 dígitos.
 * Ambos extremos deben tener el formato válido; el inicio no puede superar al
 * fin; y el total no puede pasar de `MAX_NUMEROS_POR_CARGA`.
 */
export function expandirRango(desde: string, hasta: string): RangoExpandido {
  if (!esNumeroRegistroValido(desde) || !esNumeroRegistroValido(hasta)) {
    return { ok: false, error: 'Los números deben tener exactamente 8 dígitos.' }
  }

  // Base 10 explícita: "00000010" no es octal.
  const inicio = Number.parseInt(desde, 10)
  const fin = Number.parseInt(hasta, 10)

  if (inicio > fin) {
    return { ok: false, error: 'El número inicial no puede ser mayor que el final.' }
  }

  const total = fin - inicio + 1
  if (total > MAX_NUMEROS_POR_CARGA) {
    return {
      ok: false,
      error: `Un rango no puede tener más de ${MAX_NUMEROS_POR_CARGA} números. Cárgalo en partes.`,
    }
  }

  const numeros: string[] = []
  for (let n = inicio; n <= fin; n++) {
    numeros.push(String(n).padStart(8, '0'))
  }
  return { ok: true, numeros }
}
