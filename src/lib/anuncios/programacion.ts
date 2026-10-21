/*
  NOVEDADES PROGRAMADAS  ·  puro (21/10/2026)
  ---------------------------------------------------------------------------
  Encargo: «que el administrador pueda programar el anuncio: un rango de
  fechas con una hora de salida y una hora de finalización».

  Una novedad tiene una VENTANA opcional, `publicar_desde` y
  `publicar_hasta` (timestamptz). Sin la primera se ve desde que se guarda;
  sin la segunda, hasta que se retire.

  LA HORA ES LA DE COLOMBIA, siempre. El administrador escribe «14/11, 8:00»
  pensando en Bogotá, y su navegador puede estar en otra zona (o mal
  configurado). Por eso la fecha y la hora viajan como texto y aquí se les
  pone el desfase de Bogotá (−05:00, sin horario de verano), igual que hace
  `lib/shared/fecha.ts` para los filtros.
*/

const ZONA = 'America/Bogota'
const DESFASE_BOGOTA = '-05:00'

export type EstadoNovedad = 'retirada' | 'programada' | 'publicada' | 'finalizada'

/** El instante de una fecha (`AAAA-MM-DD`) y una hora (`HH:mm`) de Bogotá, en ISO. `null` si no son válidas. */
export function instanteBogota(fecha: string, hora: string): string | null {
  const f = fecha.trim()
  const h = hora.trim()
  const mf = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f)
  const mh = /^(\d{2}):(\d{2})$/.exec(h)
  if (!mf || !mh) return null
  const [anio, mes, dia] = [Number(mf[1]), Number(mf[2]), Number(mf[3])]
  const [horas, minutos] = [Number(mh[1]), Number(mh[2])]
  if (horas > 23 || minutos > 59) return null
  const civil = new Date(Date.UTC(anio, mes - 1, dia))
  if (civil.getUTCFullYear() !== anio || civil.getUTCMonth() !== mes - 1 || civil.getUTCDate() !== dia) {
    return null
  }
  return new Date(`${f}T${h}:00${DESFASE_BOGOTA}`).toISOString()
}

/** La fecha y la hora de Bogotá de un instante, para rellenar los campos. */
export function partesBogota(iso: string | null): { fecha: string; hora: string } {
  if (!iso) return { fecha: '', hora: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { fecha: '', hora: '' }
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` }
}

/** En qué punto de su vida está una novedad, ahora. */
export function estadoNovedad(
  novedad: { activo: boolean; desde: string | null; hasta: string | null },
  ahora: Date,
): EstadoNovedad {
  if (!novedad.activo) return 'retirada'
  const t = ahora.getTime()
  if (novedad.hasta && new Date(novedad.hasta).getTime() <= t) return 'finalizada'
  if (novedad.desde && new Date(novedad.desde).getTime() > t) return 'programada'
  return 'publicada'
}

/** «14 de nov., 8:00 a. m.» en Bogotá. */
export function formatearMomento(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** La ventana en palabras: «Del 14 de nov., 8:00 a. m. al 20 de nov., 6:00 p. m.», o `null` si no tiene. */
export function describirProgramacion(desde: string | null, hasta: string | null): string | null {
  if (desde && hasta) return `Del ${formatearMomento(desde)} al ${formatearMomento(hasta)}`
  if (desde) return `Desde el ${formatearMomento(desde)}`
  if (hasta) return `Hasta el ${formatearMomento(hasta)}`
  return null
}

/**
 * Lo que está mal en una ventana, o `null`. Lo usan el formulario (para
 * avisar al momento) y la acción del servidor (que es quien decide).
 */
export function revisarProgramacion(desde: string | null, hasta: string | null, ahora: Date): string | null {
  if (desde && hasta && new Date(hasta).getTime() <= new Date(desde).getTime()) {
    return 'El fin tiene que ser después del inicio.'
  }
  if (hasta && new Date(hasta).getTime() <= ahora.getTime()) {
    return 'La fecha de fin ya pasó: la novedad no se vería nunca.'
  }
  return null
}

/** Lo mínimo para decidir si una novedad se ve ya y en qué orden. */
type ConVentana = { desde: string | null; hasta: string | null; creada: string }

/**
 * Las que están en su ventana AHORA, la más reciente primero. «Reciente» es
 * cuándo SALIÓ (su inicio programado, o cuándo se creó si no tiene): una
 * novedad programada para hoy pasa delante de una creada ayer aunque se
 * escribiera antes.
 */
export function vigentesAhora<T extends ConVentana>(filas: readonly T[], ahora: Date): T[] {
  const salida = (f: T) => new Date(f.desde ?? f.creada).getTime()
  return filas
    .filter((f) => estadoNovedad({ activo: true, desde: f.desde, hasta: f.hasta }, ahora) === 'publicada')
    .sort((a, b) => salida(b) - salida(a))
}

/** ¿El error de la base es que aún no existen las columnas de programación (migración sin aplicar)? */
export function faltanColumnasDeProgramacion(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /publicar_(desde|hasta)/.test(error.message ?? '')
  )
}
