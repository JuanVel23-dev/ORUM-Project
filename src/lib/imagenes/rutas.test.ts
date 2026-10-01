import { describe, it, expect } from 'vitest'
import { claveFotoValida, nuevaClaveFoto, rutaFotoMiembro } from './rutas'

describe('rutaFotoMiembro — la ruta ya no se puede adivinar', () => {
  const clave = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

  it('lleva el id, la clave aleatoria y la extensión', () => {
    expect(rutaFotoMiembro(12, 'png', clave)).toBe(`miembros/12/${clave}/foto.png`)
  })

  it('dos claves distintas dan rutas distintas para el mismo socio', () => {
    const otra = '0f9e8d7c6b5a49382716f5e4d3c2b1a0'
    expect(rutaFotoMiembro(12, 'jpg', clave)).not.toBe(rutaFotoMiembro(12, 'jpg', otra))
  })

  it('rechaza una clave que pueda alterar la ruta (recorrido de directorios)', () => {
    for (const mala of ['', '..', '../x', 'a/b', 'a\\b', 'ABC', ' ', 'a b', clave + '/', '%2e%2e']) {
      expect(() => rutaFotoMiembro(12, 'png', mala)).toThrow()
    }
  })

  it('rechaza una clave demasiado corta: sería adivinable', () => {
    expect(() => rutaFotoMiembro(12, 'png', 'abc123')).toThrow()
  })
})

describe('nuevaClaveFoto', () => {
  it('genera claves válidas, de 32 caracteres hexadecimales', () => {
    const k = nuevaClaveFoto()
    expect(k).toMatch(/^[0-9a-f]{32}$/)
    expect(claveFotoValida(k)).toBe(true)
  })

  it('no repite claves', () => {
    const claves = new Set(Array.from({ length: 200 }, () => nuevaClaveFoto()))
    expect(claves.size).toBe(200)
  })
})

describe('claveFotoValida', () => {
  it('acepta solo 32 hexadecimales en minúscula', () => {
    expect(claveFotoValida('a1b2c3d4e5f60718293a4b5c6d7e8f90')).toBe(true)
    expect(claveFotoValida('A1B2C3D4E5F60718293A4B5C6D7E8F90')).toBe(false)
    expect(claveFotoValida('a1b2c3d4e5f60718293a4b5c6d7e8f9')).toBe(false)
    expect(claveFotoValida('g1b2c3d4e5f60718293a4b5c6d7e8f90')).toBe(false)
  })
})
