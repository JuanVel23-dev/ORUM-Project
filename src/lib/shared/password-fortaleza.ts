/*
  Evaluación de fortaleza de contraseña.

  Vive aparte de `password.ts` porque aquel importa `node:crypto` y es solo de
  servidor; esto se ejecuta en el navegador mientras el usuario teclea.

  No pretende ser un estimador de entropía real: es una guía visual. La regla
  que de verdad se aplica —mínimo 8 caracteres— la valida el servidor en
  `cambiarPassword`, que es donde tiene que estar.
*/

export type NivelFortaleza = 'vacia' | 'debil' | 'aceptable' | 'buena' | 'excelente'

export type Fortaleza = {
  nivel: NivelFortaleza
  /** 0–4, para pintar la barra. */
  puntuacion: number
  /** Qué falta, en lenguaje llano. */
  mensaje: string
  /** ¿Cumple el mínimo que exige el servidor? */
  cumpleMinimo: boolean
}

/** Mínimo exigido en `cambiarPassword`. Debe coincidir con el servidor. */
export const LONGITUD_MINIMA = 8

export function evaluarFortaleza(password: string): Fortaleza {
  if (password.length === 0) {
    return { nivel: 'vacia', puntuacion: 0, mensaje: '', cumpleMinimo: false }
  }

  const cumpleMinimo = password.length >= LONGITUD_MINIMA

  if (!cumpleMinimo) {
    const faltan = LONGITUD_MINIMA - password.length
    return {
      nivel: 'debil',
      puntuacion: 1,
      mensaje: `Faltan ${faltan} ${faltan === 1 ? 'carácter' : 'caracteres'}.`,
      cumpleMinimo: false,
    }
  }

  const tieneMinuscula = /[a-z]/.test(password)
  const tieneMayuscula = /[A-Z]/.test(password)
  const tieneNumero = /\d/.test(password)
  const tieneSimbolo = /[^a-zA-Z0-9]/.test(password)

  const variedad = [tieneMinuscula, tieneMayuscula, tieneNumero, tieneSimbolo].filter(
    Boolean,
  ).length

  // La longitud pesa más que la variedad: una frase larga y sencilla resiste
  // mejor un ataque por fuerza bruta que ocho caracteres con símbolos.
  let puntos = 1
  if (password.length >= 12) puntos++
  if (password.length >= 16) puntos++
  if (variedad >= 3) puntos++

  // Penaliza el caso clásico: longitud justa y un solo tipo de carácter.
  if (variedad === 1 && password.length < 16) puntos = 1

  const puntuacion = Math.min(4, puntos)

  const faltantes: string[] = []
  if (!tieneMayuscula) faltantes.push('una mayúscula')
  if (!tieneNumero) faltantes.push('un número')
  if (!tieneSimbolo) faltantes.push('un símbolo')

  if (puntuacion >= 4) {
    return { nivel: 'excelente', puntuacion, mensaje: 'Contraseña sólida.', cumpleMinimo }
  }

  const sugerencia =
    password.length < 12
      ? 'Alárgala a 12 caracteres o más.'
      : faltantes.length > 0
        ? `Añade ${faltantes.join(', ')}.`
        : 'Alárgala un poco más.'

  return {
    nivel: puntuacion >= 3 ? 'buena' : puntuacion >= 2 ? 'aceptable' : 'debil',
    puntuacion,
    mensaje: sugerencia,
    cumpleMinimo,
  }
}
