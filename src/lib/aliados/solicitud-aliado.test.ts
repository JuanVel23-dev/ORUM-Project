import { describe, it, expect } from 'vitest'
import {
  ERROR_DESCRIPCION_LARGA,
  ERRORES,
  MAX_DESCRIPCION,
  SEGUNDOS_MINIMOS,
  correoValido,
  enlaceValido,
  normalizarEnlace,
  pareceAutomatico,
  telefonoValido,
  validarSolicitudAliado,
  type EntradaSolicitudAliado,
} from './solicitud-aliado'

/** Una solicitud que pasa entera. Cada prueba rompe solo lo que quiere probar. */
const base: EntradaSolicitudAliado = {
  nombreComercio: 'Casa Duarte',
  nombreContacto: 'María Duarte',
  cargo: 'Propietaria',
  telefono: '3001234567',
  correo: 'contacto@casaduarte.com',
  ciudad: 'Bogotá',
  direccion: 'Cra 15 #93-47',
  categoria: 'Gastronomía',
  descripcion: 'Cocina de autor con productos del mercado local.',
  enlace: 'instagram.com/casaduarte',
}

describe('validarSolicitudAliado', () => {
  it('acepta una solicitud completa y devuelve los datos recortados', () => {
    const r = validarSolicitudAliado({ ...base, nombreComercio: '  Casa Duarte  ' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.datos.nombreComercio).toBe('Casa Duarte')
  })

  it('acepta la solicitud sin los tres campos opcionales', () => {
    const r = validarSolicitudAliado({ ...base, cargo: '', direccion: '', enlace: '' })
    expect(r.ok).toBe(true)
  })

  it('reúne TODOS los errores en un solo pase, no solo el primero', () => {
    const r = validarSolicitudAliado({
      ...base,
      nombreComercio: '   ',
      correo: 'no-es-un-correo',
      telefono: '12',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(Object.keys(r.errores).sort()).toEqual(
        ['correo', 'nombreComercio', 'telefono'].sort(),
      )
      expect(r.errores.nombreComercio).toBe(ERRORES.nombreComercio)
    }
  })

  it('rechaza una ciudad o una categoría que no están en la lista fija', () => {
    const r = validarSolicitudAliado({ ...base, ciudad: 'Springfield', categoria: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errores.ciudad).toBe(ERRORES.ciudad)
      expect(r.errores.categoria).toBe(ERRORES.categoria)
    }
  })

  it('distingue la descripción vacía de la demasiado larga', () => {
    const vacia = validarSolicitudAliado({ ...base, descripcion: '  ' })
    const larga = validarSolicitudAliado({
      ...base,
      descripcion: 'a'.repeat(MAX_DESCRIPCION + 1),
    })
    expect(vacia.ok).toBe(false)
    expect(larga.ok).toBe(false)
    if (!vacia.ok) expect(vacia.errores.descripcion).toBe(ERRORES.descripcion)
    if (!larga.ok) expect(larga.errores.descripcion).toBe(ERROR_DESCRIPCION_LARGA)
  })

  it('acepta exactamente 280 caracteres de descripción', () => {
    const r = validarSolicitudAliado({
      ...base,
      descripcion: 'a'.repeat(MAX_DESCRIPCION),
    })
    expect(r.ok).toBe(true)
  })

  it('normaliza el enlace sin protocolo en los datos de salida', () => {
    const r = validarSolicitudAliado(base)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.datos.enlace).toBe('https://instagram.com/casaduarte')
  })
})

describe('telefonoValido', () => {
  it('acepta de 7 a 10 dígitos', () => {
    expect(telefonoValido('2451234')).toBe(true)
    expect(telefonoValido('3001234567')).toBe(true)
  })

  it('acepta el indicativo internacional contando solo dígitos', () => {
    // +57 300 123 4567 son 12 dígitos con indicativo; sin él, 10.
    expect(telefonoValido('300 123 4567')).toBe(true)
    expect(telefonoValido('(601) 245-1234')).toBe(true)
  })

  it('rechaza lo demasiado corto y lo demasiado largo', () => {
    expect(telefonoValido('123456')).toBe(false)
    expect(telefonoValido('+57 300 123 4567')).toBe(false)
    expect(telefonoValido('')).toBe(false)
  })
})

describe('correoValido', () => {
  it('acepta formas habituales', () => {
    expect(correoValido('ana@example.com')).toBe(true)
    expect(correoValido('ana.ruiz+club@mi-negocio.com.co')).toBe(true)
  })

  it('rechaza lo que no puede entregarse', () => {
    expect(correoValido('ana@localhost')).toBe(false)
    expect(correoValido('ana example.com')).toBe(false)
    expect(correoValido('@example.com')).toBe(false)
    expect(correoValido('')).toBe(false)
  })
})

describe('normalizarEnlace / enlaceValido', () => {
  it('deja el vacío como vacío y lo da por válido', () => {
    expect(normalizarEnlace('  ')).toBe('')
    expect(enlaceValido('')).toBe(true)
  })

  it('no toca lo que ya trae protocolo', () => {
    expect(normalizarEnlace('https://x.com/y')).toBe('https://x.com/y')
    expect(normalizarEnlace('http://x.com')).toBe('http://x.com')
  })

  it('rechaza un dominio sin punto', () => {
    expect(enlaceValido('taller')).toBe(false)
    expect(enlaceValido('taller.co')).toBe(true)
  })
})

describe('pareceAutomatico', () => {
  const ahora = 1_000_000

  it('delata el campo trampa relleno', () => {
    expect(pareceAutomatico('cualquier cosa', ahora - 60_000, ahora)).toBe(true)
  })

  it('delata el envío instantáneo', () => {
    expect(pareceAutomatico('', ahora - 500, ahora)).toBe(true)
  })

  it('deja pasar un envío humano', () => {
    expect(pareceAutomatico('', ahora - SEGUNDOS_MINIMOS * 1000, ahora)).toBe(false)
    expect(pareceAutomatico('   ', ahora - 45_000, ahora)).toBe(false)
  })

  it('trata como sospechoso el sello ausente o ilegible', () => {
    expect(pareceAutomatico('', null, ahora)).toBe(true)
    expect(pareceAutomatico('', Number.NaN, ahora)).toBe(true)
  })
})
