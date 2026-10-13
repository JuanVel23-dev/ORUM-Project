import { describe, expect, it } from 'vitest'
import {
  DESCRIPCION_MAXIMA,
  DESCRIPCION_POR_DEFECTO,
  ordenTrasMover,
  revisarDescripcion,
  textoAlternativo,
} from './publicidad'

describe('revisarDescripcion', () => {
  it('recorta y une los espacios', () => {
    expect(revisarDescripcion('  Feria   de\naliados  ')).toEqual({
      ok: true,
      descripcion: 'Feria de aliados',
    })
  })

  it('vacía se acepta: es opcional', () => {
    expect(revisarDescripcion('   ')).toEqual({ ok: true, descripcion: '' })
  })

  it('rechaza la que pasa del máximo', () => {
    expect(revisarDescripcion('a'.repeat(DESCRIPCION_MAXIMA)).ok).toBe(true)
    expect(revisarDescripcion('a'.repeat(DESCRIPCION_MAXIMA + 1)).ok).toBe(false)
  })
})

describe('textoAlternativo', () => {
  it('usa la descripción, y si falta, el texto por defecto', () => {
    expect(textoAlternativo('Feria de aliados')).toBe('Feria de aliados')
    expect(textoAlternativo('  ')).toBe(DESCRIPCION_POR_DEFECTO)
  })
})

describe('ordenTrasMover', () => {
  it('intercambia con la vecina', () => {
    expect(ordenTrasMover([5, 8, 2], 8, -1)).toEqual([8, 5, 2])
    expect(ordenTrasMover([5, 8, 2], 8, 1)).toEqual([5, 2, 8])
  })

  it('en un extremo no hay nada que mover', () => {
    expect(ordenTrasMover([5, 8, 2], 5, -1)).toBeNull()
    expect(ordenTrasMover([5, 8, 2], 2, 1)).toBeNull()
  })

  it('una pieza que no está no mueve nada', () => {
    expect(ordenTrasMover([5, 8, 2], 99, 1)).toBeNull()
  })

  it('no toca la lista original', () => {
    const ids = [1, 2, 3]
    ordenTrasMover(ids, 1, 1)
    expect(ids).toEqual([1, 2, 3])
  })
})
