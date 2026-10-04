import 'server-only'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { claveCupo, huella, ipDeCabeceras, LIMITES, type Limite } from './limite-uso'

/*
  Contacto con la base para el límite de uso. Envoltura fina, sin pruebas (igual
  que `verificarTurnstile`): la lógica comprobable vive en `limite-uso.ts` y el
  conteo atómico, en la función SQL `consumir_cupo`.
*/

/** IP del cliente de la petición en curso. Ver `ipDeCabeceras` para el porqué. */
export async function ipDelCliente(): Promise<string> {
  const h = await headers()
  return ipDeCabeceras((nombre) => h.get(nombre))
}

/**
 * Qué hacer si no se puede consultar el contador (base caída, error de red).
 *
 * - `'bloquear'`: se trata como si el cupo estuviera agotado. Para lo que envía
 *   correo, porque abrir la compuerta cuando falla el limitador es justo lo que
 *   agota la cuota de Google.
 * - `'permitir'`: se deja pasar. Para el login, para que una caída del
 *   limitador no deje fuera a socios y comercios reales; ahí además sigue
 *   mandando Turnstile.
 */
export type AlFallar = 'bloquear' | 'permitir'

/**
 * Gasta una unidad del cupo de `clave` y dice si todavía estaba permitido.
 * Nunca lanza.
 */
export async function hayCupo(clave: string, limite: Limite, alFallar: AlFallar): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc('consumir_cupo', {
      p_clave: clave,
      p_tope: limite.tope,
      p_ventana_segundos: limite.ventanaSegundos,
    })
    if (error || typeof data !== 'boolean') throw error ?? new Error('respuesta inesperada')
    return data
  } catch (err) {
    console.error('[limite-uso] no se pudo consultar el contador', clave.split(':')[0], err)
    return alFallar === 'permitir'
  }
}

export const ERROR_LIMITE_LOGIN =
  'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'

/**
 * Cupo de un intento de inicio de sesión: uno por cuenta (correo o número de
 * membresía) y otro por IP. Se gastan los dos aunque falle el primero, para que
 * una IP que prueba muchas cuentas no recupere cupo por haber topado en una.
 * Falla hacia «permitir»: ver `AlFallar`.
 */
export async function cupoDeLogin(cuenta: string): Promise<boolean> {
  const ip = await ipDelCliente()
  const [porCuenta, porIp] = await Promise.all([
    hayCupo(claveCupo('login', 'cuenta', huella(cuenta)), LIMITES.loginPorCuenta, 'permitir'),
    hayCupo(claveCupo('login', 'ip', ip), LIMITES.loginPorIp, 'permitir'),
  ])
  return porCuenta && porIp
}

/**
 * Cupo para enviar un enlace de recuperación: uno por cuenta (para no inundar
 * un buzón ajeno) y otro por IP (para que nadie barra cuentas desde un sitio).
 * Recibe la IP ya leída porque se llama dentro de `after()`, donde no conviene
 * leer cabeceras. Falla hacia «bloquear»: ver `AlFallar`.
 */
export async function cupoDeRecuperacion(cuenta: string, ip: string): Promise<boolean> {
  const [porCuenta, porIp] = await Promise.all([
    hayCupo(claveCupo('recuperar', 'cuenta', huella(cuenta)), LIMITES.recuperarPorCuenta, 'bloquear'),
    hayCupo(claveCupo('recuperar', 'ip', ip), LIMITES.recuperarPorIp, 'bloquear'),
  ])
  return porCuenta && porIp
}

/**
 * Cupo para enviar una solicitud de aliado: por IP, y un techo global al día
 * que protege la cuota de correo aunque el abuso rote de IP. Falla hacia
 * «bloquear»: ver `AlFallar`.
 */
export async function cupoDeSolicitudAliado(ip: string): Promise<boolean> {
  const [porIp, global] = await Promise.all([
    hayCupo(claveCupo('aliados', 'ip', ip), LIMITES.aliadosPorIp, 'bloquear'),
    hayCupo(claveCupo('aliados', 'global', 'dia'), LIMITES.aliadosGlobalDia, 'bloquear'),
  ])
  return porIp && global
}

/** Tras un acierto, la cuenta vuelve a empezar: el tope cuenta fallos seguidos. */
export function reiniciarLogin(cuenta: string): Promise<void> {
  return reiniciarCupo(claveCupo('login', 'cuenta', huella(cuenta)))
}

/** Pone a cero el contador de `clave` (el login, al acertar). Nunca lanza. */
export async function reiniciarCupo(clave: string): Promise<void> {
  try {
    await createAdminClient().rpc('reiniciar_cupo', { p_clave: clave })
  } catch (err) {
    console.error('[limite-uso] no se pudo reiniciar el contador', err)
  }
}
