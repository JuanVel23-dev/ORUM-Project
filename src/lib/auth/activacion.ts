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
