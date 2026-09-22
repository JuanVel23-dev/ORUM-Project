'use server'

import { after } from 'next/server'
import { ERROR_TURNSTILE, verificarTurnstileDeFormulario } from '@/lib/auth/turnstile-request'
import { enviarRecuperacion } from '@/lib/auth/recuperacion'

export type RecuperarState = { enviado?: boolean; error?: string }

/**
 * Pide el enlace para restablecer la contraseña de un comercio (por correo).
 * Misma regla anti-enumeración que la de miembros: respuesta idéntica exista o
 * no la cuenta, y el trabajo real va en `after()`.
 */
export async function solicitarRecuperacionComercio(
  _prev: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email || !email.includes('@')) return { error: 'Ingresa un correo válido.' }

  const captcha = await verificarTurnstileDeFormulario(formData)
  if (!captcha.valido) return { error: ERROR_TURNSTILE }

  after(() => enviarRecuperacion(email, 'comercio'))

  return { enviado: true }
}
