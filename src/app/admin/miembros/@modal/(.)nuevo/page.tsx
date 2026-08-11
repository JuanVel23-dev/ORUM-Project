import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { MiembroForm } from '../../miembro-form'

/**
 * Registrar miembro, interceptado.
 *
 * Al llegar desde la lista se abre encima; al entrar por enlace directo se
 * sirve la página completa de `../../nuevo`. La lógica y el formulario son
 * los mismos: aquí solo cambia el envoltorio.
 *
 * `detent="large"`: son diez campos, y según la HIG el detent medio no aporta
 * cuando el contenido solo es útil a pantalla completa.
 */
export default async function NuevoMiembroInterceptado() {
  await requireRol('super_admin', 'empleado')

  const admin = createAdminClient()
  const [{ data: ciudades }, { data: planes }] = await Promise.all([
    admin.from('ciudades').select('id, nombre').order('nombre'),
    admin
      .from('planes_membresia')
      .select('id, nombre, precio')
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre'),
  ])

  return (
    <OverlayRuta
      title="Registrar miembro"
      description="Crea el cliente, su cuenta de acceso y su primera membresía en un solo paso."
      width="680px"
      detent="large"
    >
      {/* Sin `FormCard`: dentro de un overlay la superficie ya la pone el
          propio overlay. Los formularios no ponen la suya nunca. */}
      <MiembroForm ciudades={ciudades ?? []} planes={planes ?? []} />
    </OverlayRuta>
  )
}
