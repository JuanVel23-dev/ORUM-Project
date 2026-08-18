import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { cerrarSesionComercio } from '../login/actions'
import styles from './portal.module.css'

export const metadata = { title: 'Portal de Comercios · ORUM' }

export default async function ComerciosLayout({ children }: { children: ReactNode }) {
  const perfil = await requireRolComercio()

  const supabase = await createClient()
  const { data: comercio } = await supabase
    .from('comercios')
    .select('nombre')
    .eq('perfil_id', perfil.userId)
    .maybeSingle()

  const correo = perfil.email ?? 'Mi cuenta'

  return (
    <div className={styles.portal}>
      <header className={styles.cabecera}>
        <Link href="/comercios" className={styles.marca}>
          ORUM
        </Link>

        {comercio?.nombre && <span className={styles.comercio}>{comercio.nombre}</span>}

        <div className={styles.acciones}>
          <ThemeToggle />

          {/*
            El formulario envuelve el menú: así "Cerrar sesión" es un submit
            real dentro de él y la server action se dispara aunque no haya
            JavaScript. En una caja, poder salir siempre importa.
          */}
          <form action={cerrarSesionComercio}>
            <DropdownMenu
              trigger={
                <button type="button" aria-label="Mi cuenta">
                  <Avatar nombre={comercio?.nombre ?? correo} size="sm" decorativo />
                </button>
              }
            >
              <p className={styles.correoMenu}>{correo}</p>

              <MenuSeparator />

              <MenuItem submit destructive icon={<LogOut size={16} />}>
                Cerrar sesión
              </MenuItem>
            </DropdownMenu>
          </form>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  )
}
