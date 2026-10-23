import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

/** Lo mínimo del cliente de administración que necesita la comprobación. */
type ListadorUsuarios = {
  auth: {
    admin: {
      listUsers: (p: { page: number; perPage: number }) => Promise<{
        data: { users: { email?: string | null }[] } | null
        error: { message: string } | null
      }>
    }
  }
}

const POR_PAGINA = 1000
// Tope de seguridad: 50 000 cuentas. Más allá, es mejor fallar que dar vueltas.
const MAX_PAGINAS = 50

export const MENSAJE_CORREO_OCUPADO = 'Ya existe un usuario con ese correo.'

/**
 * `true` si ya hay una cuenta de Auth con ese correo, `false` si no, `null` si
 * no se pudo comprobar.
 *
 * Existe porque `generateLink({ type: 'invite' })` NO falla con un correo que
 * ya está registrado: devuelve el usuario existente. Las altas seguían con ese
 * usuario, le pisaban el rol del perfil (un comercio pasó a ser miembro, y
 * editar el correo de uno cambiaba el del otro) y, si algo fallaba después,
 * `revertir()` habría borrado la cuenta de otra persona. Una cuenta de Auth es
 * UNA persona con UN rol: se comprueba antes de invitar.
 */
export async function correoYaRegistrado(
  admin: ListadorUsuarios,
  correo: string,
): Promise<boolean | null> {
  const buscado = correo.trim().toLowerCase()
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: POR_PAGINA })
    if (error || !data) return null
    if (data.users.some((u) => u.email?.trim().toLowerCase() === buscado)) return true
    if (data.users.length < POR_PAGINA) return false
  }
  return null
}

/**
 * El mensaje de error que debe devolver un alta si el correo no se puede usar,
 * o `null` si está libre. Lo comparten las tres altas (miembro, comercio y
 * personal del panel).
 */
export async function errorDeCorreoOcupado(admin: Admin, correo: string): Promise<string | null> {
  const ocupado = await correoYaRegistrado(admin, correo)
  if (ocupado === null) return 'No se pudo comprobar el correo. Inténtalo de nuevo en un momento.'
  return ocupado ? MENSAJE_CORREO_OCUPADO : null
}
