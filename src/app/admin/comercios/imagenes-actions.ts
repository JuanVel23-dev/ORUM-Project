'use server'

/*
  IMÁGENES DE UN COMERCIO  ·  logo, portada y galería

  Archivo aparte de `actions.ts` a propósito. `actions.ts` recibió la tanda de
  seguridad OWASP de agosto y está auditado contra un modelo de amenazas
  concreto; la subida de archivos es superficie nueva y merece revisarse como
  tal, no colarse dentro de una acción ya firmada. Aquí no se toca nada de lo
  que aquel archivo hace: `crearComercio` y `editarComercio` siguen guardando
  `logo_url` como siempre, y por eso el formulario de edición le sigue
  enviando el valor vigente en un campo oculto.

  El criterio de autorización es EL MISMO que el de `actions.ts` —
  `super_admin` activo—, deliberadamente copiado y no reinventado: dos
  verdades sobre quién es administrador es como se cuelan los agujeros.
*/

import { revalidatePath } from 'next/cache'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import { borrarObjeto, rutaDesdeUrlPublica, subirImagen } from '@/lib/imagenes/subir'
import {
  BUCKET_IMAGENES_COMERCIOS,
  claveGaleria,
  rutaGaleriaComercio,
  rutaLogoComercio,
  rutaPortadaComercio,
} from '@/lib/imagenes/rutas'
import { LIMITE_IMAGENES_COMERCIOS } from '@/lib/imagenes/validacion'
import type { EstadoSubida } from '@/lib/imagenes/estado'

/** Mismo criterio que `exigirSuperAdmin` de `actions.ts`. No se relaja aquí. */
async function actorSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') return null
  return actor.userId
}

const SIN_PERMISO = 'No tienes permiso para realizar esta acción.'

/** El catálogo del socio lee estas mismas columnas: se refresca también. */
function refrescar(comercioId: number): void {
  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${comercioId}`)
  revalidatePath(`/admin/comercios/${comercioId}/imagenes`)
  revalidatePath('/miembros')
  revalidatePath(`/miembros/comercios/${comercioId}`)
}

type DestinoComercio = 'logo' | 'portada'

/**
 * Sustituye el logo o la portada de un comercio.
 *
 * La columna solo se escribe DESPUÉS de que la subida haya ido bien: si
 * Storage falla, `logo_url` se queda exactamente como estaba. Nunca queda a
 * medias, que es el punto 4 del contrato.
 */
export async function guardarImagenComercio(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const comercioId = Number(formData.get('id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) {
    return { error: 'Falta el identificador del comercio.' }
  }

  const destinoRaw = String(formData.get('destino') ?? '')
  if (destinoRaw !== 'logo' && destinoRaw !== 'portada') {
    return { error: 'Destino de imagen no válido.' }
  }
  const destino: DestinoComercio = destinoRaw
  const campo = destino === 'logo' ? 'logo_url' : 'portada_url'

  const admin = createAdminClient()

  const { data: comercio } = await admin
    .from('comercios')
    .select('id, logo_url, portada_url')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!comercio) return { error: 'El comercio ya no existe.' }

  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_IMAGENES_COMERCIOS,
    ruta: (ext) =>
      destino === 'logo'
        ? rutaLogoComercio(comercioId, ext)
        : rutaPortadaComercio(comercioId, ext),
    limite: LIMITE_IMAGENES_COMERCIOS,
  })
  if (!resultado.ok) return { error: resultado.error }

  const anterior = destino === 'logo' ? comercio.logo_url : comercio.portada_url

  /*
    Objeto explícito por rama y no `{ [campo]: url }`: una clave computada
    ensancha el tipo a `{ [x: string]: string }` y el cliente tipado de
    Supabase la rechaza. La verbosidad aquí compra que un destino mal escrito
    sea un error de compilación y no una columna inventada.
  */
  const { error } = await admin
    .from('comercios')
    .update(
      destino === 'logo' ? { logo_url: resultado.url } : { portada_url: resultado.url },
    )
    .eq('id', comercioId)

  if (error) {
    // El archivo ya está arriba, pero la columna sigue apuntando a lo anterior:
    // el estado visible del producto NO cambió. Se dice tal cual.
    return {
      error: `La imagen se subió pero no se pudo guardar en el comercio: ${error.message}. Se conserva la anterior.`,
    }
  }

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'comercio',
    entidadId: comercioId,
    campo,
    urlAnterior: anterior,
    urlNueva: resultado.url,
  })

  refrescar(comercioId)
  return { ok: true, url: resultado.url }
}

/** Texto alternativo de una pieza de galería. Vacío = decorativa. */
function leerDescripcion(formData: FormData): string | null {
  const texto = String(formData.get('descripcion') ?? '').trim()
  return texto || null
}

function leerOrden(formData: FormData): number {
  const n = Number(formData.get('orden'))
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

/** Añade una pieza a `comercio_imagenes`, con su orden y su texto alternativo. */
export async function agregarImagenGaleria(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) {
    return { error: 'Falta el identificador del comercio.' }
  }

  const admin = createAdminClient()

  const { data: comercio } = await admin
    .from('comercios')
    .select('id')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!comercio) return { error: 'El comercio ya no existe.' }

  // Clave opaca: el nombre que trae el archivo del administrador viene con
  // espacios, tildes y a veces una ruta de Windows entera.
  const clave = claveGaleria(Date.now(), Math.random())

  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_IMAGENES_COMERCIOS,
    ruta: (ext) => rutaGaleriaComercio(comercioId, clave, ext),
    limite: LIMITE_IMAGENES_COMERCIOS,
  })
  if (!resultado.ok) return { error: resultado.error }

  const { error } = await admin.from('comercio_imagenes').insert({
    comercio_id: comercioId,
    url: resultado.url,
    descripcion: leerDescripcion(formData),
    orden: leerOrden(formData),
  })

  if (error) {
    // La fila no entró: el archivo suelto en Storage no lo referencia nadie y
    // se queda huérfano. Se borra para no dejar basura acumulándose.
    await borrarObjeto(admin, BUCKET_IMAGENES_COMERCIOS, resultado.ruta)
    return { error: `No se pudo añadir la imagen a la galería: ${error.message}` }
  }

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'comercio_imagen',
    entidadId: comercioId,
    campo: 'galeria',
    urlAnterior: null,
    urlNueva: resultado.url,
  })

  refrescar(comercioId)
  return { ok: true, url: resultado.url }
}

/**
 * Cambia el orden o el texto alternativo de una pieza ya subida. No toca el
 * archivo: para sustituir la imagen se quita y se vuelve a añadir.
 *
 * Acción sin estado (`void`) porque va en un `<form>` simple: funciona sin
 * JavaScript y `revalidatePath` repinta la lista.
 */
export async function actualizarImagenGaleria(formData: FormData): Promise<void> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(id) || id < 1) return
  if (!Number.isInteger(comercioId) || comercioId < 1) return

  const admin = createAdminClient()
  await admin
    .from('comercio_imagenes')
    .update({ descripcion: leerDescripcion(formData), orden: leerOrden(formData) })
    .eq('id', id)
    .eq('comercio_id', comercioId)

  refrescar(comercioId)
}

/** Quita una pieza de la galería: la fila y, si es nuestro, el archivo. */
export async function quitarImagenGaleria(formData: FormData): Promise<void> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(id) || id < 1) return
  if (!Number.isInteger(comercioId) || comercioId < 1) return

  const admin = createAdminClient()

  const { data: fila } = await admin
    .from('comercio_imagenes')
    .select('id, url')
    .eq('id', id)
    .eq('comercio_id', comercioId)
    .maybeSingle()
  if (!fila) return

  const { error } = await admin
    .from('comercio_imagenes')
    .delete()
    .eq('id', id)
    .eq('comercio_id', comercioId)
  if (error) return

  // Solo si el archivo es nuestro. Una URL externa no se toca: no es nuestra.
  const ruta = rutaDesdeUrlPublica(fila.url, BUCKET_IMAGENES_COMERCIOS)
  if (ruta) await borrarObjeto(admin, BUCKET_IMAGENES_COMERCIOS, ruta)

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'comercio_imagen',
    entidadId: comercioId,
    campo: 'galeria',
    urlAnterior: fila.url,
    urlNueva: null,
  })

  refrescar(comercioId)
}
