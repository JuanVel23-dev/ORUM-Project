import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { UsuarioForm } from './usuario-form'

export const metadata = { title: 'Crear usuario · ORUM' }

export default async function NuevoUsuarioPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const [{ data: marcas }, { data: categorias }] = await Promise.all([
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin/usuarios" className="orum-muted" style={{ fontSize: '0.9rem' }}>
        ← Volver a usuarios
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 1.25rem' }}>
        Crear usuario
      </h1>

      <UsuarioForm marcas={marcas ?? []} categorias={categorias ?? []} />
    </div>
  )
}
