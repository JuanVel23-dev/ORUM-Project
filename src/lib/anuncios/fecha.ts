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
