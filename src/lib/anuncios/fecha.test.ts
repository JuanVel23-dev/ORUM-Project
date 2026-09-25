import { describe, it, expect } from 'vitest'
import { formatearFechaNovedad } from './fecha'

describe('formatearFechaNovedad', () => {
  it('formatea un timestamptz en America/Bogota, en español', () => {
    // 2026-09-23T23:30:00Z son las 18:30 en Bogotá (UTC-5): mismo día.
    expect(formatearFechaNovedad('2026-09-23T23:30:00Z')).toBe('23 de septiembre de 2026')
  })

  it('un timestamp que cruza medianoche UTC hacia el día anterior en Bogotá', () => {
    // 2026-09-24T02:00:00Z son las 21:00 del 23 en Bogotá.
    expect(formatearFechaNovedad('2026-09-24T02:00:00Z')).toBe('23 de septiembre de 2026')
  })
})
