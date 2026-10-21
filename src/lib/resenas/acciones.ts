/*
  RESEÑAS  ·  lo puro de las acciones del socio
  ---------------------------------------------------------------------------
  Lo que `resenas-actions.ts` decide sin tocar la red, aparte para poder
  probarlo: leer el comercio del formulario (entrada no confiable), traducir
  a una frase de persona lo que contesta la base y fechar una reseña.
*/

import { esTablaAusente } from './resenas'

/** El `comercio_id` del formulario: entero positivo, o `null`. */
export function leerComercioId(crudo: FormDataEntryValue | null): number | null {
  if (typeof crudo !== 'string' || !/^\s*\d+\s*$/.test(crudo)) return null
  const n = Number(crudo)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

type ErrorDeBase = { code?: string; message?: string } | null | undefined

/*
  Los `raise exception` de `fn_validar_resena` (sin tildes: así están en la
  base). Se buscan por un trozo y no por igualdad: PostgREST puede añadir
  contexto y una frase entera es más frágil que su núcleo.
*/
const DEL_TRIGGER: [trozo: string, frase: string][] = [
  ['comercio no esta activo', 'Este comercio ya no está en el club: no se puede reseñar.'],
  ['socio no existe', 'No encontramos tu ficha de socio.'],
  [
    'solo puede resenar quien ha comprado',
    'Solo puedes reseñar un comercio donde hayas comprado con tu membresía ORUM.',
  ],
  ['membresia del socio no esta vigente', 'Tu membresía no está vigente: renuévala para poder reseñar.'],
]

/**
 * Frase para el socio a partir del error de guardar una reseña. Nunca el
 * `message` crudo de la base: nombra tablas y restricciones.
 */
export function traducirErrorResena(error: ErrorDeBase): string {
  const mensaje = (error?.message ?? '').toLowerCase()

  if (error?.code === 'P0001') {
    const casa = DEL_TRIGGER.find(([trozo]) => mensaje.includes(trozo))
    if (casa) return casa[1]
  }
  if (esTablaAusente(error)) return 'Las reseñas todavía no están disponibles.'
  // `check` de la tabla: estrellas fuera de 1–5 o un mensaje fuera de largo.
  if (error?.code === '23514') return 'Revisa la calificación y el mensaje.'
  return 'No pudimos guardar tu reseña. Inténtalo de nuevo.'
}

const FECHA_RESENA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** «5 de octubre de 2026», en hora de Colombia (`created_at` es `timestamptz`). */
export function fechaResena(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return FECHA_RESENA.format(fecha)
}
