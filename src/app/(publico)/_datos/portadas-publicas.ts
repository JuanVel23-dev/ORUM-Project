import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

/* ==========================================================================
   LAS PORTADAS DE LOS ALIADOS  ·  la foto del local, no el logotipo
   --------------------------------------------------------------------------
   POR QUÉ ESTA CONSULTA VIVE AQUÍ Y NO EN `obtenerVitrinaPublica`.

   Ese es su sitio natural: una sola consulta, una sola forma de datos. Pero
   `src/lib/publico/datos-publicos.ts` está fuera del alcance declarado de esta
   tanda (Z2 solo toca `src/app/(publico)/**`), y ahí `portadaUrl` se devuelve
   hoy en duro como `null` con un comentario que dice que la columna «no está
   aplicada». Eso dejó de ser cierto: `comercios.portada_url` existe en
   `database.types.ts` y la usan ya la ficha de comercio y el gestor de
   imágenes del panel.

   Queda anotado como propuesta: plegar este `select` dentro de
   `obtenerVitrinaPublica` y borrar este archivo. Mientras tanto, esta lectura
   suplementaria es la forma de que el escaparate enseñe fotografías sin cruzar
   la frontera de alcance, y cuesta una consulta que va EN PARALELO con las
   demás —no encadenada—, así que no suma latencia al camino crítico.

   LA MISMA DISCIPLINA QUE `datos-publicos.ts`:

     · `createAdminClient()` y no `createClient()`. El visitante no tiene
       sesión y no hay política RLS de lectura anónima sobre `comercios`: con
       la clave anónima esto devolvería CERO FILAS EN SILENCIO y la landing
       diría por omisión que ningún aliado tiene foto.
     · Se seleccionan DOS columnas, las dos públicas: `id` y `portada_url`.
       Nada que identifique a una persona.
     · Siempre `activo = true` y `deleted_at is null`. Un comercio dado de baja
       no se anuncia en la puerta, tampoco con su fotografía.
     · `server-only`: si alguien lo importara desde un componente con
       `'use client'`, el build falla en vez de publicar la clave de servicio.

   `cache()` deduplica dentro de una misma petición, igual que las otras dos
   lecturas de la fachada.
   ========================================================================== */

/**
 * Tope de filas. El mismo orden de magnitud que `obtenerVitrinaPublica`, que
 * lee hasta 100 comercios: la vitrina solo pinta 8, pero el mapa se construye
 * por `id` y tiene que cubrir a cualquiera de los que puedan entrar en ella.
 */
const TOPE_FILAS = 100

/**
 * Mapa `id de comercio → URL de portada`, solo con los que tienen una.
 *
 * Devuelve un mapa vacío si la consulta falla. Es deliberado y es el mismo
 * criterio que el resto de la fachada: sin portadas la vitrina cae al retrato
 * de marca, que es un estado completo y no una disculpa. Una landing no se
 * cae porque falte una fotografía.
 */
export const obtenerPortadasPublicas = cache(
  async (): Promise<Map<number, string>> => {
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('comercios')
      .select('id, portada_url')
      .eq('activo', true)
      .is('deleted_at', null)
      .not('portada_url', 'is', null)
      .limit(TOPE_FILAS)

    const portadas = new Map<number, string>()

    for (const fila of data ?? []) {
      const url = (fila.portada_url ?? '').trim()
      // Una cadena vacía en la columna no es una portada: sería un `<img>` con
      // `src=""`, que el navegador resuelve pidiendo la propia página.
      if (url === '') continue
      portadas.set(fila.id, url)
    }

    return portadas
  },
)
