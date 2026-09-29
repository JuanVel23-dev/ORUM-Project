import { describe, expect, it } from 'vitest'
import { topPorDescuento, type ComercioConPromociones } from './top-descuentos'

function comercio(
  id: number,
  nombre: string,
  promociones: ComercioConPromociones['promociones'],
): ComercioConPromociones {
  return { id, nombre, logoUrl: null, promociones }
}

describe('topPorDescuento', () => {
  it('ordena por el mayor porcentaje de cada comercio y numera los puestos', () => {
    const top = topPorDescuento([
      comercio(1, 'Casa', [{ id: 10, titulo: 'a', tipoCodigo: 'porcentaje', valor: 10 }]),
      comercio(2, 'Spa', [
        { id: 20, titulo: 'b', tipoCodigo: 'porcentaje', valor: 15 },
        { id: 21, titulo: 'c', tipoCodigo: 'porcentaje', valor: 20 },
      ]),
    ])
    expect(top.map((t) => [t.comercioId, t.promocionId, t.puesto])).toEqual([
      [2, 21, 1],
      [1, 10, 2],
    ])
  })

  it('ignora lo que no es porcentaje y los comercios sin él', () => {
    const top = topPorDescuento([
      comercio(1, 'Dos por uno', [{ id: 10, titulo: 'a', tipoCodigo: 'dos_por_uno', valor: null }]),
      comercio(2, 'Regalo', [{ id: 20, titulo: 'b', tipoCodigo: 'regalo', valor: 50 }]),
    ])
    expect(top).toEqual([])
  })

  it('desempata por nombre y respeta el tope', () => {
    const lista = ['Zeta', 'Alfa', 'Beta'].map((n, i) =>
      comercio(i, n, [{ id: i, titulo: n, tipoCodigo: 'porcentaje', valor: 10 }]),
    )
    expect(topPorDescuento(lista, 2).map((t) => t.comercioNombre)).toEqual(['Alfa', 'Beta'])
  })
})
