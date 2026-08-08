import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
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

  let correo = '—'
  if (comercio.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(comercio.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar comercio</h1>
      <EditarComercioForm comercio={{ ...comercio, correo }} marcas={marcas ?? []} categorias={categorias ?? []} />
    </div>
  )
}
