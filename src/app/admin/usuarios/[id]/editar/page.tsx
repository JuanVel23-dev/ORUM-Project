import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarForm } from './editar-form'

export const metadata = { title: 'Editar usuario · ORUM' }

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id: perfilId } = await params

  const admin = createAdminClient()

  const [{ data: empleado }, { data: comercio }, { data: authUser }] = await Promise.all([
    admin
      .from('empleados')
      .select('nombres, apellidos, cedula, telefono')
      .eq('perfil_id', perfilId)
      .maybeSingle(),
    admin
      .from('comercios')
      .select('nombre, descripcion')
      .eq('perfil_id', perfilId)
      .maybeSingle(),
    admin.auth.admin.getUserById(perfilId),
  ])

  if (!empleado && !comercio) notFound()

  const email = authUser?.user?.email ?? ''
  const esComercio = Boolean(comercio)

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin/usuarios" className="orum-muted" style={{ fontSize: '0.9rem' }}>
        ← Volver a usuarios
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 1.25rem' }}>
        Editar usuario
      </h1>

      <EditarForm
        perfilId={perfilId}
        esComercio={esComercio}
        email={email}
        empleado={empleado}
        comercio={comercio}
      />
    </div>
  )
}
