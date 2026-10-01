/*
  DERECHOS SOBRE LAS FOTOS DE LOS SOCIOS  ·  funciones puras

  Spec: docs/superpowers/specs/2026-09-30-derechos-imagenes-design.md

  Nada de esto es seguridad por sí solo: la declaración es PRUEBA, no
  prevención, y la comprobación de caras corre en el navegador (se salta). Lo
  que sí es seguridad es que el SERVIDOR exija la declaración y que solo
  `super_admin` pueda retirar.
*/

/** Nombre del campo del formulario y único valor que cuenta como «acepto». */
export const CAMPO_DECLARACION = 'declaracion'
export const VALOR_DECLARACION = 'si'

/**
 * El valor llega del cliente. Solo el literal exacto pasa: `on`, `true`, `1`,
 * vacío o ausente se rechazan, para que un checkbox sin `value` explícito (que
 * envía `on`) no cuele por accidente.
 */
export function declaracionAceptada(valor: FormDataEntryValue | null): boolean {
  return valor === VALOR_DECLARACION
}

export const MOTIVOS_RETIRADA = [
  'reclamo_derechos',
  'contenido_inapropiado',
  'peticion_del_socio',
] as const

export type MotivoRetirada = (typeof MOTIVOS_RETIRADA)[number]

export function esMotivoRetirada(valor: unknown): valor is MotivoRetirada {
  return typeof valor === 'string' && (MOTIVOS_RETIRADA as readonly string[]).includes(valor)
}

export const ETIQUETA_MOTIVO: Record<MotivoRetirada, string> = {
  reclamo_derechos: 'Reclamo de derechos de autor',
  contenido_inapropiado: 'Contenido inapropiado',
  peticion_del_socio: 'A petición del socio',
}

export type ResultadoCaras =
  | { estado: 'disponible'; caras: number }
  | { estado: 'no_disponible' }

export type VeredictoCaras = 'una' | 'ninguna' | 'varias' | 'no_disponible'

export function veredictoDeCaras(r: ResultadoCaras): VeredictoCaras {
  if (r.estado === 'no_disponible') return 'no_disponible'
  if (!Number.isFinite(r.caras) || r.caras < 1) return 'ninguna'
  return r.caras === 1 ? 'una' : 'varias'
}

/** `no_disponible` continúa: la capa legal cubre y un fallo técnico no bloquea a un socio legítimo. */
export function permiteContinuar(v: VeredictoCaras): boolean {
  return v === 'una' || v === 'no_disponible'
}

export function mensajeDeCaras(v: VeredictoCaras): string | null {
  if (v === 'ninguna') {
    return 'No detectamos una cara en esta imagen. Sube una foto tuya, de frente, donde se te vea bien.'
  }
  if (v === 'varias') {
    return 'Detectamos varias caras. Sube una foto donde aparezcas solo tú.'
  }
  return null
}
