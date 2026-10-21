import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { obtenerMiComercio } from '@/lib/comercios/comercio-sesion'
import { esTablaAusente, promedio, type ResenaVista } from './resenas'
import {
  gestionDeFila,
  vistaDeFilaRpc,
  type FilaGestion,
  type ResenaGestion,
} from './mapeo'

export type { ResenaGestion } from './mapeo'

/** Reseñas de la primera carga, de la más reciente a la más antigua. */
export const PAGINA_RESENAS = 20

type ResumenSocio = {
  disponible: boolean
  total: number
  promedio: number | null
  resenas: (ResenaVista & { esMia: boolean })[]
}

type ResumenGestion = {
  disponible: boolean
  total: number
  promedio: number | null
  resenas: ResenaGestion[]
}

const SOCIO_VACIO: ResumenSocio = {
  disponible: false,
  total: 0,
  promedio: null,
  resenas: [],
}

const GESTION_VACIO: ResumenGestion = {
  disponible: false,
  total: 0,
  promedio: null,
  resenas: [],
}

/** Tabla ausente: silencio. Cualquier otro error: consola, nunca la página. */
function registrar(contexto: string, error: { code?: string; message?: string }) {
  if (esTablaAusente(error)) return
  console.error(`[resenas] ${contexto}:`, error)
}

/**
 * Lo que ve el socio: resumen y lista salen de las funciones SQL con SU
 * sesión (nunca el cliente de administración). Si el comercio no está activo,
 * `resenas_resumen` no devuelve fila y se contesta `disponible: false`.
 */
export const obtenerResenasParaSocio = cache(
  async (comercioId: number): Promise<ResumenSocio> => {
    try {
      const supabase = await createClient()
      const [resumen, lista] = await Promise.all([
        supabase.rpc('resenas_resumen', { p_comercio_id: comercioId }),
        supabase.rpc('resenas_de_comercio', { p_comercio_id: comercioId }),
      ])

      if (resumen.error) {
        registrar('resenas_resumen', resumen.error)
        return SOCIO_VACIO
      }
      if (lista.error) {
        registrar('resenas_de_comercio', lista.error)
        return SOCIO_VACIO
      }

      const fila = resumen.data?.[0]
      if (!fila) return SOCIO_VACIO

      return {
        disponible: true,
        total: fila.total,
        promedio: fila.promedio === null ? null : Number(fila.promedio),
        // La función devuelve todas, ya ordenadas; la primera carga recorta.
        resenas: (lista.data ?? []).slice(0, PAGINA_RESENAS).map(vistaDeFilaRpc),
      }
    } catch (e) {
      console.error('[resenas] obtenerResenasParaSocio:', e)
      return SOCIO_VACIO
    }
  },
)

/** ¿Enseña la interfaz «Reseñar»? Pista; la barrera es el trigger. */
export const puedoResenar = cache(async (comercioId: number): Promise<boolean> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('puedo_resenar', {
      p_comercio_id: comercioId,
    })
    if (error) {
      registrar('puedo_resenar', error)
      return false
    }
    return data === true
  } catch (e) {
    console.error('[resenas] puedoResenar:', e)
    return false
  }
})

/**
 * Reseñas de un comercio para quien las gestiona. Cliente de administración
 * (la tabla no es legible con la sesión del comercio): la seguridad es el
 * filtro por `comercio_id`, que llega ya validado por quien llama. Ve las
 * reseñas aunque el comercio esté inactivo.
 */
async function cargarParaGestion(comercioId: number): Promise<ResumenGestion> {
  try {
    const admin = createAdminClient()

    // Todas las estrellas (una columna) para el total y el promedio exactos;
    // la lista, solo la primera página.
    const [estrellas, lista] = await Promise.all([
      admin.from('resenas').select('estrellas').eq('comercio_id', comercioId),
      admin
        .from('resenas')
        .select(
          'id, estrellas, mensaje, created_at, respuesta_comercio, respuesta_comercio_at, respuesta_admin, respuesta_admin_at, miembros ( nombres, apellidos )',
        )
        .eq('comercio_id', comercioId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGINA_RESENAS),
    ])

    if (estrellas.error) {
      registrar('resenas (estrellas)', estrellas.error)
      return GESTION_VACIO
    }
    if (lista.error) {
      registrar('resenas (lista)', lista.error)
      return GESTION_VACIO
    }

    const todas = (estrellas.data ?? []).map((f) => f.estrellas)
    return {
      disponible: true,
      total: todas.length,
      promedio: promedio(todas),
      resenas: (lista.data as unknown as FilaGestion[]).map(gestionDeFila),
    }
  } catch (e) {
    console.error('[resenas] cargarParaGestion:', e)
    return GESTION_VACIO
  }
}

/** Las reseñas del comercio de la sesión (el id sale de la cookie). */
export const obtenerResenasParaComercio = cache(
  async (): Promise<ResumenGestion> => {
    const comercio = await obtenerMiComercio()
    if (!comercio) return GESTION_VACIO
    return cargarParaGestion(comercio.id)
  },
)

/** Las de cualquier comercio; la página ya hizo `requireRol('super_admin')`. */
export const obtenerResenasParaAdmin = cache(
  async (comercioId: number): Promise<ResumenGestion> => cargarParaGestion(comercioId),
)
