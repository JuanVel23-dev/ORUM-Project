import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  normalizarMovimiento,
  sumarAhorro,
  type Movimiento,
  type VentaCruda,
} from './movimientos'

/*
  LA BITÁCORA DEL SOCIO  ·  lectura
  ---------------------------------------------------------------------------
  Lee `ventas` con el cliente de SESIÓN (`createClient`), el mismo que usa el
  resto del portal: todo pasa por RLS como el socio autenticado. NUNCA con la
  clave de servicio — con ella la política `ventas_member_select` no se
  evaluaría y cualquier error de filtrado aquí enseñaría ventas ajenas.

  Dos barreras, a propósito:
    1. RLS (`ventas_member_select`): solo filas de un `miembros` cuyo
       `perfil_id` es el usuario. Es la que protege de verdad.
    2. `.eq('miembro_id', …)`: redundante con la anterior, pero deja la
       intención a la vista y hace que, si alguien relajara la política, esta
       pantalla siguiera acotada al socio.

  `miembroId` sale de `miembros` (también bajo RLS: `miembros_self_select`),
  nunca de un parámetro de la URL.

  Los joins a `sucursales`, `comercios` y `promociones` son LEFT, no `!inner`:
  sus políticas solo dejan ver al socio lo activo y sin borrar, y un `!inner`
  haría desaparecer del historial cualquier venta de un comercio desactivado.
  Ver `movimientos.ts`.
*/

export type Bitacora = {
  movimientos: Movimiento[]
  /** Total de movimientos del socio, no de los cargados. */
  total: number
  /** Suma de todo lo ahorrado, no solo de lo cargado. */
  ahorroTotal: number
}

const SELECCION = `
  id, fecha_hora, valor_compra, valor_descuento, valor_final,
  sucursales ( nombre, comercios ( id, nombre, logo_url ) ),
  promociones ( titulo )
`

export async function obtenerBitacora(
  miembroId: number,
  limite: number,
): Promise<Bitacora | null> {
  const supabase = await createClient()

  /*
    El total ahorrado se pide aparte y solo con la columna que suma: no puede
    salir de la página cargada, o «Ver más» cambiaría la cifra de arriba.
    PostgREST corta a 1000 filas por defecto; un socio con más de mil compras
    en ORUM no es un caso real hoy, y si lo fuera la cifra quedaría corta, no
    inventada.
  */
  const [lista, ahorro] = await Promise.all([
    supabase
      .from('ventas')
      .select(SELECCION, { count: 'exact' })
      .eq('miembro_id', miembroId)
      .order('fecha_hora', { ascending: false })
      // Desempate: dos ventas en el mismo instante no deben bailar entre páginas.
      .order('id', { ascending: false })
      .limit(limite),
    supabase.from('ventas').select('valor_descuento').eq('miembro_id', miembroId),
  ])

  if (lista.error || ahorro.error) {
    console.error(
      `[obtenerBitacora] Error leyendo 'ventas' para miembro_id=${miembroId}:`,
      lista.error ?? ahorro.error,
    )
    return null
  }

  return {
    movimientos: (lista.data as unknown as VentaCruda[]).map(normalizarMovimiento),
    total: lista.count ?? lista.data.length,
    ahorroTotal: sumarAhorro(ahorro.data),
  }
}
