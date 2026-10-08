'use server'

import { after } from 'next/server'
import { ERROR_TURNSTILE, verificarTurnstileDeFormulario } from '@/lib/auth/turnstile-request'
import { cupoDeRecuperacion, ipDelCliente } from '@/lib/auth/limitador'
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

  const ip = await ipDelCliente()

  after(async () => {
    // La respuesta ya salió: un fallo aquí (correo, base) solo puede ir al log,
    // nunca al usuario. Sin el `catch` quedaba como error sin capturar.
    try {
      // Pasado el tope no se envía nada, y la respuesta ya salió igual.
      if (!(await cupoDeRecuperacion(email, ip))) return
      await enviarRecuperacion(email, 'comercio')
    } catch (err) {
      console.error('No se pudo procesar la recuperación de contraseña de comercio:', err)
    }
  })

  return { enviado: true }
}
