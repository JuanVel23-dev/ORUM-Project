'use server'

/*
  RECURSOS DEL SITIO  ·  subir, describir, publicar y borrar

  Archivo aparte y hermano de `comercios/imagenes-actions.ts`, por el mismo
  motivo por el que aquel no se metió dentro de `actions.ts`: la subida de
  archivos es superficie propia y se revisa como tal.

  Lo que copia de él, deliberadamente y sin reinventar nada:

    · El criterio de autorización — `super_admin` activo. Dos verdades sobre
      quién es administrador es como se cuelan los agujeros.
    · El orden del contrato: validar en servidor, subir, y SOLO DESPUÉS
      escribir en la tabla. Si Storage falla, la tabla no se toca.
    · Si la fila no entra, el archivo recién subido se borra: un objeto que no
      referencia nadie es basura que no vuelve a mirar nunca.
    · La bitácora se escribe después de que la escritura haya ido bien.

  Lo que NO copia: aquí el archivo no se sustituye nunca. Cada recurso es una
  pieza con su propia clave, como la galería de un comercio. Cambiar la imagen
  del héroe es subir otra y apagar la anterior, no pisarla — así se puede
  volver atrás sin tener el archivo a mano.
*/

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import { borrarObjeto, rutaDesdeUrlPublica, subirImagen } from '@/lib/imagenes/subir'
import {
  BUCKET_RECURSOS_SITIO,
  claveGaleria,
  rutaRecursoSitio,
} from '@/lib/imagenes/rutas'
import { LIMITE_RECURSOS_SITIO } from '@/lib/imagenes/validacion'
import type { EstadoSubida } from '@/lib/imagenes/estado'
import { esUbicacionRecurso, validarEnlaceRecurso } from '@/lib/sitio/recursos'
import type { UbicacionRecurso } from '@/lib/supabase/database.types'

const SIN_PERMISO = 'No tienes permiso para realizar esta acción.'

/** Mismo criterio que `exigirSuperAdmin` de `planes/actions.ts`. No se relaja. */
async function actorSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') return null
  return actor.userId
}

/**
 * La landing entra aquí igual que el panel: publicar un cartel que no se ve
 * hasta que caduque la caché es indistinguible de que no funcione.
 *
 * `/` se revalida siempre, aunque la ubicación sea `logo` o `general` y no se
 * pinte en ninguna parte. Un `revalidatePath` de más cuesta una regeneración;
 * uno de menos cuesta que el administrador vuelva a subir la imagen creyendo
 * que la primera vez falló.
 */
function refrescar(): void {
  revalidatePath('/admin/recursos')
  revalidatePath('/')
}

function leerUbicacion(formData: FormData): UbicacionRecurso | null {
  const valor = String(formData.get('ubicacion') ?? '')
  return esUbicacionRecurso(valor) ? valor : null
}

/** Texto alternativo. Vacío = decorativa, nunca el nombre del archivo. */
function leerDescripcion(formData: FormData): string | null {
  return String(formData.get('descripcion') ?? '').trim() || null
}

function leerOrden(formData: FormData): number {
  const n = Number(formData.get('orden'))
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

/* ==========================================================================
   SUBIR
   ========================================================================== */

export async function subirRecurso(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const ubicacion = leerUbicacion(formData)
  if (!ubicacion) return { error: 'Ubicación del recurso no válida.' }

  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) {
    return {
      error: 'Ponle un nombre. Es lo que vas a leer en esta lista dentro de seis meses.',
    }
  }

  const enlace = validarEnlaceRecurso(String(formData.get('enlace_url') ?? ''))
  if (!enlace.ok) return { error: enlace.error }

  const admin = createAdminClient()

  const clave = claveGaleria(Date.now(), Math.random())

  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_RECURSOS_SITIO,
    ruta: (ext) => rutaRecursoSitio(ubicacion, clave, ext),
    limite: LIMITE_RECURSOS_SITIO,
  })
  if (!resultado.ok) return { error: resultado.error }

  const { error } = await admin.from('recursos_sitio').insert({
    ubicacion,
    titulo,
    descripcion: leerDescripcion(formData),
    url: resultado.url,
    enlace_url: enlace.enlace,
    orden: leerOrden(formData),
    // El interruptor del formulario. Sin marcar, el recurso queda guardado y
    // apagado: subir no es publicar.
    visible: formData.get('visible') === 'on',
    creado_por: actorId,
  })

  if (error) {
    await borrarObjeto(admin, BUCKET_RECURSOS_SITIO, resultado.ruta)
    return { error: `No se pudo guardar el recurso: ${error.message}` }
  }

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'recurso_sitio',
    entidadId: null,
    campo: 'url',
    urlAnterior: null,
    urlNueva: resultado.url,
    contexto: { ubicacion, titulo },
  })

  refrescar()
  return { ok: true, url: resultado.url }
}

/* ==========================================================================
   EDITAR  ·  nombre, texto alternativo, enlace y orden
   --------------------------------------------------------------------------
   Acción sin estado (`void`) porque va en un `<form>` llano: funciona sin
   JavaScript y `revalidatePath` repinta la lista. El archivo no se toca —
   para cambiar la imagen se sube otra.
   ========================================================================== */

export async function actualizarRecurso(formData: FormData): Promise<void> {
  if (!(await actorSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id < 1) return

  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) return

  const enlace = validarEnlaceRecurso(String(formData.get('enlace_url') ?? ''))
  // Un enlace inválido deja el resto de los campos sin guardar, a propósito:
  // guardar el nombre y descartar el enlace en silencio es peor que no guardar
  // nada, porque parece que funcionó.
  if (!enlace.ok) return

  const admin = createAdminClient()
  await admin
    .from('recursos_sitio')
    .update({
      titulo,
      descripcion: leerDescripcion(formData),
      enlace_url: enlace.enlace,
      orden: leerOrden(formData),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  refrescar()
}

/* ==========================================================================
   PUBLICAR / RETIRAR
   ========================================================================== */

/** El interruptor de «se ve en la página». Lo mueve `AccionEstado`. */
export async function cambiarVisibilidadRecurso(formData: FormData): Promise<void> {
  if (!(await actorSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const visible = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) return

  const admin = createAdminClient()
  await admin
    .from('recursos_sitio')
    .update({ visible, updated_at: new Date().toISOString() })
    .eq('id', id)

  refrescar()
}

/* ==========================================================================
   BORRAR
   ========================================================================== */

/**
 * Borra el recurso de verdad: la fila y, si el archivo es nuestro, el objeto
 * de Storage.
 *
 * Sin `deleted_at` y sin papelera, al revés que comercios o miembros. Un
 * comercio dado de baja sigue apareciendo en ventas de hace un año; un cartel
 * de promoción no lo referencia nada, y una biblioteca de imágenes que
 * acumula borrados invisibles deja de servir para lo único que sirve —ver de
 * un vistazo lo que hay alojado—.
 */
export async function borrarRecurso(formData: FormData): Promise<void> {
  const actorId = await actorSuperAdmin()
  if (!actorId) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id < 1) return

  const admin = createAdminClient()

  const { data: fila } = await admin
    .from('recursos_sitio')
    .select('id, url, ubicacion, titulo')
    .eq('id', id)
    .maybeSingle()
  if (!fila) return

  const { error } = await admin.from('recursos_sitio').delete().eq('id', id)
  if (error) return

  // Solo si el archivo es nuestro. `rutaDesdeUrlPublica` devuelve `null` para
  // una URL externa, y una URL externa no se toca: no es nuestra.
  const ruta = rutaDesdeUrlPublica(fila.url, BUCKET_RECURSOS_SITIO)
  if (ruta) await borrarObjeto(admin, BUCKET_RECURSOS_SITIO, ruta)

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'recurso_sitio',
    entidadId: null,
    campo: 'url',
    urlAnterior: fila.url,
    urlNueva: null,
    contexto: { ubicacion: fila.ubicacion, titulo: fila.titulo },
  })

  refrescar()
}
