import { describe, it, expect } from 'vitest'
import {
  LIMITE_AVATARES,
  LIMITE_IMAGENES_COMERCIOS,
  conVersion,
  detectarTipoPorContenido,
  esTipoImagen,
  extensionDe,
  pesoLegible,
  validarImagen,
} from './validacion'
import {
  claveGaleria,
  rutaAvatarPerfil,
  rutaFotoMiembro,
  rutaGaleriaComercio,
  rutaLogoComercio,
  rutaLogoMarca,
  rutaPortadaComercio,
  urlPublica,
} from './rutas'

/* Cabeceras reales de cada formato. No se inventan: son las firmas que el
   servidor va a encontrar en un archivo de verdad. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])
/* Un SVG es texto: no tiene número mágico y por eso cae en el respaldo. */
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">')

describe('esTipoImagen / extensionDe', () => {
  it('admite los tres formatos del contrato', () => {
    expect(esTipoImagen('image/png')).toBe(true)
    expect(esTipoImagen('image/jpeg')).toBe(true)
    expect(esTipoImagen('image/webp')).toBe(true)
  })

  it('rechaza el SVG, que es la exclusión de seguridad', () => {
    expect(esTipoImagen('image/svg+xml')).toBe(false)
  })

  it('rechaza cualquier otro tipo', () => {
    expect(esTipoImagen('application/pdf')).toBe(false)
    expect(esTipoImagen('image/gif')).toBe(false)
    expect(esTipoImagen('')).toBe(false)
  })

  it('usa jpg y no jpeg como extensión', () => {
    expect(extensionDe('image/jpeg')).toBe('jpg')
    expect(extensionDe('image/png')).toBe('png')
    expect(extensionDe('image/webp')).toBe('webp')
  })
})

describe('detectarTipoPorContenido', () => {
  it('reconoce PNG, JPEG y WebP por su firma', () => {
    expect(detectarTipoPorContenido(PNG)).toBe('image/png')
    expect(detectarTipoPorContenido(JPEG)).toBe('image/jpeg')
    expect(detectarTipoPorContenido(WEBP)).toBe('image/webp')
  })

  it('devuelve null ante un SVG', () => {
    expect(detectarTipoPorContenido(SVG)).toBeNull()
  })

  it('devuelve null si el archivo es más corto que la firma', () => {
    expect(detectarTipoPorContenido(new Uint8Array([0x89, 0x50]))).toBeNull()
  })

  it('no confunde un RIFF que no es WebP (un WAV) con una imagen', () => {
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ])
    expect(detectarTipoPorContenido(wav)).toBeNull()
  })
})

describe('pesoLegible', () => {
  it('usa bytes, kilos y megas según la escala', () => {
    expect(pesoLegible(512)).toBe('512 B')
    expect(pesoLegible(LIMITE_AVATARES)).toBe('512 KB')
    expect(pesoLegible(LIMITE_IMAGENES_COMERCIOS)).toBe('1,0 MB')
  })

  it('usa la coma decimal, porque el texto va a la interfaz', () => {
    expect(pesoLegible(1_572_864)).toBe('1,5 MB')
  })

  it('no explota con valores imposibles', () => {
    expect(pesoLegible(-1)).toBe('0 KB')
    expect(pesoLegible(Number.NaN)).toBe('0 KB')
  })
})

describe('validarImagen — lo que se arregla eligiendo otro archivo', () => {
  it('rechaza un archivo vacío', () => {
    const r = validarImagen({ tipo: 'image/png', tamano: 0 }, LIMITE_AVATARES)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toBe('El archivo está vacío.')
  })

  it('rechaza un SVG y lo dice por su nombre', () => {
    const r = validarImagen({ tipo: 'image/svg+xml', tamano: 1000 }, LIMITE_AVATARES)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toContain('SVG')
  })

  it('rechaza un PDF disfrazado de subida de imagen', () => {
    const r = validarImagen({ tipo: 'application/pdf', tamano: 1000 }, LIMITE_AVATARES)
    expect(r.ok).toBe(false)
  })
})

describe('validarImagen — el peso', () => {
  it('acepta justo en el límite', () => {
    const r = validarImagen(
      { tipo: 'image/png', tamano: LIMITE_AVATARES },
      LIMITE_AVATARES,
    )
    expect(r.ok).toBe(true)
  })

  it('rechaza un byte por encima del límite', () => {
    const r = validarImagen(
      { tipo: 'image/png', tamano: LIMITE_AVATARES + 1 },
      LIMITE_AVATARES,
    )
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toContain('512 KB')
  })

  it('el límite de comercios es mayor que el de avatares', () => {
    const r = validarImagen(
      { tipo: 'image/jpeg', tamano: 800_000 },
      LIMITE_IMAGENES_COMERCIOS,
    )
    expect(r.ok).toBe(true)
    expect(validarImagen({ tipo: 'image/jpeg', tamano: 800_000 }, LIMITE_AVATARES).ok).toBe(
      false,
    )
  })
})

describe('validarImagen — el contenido, que detecta el engaño y no el descuido', () => {
  it('acepta cuando el contenido coincide con lo declarado', () => {
    const r = validarImagen(
      { tipo: 'image/png', tamano: PNG.length, contenido: PNG },
      LIMITE_AVATARES,
    )
    expect(r).toEqual({ ok: true, tipo: 'image/png', extension: 'png' })
  })

  it('rechaza un JPEG renombrado a .png', () => {
    const r = validarImagen(
      { tipo: 'image/png', tamano: JPEG.length, contenido: JPEG },
      LIMITE_AVATARES,
    )
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toContain('JPEG')
  })

  it('rechaza un SVG con el tipo cambiado a image/png', () => {
    const r = validarImagen(
      { tipo: 'image/png', tamano: SVG.length, contenido: SVG },
      LIMITE_AVATARES,
    )
    expect(r.ok).toBe(false)
  })

  it('sin contenido no comprueba la firma: es el modo del navegador', () => {
    const r = validarImagen({ tipo: 'image/webp', tamano: 2000 }, LIMITE_AVATARES)
    expect(r).toEqual({ ok: true, tipo: 'image/webp', extension: 'webp' })
  })

  it('el peso se comprueba antes que el contenido', () => {
    const r = validarImagen(
      { tipo: 'image/png', tamano: LIMITE_AVATARES + 1, contenido: JPEG },
      LIMITE_AVATARES,
    )
    expect(r.ok === false && r.error).toContain('máximo')
  })
})

describe('conVersion', () => {
  it('añade la marca a una URL sin consulta', () => {
    expect(conVersion('https://x.co/a/logo.png', 42)).toBe(
      'https://x.co/a/logo.png?v=42',
    )
  })

  it('respeta una cadena de consulta previa (URL externa de un comercio)', () => {
    expect(conVersion('https://cdn.aliado.com/logo.png?w=200', 42)).toBe(
      'https://cdn.aliado.com/logo.png?w=200&v=42',
    )
  })

  it('no toca una cadena vacía', () => {
    expect(conVersion('', 42)).toBe('')
  })
})

describe('rutas — el id va en la carpeta, que es lo que audita la política RLS', () => {
  it('comercio: logo, portada y galería', () => {
    expect(rutaLogoComercio(42, 'webp')).toBe('comercios/42/logo.webp')
    expect(rutaPortadaComercio(42, 'jpg')).toBe('comercios/42/portada.jpg')
    expect(rutaGaleriaComercio(42, 'abc-0001', 'png')).toBe(
      'comercios/42/galeria/abc-0001.png',
    )
  })

  it('marca, perfil y miembro', () => {
    expect(rutaLogoMarca(7, 'png')).toBe('marcas/7/logo.png')
    expect(rutaAvatarPerfil('6f1c-uuid', 'jpg')).toBe('perfiles/6f1c-uuid/avatar.jpg')
    expect(rutaFotoMiembro(9, 'webp')).toBe('miembros/9/foto.webp')
  })

  it('el nombre del archivo es fijo, para que upsert sustituya y no acumule', () => {
    expect(rutaLogoComercio(42, 'webp')).toBe(rutaLogoComercio(42, 'webp'))
  })

  it('la clave de galería es opaca y no contiene el nombre del archivo', () => {
    const clave = claveGaleria(1_757_000_000_000, 0.5)
    expect(clave).toMatch(/^[0-9a-z]+-[0-9a-z]{4}$/)
  })
})

describe('urlPublica', () => {
  it('arma la forma que documenta el contrato', () => {
    expect(
      urlPublica('https://abc.supabase.co', 'imagenes-comercios', 'comercios/42/logo.webp'),
    ).toBe(
      'https://abc.supabase.co/storage/v1/object/public/imagenes-comercios/comercios/42/logo.webp',
    )
  })

  it('tolera una base con barra final', () => {
    expect(urlPublica('https://abc.supabase.co/', 'avatares', 'miembros/9/foto.png')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/avatares/miembros/9/foto.png',
    )
  })
})
