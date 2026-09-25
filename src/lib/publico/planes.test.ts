import { describe, it, expect } from 'vitest'
import { formatearPesos, periodoDelPlan, prepararPlanes, type PlanCrudo } from './planes'

function plan(id: number, precio: number, duracion_meses: number, nombre = `Plan ${id}`): PlanCrudo {
  return { id, nombre, descripcion: null, precio, duracion_meses }
}

describe('formatearPesos', () => {
  it('usa punto de miles y ningún decimal', () => {
    expect(formatearPesos(250000)).toBe('$250.000')
    expect(formatearPesos(20833.33)).toBe('$20.833')
  })
})

describe('periodoDelPlan', () => {
  it('nombra los periodos habituales', () => {
    expect(periodoDelPlan(1)).toBe('mes')
    expect(periodoDelPlan(12)).toBe('año')
    expect(periodoDelPlan(24)).toBe('2 años')
    expect(periodoDelPlan(6)).toBe('6 meses')
  })
})

describe('prepararPlanes', () => {
  it('calcula el ahorro real del anual frente a doce mensualidades', () => {
    const [mensual, anual] = prepararPlanes([plan(2, 250000, 12), plan(1, 30000, 1)])

    expect(mensual.ahorro).toBeNull()
    expect(mensual.mensualEquivalente).toBeNull()
    expect(mensual.destacado).toBe(false)

    // 30.000 x 12 = 360.000; 360.000 - 250.000 = 110.000. No «dos meses».
    expect(anual.ahorro).toBe(110000)
    expect(anual.mensualEquivalente).toBe(20833)
    expect(anual.periodo).toBe('año')
    expect(anual.destacado).toBe(true)
  })

  it('sin plan mensual no inventa ningún ahorro', () => {
    const planes = prepararPlanes([plan(1, 250000, 12)])
    expect(planes[0].ahorro).toBeNull()
    expect(planes[0].destacado).toBe(false)
  })

  it('un plan largo más caro que sus mensualidades no anuncia ahorro', () => {
    const [, trimestral] = prepararPlanes([plan(1, 30000, 1), plan(2, 95000, 3)])
    expect(trimestral.ahorro).toBeNull()
    expect(trimestral.destacado).toBe(false)
  })

  it('destaca el de mayor ahorro relativo, no el más largo', () => {
    const planes = prepararPlanes([
      plan(1, 30000, 1),
      plan(2, 150000, 6), // ahorra 30.000 de 180.000: 16,7 %
      plan(3, 700000, 24), // ahorra 20.000 de 720.000: 2,8 %
    ])
    expect(planes.find((p) => p.id === 2)?.destacado).toBe(true)
    expect(planes.filter((p) => p.destacado)).toHaveLength(1)
  })

  it('descarta precios o duraciones que no se pueden anunciar', () => {
    const planes = prepararPlanes([plan(1, 0, 1), plan(2, 30000, 0), plan(3, 30000, 1)])
    expect(planes.map((p) => p.id)).toEqual([3])
  })

  it('compara contra el mensual más barato si hay varios', () => {
    const [, , anual] = prepararPlanes([plan(1, 30000, 1), plan(2, 40000, 1), plan(3, 300000, 12)])
    expect(anual.ahorro).toBe(60000)
  })
})
