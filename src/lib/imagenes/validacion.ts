/*
  VALIDACIÓN DE IMÁGENES  ·  función pura, a propósito

  El límite del bucket de Storage es la ÚLTIMA red, no la primera. Cuando
  salta, el error que llega es un mensaje genérico del servicio y el
  administrador no sabe si el archivo pesaba de más, si el formato no se
  admite o si el servicio está caído.

  Aquí se decide antes, con un mensaje que dice qué hacer, y se decide en el
  SERVIDOR: la validación del navegador es comodidad, no seguridad — un
  `accept` en un `<input type="file">` se salta con dos líneas de consola.

  Todo lo de este archivo es puro: entra un descriptor, sale un veredicto. Sin
  red, sin `File`, sin Supabase. Es la norma del proyecto para lo que se
  prueba de forma automatizada.

  ── SVG excluido a propósito ────────────────────────────────────────────────
  Un SVG puede contener `<script>`. Servido desde un bucket PÚBLICO del mismo
  origen, es superficie de XSS directa. No es una limitación técnica: es una
  decisión de seguridad ya tomada, y el bucket la repite del lado del servicio.
*/

/** Los tres formatos que admiten los dos buckets. El orden es el del mensaje. */
export const TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp'] as const

export type TipoImagen = (typeof TIPOS_IMAGEN)[number]

/**
 * Límites por bucket, en bytes. Son los mismos que declara Storage: si aquí
 * fueran más grandes, el rechazo llegaría del servicio con un mensaje peor.
 */
export const LIMITE_IMAGENES_COMERCIOS = 1_048_576 // 1 MB — logo, portada, galería
export const LIMITE_AVATARES = 524_288 // 512 KB — avatar de perfil, foto de socio
/*
  2 MB para los recursos del sitio, y es el único límite que sube.

  La imagen principal de la portada es una fotografía que se pinta a ancho de
  pantalla en escritorio: comprimirla a 1 MB como un logo de 72px la deja con
  artefactos justo en lo primero que ve quien llega. Los carteles de promoción
  viven en el mismo bucket y heredan el mismo techo.
*/
export const LIMITE_RECURSOS_SITIO = 2_097_152 // 2 MB — héroe, promociones, logos

/**
 * Extensión de archivo por tipo. `jpg` y no `jpeg` porque es lo que escribe
 * cualquier exportador, y la ruta del objeto se compara a ojo en Storage.
 */
const EXTENSION: Record<TipoImagen, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

/** Nombre humano del formato, para los mensajes de error. */
const NOMBRE: Record<TipoImagen, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
}

export function esTipoImagen(valor: string): valor is TipoImagen {
  return (TIPOS_IMAGEN as readonly string[]).includes(valor)
}

export function extensionDe(tipo: TipoImagen): string {
  return EXTENSION[tipo]
}

export function nombreDe(tipo: TipoImagen): string {
  return NOMBRE[tipo]
}

/**
 * Peso legible. Redondea a un decimal en megas y a entero en kilos: «0,9 MB»
 * informa, «943718 bytes» no.
 *
 * Usa el separador decimal de es-CO (la coma) porque el texto va a la
 * interfaz, no a un log.
 */
export function pesoLegible(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 KB'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} KB`
  const megas = bytes / 1_048_576
  return `${megas.toFixed(1).replace('.', ',')} MB`
}

/**
 * Detecta el formato real leyendo los primeros bytes del archivo.
 *
 * El `type` que llega en un `File` lo deduce el NAVEGADOR de la extensión: un
 * ejecutable renombrado a `.png` llega declarado como `image/png`. Los números
 * mágicos son lo que distingue lo que el archivo dice de lo que el archivo es.
 *
 * Devuelve `null` si no reconoce la firma — que incluye el caso del SVG, que
 * es texto y no tiene ninguna.
 */
export function detectarTipoPorContenido(bytes: Uint8Array): TipoImagen | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  // JPEG: FF D8 FF (los tres primeros bytes de cualquier variante: JFIF, Exif…)
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  // WebP: 'RIFF' …4 bytes de tamaño… 'WEBP'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  return null
}

export type ImagenCandidata = {
  /** El `type` que declara el archivo. No se cree, se contrasta. */
  tipo: string
  /** Tamaño en bytes. */
  tamano: number
  /**
   * Primeros bytes del archivo. Opcional porque el navegador valida sin
   * leerlos (es solo comodidad); en servidor SIEMPRE se pasan.
   */
  contenido?: Uint8Array | null
}

export type ResultadoValidacion =
  | { ok: true; tipo: TipoImagen; extension: string }
  | { ok: false; error: string }

/**
 * Veredicto sobre una imagen candidata.
 *
 * El orden importa y es el del coste para quien sube: primero lo que se
 * arregla eligiendo otro archivo (vacío, formato), luego lo que se arregla
 * exportando de nuevo (peso), y por último la comprobación de contenido, que
 * es la que detecta un engaño y no un descuido.
 */
export function validarImagen(
  candidata: ImagenCandidata,
  limite: number,
): ResultadoValidacion {
  const { tipo, tamano, contenido } = candidata

  if (!Number.isFinite(tamano) || tamano <= 0) {
    return { ok: false, error: 'El archivo está vacío.' }
  }

  if (!esTipoImagen(tipo)) {
    return {
      ok: false,
      error:
        'Formato no admitido. Usa PNG, JPEG o WebP. El SVG no se acepta por seguridad.',
    }
  }

  if (tamano > limite) {
    return {
      ok: false,
      error: `La imagen pesa ${pesoLegible(tamano)} y el máximo son ${pesoLegible(limite)}. Expórtala más ligera y vuelve a intentarlo.`,
    }
  }

  if (contenido) {
    const real = detectarTipoPorContenido(contenido)
    if (real === null) {
      return {
        ok: false,
        error: 'El archivo no es una imagen PNG, JPEG ni WebP aunque lo parezca por su nombre.',
      }
    }
    if (real !== tipo) {
      return {
        ok: false,
        error: `El archivo dice ser ${nombreDe(tipo)} pero su contenido es ${nombreDe(real)}. Vuelve a exportarlo.`,
      }
    }
  }

  return { ok: true, tipo, extension: EXTENSION[tipo] }
}

/**
 * Añade una marca de versión a una URL pública ya formada.
 *
 * Hace falta porque se sube con `upsert: true`: la ruta del objeto NO cambia
 * al sustituir la imagen, así que la URL tampoco, y el CDN —y el navegador—
 * siguen sirviendo la anterior. Sin esto, cambiar el logo «no hace nada»
 * durante el tiempo que dure la caché, que es justo cuando el administrador
 * mira si funcionó.
 *
 * Se respeta una cadena de consulta previa, porque en esta columna conviven
 * URLs externas de comercios que alojan su logo en su propia web.
 */
export function conVersion(url: string, marca: number | string): string {
  if (!url) return url
  const separador = url.includes('?') ? '&' : '?'
  return `${url}${separador}v=${marca}`
}
