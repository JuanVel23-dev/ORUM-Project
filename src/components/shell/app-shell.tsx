'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ChevronDown, KeyRound, LogOut, Search, UserPlus } from 'lucide-react'
import {
  BotonInstalar,
  EntradaInstalar,
  GuiaInstalacionIOS,
} from '@/components/pwa/instalar-app'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogoOrum } from '@/components/ui/marca/marca'
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Sheet } from '@/components/ui/sheet'
import { ToastProvider } from '@/components/ui/toast'
import { SPRING_MOVE, prefiereMovimientoReducido } from '@/lib/shared/motion'
import type { RolCodigo } from '@/lib/supabase/database.types'
import escaparate from '@/app/(publico)/escaparate.module.css'
import cromo from '@/app/miembros/(portal)/portal.module.css'
import { TeclaPaleta } from './atajos'
import { CommandPalette, useAtajoPaleta } from './command-palette'
import {
  esRutaActiva,
  navegacionPara,
  tabsPara,
  type NavGroup,
  type NavItem,
} from './nav-config'
import styles from './app-shell.module.css'

/*
  EL PANEL DE ADMINISTRACIÓN  ·  rediseño del 04/10/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «un rediseño total, con el mismo estilo que el
  portal inicial, comercios y miembros, pero muy administrativo, conservando
  la comodidad para trabajar y los atajos. No quiero la imagen inicial:
  quiero una barra de opciones».

  Así que el panel es la cuarta cara de la fachada, sin su foto:

    · LA CABECERA NEGRA de los otros portales —logotipo en plata, el
      buscador (la paleta de comandos), «Registrar miembro» en oro y la
      cuenta—. No es fija: se va al desplazar, y deja sitio al trabajo.
    · LA BARRA DE OPCIONES, negra, justo debajo: donde los otros portales
      ponen la foto, aquí van todas las secciones a la vista, en sus grupos.
      ESA sí se queda pegada arriba: la navegación siempre a un clic. La
      sección activa la dicen el filo dorado, el peso y `aria-current`.
    · EL CONTENIDO, sobre blanco y con la paleta de la fachada (importada del
      cromo de miembros, como hace comercios: es el mismo por construcción).
    · EN EL TELÉFONO, la barra inferior en la zona del pulgar —ahora negra,
      como el resto del cromo— y la hoja «Más».

  SIEMPRE EN CLARO (`data-theme="light"`), como los otros tres portales. El
  selector de tema se retiró con la barra lateral.

  POR QUÉ LA CABECERA NO LLEVA `data-theme="dark"`: el menú de la cuenta es
  un popover que se pinta DENTRO de ella, y un popover hereda las propiedades
  de sus ancestros del DOM. Con la cabecera en oscuro, el menú salía negro.
  Así que la cabecera se pinta de negro con los tokens de la franja
  (`--cacao-*`) y solo los controles del sistema que viven en ella van en el
  ámbito `sobreFoto` de la fachada — la misma solución que la cabecera
  pública.
*/

export type ShellUser = {
  nombre: string
  email: string | null
  rolNombre: string
  rolCodigo: RolCodigo
}

type Props = {
  user: ShellUser
  /** Server action de cierre de sesión, inyectada desde el layout. */
  cerrarSesion: () => void | Promise<void>
  /** Fuente de resultados de la paleta. Solo se sustituye en `/dev/shell`. */
  buscar?: ComponentProps<typeof CommandPalette>['buscar']
  /**
   * La sección que se da por activa. Solo en `/dev/shell`: allí no hay ruta
   * de `/admin` (exige sesión) y sin esto no se vería el filo de la activa.
   */
  rutaSimulada?: string
  children: ReactNode
}

export function AppShell({ user, cerrarSesion, buscar, rutaSimulada, children }: Props) {
  const rutaReal = usePathname()
  const pathname = rutaSimulada ?? rutaReal
  const [paleta, setPaleta] = useState(false)
  const [mas, setMas] = useState(false)
  const [guiaIOS, setGuiaIOS] = useState(false)
  const formCerrarSesion = useRef<HTMLFormElement>(null)

  const abrirPaleta = useCallback(() => setPaleta(true), [])
  useAtajoPaleta(abrirPaleta)

  const grupos = navegacionPara(user.rolCodigo)
  const tabs = tabsPara(user.rolCodigo)

  // Destinos que no caben en la barra inferior: van a la hoja "Más".
  const enTabs = new Set(
    tabs.filter((t) => t.kind === 'link').map((t) => (t as NavItem).href),
  )
  const extras = grupos
    .flatMap((g) => g.items)
    .filter((item) => !enTabs.has(item.href))

  return (
    // El provider envuelve todo el panel: cualquier pantalla puede confirmar
    // una acción con un toast sin montar su propio contenedor.
    <ToastProvider>
      <div className={[cromo.portal, styles.panel].join(' ')} data-theme="light">
        {/* ── LA CABECERA ─────────────────────────────────────────────── */}
        <header className={styles.cabecera}>
          <Link href="/admin" className={styles.marca} aria-label="ORUM, ir al inicio del panel">
            {/* Sobre negro, plata (CLAUDE.md → «sobre negro, plata»). */}
            <LogoOrum variante="plata" className={styles.logo} preload />
            <span className={styles.marcaPanel} aria-hidden="true">
              Panel
            </span>
          </Link>

          <BotonBuscar onClick={abrirPaleta} />

          <div className={styles.acciones}>
            {/* El flujo estrella, a un clic desde cualquier pantalla. En el
                teléfono queda solo el icono; el nombre lo dice `aria-label`. */}
            <div className={escaparate.sobreFoto}>
              <Button
                href="/admin/miembros/nuevo"
                variant="brand"
                size="sm"
                pildora
                icon={<UserPlus size={15} aria-hidden="true" />}
                aria-label="Registrar miembro y vender membresía"
                className={styles.registrar}
              >
                <span className={styles.registrarTexto}>Registrar miembro</span>
              </Button>
            </div>

            {/* La cuenta. En el teléfono vive en la hoja «Más»: aquí sería
                la misma acción listada dos veces en la misma pantalla. */}
            <div className={styles.cuenta}>
              <DropdownMenu
                align="end"
                trigger={
                  <button type="button" className={styles.cuentaBoton} aria-label="Cuenta y sesión">
                    <Avatar nombre={user.nombre} size="sm" brand decorativo />
                    <span className={styles.cuentaTextos}>
                      <span className={styles.cuentaNombre}>{user.email ?? user.nombre}</span>
                      <span className={styles.cuentaRol}>{user.rolNombre}</span>
                    </span>
                    <ChevronDown size={15} aria-hidden="true" className={styles.cuentaFlecha} />
                  </button>
                }
              >
                <div className={styles.menuCabecera}>
                  <span className={styles.menuCorreo}>{user.email ?? user.nombre}</span>
                  <span className={styles.menuRol}>{user.rolNombre}</span>
                </div>

                <MenuItem href="/admin/cuenta/password" icon={<KeyRound size={16} />}>
                  Mi contraseña
                </MenuItem>

                {/* Acceso PERMANENTE a la instalación de la app. */}
                <BotonInstalar onPedirGuiaIOS={() => setGuiaIOS(true)} />

                <MenuSeparator />

                <MenuItem
                  destructive
                  icon={<LogOut size={16} />}
                  onSelect={() => {
                    // La server action se dispara desde un formulario oculto:
                    // un `MenuItem` es un botón y no puede enviar otro formulario.
                    formCerrarSesion.current?.requestSubmit()
                  }}
                >
                  Cerrar sesión
                </MenuItem>
              </DropdownMenu>
              <form ref={formCerrarSesion} action={cerrarSesion} hidden />
            </div>
          </div>
        </header>

        {/* ── LA BARRA DE OPCIONES ────────────────────────────────────── */}
        <BarraOpciones grupos={grupos} pathname={pathname} />

        <main className={styles.main}>{children}</main>

        <TabBar
          tabs={tabs}
          pathname={pathname}
          onBuscar={abrirPaleta}
          onMas={() => setMas(true)}
        />

        <Sheet open={mas} onClose={() => setMas(false)} title="Más opciones">
          <nav className={styles.masLista} aria-label="Más secciones">
            {extras.map((item) => {
              const activo = esRutaActiva(item, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.masItem}
                  data-activo={activo}
                  /* Esta hoja es la ÚNICA puerta a estos destinos en el
                     teléfono: el destino actual lo dicen el filo y
                     `aria-current`, nunca un relleno solo. */
                  aria-current={activo ? 'page' : undefined}
                  onClick={() => setMas(false)}
                >
                  <item.icon className={styles.masItemIcono} aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}

            {/*
              En el teléfono el menú de la cuenta no se pinta, así que esta
              hoja es la ÚNICA puerta a la cuenta. Se lista aquí a mano, no a
              través de `navegacionPara`.
            */}
            <Link
              href="/admin/cuenta/password"
              className={styles.masItem}
              data-activo={pathname.startsWith('/admin/cuenta/password')}
              onClick={() => setMas(false)}
            >
              <KeyRound className={styles.masItemIcono} aria-hidden="true" />
              Mi contraseña
            </Link>

            <EntradaInstalar
              className={styles.masItem}
              iconClassName={styles.masItemIcono}
              onInstalar={() => setMas(false)}
              onPedirGuiaIOS={() => {
                // Una hoja se va, la otra llega: no se apilan.
                setMas(false)
                setGuiaIOS(true)
              }}
            />
          </nav>

          <form action={cerrarSesion} className={styles.masSalir}>
            <Button type="submit" variant="secondary" pildora fullWidth icon={<LogOut size={16} />}>
              Cerrar sesión
            </Button>
          </form>
        </Sheet>

        {/*
          HERMANA de la hoja "Más", no hija. Un `<dialog>` cerrado es
          `display: none` y arrastra a sus descendientes: si la guía viviera
          dentro, cerrar "Más" para mostrarla la ocultaría con ella.
        */}
        <GuiaInstalacionIOS abierta={guiaIOS} onCerrar={() => setGuiaIOS(false)} />

        <CommandPalette
          open={paleta}
          onClose={() => setPaleta(false)}
          rol={user.rolCodigo}
          buscar={buscar}
        />
      </div>
    </ToastProvider>
  )
}

/* ========================================================================== */

/**
 * El disparador de la paleta. Es un botón, pero se lee como el buscador de
 * la fachada: una píldora con la lupa, el texto en tono de marcador y el
 * atajo a la derecha.
 */
function BotonBuscar({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.buscar} onClick={onClick} aria-keyshortcuts="Control+K Meta+K /">
      <Search size={17} aria-hidden="true" className={styles.buscarIcono} />
      <span className={styles.buscarTexto}>Buscar un miembro o una acción…</span>
      <TeclaPaleta className={styles.atajo} />
    </button>
  )
}

/* ========================================================================== */

/**
 * La barra de opciones: todas las secciones a la vista, en sus grupos. El
 * destino activo lleva un filo dorado que SE DESLIZA de uno a otro (`layoutId`
 * compartido), para no perder de dónde venía la selección.
 */
function BarraOpciones({ grupos, pathname }: { grupos: NavGroup[]; pathname: string }) {
  const transicion = prefiereMovimientoReducido() ? { duration: 0 } : SPRING_MOVE

  return (
    <nav className={styles.opciones} aria-label="Secciones del panel">
      <div className={styles.opcionesFila}>
        {grupos.map((grupo, i) => (
          <div
            key={grupo.label ?? i}
            className={styles.grupo}
            role="group"
            aria-label={grupo.label ?? 'Principal'}
          >
            {grupo.items.map((item) => {
              const activo = esRutaActiva(item, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.opcion}
                  data-activo={activo}
                  aria-current={activo ? 'page' : undefined}
                >
                  {activo && (
                    <motion.span
                      layoutId="opcion-activa"
                      className={styles.opcionFilo}
                      transition={transicion}
                    />
                  )}
                  <item.icon className={styles.opcionIcono} aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}

/* ========================================================================== */

function TabBar({
  tabs,
  pathname,
  onBuscar,
  onMas,
}: {
  tabs: ReturnType<typeof tabsPara>
  pathname: string
  onBuscar: () => void
  onMas: () => void
}) {
  const transicion = prefiereMovimientoReducido() ? { duration: 0 } : SPRING_MOVE

  return (
    <nav className={styles.tabbar} aria-label="Navegación">
      {tabs.map((tab) => {
        if (tab.kind === 'link') {
          const activo = esRutaActiva(tab, pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={styles.tab}
              data-activo={activo}
              aria-current={activo ? 'page' : undefined}
            >
              {activo && (
                <motion.span
                  layoutId="tab-indicador"
                  className={styles.tabIndicador}
                  transition={transicion}
                />
              )}
              <tab.icon className={styles.tabIcono} aria-hidden="true" />
              {tab.label}
            </Link>
          )
        }

        const alPulsar = tab.kind === 'search' ? onBuscar : onMas
        return (
          <button key={tab.kind} type="button" className={styles.tab} onClick={alPulsar}>
            <tab.icon className={styles.tabIcono} aria-hidden="true" />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
