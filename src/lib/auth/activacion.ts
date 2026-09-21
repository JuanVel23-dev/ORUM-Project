export type RolActivacion = 'miembro' | 'comercio' | 'staff'
export type ModoActivacion = 'invitar' | 'recuperar'

/** Base del sitio para los enlaces de correo. En producción es obligatoria. */
export function urlBaseSitio(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (url) return url
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'NEXT_PUBLIC_SITE_URL no está definida: los enlaces de los correos apuntarán a localhost.',
    )
  }
  return 'http://localhost:3000'
}

/** URL a la que Supabase redirige tras seguir el enlace del correo. */
export function construirUrlActivacion(
  urlBase: string,
  rol: RolActivacion,
  modo: ModoActivacion = 'invitar',
): string {
  const base = urlBase.replace(/\/+$/, '')
  const sufijo = modo === 'recuperar' ? '&modo=recuperar' : ''
  return `${base}/activar-cuenta?rol=${rol}${sufijo}`
}

export function textosActivacion(modo: string | undefined) {
  if (modo === 'recuperar') {
    return {
      subtitulo: 'Restablece tu contraseña',
      etiquetaPassword: 'Elige tu nueva contraseña',
      boton: 'Guardar contraseña',
    }
  }
  return {
    subtitulo: 'Activa tu cuenta',
    etiquetaPassword: 'Elige tu contraseña',
    boton: 'Activar cuenta',
  }
}

export const MENSAJE_ENLACE_INVALIDO =
  'Este enlace no es válido o ya expiró. Pide que te envíen uno nuevo.'

export type InterpretacionEnlace =
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'con-credenciales' }
  | { tipo: 'sin-credenciales' }

/**
 * Decide qué trae la URL a la que Supabase redirige tras el enlace del correo.
 * Un enlace vencido o ya usado llega como `#error=access_denied&error_code=otp_expired`;
 * uno bueno trae `#access_token=…` (implícito) o `?code=…` (PKCE). Sin ninguno de
 * los dos, una sesión previa del navegador NO prueba nada sobre este enlace.
 */
export function interpretarEnlaceActivacion(hash: string, search: string): InterpretacionEnlace {
  const h = new URLSearchParams(hash.replace(/^#/, ''))
  const q = new URLSearchParams(search.replace(/^\?/, ''))

  if (h.has('error') || h.has('error_description') || h.has('error_code')) {
    const mensaje =
      h.get('error_code') === 'otp_expired'
        ? 'Este enlace ya expiró o ya se usó. Pide uno nuevo.'
        : MENSAJE_ENLACE_INVALIDO
    return { tipo: 'error', mensaje }
  }
  if (h.has('access_token') || h.has('type') || q.has('code')) return { tipo: 'con-credenciales' }
  return { tipo: 'sin-credenciales' }
}
