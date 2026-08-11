import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { EditarComercioForm } from './_components/editar-comercio-form'

export const metadata = { title: 'Editar comercio · ORUM' }

export default async function EditarComercioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: comercio }, { data: marcas }, { data: categorias }] = await Promise.all([
    admin
      .from('comercios')
      .select('id, perfil_id, nombre, descripcion, marca_id, categoria_id, logo_url')
      .eq('id', comercioId)
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])
  if (!comercio) notFound()

  // Cadena vacía y no '—': el valor va directo a un campo de formulario, y un
  // guión se enviaría como si fuera un correo real.
  let correo = ''
  if (comercio.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(comercio.perfil_id)
    correo = authUser.user?.email ?? ''
  }

  return (
    <>
      <PageHeader title="Editar comercio" description={comercio.nombre} />
      <FormCard>
        <EditarComercioForm
          comercio={{ ...comercio, correo }}
          marcas={marcas ?? []}
          categorias={categorias ?? []}
        />
      </FormCard>
    </>
  )
}
