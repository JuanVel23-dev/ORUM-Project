import { describe, it, expect } from 'vitest'
import { claveCupo, huella, ipDeCabeceras, IP_DESCONOCIDA, LIMITES, normalizarIp } from './limite-uso'

describe('huella', () => {
  it('no depende de mayúsculas ni de espacios', () => {
    expect(huella('  Ana@Ejemplo.COM ')).toBe(huella('ana@ejemplo.com'))
  })

  it('distingue datos distintos', () => {
    expect(huella('ana@ejemplo.com')).not.toBe(huella('luis@ejemplo.com'))
  })

  it('no deja el dato en claro y tiene longitud fija', () => {
    const h = huella('ana@ejemplo.com')
    expect(h).toMatch(/^[0-9a-f]{32}$/)
    expect(h).not.toContain('ana')
  })
})

describe('claveCupo', () => {
  it('une acción, tipo y valor', () => {
    expect(claveCupo('login', 'ip', '203.0.113.5')).toBe('login:ip:203.0.113.5')
  })

  it('la pareja cuenta + IP es una clave distinta de la cuenta sola', () => {
    expect(claveCupo('login', 'cuenta-ip', 'abc:203.0.113.5')).not.toBe(claveCupo('login', 'cuenta', 'abc'))
  })

  it('la misma cuenta desde otra IP tiene otro contador', () => {
    expect(claveCupo('login', 'cuenta-ip', 'abc:203.0.113.5')).not.toBe(
      claveCupo('login', 'cuenta-ip', 'abc:198.51.100.7'),
    )
  })

  it('separa la misma persona en acciones distintas', () => {
    expect(claveCupo('login', 'cuenta', 'abc')).not.toBe(claveCupo('recuperar', 'cuenta', 'abc'))
  })
})

describe('normalizarIp', () => {
  it('deja intacta una IPv4 válida', () => {
    expect(normalizarIp('203.0.113.5')).toBe('203.0.113.5')
  })

  it('rechaza una IPv4 con octetos fuera de rango', () => {
    expect(normalizarIp('300.1.1.1')).toBeNull()
  })

  it('reduce una IPv6 a su prefijo /64', () => {
    expect(normalizarIp('2001:db8:85a3:1:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:85a3:1::/64')
  })

  it('da el mismo prefijo a dos direcciones de la misma red', () => {
    expect(normalizarIp('2001:db8:1:2::1')).toBe(normalizarIp('2001:db8:1:2:ffff::9'))
  })

  it('expande la forma comprimida antes de cortar', () => {
    expect(normalizarIp('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(normalizarIp('::1')).toBe('0:0:0:0::/64')
  })

  it('ignora mayúsculas y ceros a la izquierda en IPv6', () => {
    expect(normalizarIp('2001:0DB8:0000:0001::1')).toBe('2001:db8:0:1::/64')
  })

  it('rechaza lo que no es una IP', () => {
    expect(normalizarIp('no-es-ip')).toBeNull()
    expect(normalizarIp('')).toBeNull()
    expect(normalizarIp('1::2::3')).toBeNull()
    expect(normalizarIp('1:2:3:4:5:6:7:8:9')).toBeNull()
  })
})

describe('ipDeCabeceras', () => {
  const con = (cabeceras: Record<string, string>) => (n: string) => cabeceras[n] ?? null

  it('prefiere la cabecera que Vercel sobrescribe', () => {
    const leer = con({
      'x-vercel-forwarded-for': '198.51.100.7',
      'x-real-ip': '203.0.113.1',
      'x-forwarded-for': '192.0.2.9',
    })
    expect(ipDeCabeceras(leer)).toBe('198.51.100.7')
  })

  it('toma la primera entrada de x-forwarded-for', () => {
    expect(ipDeCabeceras(con({ 'x-forwarded-for': '192.0.2.9, 10.0.0.1' }))).toBe('192.0.2.9')
  })

  it('ignora cf-connecting-ip: cualquiera puede ponerla a mano', () => {
    const leer = con({ 'cf-connecting-ip': '1.2.3.4', 'x-real-ip': '203.0.113.1' })
    expect(ipDeCabeceras(leer)).toBe('203.0.113.1')
  })

  it('salta una cabecera con basura y usa la siguiente', () => {
    expect(ipDeCabeceras(con({ 'x-vercel-forwarded-for': 'basura', 'x-real-ip': '203.0.113.1' }))).toBe(
      '203.0.113.1',
    )
  })

  it('devuelve el marcador cuando no hay ninguna', () => {
    expect(ipDeCabeceras(con({}))).toBe(IP_DESCONOCIDA)
  })
})

describe('LIMITES', () => {
  it('todos tienen tope y ventana positivos', () => {
    for (const { tope, ventanaSegundos } of Object.values(LIMITES)) {
      expect(tope).toBeGreaterThan(0)
      expect(ventanaSegundos).toBeGreaterThan(0)
    }
  })

  it('el techo por cuenta sola es mucho más alto que el de la pareja cuenta + IP', () => {
    expect(LIMITES.loginPorCuenta.tope).toBeGreaterThanOrEqual(LIMITES.loginPorCuentaYIp.tope * 5)
  })

  it('el techo global de aliados no baja del tope por IP', () => {
    expect(LIMITES.aliadosGlobalDia.tope).toBeGreaterThan(LIMITES.aliadosPorIp.tope)
  })
})
