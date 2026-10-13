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

import { mensajeDeError } from '@/lib/shared/errores'
import { revalidatePath, updateTag } from 'next/cache'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import {
  borrarObjeto,
  borrarPorUrlPublica,
  rutaDesdeUrlPublica,
  subirImagen,
} from '@/lib/imagenes/subir'
import { TOPE_FOTOS_NEGOCIO, fotosUsadas } from '@/lib/comercios/fotos-negocio'
import { ordenTrasMover } from '@/lib/shared/orden'
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

/**
 * El catálogo del socio y la fachada leen estas mismas columnas: se refrescan
 * también. La fachada va detrás de la caché `publico`; sin soltarla, el
 * cambio tardaría un minuto en verse en la ficha pública.
 */
function refrescar(comercioId: number): void {
  updateTag('publico')
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
      destino === 'logo'
        ? { logo_url: resultado.url, updated_by: actorId }
        : { portada_url: resultado.url, updated_by: actorId },
    )
    .eq('id', comercioId)

  if (error) {
    // El archivo ya está arriba, pero la columna sigue apuntando a lo anterior:
    // el estado visible del producto NO cambió. Se dice tal cual.
    return {
      error: mensajeDeError('La imagen se subió pero no se pudo guardar en el comercio', error, 'Se conserva la anterior.'),
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

/**
 * Quita el logotipo o la portada de un comercio (13/10/2026, encargo del
 * propietario: «la posibilidad de borrar cualquiera que quiera; ya sea logo,
 * portada, galería»). La columna queda vacía y, si el archivo es nuestro, se
 * borra; un logotipo alojado en la web del comercio solo se desvincula.
 */
export async function quitarImagenComercio(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const comercioId = Number(formData.get('id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) {
    return { error: 'Falta el identificador del comercio.' }
  }
  const destino = String(formData.get('destino') ?? '')
  if (destino !== 'logo' && destino !== 'portada') {
    return { error: 'Destino de imagen no válido.' }
  }

  const admin = createAdminClient()
  const { data: comercio } = await admin
    .from('comercios')
    .select('id, logo_url, portada_url')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!comercio) return { error: 'El comercio ya no existe.' }

  const anterior = destino === 'logo' ? comercio.logo_url : comercio.portada_url
  // Ya no hay nada: para quien pulsa, quedó quitada.
  if (!anterior) return { ok: true }

  const { error } = await admin
    .from('comercios')
    .update(
      destino === 'logo'
        ? { logo_url: null, updated_by: actorId }
        : { portada_url: null, updated_by: actorId },
    )
    .eq('id', comercioId)
  if (error) {
    return {
      error: mensajeDeError(
        destino === 'logo' ? 'No se pudo quitar el logotipo' : 'No se pudo quitar la portada',
        error,
      ),
    }
  }

  await borrarPorUrlPublica(admin, BUCKET_IMAGENES_COMERCIOS, anterior)

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'comercio',
    entidadId: comercioId,
    campo: destino === 'logo' ? 'logo_url' : 'portada_url',
    urlAnterior: anterior,
    urlNueva: null,
  })

  refrescar(comercioId)
  return { ok: true }
}

/* ==========================================================================
   LA GALERÍA
   ========================================================================== */

/** Texto alternativo de una pieza de galería. Vacío = decorativa. */
function leerDescripcion(formData: FormData): string | null {
  const texto = String(formData.get('descripcion') ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  return texto || null
}

function leerEntero(formData: FormData, campo: string): number | null {
  const crudo = formData.get(campo)
  if (crudo === null || crudo === '') return null
  const n = Number(crudo)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** Las piezas de la galería de un comercio, en el orden en que se ven. */
async function leerGaleria(admin: ReturnType<typeof createAdminClient>, comercioId: number) {
  const { data } = await admin
    .from('comercio_imagenes')
    .select('id, url, orden')
    .eq('comercio_id', comercioId)
    .order('orden', { ascending: true })
    .order('id', { ascending: true })
  return data ?? []
}

/**
 * Guarda una foto de la galería ya encuadrada. Con `foto_id`, sustituye esa
 * pieza (y conserva su puesto); sin él, añade una al final.
 *
 * El tope de fotos es el mismo que respeta el comercio desde su portal
 * (`lib/comercios/fotos-negocio.ts`): si el panel pudiera pasarlo, el
 * comercio se encontraría con más fotos de las que su ventana sabe enseñar.
 */
export async function guardarFotoGaleria(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const comercioId = leerEntero(formData, 'comercio_id')
  if (comercioId === null) return { error: 'Falta el identificador del comercio.' }

  const admin = createAdminClient()
  const { data: comercio } = await admin
    .from('comercios')
    .select('id, portada_url')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!comercio) return { error: 'El comercio ya no existe.' }

  const piezas = await leerGaleria(admin, comercioId)
  const fotoId = leerEntero(formData, 'foto_id')
  const anterior = fotoId === null ? null : piezas.find((p) => p.id === fotoId)

  // Un `id` que no es de este comercio no está en `piezas`: no se toca nada.
  if (fotoId !== null && !anterior) return { error: 'Esa foto ya no existe.' }
  if (!anterior && fotosUsadas(comercio.portada_url, piezas.length) >= TOPE_FOTOS_NEGOCIO) {
    return { error: `El comercio ya tiene las ${TOPE_FOTOS_NEGOCIO} fotos. Quita una para añadir otra.` }
  }

  // Clave opaca y nueva en cada subida, también al sustituir: la dirección
  // cambia, así que ni el navegador ni la CDN siguen enseñando la anterior.
  const clave = claveGaleria(Date.now(), Math.random())
  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_IMAGENES_COMERCIOS,
    ruta: (ext) => rutaGaleriaComercio(comercioId, clave, ext),
    limite: LIMITE_IMAGENES_COMERCIOS,
  })
  if (!resultado.ok) return { error: resultado.error }

  const descripcion = leerDescripcion(formData)
  const { error } = anterior
    ? await admin
        .from('comercio_imagenes')
        .update({ url: resultado.url, descripcion })
        .eq('id', anterior.id)
        .eq('comercio_id', comercioId)
    : await admin.from('comercio_imagenes').insert({
        comercio_id: comercioId,
        url: resultado.url,
        descripcion,
        // Al final: las nuevas no desordenan las que ya había.
        orden: piezas.reduce((max, p) => Math.max(max, p.orden), 0) + 1,
      })

  if (error) {
    // La fila no entró: el archivo recién subido no lo referencia nadie.
    await borrarObjeto(admin, BUCKET_IMAGENES_COMERCIOS, resultado.ruta)
    return { error: mensajeDeError('No se pudo guardar la foto', error) }
  }

  // Sustituida: la anterior sobra. Solo si es nuestra; una URL externa no se toca.
  if (anterior) await borrarPorUrlPublica(admin, BUCKET_IMAGENES_COMERCIOS, anterior.url)

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'comercio_imagen',
    entidadId: comercioId,
    campo: 'galeria',
    urlAnterior: anterior?.url ?? null,
    urlNueva: resultado.url,
  })

  refrescar(comercioId)
  return { ok: true, url: resultado.url }
}

/** Mueve una foto de la galería un puesto (`sentido`: -1 antes, 1 después). */
export async function moverFotoGaleria(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const comercioId = leerEntero(formData, 'comercio_id')
  const fotoId = leerEntero(formData, 'foto_id')
  const sentido = Number(formData.get('sentido'))
  if (comercioId === null || fotoId === null || (sentido !== -1 && sentido !== 1)) {
    return { error: 'No se pudo mover la foto.' }
  }

  const admin = createAdminClient()
  const piezas = await leerGaleria(admin, comercioId)
  const nuevo = ordenTrasMover(
    piezas.map((p) => p.id),
    fotoId,
    sentido,
  )
  // Ya estaba en ese extremo (o no es de este comercio): nada que hacer.
  if (!nuevo) return { ok: true }

  // Se renumeran todas: son ocho como mucho, y así el orden nunca queda con
  // huecos ni con dos piezas en el mismo puesto.
  const resultados = await Promise.all(
    nuevo.map((id, i) =>
      admin
        .from('comercio_imagenes')
        .update({ orden: i + 1 })
        .eq('id', id)
        .eq('comercio_id', comercioId),
    ),
  )
  const fallo = resultados.find((r) => r.error)?.error
  if (fallo) return { error: mensajeDeError('No se pudo mover la foto', fallo) }

  refrescar(comercioId)
  return { ok: true }
}

/** Quita una foto de la galería: la fila y, si es nuestro, el archivo. */
export async function quitarFotoGaleria(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const comercioId = leerEntero(formData, 'comercio_id')
  const fotoId = leerEntero(formData, 'foto_id')
  if (comercioId === null || fotoId === null) {
    return { error: 'Falta la foto que se quiere quitar.' }
  }

  const admin = createAdminClient()
  const { data: fila } = await admin
    .from('comercio_imagenes')
    .select('id, url')
    .eq('id', fotoId)
    .eq('comercio_id', comercioId)
    .maybeSingle()
  // Ya no está (o no es de este comercio): para quien pulsa, quedó quitada.
  if (!fila) {
    refrescar(comercioId)
    return { ok: true }
  }

  const { error } = await admin
    .from('comercio_imagenes')
    .delete()
    .eq('id', fila.id)
    .eq('comercio_id', comercioId)
  if (error) return { error: mensajeDeError('No se pudo quitar la foto', error) }

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
  return { ok: true }
}
