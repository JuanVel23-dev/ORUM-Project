import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { UBICACIONES_RECURSO } from '@/lib/sitio/recursos'
import type { UbicacionRecurso } from '@/lib/supabase/database.types'

export type RecursoAdmin = {
  id: number
  ubicacion: UbicacionRecurso
  titulo: string
  descripcion: string | null
  url: string
  enlaceUrl: string | null
  orden: number
  visible: boolean
}

/** Las cuatro ubicaciones, cada una con sus recursos. Siempre las cuatro. */
export type RecursosPorUbicacion = Record<UbicacionRecurso, RecursoAdmin[]>

function vacio(): RecursosPorUbicacion {
  return { heroe: [], promo: [], logo: [], general: [] }
}

/**
 * Todo lo alojado, visible o no.
 *
 * UNA SOLA CONSULTA para las cuatro ubicaciones, y se reparten en memoria.
 * Cuatro consultas en paralelo se leen mejor pero abren cuatro conexiones
 * para traer, en total, unas decenas de filas: esta tabla no crece con el
 * número de socios ni con el de comercios, crece con lo que sube una persona
 * a mano.
 *
 * Ante un fallo devuelve las cuatro ubicaciones VACÍAS en vez de reventar: el
 * esquema de este proyecto se aplica a mano desde el panel de Supabase, y
 * mientras la migración 20260925090000 no esté corrida esta tabla no existe.
 * La pantalla lo dice con todas las letras (`migracionPendiente`) en lugar de
 * enseñar una biblioteca vacía, que se leería como «no has subido nada».
 */
export async function cargarRecursosSitio(): Promise<{
  recursos: RecursosPorUbicacion
  migracionPendiente: boolean
}> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('recursos_sitio')
    .select('id, ubicacion, titulo, descripcion, url, enlace_url, orden, visible')
    .order('orden', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.error(
      'No se pudieron leer los recursos del sitio. ¿Está aplicada la migración ' +
        `20260925090000_recursos_sitio.sql? ${error.message}`,
    )
    return { recursos: vacio(), migracionPendiente: true }
  }

  const recursos = vacio()

  for (const fila of data ?? []) {
    // La columna es `text` con un `check`, así que en TypeScript llega tipada
    // pero en la base podría haber cualquier cosa si alguien tocara el check.
    // Una ubicación desconocida se descarta en vez de romper el reparto.
    if (!(UBICACIONES_RECURSO as readonly string[]).includes(fila.ubicacion)) continue

    recursos[fila.ubicacion].push({
      id: fila.id,
      ubicacion: fila.ubicacion,
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      url: fila.url,
      enlaceUrl: fila.enlace_url,
      orden: fila.orden,
      visible: fila.visible,
    })
  }

  return { recursos, migracionPendiente: false }
}
