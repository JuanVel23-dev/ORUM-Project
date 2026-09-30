import { describe, expect, it } from 'vitest'
import {
  ENCUADRE_INICIAL,
  conZoom,
  dimensionesGiradas,
  escalaBase,
  girar,
  limitarEncuadre,
} from './encuadre'

describe('escalaBase', () => {
  it('hace que el lado corto mida exactamente el círculo', () => {
    expect(escalaBase(2000, 1000)).toBe(1 / 1000)
    expect(escalaBase(800, 1200)).toBe(1 / 800)
  })
})

describe('dimensionesGiradas', () => {
  it('intercambia ancho y alto a 90 y 270', () => {
    expect(dimensionesGiradas(400, 300, 90)).toEqual({ ancho: 300, alto: 400 })
    expect(dimensionesGiradas(400, 300, 270)).toEqual({ ancho: 300, alto: 400 })
    expect(dimensionesGiradas(400, 300, 180)).toEqual({ ancho: 400, alto: 300 })
  })
})

describe('limitarEncuadre', () => {
  it('una imagen cuadrada a zoom 1 no admite desplazamiento', () => {
    expect(limitarEncuadre({ ...ENCUADRE_INICIAL, x: 0.3, y: -0.2 }, 500, 500)).toEqual(
      ENCUADRE_INICIAL,
    )
  })

  it('una apaisada 2:1 solo se mueve en horizontal, hasta medio diámetro', () => {
    const e = limitarEncuadre({ ...ENCUADRE_INICIAL, x: 9, y: 9 }, 2000, 1000)
    expect(e.x).toBeCloseTo(0.5)
    expect(e.y).toBe(0)
  })

  it('girada 90°, la holgura pasa al eje vertical', () => {
    const e = limitarEncuadre({ ...ENCUADRE_INICIAL, giro: 90, x: 9, y: 9 }, 2000, 1000)
    expect(e.x).toBe(0)
    expect(e.y).toBeCloseTo(0.5)
  })

  it('acota el zoom a su rango', () => {
    expect(limitarEncuadre({ ...ENCUADRE_INICIAL, zoom: 0.2 }, 500, 500).zoom).toBe(1)
    expect(limitarEncuadre({ ...ENCUADRE_INICIAL, zoom: 12 }, 500, 500).zoom).toBe(4)
  })
})

describe('conZoom', () => {
  it('mantiene el centro: el desplazamiento crece con la imagen', () => {
    const e = conZoom({ ...ENCUADRE_INICIAL, zoom: 2, x: 0.2, y: 0.1 }, 3, 1000, 1000)
    expect(e.zoom).toBe(3)
    expect(e.x).toBeCloseTo(0.3)
    expect(e.y).toBeCloseTo(0.15)
  })

  it('al alejar, vuelve a acotar para no dejar hueco', () => {
    const e = conZoom({ ...ENCUADRE_INICIAL, zoom: 3, x: 1, y: 0 }, 1, 1000, 1000)
    expect(e).toEqual(ENCUADRE_INICIAL)
  })
})

describe('girar', () => {
  it('da la vuelta completa en cuatro cuartos', () => {
    let e = { ...ENCUADRE_INICIAL, zoom: 2, x: 0.2, y: 0.1 }
    for (let i = 0; i < 4; i++) e = girar(e, 1000, 1000)
    expect(e.giro).toBe(0)
    expect(e.x).toBeCloseTo(0.2)
    expect(e.y).toBeCloseTo(0.1)
  })

  it('el desplazamiento gira con la imagen', () => {
    const e = girar({ ...ENCUADRE_INICIAL, zoom: 2, x: 0.2, y: 0 }, 1000, 1000)
    expect(e.giro).toBe(90)
    expect(e.x).toBeCloseTo(0)
    expect(e.y).toBeCloseTo(0.2)
  })
})
