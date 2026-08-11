import { describe, expect, it } from 'vitest'
import {
  DECELERACION_NORMAL,
  amortiguarBorde,
  proyectarMomento,
  velocidadRelativa,
} from './motion'

describe('proyectarMomento', () => {
  it('no proyecta nada si no hay velocidad', () => {
    expect(proyectarMomento(0)).toBe(0)
  })

  it('proyecta 499px para 1000px/s con la deceleración normal', () => {
    // (1000/1000) * 0.998 / (1 - 0.998) = 499
    expect(proyectarMomento(1000, DECELERACION_NORMAL)).toBeCloseTo(499, 6)
  })

  it('conserva el signo de la velocidad', () => {
    expect(proyectarMomento(-1000)).toBeCloseTo(-499, 6)
  })

  it('es simétrica respecto al signo', () => {
    expect(proyectarMomento(750)).toBeCloseTo(-proyectarMomento(-750), 6)
  })

  it('proyecta más lejos cuanto mayor es la velocidad', () => {
    expect(proyectarMomento(2000)).toBeGreaterThan(proyectarMomento(1000))
  })

  it('una deceleración más baja produce un deslizamiento más seco', () => {
    // 0.99 => (1) * 0.99 / 0.01 = 99, mucho menos que los 499 de 0.998.
    expect(proyectarMomento(1000, 0.99)).toBeCloseTo(99, 6)
    expect(proyectarMomento(1000, 0.99)).toBeLessThan(proyectarMomento(1000))
  })
})

describe('amortiguarBorde', () => {
  it('no amortigua nada dentro del límite', () => {
    expect(amortiguarBorde(0, 400)).toBe(0)
  })

  it('devuelve 0 si la dimensión no es válida', () => {
    expect(amortiguarBorde(100, 0)).toBe(0)
  })

  it('resiste: el desplazamiento es menor que el exceso', () => {
    // 100 * 400 * 0.55 / (400 + 0.55*100) = 22000 / 455 ≈ 48.35
    expect(amortiguarBorde(100, 400)).toBeCloseTo(48.3516, 3)
    expect(amortiguarBorde(100, 400)).toBeLessThan(100)
  })

  it('resiste cada vez más: la respuesta crece por debajo de lo lineal', () => {
    const a = amortiguarBorde(100, 400)
    const b = amortiguarBorde(200, 400)

    expect(b).toBeGreaterThan(a) // sigue respondiendo
    expect(b).toBeLessThan(a * 2) // pero cada píxel adicional cuenta menos
  })

  it('nunca se despega: tiende asintóticamente a la dimensión', () => {
    const enorme = amortiguarBorde(1_000_000, 400)
    expect(enorme).toBeLessThan(400)
    expect(enorme).toBeCloseTo(400, 0)
  })

  it('es simétrica respecto al signo', () => {
    expect(amortiguarBorde(-100, 400)).toBeCloseTo(-amortiguarBorde(100, 400), 6)
  })
})

describe('velocidadRelativa', () => {
  it('normaliza por la distancia restante', () => {
    // Elemento en 50, destino 150 (quedan 100px), dedo a 50px/s => 0.5
    expect(velocidadRelativa(50, 50, 150)).toBeCloseTo(0.5, 6)
  })

  it('devuelve 0 cuando ya se está en el destino, sin dividir por cero', () => {
    expect(velocidadRelativa(120, 150, 150)).toBe(0)
  })

  it('conserva el signo al retroceder', () => {
    expect(velocidadRelativa(-50, 150, 50)).toBeCloseTo(0.5, 6)
  })
})
