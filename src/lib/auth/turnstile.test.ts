import { describe, it, expect } from 'vitest'
import { interpretarRespuestaTurnstile } from './turnstile'

describe('interpretarRespuestaTurnstile', () => {
  it('acepta la respuesta cuando success es true', () => {
    expect(interpretarRespuestaTurnstile({ success: true })).toEqual({ valido: true })
  })

  it('rechaza y expone el primer error-code cuando success es false', () => {
    const cuerpo = { success: false, 'error-codes': ['invalid-input-response'] }
    expect(interpretarRespuestaTurnstile(cuerpo)).toEqual({
      valido: false,
      motivo: 'invalid-input-response',
    })
  })

  it('distingue el token caducado o reutilizado', () => {
    const cuerpo = { success: false, 'error-codes': ['timeout-or-duplicate'] }
    expect(interpretarRespuestaTurnstile(cuerpo)).toEqual({
      valido: false,
      motivo: 'timeout-or-duplicate',
    })
  })

  it('usa un motivo genérico cuando success es false sin error-codes', () => {
    expect(interpretarRespuestaTurnstile({ success: false })).toEqual({
      valido: false,
      motivo: 'desconocido',
    })
    expect(interpretarRespuestaTurnstile({ success: false, 'error-codes': [] })).toEqual({
      valido: false,
      motivo: 'desconocido',
    })
  })

  it('rechaza cuerpos que no son un objeto con success booleano', () => {
    expect(interpretarRespuestaTurnstile(null)).toEqual({ valido: false, motivo: 'desconocido' })
    expect(interpretarRespuestaTurnstile('ok')).toEqual({ valido: false, motivo: 'desconocido' })
    expect(interpretarRespuestaTurnstile({ success: 'true' })).toEqual({
      valido: false,
      motivo: 'desconocido',
    })
  })
})
