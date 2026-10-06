import { headers } from 'next/headers'
import { CAMPO_TURNSTILE, verificarTurnstile, type ResultadoTurnstile } from './turnstile'

/*
  Puente entre una server action y `verificarTurnstile`: saca el token del
  FormData y la IP de las cabeceras. Vive aparte de `turnstile.ts` porque
  `next/headers` no se puede importar desde el entorno de pruebas.
*/

export const ERROR_TURNSTILE =
  'No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.'

export async function verificarTurnstileDeFormulario(
  formData: FormData,
): Promise<ResultadoTurnstile> {
  const h = await headers()
  const ip =
    h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const resultado = await verificarTurnstile(String(formData.get(CAMPO_TURNSTILE) ?? ''), ip)

  /*
    Solo el MOTIVO, nunca el token ni la IP: queda en los registros de Vercel
    para distinguir un token ya gastado (`timeout-or-duplicate`) de uno que no
    llegó (`token-ausente`) o de un fallo de red (`red`). Sin esto, un rechazo
    se ve igual desde fuera sea cual sea la causa.
  */
  if (!resultado.valido) {
    console.warn('[turnstile] rechazado:', resultado.motivo ?? 'desconocido')
  }

  return resultado
}
