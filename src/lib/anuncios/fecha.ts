/**
 * Fecha de un anuncio en prosa, en `America/Bogota` — igual que el resto del
 * proyecto formatea un `timestamptz` (ver `src/lib/shared/fecha.ts`). Bogotá
 * no tiene horario de verano, así que el offset es siempre -05:00.
 */
export function formatearFechaNovedad(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

/**
 * La misma fecha, corta («26 sept 2026»): el aviso del teléfono, donde la
 * larga no cabía junto a la insignia «Novedad» y se cortaba bajo la X.
 */
export function formatearFechaNovedadCorta(iso: string): string {
  const partes = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(iso))
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${parte('day')} ${parte('month').replace('.', '')} ${parte('year')}`
}
