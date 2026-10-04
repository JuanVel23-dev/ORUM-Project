import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import type { FotoNegocio } from '@/lib/comercios/fotos-negocio'

export type MiComercio = {
  id: number
  nombre: string
  logoUrl: string | null
  /** La foto grande de la ficha. Cuenta como una de las ocho del negocio. */
  portadaUrl: string | null
}

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
    .select('id, nombre, logo_url, portada_url')
    .eq('perfil_id', perfil.userId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    nombre: data.nombre,
    logoUrl: (data.logo_url ?? '').trim() || null,
    portadaUrl: (data.portada_url ?? '').trim() || null,
  }
})

/**
 * La galería del comercio de la sesión, en el orden en que la ve el socio.
 *
 * Con el cliente de administración y no con el de la sesión: `comercio_imagenes`
 * no tiene por qué ser legible con el rol de comercio, y aquí no hace falta que
 * lo sea. La seguridad no la pone la política sino el filtro: el `comercio_id`
 * sale de `obtenerMiComercio`, es decir, de la cookie. No hay forma de pedir
 * la galería de otro.
 */
export const obtenerMiGaleria = cache(async (): Promise<FotoNegocio[]> => {
  const comercio = await obtenerMiComercio()
  if (!comercio) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('comercio_imagenes')
    .select('id, url')
    .eq('comercio_id', comercio.id)
    // Mismo orden que la ficha. `id` desempata para que dos piezas con el
    // mismo `orden` no bailen entre recargas.
    .order('orden', { ascending: true })
    .order('id', { ascending: true })

  return data ?? []
})
