import { describe, expect, it } from 'vitest'
import { ZOOM_MAX } from './encuadre'
import {
  encuadreInicialEnMarco,
  escalaCubrir,
  girarEnMarco,
  limitarEnMarco,
  zoomEnMarco,
  zoomMinimo,
  zoomQueContiene,
  type Marco,
} from './marco'

const FOTO: Marco = { proporcion: 9 / 16 }
const LOGO: Marco = { proporcion: 1, permiteContener: true }
const LOGO_REDONDO: Marco = { proporcion: 1, permiteContener: true, circular: true }

describe('escalaCubrir', () => {
  it('en un cuadrado coincide con el lado corto, como el círculo del socio', () => {
    expect(escalaCubrir(2000, 1000, 0, 1)).toBe(1 / 1000)
    expect(escalaCubrir(800, 1200, 0, 1)).toBe(1 / 800)
  })

  it('una imagen con la proporción del marco lo cubre justo a lo ancho', () => {
    expect(escalaCubrir(1600, 900, 0, 9 / 16)).toBeCloseTo(1 / 1600)
  })

  it('una vertical en un marco apaisado manda por el ancho', () => {
    // 900×1600 en 16:9: a lo ancho mide 1 y de alto sobra muchísimo.
    expect(escalaCubrir(900, 1600, 0, 9 / 16)).toBeCloseTo(1 / 900)
  })

  it('depende del giro: la misma vertical, girada, cubre con otra escala', () => {
    // Girada es 1600×900: vuelve a ser la proporción del marco.
    expect(escalaCubrir(900, 1600, 90, 9 / 16)).toBeCloseTo(1 / 1600)
  })
})

describe('zoomQueContiene', () => {
  it('vale 1 cuando la imagen tiene la proporción del marco', () => {
    expect(zoomQueContiene(1600, 900, 0, 9 / 16)).toBeCloseTo(1)
    expect(zoomQueContiene(500, 500, 0, 1)).toBeCloseTo(1)
  })

  it('un logotipo 4:1 en un cuadrado cabe a un cuarto del zoom de cubrir', () => {
    expect(zoomQueContiene(2000, 500, 0, 1)).toBeCloseTo(0.25)
  })

  it('en un círculo cabe la DIAGONAL: el mismo logotipo se aleja más', () => {
    // Cubrir: 1/500. Caber en el círculo: 1/√(2000² + 500²).
    expect(zoomQueContiene(2000, 500, 0, 1, true)).toBeCloseTo(500 / Math.hypot(2000, 500))
    // Una imagen cuadrada cabe en el círculo a 1/√2 del zoom de cubrir.
    expect(zoomQueContiene(800, 800, 0, 1, true)).toBeCloseTo(Math.SQRT1_2)
  })
})

describe('zoomMinimo', () => {
  it('una fotografía nunca baja de cubrir', () => {
    expect(zoomMinimo(2000, 500, 0, FOTO)).toBe(1)
  })

  it('un logotipo se aleja un poco más allá de caber, para dejar aire', () => {
    expect(zoomMinimo(2000, 500, 0, LOGO)).toBeCloseTo(0.25 * 0.8)
    expect(zoomMinimo(500, 500, 0, LOGO)).toBeCloseTo(0.8)
  })
})

describe('encuadreInicialEnMarco', () => {
  it('una fotografía arranca cubriendo el marco', () => {
    expect(encuadreInicialEnMarco(3000, 2000, FOTO)).toEqual({ x: 0, y: 0, zoom: 1, giro: 0 })
  })

  it('un logotipo arranca ENTERO, no recortado', () => {
    expect(encuadreInicialEnMarco(2000, 500, LOGO).zoom).toBeCloseTo(0.25)
  })

  it('en un círculo arranca entero DENTRO del círculo', () => {
    expect(encuadreInicialEnMarco(2000, 500, LOGO_REDONDO).zoom).toBeCloseTo(
      500 / Math.hypot(2000, 500),
    )
  })

  it('un logotipo ya publicado se abre como se ve: el ajustado aquí, tal cual', () => {
    // El que guarda este editor es cuadrado: abrirlo y guardarlo no lo encoge.
    expect(encuadreInicialEnMarco(640, 640, LOGO_REDONDO, true)).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
      giro: 0,
    })
    // Uno antiguo y apaisado, contenido en la caja cuadrada, como en la placa.
    expect(encuadreInicialEnMarco(2000, 500, LOGO_REDONDO, true).zoom).toBeCloseTo(0.25)
  })

  it('una fotografía ya publicada arranca igual que una nueva: cubriendo', () => {
    expect(encuadreInicialEnMarco(1600, 900, FOTO, true)).toEqual({ x: 0, y: 0, zoom: 1, giro: 0 })
  })
})

describe('limitarEnMarco', () => {
  it('una 16:9 en su marco, a zoom 1, no admite desplazamiento', () => {
    const e = limitarEnMarco({ x: 0.4, y: -0.3, zoom: 1, giro: 0 }, 1600, 900, FOTO)
    expect(e).toEqual({ x: 0, y: 0, zoom: 1, giro: 0 })
  })

  it('una cuadrada en un marco 16:9 solo se mueve en vertical', () => {
    // Cubre a lo ancho (1) y de alto mide 1: sobra (1 − 9/16) / 2 a cada lado.
    const e = limitarEnMarco({ x: 9, y: 9, zoom: 1, giro: 0 }, 1000, 1000, FOTO)
    expect(e.x).toBe(0)
    expect(e.y).toBeCloseTo((1 - 9 / 16) / 2)
  })

  it('al acercar, la holgura crece en los dos ejes', () => {
    const e = limitarEnMarco({ x: 9, y: 9, zoom: 2, giro: 0 }, 1600, 900, FOTO)
    expect(e.x).toBeCloseTo(0.5)
    expect(e.y).toBeCloseTo(9 / 32)
  })

  it('un logotipo alejado se queda centrado: no hay nada que encuadrar', () => {
    const e = limitarEnMarco({ x: 0.4, y: 0.4, zoom: 0.25, giro: 0 }, 2000, 500, LOGO)
    expect(e.x).toBe(0)
    expect(e.y).toBe(0)
  })

  it('acota el zoom a su rango, por arriba y por abajo', () => {
    expect(limitarEnMarco({ x: 0, y: 0, zoom: 99, giro: 0 }, 1600, 900, FOTO).zoom).toBe(ZOOM_MAX)
    expect(limitarEnMarco({ x: 0, y: 0, zoom: 0.1, giro: 0 }, 1600, 900, FOTO).zoom).toBe(1)
    expect(limitarEnMarco({ x: 0, y: 0, zoom: 0.01, giro: 0 }, 2000, 500, LOGO).zoom).toBeCloseTo(0.2)
  })
})

describe('zoomEnMarco', () => {
  it('lo que estaba en el centro sigue en el centro: el desplazamiento escala', () => {
    const antes = { x: 0.2, y: 0.1, zoom: 2, giro: 0 as const }
    const despues = zoomEnMarco(antes, 4, 1600, 900, FOTO)
    expect(despues.zoom).toBe(4)
    expect(despues.x).toBeCloseTo(0.4)
    expect(despues.y).toBeCloseTo(0.2)
  })

  it('al alejar hasta cubrir, vuelve al centro', () => {
    const e = zoomEnMarco({ x: 0.4, y: 0.2, zoom: 2, giro: 0 }, 1, 1600, 900, FOTO)
    expect(e).toEqual({ x: 0, y: 0, zoom: 1, giro: 0 })
  })
})

describe('girarEnMarco', () => {
  it('avanza un cuarto de vuelta y da la vuelta entera en cuatro', () => {
    let e = encuadreInicialEnMarco(1600, 900, FOTO)
    for (const giro of [90, 180, 270, 0]) {
      e = girarEnMarco(e, 1600, 900, FOTO)
      expect(e.giro).toBe(giro)
    }
  })

  it('el desplazamiento gira con la imagen y se recorta al marco nuevo', () => {
    // Cuadrada en 16:9 a zoom 2: holgura 0,5 en x y (2 − 9/16)/2 en y.
    const e = girarEnMarco({ x: 0.3, y: 0.1, zoom: 2, giro: 0 }, 1000, 1000, FOTO)
    expect(e.giro).toBe(90)
    expect(e.x).toBeCloseTo(-0.1)
    expect(e.y).toBeCloseTo(0.3)
  })
})
