import { createAdminClient } from '@/lib/supabase/admin'
import { enviarCorreoRecuperacion } from '@/lib/correo/correo'
import { construirUrlActivacion, urlBaseSitio } from './activacion'

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
): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: correo,
      options: { redirectTo: construirUrlActivacion(urlBaseSitio(), rol, 'recuperar') },
    })
    if (error || !data?.user) return

    const { data: rolFila } = await admin.from('roles').select('id').eq('codigo', rol).single()
    if (!rolFila) return

    const { data: perfil } = await admin
      .from('perfiles')
      .select('activo')
      .eq('id', data.user.id)
      .eq('rol_id', rolFila.id)
      .maybeSingle()
    if (!perfil?.activo) return

    await enviarCorreoRecuperacion({
      correo,
      urlRecuperacion: data.properties.action_link,
    })
  } catch (err) {
    console.error('No se pudo procesar la recuperación de contraseña:', err)
  }
}
