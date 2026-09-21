import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resuelve el correo real de Auth a partir del número de membresía (RF-06).
 * Se usa únicamente en el login de miembros, antes de que exista sesión — por
 * eso es la única función de este portal que usa el admin client. Nunca se
 * inventan correos internos: el miembro siempre tiene un correo real
 * asociado a su cuenta de Auth (provisionado desde Fase 2).
 */
export async function resolverCuentaPorNumeroMembresia(
  numeroMembresia: string,
): Promise<{ correo: string; perfilId: string } | null> {
  const admin = createAdminClient()

  const { data: miembro } = await admin
    .from('miembros')
    .select('perfil_id')
    .eq('numero_membresia', numeroMembresia)
    .is('deleted_at', null)
    .maybeSingle()

  if (!miembro?.perfil_id) return null

  const { data } = await admin.auth.admin.getUserById(miembro.perfil_id)
  const correo = data.user?.email
  return correo ? { correo, perfilId: miembro.perfil_id } : null
}

export async function resolverCorreoPorNumeroMembresia(
  numeroMembresia: string,
): Promise<string | null> {
  return (await resolverCuentaPorNumeroMembresia(numeroMembresia))?.correo ?? null
}
