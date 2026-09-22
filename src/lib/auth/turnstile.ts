export type ResultadoTurnstile = { valido: boolean; motivo?: string }

/** Nombre del campo oculto que el widget de Cloudflare añade al formulario. */
export const CAMPO_TURNSTILE = 'cf-turnstile-response'

/**
 * Llaves de prueba oficiales de Cloudflare (siempre pasan). Se usan como
 * respaldo para que el desarrollo local funcione sin configurar nada. En
 * producción hay que definir las variables de entorno reales.
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_SITE_KEY_PRUEBA = '1x00000000000000000000AA'
const TURNSTILE_SECRET_PRUEBA = '1x0000000000000000000000000000000AA'

const URL_SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Traduce el cuerpo JSON de `siteverify` a un resultado propio. Pura: no toca
 * la red. Cualquier forma inesperada del cuerpo se trata como no válida
 * (fail-closed).
 */
export function interpretarRespuestaTurnstile(cuerpo: unknown): ResultadoTurnstile {
  if (typeof cuerpo !== 'object' || cuerpo === null || !('success' in cuerpo)) {
    return { valido: false, motivo: 'desconocido' }
  }

  const { success } = cuerpo as { success: unknown }
  if (success === true) {
    return { valido: true }
  }
  if (success !== false) {
    return { valido: false, motivo: 'desconocido' }
  }

  const codigos = (cuerpo as { 'error-codes'?: unknown })['error-codes']
  const primero = Array.isArray(codigos) ? codigos[0] : undefined
  return {
    valido: false,
    motivo: typeof primero === 'string' && primero ? primero : 'desconocido',
  }
}

/**
 * Valida un token de Turnstile contra Cloudflare. Envoltura fina sobre
 * `fetch` (no se cubre con tests, igual que el envío de correo): la lógica
 * comprobable vive en `interpretarRespuestaTurnstile`.
 *
 * Fail-closed: sin token, o si la red falla, devuelve `valido: false`.
 */
export async function verificarTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<ResultadoTurnstile> {
  if (!token) {
    return { valido: false, motivo: 'token-ausente' }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_PRUEBA

  const cuerpo = new FormData()
  cuerpo.set('secret', secret)
  cuerpo.set('response', token)
  if (ip) {
    cuerpo.set('remoteip', ip)
  }

  try {
    const respuesta = await fetch(URL_SITEVERIFY, { method: 'POST', body: cuerpo })
    return interpretarRespuestaTurnstile(await respuesta.json())
  } catch {
    return { valido: false, motivo: 'red' }
  }
}
