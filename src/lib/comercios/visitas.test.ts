import { describe, expect, it } from 'vitest'
import { MAX_VISITAS, prepararVisitas } from './visitas'

const dos = [
  { id: 1, nombre: 'Centro' },
  { id: 2, nombre: 'Norte' },
]

describe('prepararVisitas', () => {
  it('ordena de más reciente a más antigua', () => {
    const r = prepararVisitas(
      [
        { id: 1, fecha_hora: '2026-10-01T15:00:00Z', sucursal_id: 1 },
        { id: 2, fecha_hora: '2026-10-05T15:00:00Z', sucursal_id: 1 },
      ],
      dos,
    )
    expect(r.map((v) => v.id)).toEqual([2, 1])
  })

  it('recorta a MAX_VISITAS', () => {
    const filas = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      fecha_hora: `2026-10-0${i + 1}T15:00:00Z`,
      sucursal_id: 1,
    }))
    expect(prepararVisitas(filas, dos)).toHaveLength(MAX_VISITAS)
  })

  it('formatea en hora de Bogotá, no en UTC', () => {
    // 00:30 UTC del día 8 = 7:30 p. m. del día 7 en Colombia.
    const [v] = prepararVisitas([{ id: 1, fecha_hora: '2026-10-08T00:30:00Z', sucursal_id: 1 }], dos)
    expect(v.fecha).toContain('7')
    expect(v.fecha).not.toMatch(/\b8\b/)
    expect(v.hora).toMatch(/7:30/)
  })

  it('nombra la sucursal solo si el comercio tiene más de una', () => {
    const fila = [{ id: 1, fecha_hora: '2026-10-05T15:00:00Z', sucursal_id: 2 }]
    expect(prepararVisitas(fila, dos)[0].sucursal).toBe('Norte')
    expect(prepararVisitas(fila, [dos[1]])[0].sucursal).toBeNull()
  })

  it('descarta fechas ilegibles y acepta una lista vacía', () => {
    expect(prepararVisitas([{ id: 1, fecha_hora: 'basura', sucursal_id: 1 }], dos)).toEqual([])
    expect(prepararVisitas([], dos)).toEqual([])
  })
})
