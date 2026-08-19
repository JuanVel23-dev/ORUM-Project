'use client'

import Link from 'next/link'
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import styles from './menu.module.css'

/*
  Construido sobre la API nativa de popover. Aporta capa superior (el menú no
  lo recorta el overflow de una fila de tabla), cierre al pulsar fuera y
  cierre con Escape, sin librería de posicionamiento ni gestión de z-index.

  Lo único que queda por hacer a mano es colocar el menú y navegarlo con el
  teclado.
*/

const MARGEN = 6 // separación entre disparador y menú, en px
const BORDE = 8 // margen mínimo respecto al borde de la ventana

type DropdownMenuProps = {
  /** Elemento que abre el menú. Recibe los atributos de popover. */
  trigger: ReactElement<Record<string, unknown>>
  /** Alineación horizontal respecto al disparador. */
  align?: 'start' | 'end'
  children: ReactNode
}

export function DropdownMenu({ trigger, align = 'end', children }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const disparadorRef = useRef<HTMLSpanElement>(null)
  const id = useId()

  /** Coloca el menú y ancla el origen de la animación en el disparador. */
  const colocar = useCallback(() => {
    const menu = menuRef.current
    const ancla = disparadorRef.current?.firstElementChild as HTMLElement | undefined
    if (!menu || !ancla) return

    const r = ancla.getBoundingClientRect()
    const { offsetWidth: ancho, offsetHeight: alto } = menu
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Vertical: debajo por defecto; arriba si abajo no cabe y arriba sí.
    const cabeDebajo = r.bottom + MARGEN + alto <= vh - BORDE
    const cabeArriba = r.top - MARGEN - alto >= BORDE
    const arriba = !cabeDebajo && cabeArriba

    const top = arriba ? r.top - MARGEN - alto : r.bottom + MARGEN

    // Horizontal: alineado al borde pedido, corrigiendo si se sale.
    let left = align === 'end' ? r.right - ancho : r.left
    left = Math.min(Math.max(BORDE, left), vw - ancho - BORDE)

    menu.style.top = `${Math.min(Math.max(BORDE, top), vh - alto - BORDE)}px`
    menu.style.left = `${left}px`

    // El menú escala desde la esquina del botón que lo abrió, no desde su
    // propio centro: así se ve de dónde salió.
    const origenX = align === 'end' ? `${r.right - left}px` : `${r.left - left}px`
    menu.style.transformOrigin = `${origenX} ${arriba ? 'bottom' : 'top'}`
    menu.style.setProperty('--desplazamiento-entrada', arriba ? '4px' : '-4px')
  }, [align])

  const alAlternar = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const evento = e.nativeEvent as ToggleEvent
    if (evento.newState !== 'open') return

    colocar()
    // Enfocar el primer elemento deja el menú listo para el teclado.
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus()
  }

  /** Navegación con flechas, Inicio y Fin dentro del menú. */
  const alPulsarTecla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const opciones = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    )
    if (opciones.length === 0) return

    const actual = opciones.indexOf(document.activeElement as HTMLElement)
    let siguiente: number | null = null

    if (e.key === 'ArrowDown') siguiente = (actual + 1) % opciones.length
    else if (e.key === 'ArrowUp')
      siguiente = (actual - 1 + opciones.length) % opciones.length
    else if (e.key === 'Home') siguiente = 0
    else if (e.key === 'End') siguiente = opciones.length - 1

    if (siguiente !== null) {
      e.preventDefault()
      opciones[siguiente].focus()
    }
  }

  return (
    <>
      <span ref={disparadorRef} className={styles.disparador}>
        {cloneElement(trigger, { popoverTarget: id })}
      </span>

      <div
        ref={menuRef}
        id={id}
        popover="auto"
        className={styles.menu}
        role="menu"
        onToggle={alAlternar}
        onKeyDown={alPulsarTecla}
      >
        {/* El índice alimenta el retardo escalonado de la animación de entrada. */}
        {Children.map(children, (hijo, i) =>
          isValidElement(hijo)
            ? cloneElement(hijo as ReactElement<{ style?: CSSProperties }>, {
                style: { '--indice': i } as CSSProperties,
              })
            : hijo,
        )}
      </div>
    </>
  )
}

/* ========================================================================== */

type MenuItemProps = {
  onSelect?: () => void
  /**
   * Navega en lugar de ejecutar. Renderiza un `<Link>` real: un `<a>` dentro
   * de un `<button>` sería HTML inválido y no navegaría.
   */
  href?: string
  /**
   * Envía el `<form>` que contiene al menú en lugar de ejecutar `onSelect`.
   * Para server actions —cerrar sesión, por ejemplo—: así la acción sigue
   * funcionando sin JavaScript, que es justo cuando más importa poder salir.
   */
  submit?: boolean
  icon?: ReactNode
  /** Rojo. Reserva `true` para acciones que borran o revocan. */
  destructive?: boolean
  disabled?: boolean
  children: ReactNode
}

export function MenuItem({
  onSelect,
  href,
  submit = false,
  icon,
  destructive = false,
  disabled = false,
  children,
}: MenuItemProps) {
  const clase = [styles.item, destructive && styles.destructivo]
    .filter(Boolean)
    .join(' ')

  /** Cierra el popover contenedor sin necesidad de estado en React. */
  const cerrarMenu = (elemento: HTMLElement) => {
    elemento.closest<HTMLElement>('[popover]')?.hidePopover()
  }

  const contenido = (
    <>
      {icon && <span className={styles.itemIcono}>{icon}</span>}
      {children}
    </>
  )

  if (href && !disabled) {
    return (
      <Link
        href={href}
        role="menuitem"
        className={clase}
        onClick={(e) => cerrarMenu(e.currentTarget)}
      >
        {contenido}
      </Link>
    )
  }

  return (
    <button
      type={submit ? 'submit' : 'button'}
      role="menuitem"
      className={clase}
      disabled={disabled}
      onClick={(e) => {
        onSelect?.()
        cerrarMenu(e.currentTarget)
      }}
    >
      {contenido}
    </button>
  )
}

export function MenuSeparator() {
  return <hr className={styles.separador} />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className={styles.etiquetaGrupo}>{children}</div>
}
