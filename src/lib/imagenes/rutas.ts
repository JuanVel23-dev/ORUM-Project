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
    avatares/miembros/{id}/foto.{ext}

  Nombre de archivo FIJO por destino (`logo`, `portada`, `avatar`, `foto`).
  Con `upsert: true` eso significa que subir dos veces SUSTITUYE en vez de
  acumular archivos huérfanos que nadie borra nunca. La única excepción es la
  galería, donde cada imagen es una pieza distinta y necesita su propia clave.
*/

export const BUCKET_IMAGENES_COMERCIOS = 'imagenes-comercios'
export const BUCKET_AVATARES = 'avatares'
export const BUCKET_RECURSOS_SITIO = 'recursos-sitio'

export function rutaLogoComercio(comercioId: number, extension: string): string {
  return `comercios/${comercioId}/logo.${extension}`
}

export function rutaPortadaComercio(comercioId: number, extension: string): string {
  return `comercios/${comercioId}/portada.${extension}`
}

export function rutaLogoMarca(marcaId: number, extension: string): string {
  return `marcas/${marcaId}/logo.${extension}`
}

export function rutaAvatarPerfil(perfilId: string, extension: string): string {
  return `perfiles/${perfilId}/avatar.${extension}`
}

export function rutaFotoMiembro(miembroId: number, extension: string): string {
  return `miembros/${miembroId}/foto.${extension}`
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
 * Una imagen del sitio público: el héroe, un cartel de promoción, un logo.
 *
 *   recursos-sitio/{ubicacion}/{clave}.{ext}
 *
 * La ubicación va EN LA RUTA aunque ninguna política la mire: el bucket se
 * abre a mano en el panel de Supabase más veces de las que se piensa, y
 * `promo/lk9x-0f21.webp` se entiende de un vistazo donde `lk9x-0f21.webp`
 * obliga a cruzar la tabla.
 *
 * La clave es OPACA y la genera `claveGaleria`, nunca el nombre del archivo
 * que trae quien sube: viene con espacios, tildes y a veces una ruta de
 * Windows entera. Y es por pieza, no fija por destino: aquí cada imagen es
 * una imagen distinta, no la sustitución de la anterior.
 */
export function rutaRecursoSitio(
  ubicacion: string,
  clave: string,
  extension: string,
): string {
  return `${ubicacion}/${clave}.${extension}`
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
