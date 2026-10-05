import { describe, it, expect } from 'vitest'
import {
  ERROR_CORREO_DOMINIO,
  ERROR_CORREO_TEMPORAL,
  ERROR_DESCRIPCION_CORTA,
  ERROR_DESCRIPCION_ENLACE,
  ERROR_DESCRIPCION_LARGA,
  ERRORES,
  SEGUNDOS_MINIMOS,
  correoValido,
  enlaceValido,
  normalizarEnlace,
  pareceAutomatico,
  revisarCargo,
  revisarCorreo,
  revisarDescripcion,
  revisarDireccion,
  revisarNombreComercio,
  revisarNombreContacto,
  telefonoValido,
  validarSolicitudAliado,
  type EntradaSolicitudAliado,
} from './solicitud-aliado'

/** Una solicitud que pasa entera. Cada prueba rompe solo lo que quiere probar. */
const base: EntradaSolicitudAliado = {
  nombreComercio: 'Casa Duarte',
  nombreContacto: 'María Duarte',
  cargo: 'Propietaria',
  telefono: '3104582917',
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

  it('distingue la descripción vacía, la corta y la demasiado larga', () => {
    const frase = 'Cocina de autor con productos del mercado local. '
    const vacia = validarSolicitudAliado({ ...base, descripcion: '  ' })
    const corta = validarSolicitudAliado({ ...base, descripcion: 'Vendemos pan' })
    const larga = validarSolicitudAliado({ ...base, descripcion: frase.repeat(7) })
    if (!vacia.ok) expect(vacia.errores.descripcion).toBe(ERRORES.descripcion)
    if (!corta.ok) expect(corta.errores.descripcion).toBe(ERROR_DESCRIPCION_CORTA)
    if (!larga.ok) expect(larga.errores.descripcion).toBe(ERROR_DESCRIPCION_LARGA)
    expect([vacia.ok, corta.ok, larga.ok]).toEqual([false, false, false])
  })

  it('normaliza el enlace, el teléfono y el correo en los datos de salida', () => {
    const r = validarSolicitudAliado({
      ...base,
      telefono: '+57 310 458 2917',
      correo: 'Contacto@CasaDuarte.com',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.datos.enlace).toBe('https://instagram.com/casaduarte')
      expect(r.datos.telefono).toBe('3104582917')
      expect(r.datos.correo).toBe('contacto@casaduarte.com')
    }
  })
})

describe('revisarNombreComercio', () => {
  it('acepta nombres comerciales reales', () => {
    for (const n of [
      'Casa Duarte',
      "D'Lucía Café & Bar",
      'Panadería La 85',
      'Crepes & Waffles',
      'El Corral #2',
    ]) {
      expect(revisarNombreComercio(n)).toBeNull()
    }
  })

  it('rechaza relleno, símbolos y enlaces', () => {
    for (const n of [
      'a',
      '12345',
      'aaaaaaa',
      'asdfgh',
      'sdfghjkl',
      '<script>',
      'https://spam.com',
      '....',
    ]) {
      expect(revisarNombreComercio(n)).not.toBeNull()
    }
  })
})

describe('revisarNombreContacto', () => {
  it('pide nombre y apellido, solo con letras', () => {
    expect(revisarNombreContacto('María Duarte')).toBeNull()
    expect(revisarNombreContacto("Ana María O'Neill-Pérez")).toBeNull()
    for (const n of ['', 'María', 'Juan 123', 'asdf qwrt', 'Jjj Kkk', 'xx yy', 'María <b>']) {
      expect(revisarNombreContacto(n)).not.toBeNull()
    }
  })
})

describe('revisarCargo y revisarDireccion (opcionales)', () => {
  it('vacíos valen', () => {
    expect(revisarCargo('')).toBeNull()
    expect(revisarDireccion('  ')).toBeNull()
  })

  it('si hay algo, tiene que ser verosímil', () => {
    expect(revisarCargo('Gerente general')).toBeNull()
    expect(revisarCargo('123')).not.toBeNull()
    expect(revisarCargo('zzzz')).not.toBeNull()
    expect(revisarDireccion('Cra 15 # 93-47, local 2')).toBeNull()
    expect(revisarDireccion('Calle 80')).toBeNull()
    expect(revisarDireccion('mi casa')).not.toBeNull()
    expect(revisarDireccion('12345678')).not.toBeNull()
    expect(revisarDireccion('asdfghjk 12')).not.toBeNull()
  })
})

describe('revisarDescripcion', () => {
  it('rechaza enlaces, marcado y relleno', () => {
    expect(revisarDescripcion('Visita www.spam.com para ganar premios hoy')).toBe(
      ERROR_DESCRIPCION_ENLACE,
    )
    expect(revisarDescripcion('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaa aaaa aaaa')).not.toBeNull()
    expect(revisarDescripcion('Hola <script>alert(1)</script> somos un negocio')).not.toBeNull()
    expect(revisarDescripcion('Cocina de autor con productos del mercado local.')).toBeNull()
  })
})

describe('telefonoValido', () => {
  it('acepta celulares y fijos colombianos, con o sin indicativo', () => {
    for (const t of [
      '3104582917',
      '310 458 2917',
      '+57 310 458 2917',
      '(601) 245-1234',
      '6042451234',
    ]) {
      expect(telefonoValido(t)).toBe(true)
    }
  })

  it('rechaza lo que no es un número colombiano', () => {
    for (const t of [
      '',
      '2451234',
      '123456',
      '1234567890',
      '9001234567',
      '6001234567',
      '+1 300 123 4567',
      '300123456a',
    ]) {
      expect(telefonoValido(t)).toBe(false)
    }
  })

  it('rechaza los números de mentira', () => {
    for (const t of ['3000000000', '3111111111', '3123456789', '3009876543', '3001234567']) {
      expect(telefonoValido(t)).toBe(false)
    }
  })
})

describe('correoValido / revisarCorreo', () => {
  it('acepta formas habituales', () => {
    expect(correoValido('ana@casaduarte.com')).toBe(true)
    expect(correoValido('ana.ruiz+club@mi-negocio.com.co')).toBe(true)
  })

  it('rechaza lo que no puede entregarse', () => {
    for (const c of [
      '',
      'ana@localhost',
      'ana example.com',
      '@casaduarte.com',
      'a@b.c',
      'ana..ruiz@gmail.com',
      '.ana@gmail.com',
      'ana@-dominio.com',
      'ana@dominio.c0m',
    ]) {
      expect(correoValido(c)).toBe(false)
    }
  })

  it('dice por qué: dominio mal escrito o correo desechable', () => {
    expect(revisarCorreo('ana@gmial.com')).toBe(ERROR_CORREO_DOMINIO)
    expect(revisarCorreo('ana@hotmail.con')).toBe(ERROR_CORREO_DOMINIO)
    expect(revisarCorreo('ana@mailinator.com')).toBe(ERROR_CORREO_TEMPORAL)
    expect(revisarCorreo('ana@yopmail.com')).toBe(ERROR_CORREO_TEMPORAL)
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

  it('rechaza lo que no es una web pública', () => {
    for (const e of [
      'http://192.168.1.1',
      'localhost:3000',
      'ftp://sitio.com',
      'javascript:alert(1)',
      'https://usuario:clave@sitio.com',
      'mi sitio.com',
      'sitio.123',
    ]) {
      expect(enlaceValido(e)).toBe(false)
    }
    expect(enlaceValido('instagram.com/casaduarte')).toBe(true)
    expect(enlaceValido('https://www.casaduarte.com.co/menu?x=1')).toBe(true)
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
