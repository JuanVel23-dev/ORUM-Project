import { describe, it, expect } from 'vitest'
import { escaparHtml } from './html'

describe('escaparHtml', () => {
  it('escapa las cinco entidades HTML', () => {
    expect(escaparHtml(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    )
  })

  it('neutraliza una inyección de imagen con onerror', () => {
    const entrada = 'Juan <img src=x onerror=alert(1)>'
    const salida = escaparHtml(entrada)
    expect(salida).not.toContain('<img')
    expect(salida).toBe('Juan &lt;img src=x onerror=alert(1)&gt;')
  })

  it('deja intacto un texto sin caracteres especiales', () => {
    expect(escaparHtml('Ana Ruiz')).toBe('Ana Ruiz')
  })
})
