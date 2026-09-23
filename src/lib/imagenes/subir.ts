/*
  SUBIDA DE IMÁGENES  ·  el único sitio donde se habla con Storage

  Orden obligatorio, y es el del contrato con backend:

    1. Validar tipo MIME y tamaño EN SERVIDOR. El límite del bucket es la
       última red, no la primera.
    2. Subir con `upsert: true` a la ruta convenida.
    3. Devolver la URL PÚBLICA COMPLETA, no la ruta interna.
    4. Si la subida falla, la columna NO se toca: o la URL nueva, o la
       anterior intacta. Por eso este módulo no escribe en la base — devuelve
       una URL y quien llama decide, así no existe el estado intermedio.
    5. La bitácora la escribe `auditoria.ts`, después de que el UPDATE haya
       ido bien.

  `server-only` es una barrera de compilación: `createAdminClient` usa la
  `service_role`, que ignora TODAS las políticas RLS. Un `'use client'`
  colado en la cadena de importaciones la metería en un bundle del navegador
  sin dar ningún síntoma.
*/
import 'server-only'

import type { createAdminClient } from '@/lib/supabase/admin'
import { conVersion, validarImagen } from './validacion'

type Admin = ReturnType<typeof createAdminClient>

export type ResultadoSubida =
  | { ok: true; url: string; ruta: string }
  | { ok: false; error: string }

type OpcionesSubida = {
  /** La entrada cruda del `FormData`. Puede ser cualquier cosa; aquí se estrecha. */
  archivo: FormDataEntryValue | null
  bucket: string
  /**
   * Ruta destino en función de la extensión REAL, que no se conoce hasta
   * haber validado el contenido. Por eso es una función y no una cadena.
   */
  ruta: (extension: string) => string
  /** Límite en bytes del bucket correspondiente. */
  limite: number
}

/**
 * Un año de caché. Es seguro porque la URL guardada lleva marca de versión
 * (`conVersion`): al sustituir la imagen cambia la URL, no el objeto.
 */
const CACHE_UN_ANO = '31536000'

/**
 * Lee, valida y sube. No escribe en ninguna tabla.
 *
 * Devuelve siempre un mensaje en español listo para enseñar: quien llama no
 * tiene que traducir errores de Storage.
 */
export async function subirImagen(
  admin: Admin,
  { archivo, bucket, ruta, limite }: OpcionesSubida,
): Promise<ResultadoSubida> {
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: 'Selecciona una imagen.' }
  }

  // Se leen los bytes ANTES de decidir: el `type` que declara el navegador se
  // deduce de la extensión y por sí solo no prueba nada.
  let contenido: Uint8Array
  try {
    contenido = new Uint8Array(await archivo.arrayBuffer())
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo. Vuelve a seleccionarlo.' }
  }

  const veredicto = validarImagen(
    { tipo: archivo.type, tamano: archivo.size, contenido },
    limite,
  )
  if (!veredicto.ok) return { ok: false, error: veredicto.error }

  const destino = ruta(veredicto.extension)

  const { error } = await admin.storage.from(bucket).upload(destino, contenido, {
    upsert: true,
    contentType: veredicto.tipo,
    cacheControl: CACHE_UN_ANO,
  })

  if (error) {
    // El servicio responde en inglés y con su propio vocabulario. Se traduce
    // lo que tiene remedio y se deja pasar el resto con su texto original,
    // que es lo único que ayuda a diagnosticar un fallo real.
    const bruto = error.message ?? ''
    const mensaje = /exceeded the maximum allowed size|payload too large/i.test(bruto)
      ? 'La imagen supera el tamaño máximo que admite el almacenamiento.'
      : /mime type|not allowed/i.test(bruto)
        ? 'El almacenamiento no admite ese formato de imagen.'
        : `No se pudo subir la imagen: ${bruto || 'error desconocido'}`
    return { ok: false, error: mensaje }
  }

  // Después de subir, y nunca antes: si el formato cambió (de PNG a WebP, por
  // ejemplo) el archivo anterior tiene OTRO nombre y `upsert` no lo pisa. Sin
  // esto, cada cambio de formato deja un huérfano que nadie vuelve a mirar.
  await borrarOtrasVariantes(admin, bucket, ruta, veredicto.extension)

  const { data } = admin.storage.from(bucket).getPublicUrl(destino)
  if (!data?.publicUrl) {
    return { ok: false, error: 'La imagen se subió pero no se pudo resolver su dirección pública.' }
  }

  return { ok: true, url: conVersion(data.publicUrl, Date.now()), ruta: destino }
}

/** Extensiones que puede tener el mismo destino, según el formato de origen. */
const EXTENSIONES = ['png', 'jpg', 'webp'] as const

async function borrarOtrasVariantes(
  admin: Admin,
  bucket: string,
  ruta: (extension: string) => string,
  conservar: string,
): Promise<void> {
  const sobrantes = EXTENSIONES.filter((e) => e !== conservar).map((e) => ruta(e))
  if (sobrantes.length === 0) return
  try {
    // Borrar lo que no existe no es un error en Storage: no hace falta mirar
    // antes si están. Y si fallara, no es motivo para invalidar una subida
    // que ya salió bien — solo queda un archivo de más.
    await admin.storage.from(bucket).remove(sobrantes)
  } catch (err) {
    console.error('No se pudieron borrar las variantes anteriores de la imagen:', err)
  }
}

/**
 * Borra un objeto concreto. Se usa al quitar una pieza de la galería: la fila
 * de `comercio_imagenes` se va, y el archivo detrás también.
 *
 * Best-effort a propósito: si el archivo ya no está, la fila debe irse igual.
 */
export async function borrarObjeto(
  admin: Admin,
  bucket: string,
  ruta: string,
): Promise<void> {
  try {
    await admin.storage.from(bucket).remove([ruta])
  } catch (err) {
    console.error('No se pudo borrar el objeto de Storage:', err)
  }
}

/**
 * Ruta interna a partir de una URL pública nuestra, o `null` si la URL es
 * externa (un comercio que aloja su logo en su propia web).
 *
 * Las dos fuentes CONVIVEN y ninguna se migra: por eso hace falta poder
 * distinguirlas para borrar, y solo para borrar.
 */
export function rutaDesdeUrlPublica(url: string | null, bucket: string): string | null {
  if (!url) return null
  const marca = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marca)
  if (i === -1) return null
  const cola = url.slice(i + marca.length)
  const sinConsulta = cola.split('?')[0]
  return sinConsulta ? decodeURIComponent(sinConsulta) : null
}
