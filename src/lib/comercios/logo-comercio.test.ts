import { describe, it, expect } from 'vitest'
import { resolverLogoComercio } from './logo-comercio'

describe('resolverLogoComercio — comercio → marca → null', () => {
  it('usa el logo del comercio cuando existe', () => {
    expect(resolverLogoComercio('https://x.com/comercio.png', 'https://x.com/marca.png')).toBe(
      'https://x.com/comercio.png',
    )
  })

  it('cae al logo de la marca cuando el comercio no tiene', () => {
    expect(resolverLogoComercio(null, 'https://x.com/marca.png')).toBe(
      'https://x.com/marca.png',
    )
  })

  it('devuelve null cuando ninguno de los dos tiene logo', () => {
    expect(resolverLogoComercio(null, null)).toBeNull()
  })

  it('trata la cadena vacía del comercio como ausencia y cae a la marca', () => {
    expect(resolverLogoComercio('', 'https://x.com/marca.png')).toBe(
      'https://x.com/marca.png',
    )
  })

  it('trata una cadena de solo espacios del comercio como ausencia', () => {
    expect(resolverLogoComercio('   ', 'https://x.com/marca.png')).toBe(
      'https://x.com/marca.png',
    )
  })

  it('trata una cadena de solo espacios en la marca como ausencia (fila cargada a mano)', () => {
    expect(resolverLogoComercio(null, '   ')).toBeNull()
  })

  it('cadena vacía en comercio y cadena vacía en marca: null', () => {
    expect(resolverLogoComercio('', '')).toBeNull()
  })

  it('cadena de solo espacios en ambos: null', () => {
    expect(resolverLogoComercio('  ', '\t\n')).toBeNull()
  })

  it('recorta espacios sobrantes del logo del comercio antes de devolverlo', () => {
    expect(resolverLogoComercio('  https://x.com/comercio.png  ', null)).toBe(
      'https://x.com/comercio.png',
    )
  })

  it('recorta espacios sobrantes del logo de la marca antes de devolverlo', () => {
    expect(resolverLogoComercio(null, '  https://x.com/marca.png  ')).toBe(
      'https://x.com/marca.png',
    )
  })

  it('comercio null y marca con logo válido: usa el de la marca', () => {
    expect(resolverLogoComercio(null, 'https://x.com/marca.png')).toBe(
      'https://x.com/marca.png',
    )
  })

  it('comercio con logo y marca null: usa el del comercio, no falla por marca ausente', () => {
    expect(resolverLogoComercio('https://x.com/comercio.png', null)).toBe(
      'https://x.com/comercio.png',
    )
  })
})
