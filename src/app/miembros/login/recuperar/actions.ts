'use server'

import { after } from 'next/server'
import { ERROR_TURNSTILE, verificarTurnstileDeFormulario } from '@/lib/auth/turnstile-request'
import { enviarRecuperacion } from '@/lib/auth/recuperacion'
import { resolverCorreoPorNumeroMembresia } from '@/lib/miembros/auth-miembro'

export type RecuperarState = { enviado?: boolean; error?: string }

/**
 * Pide el enlace para restablecer la contraseña de un miembro (por número de
 * membresía). Responde SIEMPRE igual exista o no la cuenta: el trabajo real
 * corre en `after()`, así la respuesta tampoco delata la diferencia por tiempo.
 */
export async function solicitarRecuperacionMiembro(
  _prev: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const numeroMembresia = String(formData.get('numero_membresia') ?? '').trim()
  if (!numeroMembresia) return { error: 'Ingresa tu número de membresía.' }

  const captcha = await verificarTurnstileDeFormulario(formData)
  if (!captcha.valido) return { error: ERROR_TURNSTILE }

  after(async () => {
    const correo = await resolverCorreoPorNumeroMembresia(numeroMembresia)
    if (correo) await enviarRecuperacion(correo, 'miembro')
  })

  return { enviado: true }
}
