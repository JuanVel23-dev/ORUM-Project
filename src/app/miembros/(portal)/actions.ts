'use server'

import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { esIdComercioValido } from '@/lib/miembros/favoritos'

/*
  FAVORITOS DEL SOCIO  ·  encargo nº 3
  ---------------------------------------------------------------------------
  Nota de frontera (`SCOPE.md §5`): las server actions son zona de SOLO LECTURA
  para los agentes. Este archivo se crea porque el encargo lo pide de forma
  explícita y porque favoritos no tiene ninguna acción previa a la que
  acoplarse — no se está tocando ni una línea de las doce acciones auditadas por
  la tanda OWASP. Queda anotado en el reporte para que una persona lo revise.

  Las tres reglas que gobiernan este archivo:

  1. VERIFICACIÓN DE ROL AL ENTRAR. `requireMiembroVigente()` es lo primero que
     se ejecuta, antes de leer el argumento. Una server action es un endpoint
     HTTP con nombre adivinable: que solo se invoque desde un botón del portal
     no es una garantía de nada.

  2. EL `miembro_id` NO VIENE DEL CLIENTE, y la firma no ofrece el hueco. Sale
     de la sesión. La política RLS de `favoritos` lo comprueba igual —cada socio
     ve y escribe solo los suyos—, pero una acción que ACEPTA un `miembroId`
     invita a que alguien lo pase desde el navegador, y entonces la seguridad
     depende de que nadie se equivoque al llamarla.

  3. NO REVALIDA LA RUTA. Ver la nota larga al final de `alternarFavorito`.
*/

export type ResultadoFavorito =
  | { ok: true; favorito: boolean }
  | { ok: false; mensaje: string }

/**
 * Marca o desmarca un comercio como favorito del socio de la sesión.
 *
 * `favorito` es el estado DESEADO, no un "invierte lo que haya". Es lo que hace
 * la acción idempotente: dos toques rápidos, una recarga a medias o un reintento
 * tras un fallo de red terminan en el mismo sitio, y el corazón no puede quedar
 * al revés de lo que el socio ve.
 */
export async function alternarFavorito(
  comercioId: number,
  favorito: boolean,
): Promise<ResultadoFavorito> {
  /* Rol + membresía vigente, antes de mirar los argumentos. Si no hay sesión de
     miembro, esto redirige y no se ejecuta nada más. */
  const miembro = await requireMiembroVigente()

  if (!esIdComercioValido(comercioId)) {
    return { ok: false, mensaje: 'Comercio no válido.' }
  }

  const supabase = await createClient()

  if (favorito) {
    /*
      `upsert` y no `insert`: la clave primaria es (miembro_id, comercio_id), así
      que un segundo toque sobre un favorito ya guardado —dos pestañas, un doble
      toque, un reintento— daría violación de unicidad y el corazón se revertiría
      delante del socio ENSEÑÁNDOLE UN ERROR POR HABER ACERTADO.

      `ignoreDuplicates` deja la fila original intacta: `created_at` es lo que
      ordena "Tus favoritos" (lo último marcado, primero) y reescribirlo
      reordenaría la estantería sin que el socio haya hecho nada.
    */
    const { error } = await supabase
      .from('favoritos')
      .upsert(
        { miembro_id: miembro.id, comercio_id: comercioId },
        { onConflict: 'miembro_id,comercio_id', ignoreDuplicates: true },
      )

    if (error) {
      console.error('[alternarFavorito] No se pudo guardar el favorito:', error)
      return { ok: false, mensaje: 'No se pudo guardar.' }
    }

    return { ok: true, favorito: true }
  }

  /* El `eq` sobre `miembro_id` es redundante con la política RLS y se escribe
     igual: si algún día la política se relaja, el borrado no se convierte en
     silencio en "bórralo para todos". Defensa en profundidad, no desconfianza
     de la base. */
  const { error } = await supabase
    .from('favoritos')
    .delete()
    .eq('miembro_id', miembro.id)
    .eq('comercio_id', comercioId)

  if (error) {
    console.error('[alternarFavorito] No se pudo quitar el favorito:', error)
    return { ok: false, mensaje: 'No se pudo quitar.' }
  }

  return { ok: true, favorito: false }

  /*
    POR QUÉ NO HAY `revalidatePath('/miembros')` AQUÍ.

    El catálogo es una pantalla cara: entre diccionarios, comercios,
    promociones, sucursales y las dos funciones de agregación son del orden de
    diez consultas. `revalidatePath` obligaría a rehacerlas ENTERAS en cada toque
    de corazón, y el corazón es justo el control que invita a tocarlo varias
    veces seguidas.

    No hace falta: la pantalla es dinámica —depende de cookies, así que no se
    cachea—, y Next 16 no reutiliza segmentos dinámicos entre navegaciones. La
    siguiente vez que el socio entre al catálogo, los datos son frescos. Entre
    tanto, el estado visible lo sostiene la actualización optimista del cliente,
    que es además lo que el encargo pide: el corazón se llena en el acto.

    Lo que SÍ queda pendiente de comprobar en navegador: que la estantería "Tus
    favoritos" refleje el cambio al volver de la ficha de un comercio.
  */
}
