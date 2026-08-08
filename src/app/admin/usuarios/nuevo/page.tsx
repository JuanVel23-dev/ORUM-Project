import { requireRol } from '@/lib/auth/auth'
import { UsuarioForm } from './_components/usuario-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Crear usuario · ORUM' }

export default async function NuevoUsuarioPage() {
  await requireRol('super_admin')

  return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader title="Crear usuario" />
      <UsuarioForm />
    </div>
  )
}
