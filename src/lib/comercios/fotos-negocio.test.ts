import { describe, expect, it } from 'vitest'
import { TOPE_FOTOS_NEGOCIO, cuposLibres, fotosUsadas } from './fotos-negocio'

describe('fotosUsadas', () => {
  it('cuenta la portada como una foto más', () => {
    expect(fotosUsadas(null, 0)).toBe(0)
    expect(fotosUsadas('https://x/portada.jpg', 0)).toBe(1)
    expect(fotosUsadas('https://x/portada.jpg', 3)).toBe(4)
    expect(fotosUsadas(null, 3)).toBe(3)
  })
})

describe('cuposLibres', () => {
  it('el tope es de ocho, entre portada y galería', () => {
    expect(TOPE_FOTOS_NEGOCIO).toBe(8)
    expect(cuposLibres(null, 0)).toBe(8)
    expect(cuposLibres('https://x/portada.jpg', 0)).toBe(7)
    expect(cuposLibres('https://x/portada.jpg', 7)).toBe(0)
    expect(cuposLibres(null, 8)).toBe(0)
  })

  it('nunca es negativo, aunque el panel haya subido más de ocho', () => {
    expect(cuposLibres('https://x/portada.jpg', 12)).toBe(0)
  })
})
