import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'

export const metadata = {
  title: 'Panel · ORUM',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Solo super_admin y empleado pueden entrar al portal administrativo.
  const perfil = await requireRol('super_admin', 'empleado')
  const esSuperAdmin = perfil.rolCodigo === 'super_admin'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--orum-border)',
        }}
      >
        <Link href="/admin" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
          ORUM
        </Link>

        <nav style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <Link href="/admin">Inicio</Link>
          <Link href="/admin/miembros">Miembros</Link>
          {esSuperAdmin && <Link href="/admin/usuarios">Usuarios</Link>}
          {esSuperAdmin && <Link href="/admin/planes">Planes</Link>}
          <Link href="/admin/cuenta/password">Mi contraseña</Link>
        </nav>

        <span className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {perfil.email} · {perfil.rolNombre}
        </span>
        <form action={cerrarSesion}>
          <button type="submit" className="orum-button orum-button--secondary">
            Cerrar sesión
          </button>
        </form>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
