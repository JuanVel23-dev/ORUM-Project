import { redirect } from 'next/navigation'
import { getPerfilActual, type PerfilActual } from '@/lib/auth/auth'

/**
 * Exige sesión activa con rol `comercio`. La usan el layout de `/comercios` y
 * las server actions del portal (defensa en profundidad, mismo patrón que
 * `requireRolMiembro`).
 */
export async function requireRolComercio(): Promise<PerfilActual> {
  const perfil = await getPerfilActual()

  if (!perfil || !perfil.activo) {
    redirect('/comercios/login')
  }
  if (perfil.rolCodigo !== 'comercio') {
    redirect('/comercios/login?error=sin_permiso')
  }

  return perfil
}
