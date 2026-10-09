/** Cuántas visitas recientes enseña la ventana del veredicto. */
export const MAX_VISITAS = 5

export type VisitaCruda = { id: number; fecha_hora: string; sucursal_id: number }

export type Visita = {
  id: number
  /** «mié, 7 oct 2026». */
  fecha: string
  /** «3:45 p. m.». */
  hora: string
  /** El nombre de la sucursal; `null` si el comercio tiene una sola. */
  sucursal: string | null
}

/**
 * Lo que la ventana pinta. El error es un estado, no una excepción: el
 * historial es una ayuda, y que falle no puede tumbar la verificación.
 */
export type HistorialVisitas = { ok: true; visitas: Visita[] } | { ok: false }

/* Zona del negocio, no la del servidor: en UTC una visita de las 7pm en
   Colombia saldría con la fecha del día siguiente. */
const FECHA_BOGOTA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const HORA_BOGOTA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * Ordena de más reciente a más antigua, recorta a `MAX_VISITAS` y le pone
 * forma de texto. Las filas con fecha ilegible se descartan: una visita con
 * «Invalid Date» es peor que una visita menos.
 *
 * `sucursales` con una sola entrada no nombra la sucursal: no informa.
 */
export function prepararVisitas(
  filas: VisitaCruda[],
  sucursales: { id: number; nombre: string | null }[],
): Visita[] {
  const nombres = new Map(sucursales.map((s) => [s.id, (s.nombre ?? '').trim() || null]))
  const nombrarSucursal = sucursales.length > 1

  return filas
    .map((f) => ({ f, t: new Date(f.fecha_hora) }))
    .filter(({ t }) => !Number.isNaN(t.getTime()))
    .sort((a, b) => b.t.getTime() - a.t.getTime())
    .slice(0, MAX_VISITAS)
    .map(({ f, t }) => ({
      id: f.id,
      fecha: FECHA_BOGOTA.format(t),
      hora: HORA_BOGOTA.format(t),
      sucursal: nombrarSucursal ? (nombres.get(f.sucursal_id) ?? null) : null,
    }))
}
