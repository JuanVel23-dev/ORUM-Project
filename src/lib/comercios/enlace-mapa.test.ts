import { describe, expect, it } from 'vitest'
import { enlaceMapa } from './enlace-mapa'

describe('enlaceMapa', () => {
  it('busca la dirección con su ciudad y el país', () => {
    expect(enlaceMapa('Calle 27 # 24-18', 'Tuluá')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Calle%2027%20%23%2024-18%2C%20Tulu%C3%A1%2C%20Colombia',
    )
  })

  it('sin ciudad, solo la dirección y el país', () => {
    expect(enlaceMapa('  Cra 5 # 10-20 ', null)).toBe(
      'https://www.google.com/maps/search/?api=1&query=Cra%205%20%23%2010-20%2C%20Colombia',
    )
  })

  it('codifica el «#» para que no se lea como ancla de la URL', () => {
    expect(enlaceMapa('Calle 1 # 2-3')).not.toContain('#')
  })
})
