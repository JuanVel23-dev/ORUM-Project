import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'

export type MiComercio = { id: number; nombre: string; logoUrl: string | null }

/**
 * El comercio de la sesión. No admite parámetro a propósito: el identificador
 * sale de la cookie, nunca de la URL.
 *
 * `cache`: el layout del portal (banner con el nombre y el logotipo) y la
 * página (sucursales y promociones) lo piden en el mismo render, y antes cada
 * uno hacía su propia consulta a `comercios`. Con esto es una sola.
 *
 * Solo el logotipo PROPIO, sin caer al de la marca como hace la fachada
 * (`resolverLogoComercio`): eso exigiría leer `marcas` con la sesión del
 * comercio, y si su política no lo permitiera fallaría la consulta entera
 * —nombre incluido—. Sin logotipo, `ComercioLogo` pinta la inicial.
 */
export const obtenerMiComercio = cache(async (): Promise<MiComercio | null> => {
  const perfil = await requireRolComercio()

  const supabase = await createClient()
  const { data } = await supabase
    .from('comercios')
    .select('id, nombre, logo_url')
    .eq('perfil_id', perfil.userId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    nombre: data.nombre,
    logoUrl: (data.logo_url ?? '').trim() || null,
  }
})
