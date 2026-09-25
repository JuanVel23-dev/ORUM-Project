import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UbicacionRecurso } from '@/lib/supabase/database.types'
import type { RecursoPublico } from './recursos'

export type { RecursoPublico }

/* ==========================================================================
   LOS RECURSOS QUE VE EL VISITANTE
   --------------------------------------------------------------------------
   `createAdminClient()` y no `createClient()`, por la misma razón que
   `datos-publicos.ts`: la landing se pinta SIN SESIÓN y el cliente anónimo
   resuelve la sesión por cookies. Con la migración aplicada existe la política
   de lectura pública (`recursos_sitio_lectura_publica`, `using (visible)`) y
   el cliente anónimo bastaría; se usa el de servicio para no depender de que
   esa política esté puesta el día del despliegue, que es exactamente el modo
   de fallo que el comentario de aquel archivo describe.

   La disciplina la pone este módulo, en un único sitio:

     · Solo salen las filas con `visible = true`. Un cartel a medio preparar
       no se publica porque alguien adivine el id.
     · Solo salen columnas de presentación. `creado_por` —que es el uuid de
       quien lo subió, o sea una persona— QUEDA FUERA a propósito.
     · El orden es el mismo que enseña el panel, con `id` de desempate: dos
       carteles con el mismo `orden` no pueden bailar entre recargas, o el
       administrador ordena algo que cambia solo.
   ========================================================================== */

/**
 * Los recursos publicados de una ubicación.
 *
 * DEVUELVE LISTA VACÍA ANTE CUALQUIER FALLO, y eso es una decisión, no
 * descuido. Esta consulta la hacen la portada y el apartado de promociones de
 * la página de inicio: si la migración 20260925090000 todavía no se ha
 * aplicado —el esquema de este proyecto se corre A MANO desde el panel de
 * Supabase— la tabla no existe y la consulta falla. Con la lista vacía la
 * landing pierde un apartado; con una excepción, la landing entera se cae.
 *
 * Por eso el error se registra en el log del servidor en vez de tragarse del
 * todo: «no hay carteles» y «la tabla no existe» se ven igual en pantalla, y
 * sin esta línea nadie sabría cuál de las dos es.
 */
export const obtenerRecursosVisibles = cache(
  async (ubicacion: UbicacionRecurso): Promise<RecursoPublico[]> => {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('recursos_sitio')
      .select('id, titulo, descripcion, url, enlace_url')
      .eq('ubicacion', ubicacion)
      .eq('visible', true)
      .order('orden', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      console.error(
        `No se pudieron leer los recursos del sitio («${ubicacion}»). ` +
          '¿Está aplicada la migración 20260925090000_recursos_sitio.sql? ' +
          error.message,
      )
      return []
    }

    return (data ?? []).map((fila) => ({
      id: fila.id,
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      url: fila.url,
      enlaceUrl: fila.enlace_url,
    }))
  },
)
