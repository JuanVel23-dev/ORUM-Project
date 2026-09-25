import { describe, it, expect } from 'vitest'
import {
  DESCRIPTOR_UBICACION,
  MS_POR_IMAGEN_HEROE,
  UBICACIONES_RECURSO,
  esUbicacionRecurso,
  siguienteIndice,
  validarEnlaceRecurso,
} from './recursos'
/* Ruta relativa y no el alias `@/`: `vitest.config.ts` no declara `resolve.alias`,
   así que el alias solo lo entiende TypeScript y en tiempo de ejecución falla. Es
   lo que hace el resto de pruebas del proyecto. */
import { rutaRecursoSitio } from '../imagenes/rutas'

describe('esUbicacionRecurso', () => {
  it('acepta las cuatro ubicaciones del check de la migración', () => {
    for (const u of UBICACIONES_RECURSO) expect(esUbicacionRecurso(u)).toBe(true)
  })

  it('rechaza cualquier otra cosa', () => {
    // `promocion` es el error probable: la tabla `promociones` de los
    // comercios se llama casi igual, y la ubicación de aquí es `promo`.
    expect(esUbicacionRecurso('promocion')).toBe(false)
    expect(esUbicacionRecurso('')).toBe(false)
    expect(esUbicacionRecurso('HEROE')).toBe(false)
  })
})

describe('DESCRIPTOR_UBICACION', () => {
  it('describe las cuatro, sin huecos', () => {
    for (const u of UBICACIONES_RECURSO) {
      expect(DESCRIPTOR_UBICACION[u].titulo).not.toBe('')
      expect(DESCRIPTOR_UBICACION[u].nota).not.toBe('')
    }
  })

  it('solo héroe y promociones se publican solas', () => {
    expect(DESCRIPTOR_UBICACION.heroe.sePublica).toBe(true)
    expect(DESCRIPTOR_UBICACION.promo.sePublica).toBe(true)
    expect(DESCRIPTOR_UBICACION.logo.sePublica).toBe(false)
    expect(DESCRIPTOR_UBICACION.general.sePublica).toBe(false)
  })
})

describe('validarEnlaceRecurso', () => {
  it('trata el vacío como «sin destino»', () => {
    expect(validarEnlaceRecurso('')).toEqual({ ok: true, enlace: null })
    expect(validarEnlaceRecurso('   ')).toEqual({ ok: true, enlace: null })
    expect(validarEnlaceRecurso(null)).toEqual({ ok: true, enlace: null })
    expect(validarEnlaceRecurso(undefined)).toEqual({ ok: true, enlace: null })
  })

  it('acepta https y rutas internas, recortando los espacios', () => {
    expect(validarEnlaceRecurso('https://orum.co/planes')).toEqual({
      ok: true,
      enlace: 'https://orum.co/planes',
    })
    expect(validarEnlaceRecurso('  /miembros  ')).toEqual({ ok: true, enlace: '/miembros' })
  })

  it('rechaza javascript:, que es el vector que justifica esta función', () => {
    const v = validarEnlaceRecurso('javascript:alert(1)')
    expect(v.ok).toBe(false)
  })

  it('rechaza //host, que parece ruta interna y no lo es', () => {
    // El fallo silencioso: `//evil.com` pasa un `startsWith('/')` ingenuo y el
    // navegador lo resuelve como `https://evil.com`.
    const v = validarEnlaceRecurso('//evil.com')
    expect(v.ok).toBe(false)
  })

  it('rechaza http:// sin cifrar y los esquemas raros', () => {
    expect(validarEnlaceRecurso('http://orum.co').ok).toBe(false)
    expect(validarEnlaceRecurso('data:text/html,<script>').ok).toBe(false)
    expect(validarEnlaceRecurso('orum.co/planes').ok).toBe(false)
  })
})

describe('siguienteIndice', () => {
  it('da la vuelta al llegar al final', () => {
    expect(siguienteIndice(0, 3)).toBe(1)
    expect(siguienteIndice(2, 3)).toBe(0)
  })

  it('devuelve 0 con una lista vacía en vez de NaN', () => {
    // `(i + 1) % 0` es NaN, y un NaN como índice pinta `undefined` sin avisar.
    expect(siguienteIndice(0, 0)).toBe(0)
    expect(siguienteIndice(5, -1)).toBe(0)
  })

  it('se queda en 0 con una sola imagen', () => {
    expect(siguienteIndice(0, 1)).toBe(0)
  })
})

describe('MS_POR_IMAGEN_HEROE', () => {
  it('está en la banda que ni interrumpe la lectura ni esconde la segunda imagen', () => {
    expect(MS_POR_IMAGEN_HEROE).toBeGreaterThanOrEqual(5000)
    expect(MS_POR_IMAGEN_HEROE).toBeLessThanOrEqual(8000)
  })
})

describe('rutaRecursoSitio', () => {
  it('mete la ubicación en la ruta, que es lo que hace legible el bucket', () => {
    expect(rutaRecursoSitio('promo', 'abc-0001', 'webp')).toBe(
      'promo/abc-0001.webp',
    )
    expect(rutaRecursoSitio('heroe', 'xyz-0002', 'jpg')).toBe('heroe/xyz-0002.jpg')
  })
})
