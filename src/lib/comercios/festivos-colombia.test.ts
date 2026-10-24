import { describe, expect, it } from 'vitest'
import { esFestivoColombia, festivosColombia } from './festivos-colombia'

describe('festivosColombia', () => {
  it('2026 trae los 18 festivos, con los trasladados al lunes', () => {
    expect(festivosColombia(2026)).toEqual([
      '2026-01-01',
      '2026-01-12',
      '2026-03-23',
      '2026-04-02',
      '2026-04-03',
      '2026-05-01',
      '2026-05-18',
      '2026-06-08',
      '2026-06-15',
      '2026-06-29',
      '2026-07-20',
      '2026-08-07',
      '2026-08-17',
      '2026-10-12',
      '2026-11-02',
      '2026-11-16',
      '2026-12-08',
      '2026-12-25',
    ])
  })

  it('2027 calcula la Semana Santa desde la Pascua del 28 de marzo', () => {
    const f = festivosColombia(2027)
    expect(f).toContain('2027-03-25')
    expect(f).toContain('2027-03-26')
    expect(f).toHaveLength(18)
  })
})

describe('esFestivoColombia', () => {
  it('Nochebuena no es festivo', () => {
    expect(esFestivoColombia('2026-12-24')).toBe(false)
  })

  it('Viernes Santo sí', () => {
    expect(esFestivoColombia('2026-04-03')).toBe(true)
  })
})
