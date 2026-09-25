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

/**
 * Enlace que se envía por correo. Apunta directo a nuestra página con el
 * token en la URL — nunca al endpoint /verify de Supabase, que consume el
 * token con solo un GET. Un escaneo automático de enlaces (el propio Gmail,
 * un antivirus corporativo) que visita el enlace sin que la persona lo haya
 * tocado lo dejaría vencido antes de que alguien lo abriera de verdad. El
 * token solo se canjea al enviar el formulario (ver activar-form.tsx), así
 * un GET pasivo no gasta nada.
 */
export function construirEnlaceActivacion(
  urlBase: string,
  rol: RolActivacion,
  tokenHash: string,
  tipo: string,
  modo: ModoActivacion = 'invitar',
): string {
  const base = urlBase.replace(/\/+$/, '')
  const sufijo = modo === 'recuperar' ? '&modo=recuperar' : ''
  const params = new URLSearchParams({ token_hash: tokenHash, type: tipo })
  return `${base}/activar-cuenta?rol=${rol}${sufijo}&${params.toString()}`
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

export const MENSAJE_ENLACE_VENCIDO = 'Este enlace ya expiró o ya se usó. Pide uno nuevo.'
