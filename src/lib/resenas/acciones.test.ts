import { describe, expect, it } from 'vitest'
import { fechaResena, leerComercioId, traducirErrorResena } from './acciones'

describe('leerComercioId', () => {
  it('acepta un entero positivo como texto', () => {
    expect(leerComercioId('42')).toBe(42)
    expect(leerComercioId(' 7 ')).toBe(7)
  })

  it('rechaza lo que no es un id', () => {
    for (const crudo of ['0', '-3', '1.5', '1e3', 'abc', '', '  ', '99999999999999999999']) {
      expect(leerComercioId(crudo)).toBeNull()
    }
    expect(leerComercioId(null)).toBeNull()
    expect(leerComercioId(new File([], 'x'))).toBeNull()
  })
})

describe('traducirErrorResena', () => {
  const del = (message: string) => traducirErrorResena({ code: 'P0001', message })

  it('traduce cada motivo del trigger', () => {
    expect(del('Solo puede resenar quien ha comprado en este comercio')).toMatch(/hayas comprado/)
    expect(del('La membresia del socio no esta vigente')).toMatch(/no está vigente/)
    expect(del('El comercio no esta activo como aliado')).toMatch(/ya no está en el club/)
    expect(del('El socio no existe o fue dado de baja')).toMatch(/ficha de socio/)
  })

  it('no filtra el mensaje crudo de la base', () => {
    const frase = traducirErrorResena({
      code: '23505',
      message: 'duplicate key value violates unique constraint "resenas_comercio_miembro_key"',
    })
    expect(frase).not.toMatch(/resenas_/)
    expect(frase).toBe('No pudimos guardar tu reseña. Inténtalo de nuevo.')
  })

  it('un raise desconocido cae en la frase genérica', () => {
    expect(del('otra cosa')).toBe('No pudimos guardar tu reseña. Inténtalo de nuevo.')
  })

  it('tabla ausente y check tienen su frase', () => {
    expect(traducirErrorResena({ code: 'PGRST205' })).toMatch(/todavía no están disponibles/)
    expect(traducirErrorResena({ code: '23514' })).toMatch(/Revisa/)
    expect(traducirErrorResena(null)).toMatch(/No pudimos/)
  })
})

describe('fechaResena', () => {
  it('fecha en hora de Colombia, no en UTC', () => {
    // 02:00 UTC del 6 de octubre = 21:00 del 5 en Bogotá.
    expect(fechaResena('2026-10-06T02:00:00Z')).toBe('5 de octubre de 2026')
  })

  it('una fecha ilegible no rompe', () => {
    expect(fechaResena('no')).toBe('')
  })
})
