import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'

export type MiFotoDatos = { nombre: string; fotoUrl: string | null }

/**
 * La ficha del socio de la sesión. No admite parámetro a propósito: el
 * identificador sale de la cookie, nunca de la URL.
 *
 * Usa `requireRolMiembro` y no `requireMiembroVigente`: cambiar la foto no es
 * un beneficio del club, y un socio con la membresía vencida que está a punto
 * de renovar no tiene por qué encontrarse la puerta cerrada aquí.
 */
export async function cargarMiFoto(): Promise<MiFotoDatos | null> {
  const perfil = await requireRolMiembro()

  const supabase = await createClient()
  const { data: miembro } = await supabase
    .from('miembros')
    .select('nombres, apellidos, foto_url')
    .eq('perfil_id', perfil.userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!miembro) return null

  return {
    nombre: `${miembro.nombres} ${miembro.apellidos}`.trim(),
    fotoUrl: miembro.foto_url,
  }
}
