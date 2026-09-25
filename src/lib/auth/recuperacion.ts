import { createAdminClient } from '@/lib/supabase/admin'
import { enviarCorreoRecuperacion } from '@/lib/correo/correo'
import { construirEnlaceActivacion, urlBaseSitio } from './activacion'

/**
 * Genera el enlace de recuperación y lo envía por correo. Nunca lanza y no
 * distingue resultados hacia fuera: si el correo no existe, o su perfil no es
 * del rol esperado o está inactivo, simplemente no envía nada. El llamador
 * responde siempre lo mismo (anti-enumeración).
 *
 * El rol se comprueba aquí para que el formulario de un portal no pueda
 * disparar la recuperación de una cuenta de otro (p. ej. staff desde el
 * portal de comercios).
 */
export async function enviarRecuperacion(
  correo: string,
  rol: 'miembro' | 'comercio',
  perfilId?: string,
): Promise<void> {
  try {
    const admin = createAdminClient()

    // Comprueba que el perfil sea del rol esperado y esté activo.
    async function perfilValido(id: string): Promise<boolean> {
      const { data: rolFila } = await admin.from('roles').select('id').eq('codigo', rol).single()
      if (!rolFila) return false
      const { data: perfil } = await admin
        .from('perfiles')
        .select('activo')
        .eq('id', id)
        .eq('rol_id', rolFila.id)
        .maybeSingle()
      return !!perfil?.activo
    }

    // Con perfilId (miembros) se valida ANTES de generar el enlace: no se crea
    // un token de recuperación para una cuenta que no debe recibirlo.
    if (perfilId && !(await perfilValido(perfilId))) return

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: correo,
      options: { redirectTo: urlBaseSitio() },
    })
    if (error || !data?.user) return

    // Sin perfilId (comercios) no existe en el esquema público una búsqueda
    // correo -> perfil: el id solo se conoce al generar el enlace, así que la
    // validación tiene que ir después.
    if (!perfilId && !(await perfilValido(data.user.id))) return

    await enviarCorreoRecuperacion({
      correo,
      urlRecuperacion: construirEnlaceActivacion(
        urlBaseSitio(),
        rol,
        data.properties.hashed_token,
        data.properties.verification_type,
        'recuperar',
      ),
    })
  } catch (err) {
    console.error('No se pudo procesar la recuperación de contraseña:', err)
  }
}
