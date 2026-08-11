import { Clock } from 'lucide-react'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import styles from './inactiva.module.css'

export const metadata = { title: 'Membresía inactiva · ORUM' }

export default async function MembresiaInactivaPage() {
  await requireRolMiembro()

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_soporte')
    .maybeSingle()

  return (
    <div className={styles.centro}>
      <Card padding="lg">
        <div className={styles.icono} aria-hidden>
          <Clock size={26} />
        </div>

        <h1 className={styles.titulo}>Tu membresía no está activa</h1>

        <p className={styles.texto}>
          No encontramos una membresía vigente asociada a tu cuenta. Si crees que es un error o
          quieres renovarla, escríbenos y lo resolvemos.
        </p>

        {/*
          Sin salida esta pantalla es un callejón: el miembro ve el problema y
          no tiene forma de resolverlo. El botón de soporte ES la pantalla.
        */}
        {config?.valor && (
          <div className={styles.acciones}>
            <WhatsAppButton
              telefono={config.valor}
              mensaje="Hola, quiero reactivar mi membresía ORUM."
              variant="primary"
            >
              Reactivar mi membresía
            </WhatsAppButton>
          </div>
        )}
      </Card>
    </div>
  )
}
