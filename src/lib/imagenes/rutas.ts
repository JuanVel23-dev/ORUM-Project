/*
  CONVENCIÓN DE RUTAS EN STORAGE  ·  pura

  El identificador del dueño va SIEMPRE en la ruta. No es cosmético: es lo que
  permite que una política RLS compare la carpeta contra el dueño de la sesión
  (`storage.foldername(name)`). Cambiar la forma de estas rutas sin reescribir
  las políticas abre el bucket.

  Las cinco rutas están fijadas por el contrato acordado con backend:

    imagenes-comercios/comercios/{id}/logo.{ext}
    imagenes-comercios/comercios/{id}/portada.{ext}
    imagenes-comercios/comercios/{id}/galeria/{clave}.{ext}
    imagenes-comercios/marcas/{id}/logo.{ext}
    avatares/perfiles/{auth.uid()}/avatar.{ext}
    avatares/miembros/{id}/{clave}/foto.{ext}   ← clave aleatoria POR SUBIDA (1/10/2026)

  Nombre de archivo FIJO por destino (`logo`, `portada`, `avatar`, `foto`).
  Con `upsert: true` eso significa que subir dos veces SUSTITUYE en vez de
  acumular archivos huérfanos que nadie borra nunca. La única excepción es la
  galería, donde cada imagen es una pieza distinta y necesita su propia clave.
*/

export const BUCKET_IMAGENES_COMERCIOS = 'imagenes-comercios'
export const BUCKET_IMAGENES_ANUNCIOS = 'imagenes-anuncios'
export const BUCKET_AVATARES = 'avatares'

export function rutaLogoComercio(comercioId: number, extension: string): string {
  return `comercios/${comercioId}/logo.${extension}`
}

export function rutaPortadaComercio(comercioId: number, extension: string): string {
  return `comercios/${comercioId}/portada.${extension}`
}

/**
 * `imagenes-anuncios/anuncios/{id}/imagen.{ext}` — nombre fijo por destino,
 * igual que el logo o la portada de un comercio: subir dos veces SUSTITUYE
 * en vez de acumular archivos huérfanos.
 */
export function rutaImagenAnuncio(anuncioId: number, extension: string): string {
  return `anuncios/${anuncioId}/imagen.${extension}`
}

export function rutaLogoMarca(marcaId: number, extension: string): string {
  return `marcas/${marcaId}/logo.${extension}`
}

export function rutaAvatarPerfil(perfilId: string, extension: string): string {
  return `perfiles/${perfilId}/avatar.${extension}`
}

/**
 * Una clave aleatoria de 32 hexadecimales (128 bits), la misma que un UUID sin
 * guiones. Es lo que hace que la ruta de una foto NO se pueda adivinar.
 */
const FORMA_CLAVE_FOTO = /^[0-9a-f]{32}$/

export function claveFotoValida(clave: string): boolean {
  return FORMA_CLAVE_FOTO.test(clave)
}

/** Una clave nueva, de un solo uso: cada foto subida lleva la suya. */
export function nuevaClaveFoto(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * `avatares/miembros/{id}/{clave}/foto.{ext}`
 *
 * 1/10/2026 · auditoría de seguridad. La ruta era `miembros/{id}/foto.{ext}`
 * y el `id` es consecutivo: cualquiera podía bajar la foto de otro socio
 * probando números, sin sesión. Ahora lleva una clave aleatoria POR SUBIDA.
 *
 * La clave se valida y NO se concatena sin mirar: una `clave` con `..` o `/`
 * alteraría la ruta, y el valor llega de quien llama.
 *
 * Como cada foto nueva trae clave nueva, la anterior ya no se SUSTITUYE al
 * subir: quien sube debe borrarla por su dirección guardada
 * (`rutaDesdeUrlPublica`). A cambio, cada foto tiene una URL distinta y no
 * hay copia vieja en la caché de la CDN.
 *
 * El `id` se conserva en la ruta: la política de Storage compara la carpeta
 * contra el dueño, y deja la ruta legible al diagnosticar.
 */
export function rutaFotoMiembro(miembroId: number, extension: string, clave: string): string {
  if (!claveFotoValida(clave)) {
    throw new Error('Clave de foto inválida: deben ser 32 caracteres hexadecimales en minúscula.')
  }
  return `miembros/${miembroId}/${clave}/foto.${extension}`
}

/**
 * Una pieza de la galería de un comercio.
 *
 * La clave NO puede ser el nombre del archivo que suba el administrador: trae
 * espacios, tildes y a veces rutas de Windows enteras. Se genera aparte
 * (`claveGaleria`) y es opaca.
 */
export function rutaGaleriaComercio(
  comercioId: number,
  clave: string,
  extension: string,
): string {
  return `comercios/${comercioId}/galeria/${clave}.${extension}`
}

/**
 * Clave opaca para una pieza de galería. Base 36 del instante más un sufijo
 * aleatorio corto: legible en el explorador de Storage, ordenable por subida
 * y sin colisión práctica dentro de un mismo comercio.
 */
export function claveGaleria(ahora: number, aleatorio: number): string {
  const sufijo = Math.floor(aleatorio * 1_679_616)
    .toString(36)
    .padStart(4, '0')
  return `${ahora.toString(36)}-${sufijo}`
}

/**
 * URL pública completa de un objeto.
 *
 * SE GUARDA LA URL COMPLETA, NO LA RUTA. Es el contrato: la columna ya
 * contiene URLs externas de comercios que alojan su logo en su propia web, y
 * guardar unas como ruta obligaría al frontend a distinguirlas en cada render.
 *
 * En servidor se prefiere `getPublicUrl()` del SDK, que es la fuente
 * canónica. Esta función existe para poder razonar y probar la forma del
 * resultado sin abrir un cliente de Supabase.
 */
export function urlPublica(baseSupabase: string, bucket: string, ruta: string): string {
  const base = baseSupabase.replace(/\/+$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${ruta}`
}
