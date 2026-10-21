import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { rangoDePagina } from '@/lib/shared/paginacion'
import { obtenerMiComercio } from '@/lib/comercios/comercio-sesion'
import { esTablaAusente, resumenDeConteos, type ResenaVista } from './resenas'
import {
  gestionDeFila,
  separarMiResena,
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
  /** La reseña del socio, aunque no esté entre las más recientes. */
  miResena: (ResenaVista & { esMia: boolean }) | null
}

type ResumenGestion = {
  disponible: boolean
  total: number
  promedio: number | null
  resenas: ResenaGestion[]
  /** Página servida (1..paginas), cuántas hay y el tramo «desde–hasta». */
  pagina: number
  paginas: number
  desde: number
  hasta: number
}

const SOCIO_VACIO: ResumenSocio = {
  disponible: false,
  total: 0,
  promedio: null,
  resenas: [],
  miResena: null,
}

const GESTION_VACIO: ResumenGestion = {
  disponible: false,
  total: 0,
  promedio: null,
  resenas: [],
  pagina: 1,
  paginas: 1,
  desde: 0,
  hasta: 0,
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

      // La función devuelve todas, ya ordenadas; la propia se busca entre
      // todas y la primera carga recorta el resto.
      const { miResena, otras } = separarMiResena(lista.data ?? [], PAGINA_RESENAS)
      return {
        disponible: true,
        total: fila.total,
        promedio: fila.promedio === null ? null : Number(fila.promedio),
        resenas: otras,
        miResena,
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
async function cargarParaGestion(
  comercioId: number,
  /** Sin página: las `PAGINA_RESENAS` más recientes (comercio). Con página: 25 por página (panel). */
  pagina?: number,
): Promise<ResumenGestion> {
  try {
    const admin = createAdminClient()

    // Total y promedio EXACTOS sin traer filas (PostgREST corta en 1000):
    // cinco consultas `head`, una por número de estrellas.
    const conteos = await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        admin
          .from('resenas')
          .select('id', { count: 'exact', head: true })
          .eq('comercio_id', comercioId)
          .eq('estrellas', n),
      ),
    )
    const falla = conteos.find((c) => c.error)
    if (falla?.error) {
      registrar('resenas (conteo)', falla.error)
      return GESTION_VACIO
    }
    const { total, promedio: media } = resumenDeConteos(conteos.map((c) => c.count ?? 0))

    const paginado = pagina !== undefined
    const rango = rangoDePagina(total, pagina ?? 1)

    let consulta = admin
      .from('resenas')
      .select(
        'id, estrellas, mensaje, created_at, respuesta_comercio, respuesta_comercio_at, respuesta_admin, respuesta_admin_at, miembros ( nombres, apellidos )',
      )
      .eq('comercio_id', comercioId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
    consulta = paginado ? consulta.range(rango.inicio, rango.fin) : consulta.limit(PAGINA_RESENAS)
    const lista = total === 0 ? { data: [], error: null } : await consulta

    if (lista.error) {
      registrar('resenas (lista)', lista.error)
      return GESTION_VACIO
    }

    return {
      disponible: true,
      total,
      promedio: media,
      resenas: (lista.data as unknown as FilaGestion[]).map(gestionDeFila),
      pagina: rango.pagina,
      paginas: rango.paginas,
      desde: rango.desde,
      hasta: rango.hasta,
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
  async (comercioId: number, pagina: number): Promise<ResumenGestion> =>
    cargarParaGestion(comercioId, pagina),
)
