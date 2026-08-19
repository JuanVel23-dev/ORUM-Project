import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogOut, MessageCircle } from 'lucide-react'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { cerrarSesionMiembro } from '../login/actions'
import { PortalNav, PortalTabBar } from './_components/portal-nav'
import styles from './portal.module.css'

export const metadata = { title: 'Portal de Miembros · ORUM' }

const MENSAJE_SOPORTE = 'Hola, necesito ayuda con mi membresía ORUM.'

export default async function MiembrosLayout({ children }: { children: ReactNode }) {
  const perfil = await requireRolMiembro()

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_soporte')
    .maybeSingle()

  const soporte = config?.valor ?? null
  /* Supabase puede devolver una cuenta sin correo (acceso solo por teléfono);
     el avatar necesita algo de lo que sacar una inicial en ese caso. */
  const correo = perfil.email ?? 'Mi cuenta'

  return (
    <div className={styles.portal}>
      <header className={styles.cabecera}>
        <Link href="/miembros" className={styles.marca}>
          ORUM
        </Link>

        <PortalNav />

        <div className={styles.acciones}>
          {soporte && (
            <span className={styles.soporteEscritorio}>
              <WhatsAppButton telefono={soporte} mensaje={MENSAJE_SOPORTE} size="sm" />
            </span>
          )}

          <ThemeToggle />

          {/*
            El formulario envuelve el menú, no al revés: así el elemento
            "Cerrar sesión" es un submit real dentro de él y la server action
            se dispara aunque no haya JavaScript.
          */}
          <form action={cerrarSesionMiembro}>
            <DropdownMenu
              trigger={
                <button type="button" aria-label="Mi cuenta">
                  <Avatar nombre={correo} size="sm" decorativo />
                </button>
              }
            >
              <p className={styles.correoMenu}>{correo}</p>

              <MenuSeparator />

              {soporte && (
                <MenuItem
                  href={`https://wa.me/${soporte.replace(/\D/g, '')}?text=${encodeURIComponent(MENSAJE_SOPORTE)}`}
                  icon={<MessageCircle size={16} />}
                >
                  Soporte por WhatsApp
                </MenuItem>
              )}

              <MenuItem submit icon={<LogOut size={16} />}>
                Cerrar sesión
              </MenuItem>
            </DropdownMenu>
          </form>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <PortalTabBar />
    </div>
  )
}
