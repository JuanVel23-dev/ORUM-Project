import { describe, it, expect } from 'vitest'
import {
  aplicaEnFecha,
  diaDeSemanaISO,
  leerDiasDelFormulario,
  normalizarDias,
  textoDias,
} from './dias-promocion'

describe('diaDeSemanaISO', () => {
  it('lunes = 1 y domingo = 7', () => {
    expect(diaDeSemanaISO('2026-10-19')).toBe(1) // lunes
    expect(diaDeSemanaISO('2026-10-22')).toBe(4) // jueves
    expect(diaDeSemanaISO('2026-10-25')).toBe(7) // domingo
  })
})

describe('normalizarDias', () => {
  it('sin días o vacío: null (vale todos los días)', () => {
    expect(normalizarDias(null)).toBeNull()
    expect(normalizarDias([])).toBeNull()
  })

  it('los siete días equivalen a ninguna restricción', () => {
    expect(normalizarDias([1, 2, 3, 4, 5, 6, 7])).toBeNull()
  })

  it('ordena, quita repetidos y descarta lo que no es un día', () => {
    expect(normalizarDias([5, 2, 2, 9, 0, 1.5])).toEqual([2, 5])
  })
})

describe('leerDiasDelFormulario', () => {
  it('lee los valores marcados', () => {
    expect(leerDiasDelFormulario(['4', '2'])).toEqual([2, 4])
  })

  it('nada marcado: null', () => {
    expect(leerDiasDelFormulario([])).toBeNull()
  })

  it('ignora lo que no es un número', () => {
    expect(leerDiasDelFormulario(['abc', '3'])).toEqual([3])
  })
})

describe('aplicaEnFecha', () => {
  it('sin restricción aplica cualquier día', () => {
    expect(aplicaEnFecha(null, '2026-10-22')).toBe(true)
  })

  it('aplica solo en los días marcados', () => {
    const martesYJueves = [2, 4]
    expect(aplicaEnFecha(martesYJueves, '2026-10-22')).toBe(true) // jueves
    expect(aplicaEnFecha(martesYJueves, '2026-10-23')).toBe(false) // viernes
  })
})

describe('textoDias', () => {
  it('uno solo', () => {
    expect(textoDias([6])).toBe('Solo sábados')
  })

  it('dos o tres sueltos', () => {
    expect(textoDias([2, 4])).toBe('Solo martes y jueves')
    expect(textoDias([1, 3, 5])).toBe('Solo lunes, miércoles y viernes')
  })

  it('tres o más seguidos se dicen como rango', () => {
    expect(textoDias([1, 2, 3, 4, 5])).toBe('De lunes a viernes')
  })

  it('sin restricción: null', () => {
    expect(textoDias(null)).toBeNull()
  })
})
