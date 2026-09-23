import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { AnuncioResumen } from './tipos'

export type PortalAnuncios = 'publico' | 'miembros'

/*
  Qué columna de alcance mira cada portal. El Portal Público lee con
  `createAdminClient()` (se salta RLS) y el de Miembros con `createClient()`
  (RLS activa vía `anuncios_public_select`); en los dos casos el filtro de
  alcance es de la QUERY, no de la política — la política solo decide si la
  fila es legible en absoluto (activa y no borrada).
*/
const COLUMNA_ALCANCE = {
  publico: 'mostrar_publico',
  miembros: 'mostrar_miembros',
} as const satisfies Record<PortalAnuncios, 'mostrar_publico' | 'mostrar_miembros'>

/** Las novedades visibles en un portal, la más reciente primero. */
export async function obtenerAnunciosVisibles(
  supabase: SupabaseClient<Database>,
  portal: PortalAnuncios,
): Promise<AnuncioResumen[]> {
  const { data } = await supabase
    .from('anuncios')
    .select('id, titulo, cuerpo, imagen_url, created_at')
    .eq('activo', true)
    .eq(COLUMNA_ALCANCE[portal], true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []).map((fila) => ({
    id: fila.id,
    titulo: fila.titulo,
    cuerpo: fila.cuerpo,
    imagenUrl: fila.imagen_url,
    createdAt: fila.created_at,
  }))
}
