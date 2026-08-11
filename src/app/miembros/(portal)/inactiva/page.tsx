import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'

export const metadata = { title: 'Membresía inactiva · ORUM' }

export default async function MembresiaInactivaPage() {
  await requireRolMiembro()

  return (
    <div className="orum-card" style={{ textAlign: 'center', maxWidth: 480, margin: '3rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Tu membresía no está activa
      </h1>
      <p className="orum-muted" style={{ marginBottom: '1.25rem' }}>
        No encontramos una membresía vigente asociada a tu cuenta. Si crees que esto es un error,
        o quieres renovarla, contáctanos por WhatsApp.
      </p>
    </div>
  )
}
