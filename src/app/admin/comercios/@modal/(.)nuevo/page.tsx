import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { ComercioForm } from '../../comercio-form'

export default async function NuevoComercioInterceptado() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const [{ data: marcas }, { data: categorias }] = await Promise.all([
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])

  return (
    <OverlayRuta
      title="Crear comercio"
      description="Se crea el comercio y su cuenta de acceso a la herramienta de ventas."
      width="640px"
    >
      <ComercioForm marcas={marcas ?? []} categorias={categorias ?? []} />
    </OverlayRuta>
  )
}