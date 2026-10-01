import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogOut, Receipt } from 'lucide-react'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { obtenerDatosCarnet } from '@/lib/miembros/datos-carnet'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LogoOrum } from '@/components/ui/marca/marca'
import { PieSitio } from '@/components/pie/pie-sitio'
import { WhatsAppFlotante } from '@/components/ui/whatsapp-flotante'
import { TransicionesDeRuta } from '@/components/ui/transiciones-ruta'
import escaparate from '@/app/(publico)/escaparate.module.css'
import { cerrarSesionMiembro } from '../login/actions'
import { BotonCarnet, ProveedorCarnet, VentanaCarnet } from './_components/boton-carnet'
import { PortalNav } from './_components/portal-nav'
import styles from './portal.module.css'

export const metadata = { title: 'Portal de Miembros · ORUM' }

const MENSAJE_SOPORTE = 'Hola, necesito ayuda con mi membresía ORUM.'

/*
  EL CROMO DEL PORTAL DE MIEMBROS  ·  el del Portal Público (29/09/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: el portal tiene que ser igual que `/explorar`. La
  cabecera es la de la fachada —fija, negra fundida a transparente, montada
  sobre la foto del banner— con lo del socio:

    · Navegación: Inicio y Comercios.
    · «Carnet»: abre el carnet encima de la página; tocar el QR lo amplía
      (`BotonCarnet`). La foto del socio ya NO está en la cabecera: aparece
      únicamente dentro del carnet.
    · «Cerrar sesión»: un submit real, funciona sin JavaScript.

  Sin barra inferior en móvil: la cabecera ya lleva el carnet a la vista.

  La ranura `@modal` vive AQUÍ y solo aquí: una ruta interceptada solo
  intercepta si el layout que declara su ranura ya está montado.
*/
export default async function MiembrosLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) {
  const perfil = await requireRolMiembro()
  const supabase = await createClient()

  /* En paralelo: son independientes, y el cromo se renderiza en cada
     pantalla del portal. Sin membresía vigente `carnet` es `null` y no hay
     botón (el layout también envuelve `/miembros/inactiva`). */
  const [{ data: config }, carnet] = await Promise.all([
    supabase.from('configuracion').select('valor').eq('clave', 'whatsapp_soporte').maybeSingle(),
    obtenerDatosCarnet(perfil.userId),
  ])
  const soporte = config?.valor ?? null

  return (
    /*
      `data-theme="light"`: el portal siempre en claro, como la fachada. La
      cabecera fija su propio `data-theme="dark"`.
    */
    <ProveedorCarnet>
    <div className={styles.portal} data-theme="light">
      <header className={styles.cabecera} data-theme="dark">
        <Link href="/miembros" className={styles.marca} aria-label="ORUM, ir al inicio del portal">
          {/* Sobre la cabecera negra, plata (CLAUDE.md → «sobre negro, plata»). */}
          <LogoOrum variante="plata" className={styles.logo} preload />
        </Link>

        <PortalNav />

        {/* `sobreFoto`: el mismo ámbito que usa la cabecera pública para que
            las píldoras de contorno se lean sobre negro. */}
        <div className={[styles.acciones, escaparate.sobreFoto].join(' ')}>
          {carnet && <BotonCarnet />}

          {/* Solo en móvil: desde 768px la navegación ya trae «Movimientos».
              Solo icono; el nombre accesible lo dice `aria-label`. */}
          <Button
            href="/miembros/movimientos"
            variant="secondary"
            size="sm"
            pildora
            className={styles.soloMovil}
            icon={<Receipt size={15} aria-hidden="true" />}
            aria-label="Mis movimientos"
          />

          <form action={cerrarSesionMiembro}>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              pildora
              icon={<LogOut size={15} aria-hidden="true" />}
              aria-label="Cerrar sesión"
            >
              {/* En un teléfono estrecho queda solo el icono: el nombre
                  accesible lo sigue diciendo `aria-label`. */}
              <span className={styles.textoCerrar}>Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Uno por portal: es quien llama a `document.startViewTransition`. */}
      <TransicionesDeRuta />

      <main className={styles.main}>{children}</main>

      {/* El pie del Portal Público, completo, en todas las páginas. */}
      <PieSitio soporte={soporte} mensajeSoporte={MENSAJE_SOPORTE} className={styles.pie} />

      {modal}

      <WhatsAppFlotante telefono={soporte} mensaje={MENSAJE_SOPORTE} />

      {/*
        LA VENTANA DEL CARNET, FUERA DE LA CABECERA: un `<dialog>` hereda las
        propiedades de sus ancestros del DOM, y dentro de la cabecera negra
        salía oscura. Aquí hereda el claro del portal (el carnet pinta su negro).
      */}
      {carnet && <VentanaCarnet datos={carnet} />}
    </div>
    </ProveedorCarnet>
  )
}
