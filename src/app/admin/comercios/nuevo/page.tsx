import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { ComercioForm } from '../_components/comercio-form'

export const metadata = { title: 'Crear comercio · ORUM' }

export default async function NuevoComercioPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const [{ data: marcas }, { data: categorias }] = await Promise.all([
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])

  return (
    <>
      <PageHeader
        title="Crear comercio"
        description="Se crea el comercio y su cuenta de acceso a la herramienta de ventas."
      />
      <FormCard><ComercioForm marcas={marcas ?? []} categorias={categorias ?? []} /></FormCard>
    </>
  )
}
