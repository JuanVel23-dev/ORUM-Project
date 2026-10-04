import { describe, it, expect } from 'vitest'
import {
  agruparPorMes,
  normalizarMovimiento,
  sumarAhorro,
  limiteSolicitado,
  LIMITE_INICIAL,
  LIMITE_MAXIMO,
  PASO_VER_MAS,
  type VentaCruda,
} from './movimientos'

const base: VentaCruda = {
  id: 7,
  fecha_hora: '2026-09-28T23:30:00+00:00',
  valor_compra: 100000,
  valor_descuento: 15000,
  valor_final: 85000,
  sucursales: {
    nombre: 'Sede Centro',
    comercios: { id: 3, nombre: 'Café Aurora' },
  },
  promociones: { titulo: '15 % en todo el menú' },
}

describe('normalizarMovimiento', () => {
  it('aplana comercio, sucursal y promoción', () => {
    expect(normalizarMovimiento(base)).toEqual({
      id: 7,
      fechaHora: '2026-09-28T23:30:00+00:00',
      comercioId: 3,
      comercio: 'Café Aurora',
      logoUrl: null,
      sucursal: 'Sede Centro',
      promocion: '15 % en todo el menú',
      valorCompra: 100000,
      ahorro: 15000,
      valorFinal: 85000,
    })
  })

  it('no pierde la fila si el comercio ya no es legible (RLS lo oculta a clientes)', () => {
    const m = normalizarMovimiento({ ...base, sucursales: null })
    expect(m.comercio).toBe('Comercio no disponible')
    expect(m.comercioId).toBeNull()
    expect(m.sucursal).toBeNull()
  })

  it('si la promoción ya no es legible, o no hubo, no inventa un título', () => {
    expect(normalizarMovimiento({ ...base, promociones: null }).promocion).toBeNull()
  })

  it('convierte los numeric que PostgREST entrega como texto', () => {
    const m = normalizarMovimiento({
      ...base,
      valor_compra: '100000.50' as unknown as number,
      valor_descuento: '15000' as unknown as number,
      valor_final: '85000.50' as unknown as number,
    })
    expect(m.valorCompra).toBe(100000.5)
    expect(m.ahorro).toBe(15000)
    expect(m.valorFinal).toBe(85000.5)
  })
})

describe('sumarAhorro', () => {
  it('suma los descuentos', () => {
    expect(sumarAhorro([{ valor_descuento: 1000 }, { valor_descuento: 2500 }])).toBe(3500)
  })

  it('devuelve 0 sin movimientos', () => {
    expect(sumarAhorro([])).toBe(0)
  })

  it('acepta numeric en texto y evita errores de coma flotante', () => {
    const filas = [{ valor_descuento: '0.1' }, { valor_descuento: '0.2' }] as unknown as {
      valor_descuento: number
    }[]
    expect(sumarAhorro(filas)).toBe(0.3)
  })

  it('ignora valores no numéricos en vez de contaminar el total con NaN', () => {
    const filas = [{ valor_descuento: 500 }, { valor_descuento: null }] as unknown as {
      valor_descuento: number
    }[]
    expect(sumarAhorro(filas)).toBe(500)
  })
})

describe('limiteSolicitado — viene de la URL, así que no es de fiar', () => {
  it('sin parámetro, el límite inicial', () => {
    expect(limiteSolicitado(undefined)).toBe(LIMITE_INICIAL)
  })

  it('acepta un valor válido', () => {
    expect(limiteSolicitado(String(LIMITE_INICIAL + PASO_VER_MAS))).toBe(
      LIMITE_INICIAL + PASO_VER_MAS,
    )
  })

  it('rechaza basura, negativos, cero y decimales', () => {
    for (const malo of ['abc', '-5', '0', '12.5', '', 'NaN', 'Infinity']) {
      expect(limiteSolicitado(malo)).toBe(LIMITE_INICIAL)
    }
  })

  it('nunca baja del inicial ni pasa del máximo', () => {
    expect(limiteSolicitado('3')).toBe(LIMITE_INICIAL)
    expect(limiteSolicitado('999999')).toBe(LIMITE_MAXIMO)
  })

  it('si llega un arreglo (?n=1&n=2) usa el límite inicial', () => {
    expect(limiteSolicitado(['100', '200'])).toBe(LIMITE_INICIAL)
  })
})

describe('agruparPorMes', () => {
  const mov = (id: number, fechaHora: string, ahorro: number) => ({
    ...normalizarMovimiento({ ...base, id, fecha_hora: fechaHora, valor_descuento: ahorro }),
  })

  it('agrupa por mes conservando el orden de llegada', () => {
    const meses = agruparPorMes([
      mov(3, '2026-10-02T15:00:00+00:00', 1000),
      mov(2, '2026-10-01T15:00:00+00:00', 2000),
      mov(1, '2026-09-10T15:00:00+00:00', 500),
    ])
    expect(meses.map((m) => m.clave)).toEqual(['2026-10', '2026-09'])
    expect(meses[0].movimientos.map((m) => m.id)).toEqual([3, 2])
    expect(meses[0].ahorro).toBe(3000)
    expect(meses[0].titulo).toBe('Octubre de 2026')
  })

  it('decide el mes en la hora de Colombia, no en UTC', () => {
    // 1 de octubre a las 02:00 UTC = 30 de septiembre a las 9 p. m. en Bogotá.
    const meses = agruparPorMes([mov(1, '2026-10-01T02:00:00+00:00', 100)])
    expect(meses[0].clave).toBe('2026-09')
  })

  it('sin movimientos, sin meses', () => {
    expect(agruparPorMes([])).toEqual([])
  })
})
