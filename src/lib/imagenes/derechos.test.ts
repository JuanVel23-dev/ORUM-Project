import { describe, it, expect } from 'vitest'
import {
  CAMPO_DECLARACION,
  VALOR_DECLARACION,
  MOTIVOS_RETIRADA,
  declaracionAceptada,
  esMotivoRetirada,
  mensajeDeCaras,
  permiteContinuar,
  veredictoDeCaras,
} from './derechos'

describe('declaracionAceptada — viene del cliente, así que no es de fiar', () => {
  it('acepta solo el valor afirmativo exacto', () => {
    expect(CAMPO_DECLARACION).toBe('declaracion')
    expect(declaracionAceptada(VALOR_DECLARACION)).toBe(true)
  })

  it('rechaza ausente, vacío y valores parecidos', () => {
    for (const malo of [null, '', 'on', 'true', '1', 'SI', 'no', ' si']) {
      expect(declaracionAceptada(malo)).toBe(false)
    }
  })

  it('rechaza un archivo colado en ese campo', () => {
    expect(declaracionAceptada(new File(['x'], 'x.txt'))).toBe(false)
  })
})

describe('esMotivoRetirada — lista cerrada', () => {
  it('acepta los tres motivos', () => {
    expect(MOTIVOS_RETIRADA).toEqual([
      'reclamo_derechos',
      'contenido_inapropiado',
      'peticion_del_socio',
    ])
    for (const m of MOTIVOS_RETIRADA) expect(esMotivoRetirada(m)).toBe(true)
  })

  it('rechaza cualquier otra cosa', () => {
    for (const malo of ['', 'otro', 'RECLAMO_DERECHOS', null, undefined, 1, {}, ['reclamo_derechos']]) {
      expect(esMotivoRetirada(malo)).toBe(false)
    }
  })
})

describe('veredictoDeCaras', () => {
  it('una cara → una', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: 1 })).toBe('una')
  })
  it('cero caras → ninguna', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: 0 })).toBe('ninguna')
  })
  it('varias caras → varias', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: 2 })).toBe('varias')
    expect(veredictoDeCaras({ estado: 'disponible', caras: 9 })).toBe('varias')
  })
  it('sin detector → no_disponible', () => {
    expect(veredictoDeCaras({ estado: 'no_disponible' })).toBe('no_disponible')
  })
  it('un conteo absurdo no rompe: negativo o NaN cuentan como ninguna', () => {
    expect(veredictoDeCaras({ estado: 'disponible', caras: -1 })).toBe('ninguna')
    expect(veredictoDeCaras({ estado: 'disponible', caras: NaN })).toBe('ninguna')
  })
})

describe('permiteContinuar y mensajeDeCaras', () => {
  it('continúan una cara y el fallo técnico', () => {
    expect(permiteContinuar('una')).toBe(true)
    expect(permiteContinuar('no_disponible')).toBe(true)
  })
  it('bloquean ninguna y varias, con mensaje', () => {
    expect(permiteContinuar('ninguna')).toBe(false)
    expect(permiteContinuar('varias')).toBe(false)
    expect(mensajeDeCaras('ninguna')).toMatch(/cara/i)
    expect(mensajeDeCaras('varias')).toMatch(/una sola|varias/i)
  })
  it('sin mensaje cuando se puede continuar', () => {
    expect(mensajeDeCaras('una')).toBeNull()
    expect(mensajeDeCaras('no_disponible')).toBeNull()
  })
})
