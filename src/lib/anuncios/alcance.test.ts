import { describe, it, expect } from 'vitest'
import { etiquetaAlcance } from './alcance'

describe('etiquetaAlcance', () => {
  it('público y miembros', () => {
    expect(etiquetaAlcance(true, true)).toBe('Público y miembros')
  })

  it('solo público', () => {
    expect(etiquetaAlcance(true, false)).toBe('Solo público')
  })

  it('solo miembros', () => {
    expect(etiquetaAlcance(false, true)).toBe('Solo miembros')
  })

  it('ninguno marcado: no debería ocurrir, pero no debe reventar', () => {
    expect(etiquetaAlcance(false, false)).toBe('Sin publicar')
  })
})
