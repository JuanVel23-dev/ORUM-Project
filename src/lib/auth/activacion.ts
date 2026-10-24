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

/**
 * ¿La cuenta sigue sin activarse? Una invitación crea el usuario SIN correo
 * confirmado; se confirma al canjear el enlace. Es la señal que decide si se
 * ofrece «Reenviar correo de activación».
 */
export function cuentaPendienteDeActivar(
  usuario: { email_confirmed_at?: string | null } | null | undefined,
): boolean {
  return Boolean(usuario) && !usuario?.email_confirmed_at
}

/**
 * Cuando un administrador CAMBIA el correo de una cuenta a mano, ¿se da el
 * correo nuevo por verificado?
 *
 * Solo si la cuenta ya inició sesión alguna vez. Una cuenta que nunca entró
 * está pendiente de activar, y el correo que acaba de escribir el administrador
 * —quizá con un error— nadie lo ha comprobado: marcarlo como confirmado lo
 * esconde (la cuenta deja de verse «pendiente»), no manda ninguna invitación a
 * la dirección buena y no se puede detectar después.
 */
export function confirmarCorreoAlCambiar(
  usuario: { last_sign_in_at?: string | null } | null | undefined,
): boolean {
  return Boolean(usuario?.last_sign_in_at)
}

/** El `rol` que lleva el enlace de activación según el rol de la cuenta (`roles.codigo`). */
export function rolActivacionDe(rolCodigo: string): RolActivacion | null {
  if (rolCodigo === 'miembro') return 'miembro'
  if (rolCodigo === 'comercio') return 'comercio'
  if (rolCodigo === 'empleado' || rolCodigo === 'super_admin') return 'staff'
  return null
}

/**
 * Quién puede reenviar la activación de quién. El empleado registra miembros,
 * así que puede reenviarles; comercios y personal del panel los gestiona solo
 * el administrador, igual que su alta.
 */
export function puedeReenviarActivacion(rolActor: string, rolCuenta: string): boolean {
  if (rolActor === 'super_admin') return rolActivacionDe(rolCuenta) !== null
  if (rolActor === 'empleado') return rolCuenta === 'miembro'
  return false
}
