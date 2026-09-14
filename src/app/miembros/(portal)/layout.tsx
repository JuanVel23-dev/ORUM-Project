import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogOut, MessageCircle } from 'lucide-react'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { cerrarSesionMiembro } from '../login/actions'
import { MenuTema } from './_components/menu-tema'
import { PortalNav, PortalTabBar } from './_components/portal-nav'
import { TransicionesDeRuta } from '@/components/ui/transiciones-ruta'
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

        {/*
          La cabecera se queda con el wordmark, la navegación de escritorio y
          UNA sola puerta: el avatar.

          Salieron dos cosas. El botón de WhatsApp, porque la misma acción ya
          estaba dentro del menú y `CLAUDE.md` condena listarla dos veces en la
          misma pantalla. Y el conmutador de tema, que competía con las dos
          únicas pestañas que importan; baja al menú, donde Apple lo entierra.
          El corolario de la norma —"al sacar algo, comprueba el móvil"— está
          cubierto: la cabecera y el avatar se renderizan a todos los anchos,
          así que el destino no desaparece del teléfono.
        */}
        <div className={styles.acciones}>
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

              {/*
                El único componente de cliente del cromo. No es un
                `SegmentedControl`: sus radios, dentro de este `<form>`, hacían
                que Enter cerrase la sesión. El porqué completo, en el archivo.
              */}
              <MenuTema />

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

      {/*
        Uno por portal, con un único escuchador delegado. Es quien llama a
        `document.startViewTransition`: escribir el `view-transition-name` no
        anima nada por sí solo, y en Next 16.2.11 nadie más lo dispara.
      */}
      <TransicionesDeRuta />

      <main className={styles.main}>{children}</main>

      <PortalTabBar />
    </div>
  )
}
