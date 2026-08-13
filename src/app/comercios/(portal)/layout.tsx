import Link from 'next/link'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import { cerrarSesionComercio } from '../login/actions'
import { Row } from '@/components/ui'

export const metadata = { title: 'Portal de Comercios · ORUM' }

export default async function ComerciosLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRolComercio()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Row
        gap="1.5rem"
        style={{
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--orum-border)',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/comercios" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
          ORUM
        </Link>

        <Row gap="1rem" style={{ flex: 1 }}>
          <Link href="/comercios">Verificar membresía</Link>
        </Row>

        <span className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {perfil.email}
        </span>
        <form action={cerrarSesionComercio}>
          <button type="submit" className="orum-button orum-button--secondary">
            Cerrar sesión
          </button>
        </form>
      </Row>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
