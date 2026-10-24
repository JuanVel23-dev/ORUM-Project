import { describe, expect, it } from 'vitest'
import { MAX_RESTRICCIONES, leerRestricciones } from './restricciones-promocion'

describe('leerRestricciones', () => {
  it('vacío, solo espacios o ausente es «sin restricciones»', () => {
    for (const v of ['', '   \n  ', null, undefined]) {
      expect(leerRestricciones(v)).toEqual({ ok: true, valor: null })
    }
  })

  it('recorta los espacios de los extremos', () => {
    expect(leerRestricciones('  No acumulable con otras promociones.  ')).toEqual({
      ok: true,
      valor: 'No acumulable con otras promociones.',
    })
  })

  it('unifica los saltos de línea y no deja más de una línea en blanco seguida', () => {
    expect(leerRestricciones('Primera.\r\n\r\n\r\n\r\nSegunda.')).toEqual({
      ok: true,
      valor: 'Primera.\n\nSegunda.',
    })
  })

  it('acepta justo el máximo y rechaza uno más', () => {
    expect(leerRestricciones('a'.repeat(MAX_RESTRICCIONES)).ok).toBe(true)
    const r = leerRestricciones('a'.repeat(MAX_RESTRICCIONES + 1))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain(String(MAX_RESTRICCIONES))
  })

  it('el largo se cuenta sobre el texto ya limpio', () => {
    expect(leerRestricciones(`   ${'a'.repeat(MAX_RESTRICCIONES)}   `).ok).toBe(true)
  })
})
