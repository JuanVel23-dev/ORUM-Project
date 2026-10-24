/**
 * «Condiciones y restricciones» de una promoción (`promociones.restricciones`):
 * texto libre y opcional que dice cuándo o cómo NO aplica el beneficio.
 * Es informativo: el sistema no lo hace cumplir. Lo escribe el administrador y
 * lo leen el socio (en su ficha) y el cajero (al elegir la promoción).
 */

export const MAX_RESTRICCIONES = 400

/**
 * Deja el texto en su forma guardada: sin espacios en los extremos, con saltos
 * de línea unificados y como mucho una línea en blanco seguida. Vacío = `null`
 * (sin restricciones), nunca una cadena vacía.
 */
export function leerRestricciones(
  valor: string | null | undefined,
): { ok: true; valor: string | null } | { ok: false; error: string } {
  const texto = (valor ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (texto === '') return { ok: true, valor: null }
  if (texto.length > MAX_RESTRICCIONES) {
    return {
      ok: false,
      error: `Las condiciones y restricciones no pueden pasar de ${MAX_RESTRICCIONES} caracteres.`,
    }
  }
  return { ok: true, valor: texto }
}
