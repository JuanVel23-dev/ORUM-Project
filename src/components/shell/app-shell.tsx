'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { KeyRound, LogOut, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { BotonInstalar, InstalarApp } from '@/components/pwa/instalar-app'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Sheet } from '@/components/ui/sheet'
import { ToastProvider } from '@/components/ui/toast'
import { SPRING_MOVE, prefiereMovimientoReducido } from '@/lib/shared/motion'
import type { RolCodigo } from '@/lib/supabase/database.types'
import { usePreferenciaLocal } from '@/components/use-preferencia-local'
import { CommandPalette, useAtajoPaleta } from './command-palette'
import {
  esRutaActiva,
  navegacionPara,
  tabsPara,
  type NavGroup,
  type NavItem,
} from './nav-config'
import styles from './app-shell.module.css'

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
  children: ReactNode
}

export function AppShell({ user, cerrarSesion, buscar, children }: Props) {
  const pathname = usePathname()
  const [colapsada, setColapsada] = usePreferenciaLocal('orum-sidebar-colapsada', false)
  const [paleta, setPaleta] = useState(false)
  const [mas, setMas] = useState(false)

  useAtajoPaleta(() => setPaleta(true))

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
      <div
        className={styles.shell}
        /*
          El ancho va como variable EN LÍNEA, heredada por la barra y por el
          padding de la columna. La versión anterior lo intentaba con
          `.shell[data-colapsada='true'] .sidebar { width }` y esa regla nunca
          llegaba a aplicarse, por más que el atributo y el selector fueran
          correctos. Con la variable no hay selector que pueda fallar.
        */
        style={
          {
            '--ancho-lateral': colapsada
              ? 'var(--sidebar-w-rail)'
              : 'var(--sidebar-w)',
          } as CSSProperties
        }
      >
      <Sidebar
        grupos={grupos}
        pathname={pathname}
        user={user}
        colapsada={colapsada}
        onColapsar={() => setColapsada(!colapsada)}
        cerrarSesion={cerrarSesion}
      />

      <div className={styles.columna}>
        <header className={styles.topbar}>
          <Link href="/admin" className={styles.marcaMovil}>
            <span className={styles.wordmark}>ORUM</span>
          </Link>

          <div className={styles.buscador}>
            <BotonBuscar onClick={() => setPaleta(true)} />
          </div>

          <div className={styles.topbarAcciones}>
            <div className={styles.themeToggleEscritorio}>
              <ThemeToggle />
            </div>
            <Avatar nombre={user.nombre} size="sm" brand />
          </div>
        </header>

        <main className={styles.main}>
          <InstalarApp />
          {children}
        </main>
      </div>

      <TabBar
        tabs={tabs}
        pathname={pathname}
        onBuscar={() => setPaleta(true)}
        onMas={() => setMas(true)}
      />

      <Sheet open={mas} onClose={() => setMas(false)} title="Más opciones">
        <nav className={styles.masLista}>
          {extras.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.masItem}
              data-activo={esRutaActiva(item, pathname)}
              onClick={() => setMas(false)}
            >
              <item.icon className={styles.masItemIcono} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'var(--space-5)' }}>
          <ThemeToggle compactOnMobile={false} />
        </div>

        <form action={cerrarSesion} style={{ marginTop: 'var(--space-4)' }}>
          <Button type="submit" variant="secondary" fullWidth icon={<LogOut size={16} />}>
            Cerrar sesión
          </Button>
        </form>
      </Sheet>

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

function BotonBuscar({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      fullWidth
      onClick={onClick}
      icon={<Search size={16} />}
      style={{ justifyContent: 'flex-start', color: 'var(--text-3)', fontWeight: 400 }}
    >
      Buscar miembro, comercio o acción…
    </Button>
  )
}

/* ========================================================================== */

function Sidebar({
  grupos,
  pathname,
  user,
  colapsada,
  onColapsar,
  cerrarSesion,
}: {
  grupos: NavGroup[]
  pathname: string
  user: ShellUser
  colapsada: boolean
  onColapsar: () => void
  cerrarSesion: () => void | Promise<void>
}) {
  const formCerrarSesion = useRef<HTMLFormElement>(null)

  return (
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.marca}>
        <span className={`${styles.wordmark} ${styles.marcaTexto}`}>ORUM</span>
        {colapsada && <span className={styles.wordmark}>O</span>}
      </Link>

      <nav className={styles.nav} aria-label="Navegación principal">
        {grupos.map((grupo, i) => (
          <div key={grupo.label ?? i} className={styles.grupo}>
            {grupo.label && <span className={styles.grupoTitulo}>{grupo.label}</span>}

            {grupo.items.map((item) => {
              const activo = esRutaActiva(item, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.item}
                  data-activo={activo}
                  aria-current={activo ? 'page' : undefined}
                  title={colapsada ? item.label : undefined}
                >
                  {activo && (
                    // `layoutId` compartido: al cambiar de ruta, motion
                    // interpola el indicador desde su posición anterior en
                    // lugar de hacerlo desaparecer y reaparecer.
                    <motion.span
                      layoutId="nav-indicador"
                      className={styles.indicador}
                      transition={
                        prefiereMovimientoReducido()
                          ? { duration: 0 }
                          : SPRING_MOVE
                      }
                    />
                  )}
                  <item.icon className={styles.itemIcono} aria-hidden="true" />
                  <span className={styles.itemTexto}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={styles.piesidebar}>
        {/*
          Un solo control en lugar de tres. El avatar abre el menú con el
          correo, el rol y las acciones de sesión: así el pie cabe en los 72px
          del rail sin desbordarse, y deja de haber botones compitiendo.
        */}
        <DropdownMenu
          align="start"
          trigger={
            <button
              type="button"
              className={styles.perfilBoton}
              aria-label="Cuenta y sesión"
            >
              <Avatar nombre={user.nombre} size="sm" brand decorativo />
              <span className={styles.piePerfil}>
                <span className={styles.pieNombre}>{user.email ?? user.nombre}</span>
                <span className={styles.pieRol}>{user.rolNombre}</span>
              </span>
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

          {/*
            Acceso PERMANENTE a la instalación. El banner de la parte superior
            se puede descartar, y una vez descartado no había forma de volver
            a encontrarla. Aquí siempre está.
          */}
          <BotonInstalar />

          <MenuSeparator />

          <MenuItem
            destructive
            icon={<LogOut size={16} />}
            onSelect={() => {
              // La server action se dispara desde un formulario oculto: un
              // `MenuItem` es un botón y no puede enviar otro formulario.
              formCerrarSesion.current?.requestSubmit()
            }}
          >
            Cerrar sesión
          </MenuItem>
        </DropdownMenu>

        <form ref={formCerrarSesion} action={cerrarSesion} hidden />

        <button
          type="button"
          className={styles.colapsar}
          onClick={onColapsar}
          aria-label={colapsada ? 'Expandir menú' : 'Contraer menú'}
          title={colapsada ? 'Expandir menú' : 'Contraer menú'}
        >
          {colapsada ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
    </aside>
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
