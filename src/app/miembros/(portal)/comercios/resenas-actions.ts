'use server'

/*
  EL SOCIO ESCRIBE, EDITA Y BORRA SU RESEÑA DE UN COMERCIO
  ---------------------------------------------------------------------------
  Las dos acciones escriben con la `service_role` (la tabla no admite
  escrituras de la sesión del navegador), así que lo que aquí se comprueba
  ES la política:

    · El socio sale SIEMPRE de la sesión, nunca del formulario. Si viniera
      del cliente, cualquiera podría escribir o borrar la reseña de otro
      enviando otro id.
    · El comercio sí llega del formulario: se valida como entero positivo y
      se comprueba que exista y siga en el club. El trigger
      `fn_validar_resena` vuelve a exigirlo, junto con la compra previa y la
      membresía vigente: si esta acción se escribiera mal, la base seguiría
      siendo la barrera.

  Borrar NO exige membresía vigente (spec: «el socio con membresía vencida no
  puede crear ni editar, pero sí borrar la suya»), así que resuelve al socio
  por su perfil, como «Mi foto».
*/

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireMiembroVigente, requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { revisarEstrellas, revisarMensaje, type ResenaState } from '@/lib/resenas/resenas'
import { leerComercioId, traducirErrorResena } from '@/lib/resenas/acciones'

const SIN_COMERCIO = 'No encontramos este comercio.'

/** Crea la reseña del socio en el comercio, o la reemplaza si ya tenía una. */
export async function guardarResena(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  // Primero quién: sin sesión de socio vigente no se lee nada más (redirige).
  const miembro = await requireMiembroVigente()

  const comercioId = leerComercioId(formData.get('comercio_id'))
  if (comercioId === null) return { error: SIN_COMERCIO }

  const estrellas = revisarEstrellas(formData.get('estrellas'))
  if (!estrellas.ok) return { error: estrellas.error }

  const crudo = formData.get('mensaje')
  const mensaje = revisarMensaje(typeof crudo === 'string' ? crudo : '')
  if (!mensaje.ok) return { error: mensaje.error }

  const admin = createAdminClient()

  const { data: comercio, error: errorComercio } = await admin
    .from('comercios')
    .select('id')
    .eq('id', comercioId)
    .eq('activo', true)
    .is('deleted_at', null)
    .maybeSingle()
  if (errorComercio) {
    console.error('[resenas] guardarResena (comercio):', errorComercio)
    return { error: traducirErrorResena(errorComercio) }
  }
  if (!comercio) return { error: SIN_COMERCIO }

  // Una por socio y comercio: editar es reemplazar estrellas y mensaje. Las
  // respuestas no van en la carga, así que el upsert las conserva.
  const { error } = await admin.from('resenas').upsert(
    {
      comercio_id: comercioId,
      miembro_id: miembro.id,
      estrellas: estrellas.estrellas,
      mensaje: mensaje.mensaje,
    },
    { onConflict: 'comercio_id,miembro_id' },
  )

  if (error) {
    console.error('[resenas] guardarResena:', error)
    return { error: traducirErrorResena(error) }
  }

  revalidatePath('/miembros/comercios/' + comercioId)
  return { ok: true }
}

/** Borra la reseña del socio de la sesión en ese comercio (borrado real). */
export async function borrarMiResena(
  _prev: ResenaState,
  formData: FormData,
): Promise<ResenaState> {
  // Socio con sesión, vigente o no: borrar lo suyo no es un beneficio.
  const perfil = await requireRolMiembro()

  const comercioId = leerComercioId(formData.get('comercio_id'))
  if (comercioId === null) return { error: SIN_COMERCIO }

  const admin = createAdminClient()

  const { data: miembro, error: errorMiembro } = await admin
    .from('miembros')
    .select('id')
    .eq('perfil_id', perfil.userId)
    .is('deleted_at', null)
    .maybeSingle()
  if (errorMiembro) console.error('[resenas] borrarMiResena (miembro):', errorMiembro)
  if (!miembro) return { error: 'No encontramos tu ficha de socio.' }

  // Los dos filtros a la vez: solo puede caer la fila de ESTE socio.
  const { error } = await admin
    .from('resenas')
    .delete()
    .eq('comercio_id', comercioId)
    .eq('miembro_id', miembro.id)

  if (error) {
    console.error('[resenas] borrarMiResena:', error)
    return { error: 'No pudimos borrar tu reseña. Inténtalo de nuevo.' }
  }

  // Si no había nada que borrar (doble pulsación, otra pestaña), el resultado
  // que el socio quería ya es cierto: no es un error.
  revalidatePath('/miembros/comercios/' + comercioId)
  return { ok: true }
}
