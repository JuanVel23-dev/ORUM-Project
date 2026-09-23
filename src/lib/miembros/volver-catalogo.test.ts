import { describe, it, expect } from 'vitest'
import { resolverVolverAlCatalogo } from './volver-catalogo'

describe('resolverVolverAlCatalogo — ataques de redirección abierta', () => {
  it('rechaza una URL absoluta a otro dominio', () => {
    expect(resolverVolverAlCatalogo('https://evil.com/x')).toBe('/miembros')
  })

  it('rechaza protocolo relativo (el navegador lo interpreta fuera del dominio)', () => {
    expect(resolverVolverAlCatalogo('//evil.com')).toBe('/miembros')
  })

  it('rechaza protocolo relativo con query y fragmento', () => {
    expect(resolverVolverAlCatalogo('//evil.com/x?y=1#z')).toBe('/miembros')
  })

  it('rechaza esquema javascript:', () => {
    expect(resolverVolverAlCatalogo('javascript:alert(1)')).toBe('/miembros')
  })

  it('rechaza esquema javascript: con mayúsculas mezcladas', () => {
    expect(resolverVolverAlCatalogo('JaVaScRiPt:alert(1)')).toBe('/miembros')
  })

  it('rechaza esquema data:', () => {
    expect(resolverVolverAlCatalogo('data:text/html,<script>alert(1)</script>')).toBe(
      '/miembros',
    )
  })

  it('rechaza barras invertidas dobles (\\\\evil.com)', () => {
    expect(resolverVolverAlCatalogo('\\\\evil.com')).toBe('/miembros')
  })

  it('rechaza barra + barra invertida (/\\evil.com), forma que algunos navegadores normalizan a //', () => {
    expect(resolverVolverAlCatalogo('/\\evil.com')).toBe('/miembros')
  })

  it('rechaza codificación porcentual que esconde un protocolo relativo', () => {
    expect(resolverVolverAlCatalogo('%2F%2Fevil.com')).toBe('/miembros')
  })

  it('rechaza codificación porcentual que esconde un esquema javascript:', () => {
    expect(resolverVolverAlCatalogo('%6A%61%76%61%73%63%72%69%70%74%3Aalert(1)')).toBe(
      '/miembros',
    )
  })

  it('rechaza codificación porcentual del propio catálogo (no se decodifica antes de comparar)', () => {
    expect(resolverVolverAlCatalogo('%2Fmiembros')).toBe('/miembros')
  })

  it('rechaza el truco userinfo (/miembros@evil.com se leería como host evil.com en un <a>)', () => {
    expect(resolverVolverAlCatalogo('/miembros@evil.com')).toBe('/miembros')
  })

  it('rechaza una ruta hermana que no es el catálogo, aunque empiece igual', () => {
    expect(resolverVolverAlCatalogo('/miembros/perfil')).toBe('/miembros')
  })

  it('rechaza una ruta vacía', () => {
    expect(resolverVolverAlCatalogo('')).toBe('/miembros')
  })

  it('rechaza undefined (Next lo entrega así cuando el parámetro no está presente)', () => {
    expect(resolverVolverAlCatalogo(undefined)).toBe('/miembros')
  })

  it('rechaza un array vacío (defensivo: no debería ocurrir, pero no debe lanzar)', () => {
    expect(resolverVolverAlCatalogo([])).toBe('/miembros')
  })

  it('acepta exactamente /miembros', () => {
    expect(resolverVolverAlCatalogo('/miembros')).toBe('/miembros')
  })

  it('acepta /miembros con query', () => {
    expect(resolverVolverAlCatalogo('/miembros?categoria=comida')).toBe(
      '/miembros?categoria=comida',
    )
  })

  it('acepta /miembros con query y fragmento a la vez', () => {
    expect(resolverVolverAlCatalogo('/miembros?categoria=comida&q=cafe#resultados')).toBe(
      '/miembros?categoria=comida&q=cafe#resultados',
    )
  })

  it('rechaza /miembros con SOLO fragmento (no es ninguna de las dos formas admitidas)', () => {
    // La firma documentada admite exactamente dos formas: `/miembros` y
    // `/miembros?...`. Un fragmento sin `?` no es ninguna de las dos, así que
    // cae al valor por defecto. Es el comportamiento deliberado de la
    // allowlist, no un descuido: se deja explícito para que un cambio futuro
    // que lo altere sea una decisión consciente, no una regresión silenciosa.
    expect(resolverVolverAlCatalogo('/miembros#resultados')).toBe('/miembros')
  })

  it('Next entrega string[] cuando el parámetro se repite: toma el primero si es válido', () => {
    expect(resolverVolverAlCatalogo(['/miembros?x=1', '/miembros?x=2'])).toBe(
      '/miembros?x=1',
    )
  })

  it('Next entrega string[]: si el primero es un ataque, se rechaza igual', () => {
    expect(resolverVolverAlCatalogo(['https://evil.com', '/miembros'])).toBe('/miembros')
  })
})
