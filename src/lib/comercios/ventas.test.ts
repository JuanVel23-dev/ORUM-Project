import { describe, it, expect } from 'vitest'
import { calcularDescuento, calcularValorFinal } from './ventas'

describe('calcularDescuento', () => {
  it('porcentaje: calcula el % sobre el valor de compra', () => {
    expect(calcularDescuento('porcentaje', 20, 100000)).toBe(20000)
  })

  it('porcentaje: redondea al entero más cercano', () => {
    expect(calcularDescuento('porcentaje', 15, 3333)).toBe(500)
  })

  it('monto_fijo: usa el valor fijo cuando es menor a la compra', () => {
    expect(calcularDescuento('monto_fijo', 5000, 100000)).toBe(5000)
  })

  it('monto_fijo: se limita al valor de la compra si el fijo es mayor', () => {
    expect(calcularDescuento('monto_fijo', 50000, 10000)).toBe(10000)
  })
})

describe('calcularValorFinal', () => {
  it('resta el descuento del valor de compra', () => {
    expect(calcularValorFinal(100000, 20000)).toBe(80000)
  })

  it('nunca es negativo', () => {
    expect(calcularValorFinal(10000, 50000)).toBe(0)
  })

  it('con compra 0 y sin descuento (obsequio puro) da 0', () => {
    expect(calcularValorFinal(0, 0)).toBe(0)
  })
})
