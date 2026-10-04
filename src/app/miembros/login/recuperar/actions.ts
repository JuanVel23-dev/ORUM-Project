'use server'

import { after } from 'next/server'
import { ERROR_TURNSTILE, verificarTurnstileDeFormulario } from '@/lib/auth/turnstile-request'
import { cupoDeRecuperacion, ipDelCliente } from '@/lib/auth/limitador'
import { enviarRecuperacion } from '@/lib/auth/recuperacion'
import { resolverCuentaPorNumeroMembresia } from '@/lib/miembros/auth-miembro'

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

  const ip = await ipDelCliente()

  after(async () => {
    try {
      // Pasado el tope no se envía nada, y la respuesta ya salió igual: quien
      // abusa no distingue «sin cupo» de «cuenta que no existe».
      if (!(await cupoDeRecuperacion(numeroMembresia, ip))) return
      const cuenta = await resolverCuentaPorNumeroMembresia(numeroMembresia)
      if (cuenta) await enviarRecuperacion(cuenta.correo, 'miembro', cuenta.perfilId)
    } catch (err) {
      console.error('No se pudo procesar la recuperación de contraseña de miembro:', err)
    }
  })

  return { enviado: true }
}
