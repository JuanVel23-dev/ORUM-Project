import { mensajeDeError } from '../shared/errores'
import { confirmarCorreoAlCambiar } from './activacion'

/** Lo mínimo del cliente de administración de Auth que usa este módulo. */
type ClienteAuthAdmin = {
  auth: {
    admin: {
      getUserById(id: string): Promise<{
        data: { user: { last_sign_in_at?: string | null } | null }
      }>
      updateUserById(
        id: string,
        atributos: { email: string; email_confirm: boolean },
      ): Promise<{ error: { message: string } | null }>
    }
  }
}

/**
 * Cambia el correo de una cuenta (comercio, miembro o personal del panel).
 *
 * En una cuenta que NUNCA ha iniciado sesión el correo nuevo queda SIN
 * confirmar: sigue «pendiente de activar» y el administrador reenvía la
 * activación cuando lo considere. Antes se confirmaba siempre
 * (`email_confirm: true`): un correo mal escrito quedaba «verificado» sin que
 * nadie hubiera abierto nada. Ver `confirmarCorreoAlCambiar`.
 */
export async function cambiarCorreoDeCuenta(
  admin: ClienteAuthAdmin,
  perfilId: string,
  correo: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await admin.auth.admin.getUserById(perfilId)

  const { error } = await admin.auth.admin.updateUserById(perfilId, {
    email: correo,
    email_confirm: confirmarCorreoAlCambiar(data?.user),
  })
  if (!error) return { ok: true }

  return {
    ok: false,
    error: /already been registered|already registered|exists/i.test(error.message)
      ? 'Ese correo ya está en uso por otro usuario.'
      : mensajeDeError('No se pudo actualizar el correo', error),
  }
}
