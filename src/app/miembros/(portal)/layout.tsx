import Link from 'next/link'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { cerrarSesionMiembro } from '../login/actions'
import { createClient } from '@/lib/supabase/server'
import { Row, WhatsAppButton } from '@/components/ui'

export const metadata = { title: 'Portal de Miembros · ORUM' }

export default async function MiembrosLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRolMiembro()

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_soporte')
    .maybeSingle()

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
        <Link href="/miembros" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
          ORUM
        </Link>

        <Row gap="1rem" style={{ flex: 1 }}>
          <Link href="/miembros">Inicio</Link>
          <Link href="/miembros/perfil">Mi perfil</Link>
        </Row>

        {config?.valor && (
          <WhatsAppButton telefono={config.valor} mensaje="Hola, necesito ayuda con mi membresía ORUM." />
        )}

        <span className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {perfil.email}
        </span>
        <form action={cerrarSesionMiembro}>
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
