import { requireRol } from '@/lib/auth'
import { UsuarioForm } from './usuario-form'

export const metadata = { title: 'Crear usuario · ORUM' }

export default async function NuevoUsuarioPage() {
  await requireRol('super_admin')

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        Crear usuario
      </h1>
      <UsuarioForm />
    </div>
  )
}
