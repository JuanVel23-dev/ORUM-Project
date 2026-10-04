import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { horaBogota, hoyISO, saludoPorHora, sumarDiasISO } from '@/lib/shared/fecha'
import { DIAS_POR_VENCER, InicioPanel } from './_components/inicio-panel'

export const metadata = { title: 'Inicio · ORUM' }

/*
  LA PORTADA DEL PANEL  ·  rediseño del 04/10/2026
  ---------------------------------------------------------------------------
  Aquí solo los DATOS; lo que se pinta es `InicioPanel`, que no consulta nada
  (así `/dev/shell` puede enseñarla con cifras falsas, sin sesión).
*/

/**
 * Cifras del panel.
 *
 * Se consultan con `count: 'exact', head: true`: la base de datos devuelve
 * solo el número, sin traer ninguna fila.
 *
 * "Membresías vigentes" filtra por `estado = 'activa'` **y** `fecha_fin >= hoy`,
 * la misma regla que aplica `derivarEstadoMembresia`. Contar solo por `estado`
 * daría un número inflado, porque esa columna no se actualiza al vencer. Las
 * «por vencer» son las vigentes cuyo `fecha_fin` cae en los próximos 30 días.
 */
async function obtenerCifras() {
  const admin = createAdminClient()
  const hoy = hoyISO()
  const limite = sumarDiasISO(hoy, DIAS_POR_VENCER)

  const [miembros, vigentes, porVencer, comercios] = await Promise.all([
    admin
      .from('miembros')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    admin
      .from('membresias')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activa')
      .gte('fecha_fin', hoy),
    admin
      .from('membresias')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activa')
      .gte('fecha_fin', hoy)
      .lte('fecha_fin', limite),
    admin
      .from('comercios')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)
      .is('deleted_at', null),
  ])

  return {
    miembros: miembros.count ?? 0,
    vigentes: vigentes.count ?? 0,
    porVencer: porVencer.count ?? 0,
    comercios: comercios.count ?? 0,
  }
}

/** «sábado 4 de octubre», en la zona del negocio. */
function fechaLarga(instante: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(instante)
}

export default async function AdminInicioPage() {
  const perfil = await requireRol('super_admin', 'empleado')
  const cifras = await obtenerCifras()
  const ahora = new Date()

  return (
    <InicioPanel
      esSuperAdmin={perfil.rolCodigo === 'super_admin'}
      cifras={cifras}
      bajada={`${saludoPorHora(horaBogota(ahora))}. Hoy es ${fechaLarga(ahora)}; tu sesión es de ${perfil.rolNombre.toLowerCase()}.`}
    />
  )
}
