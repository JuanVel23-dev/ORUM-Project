'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useCallback, useId, useRef, type ReactElement, type ReactNode } from 'react'
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

/*
  Qué cuenta como opción navegable con flechas. Incluye `menuitemradio` porque
  una opción de un grupo excluyente —el tema— sigue siendo una fila del menú:
  si el selector solo mirase `menuitem`, las flechas la saltarían y el foco
  inicial al abrir caería en otra parte.
*/
const SELECTOR_OPCIONES =
  '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)'

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
    menuRef.current?.querySelector<HTMLElement>(SELECTOR_OPCIONES)?.focus()
  }

  /** Navegación con flechas, Inicio y Fin dentro del menú. */
  const alPulsarTecla = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const opciones = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(SELECTOR_OPCIONES) ?? [],
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

  /*
    ⚠️ NADA DE `cloneElement` AQUÍ, y esto es un bug pagado, no una preferencia.

    `trigger` y los hijos de este menú los crea casi siempre un SERVER
    COMPONENT —el layout del portal, el del panel, el de comercios— y viajan
    hasta aquí por la frontera RSC. Un elemento que ha cruzado esa frontera
    llega serializado: su `type` es una referencia perezosa al módulo de
    cliente, no la función. `cloneElement` sobre eso devuelve un elemento cuyo
    tipo React no sabe resolver, y el resultado es

      «Element type is invalid: expected a string … but got: undefined»

    …con un rastro que Next oculta entero (`at ignore-listed frames`), en la
    petición del servidor, y por tanto un 500 en CUALQUIER pantalla que monte
    este menú. Tipaba, compilaba, pasaba lint y pasaba `next build`, porque el
    fallo solo existe al renderizar con datos reales.

    El atributo se pone sobre el nodo ya montado, con una ref de callback. La
    ref hace dos trabajos —guardar el nodo para `colocar()` y estampar el
    atributo— porque son el mismo momento y separarlos daría dos refs sobre el
    mismo elemento.
  */
  const anclarDisparador = useCallback(
    (nodo: HTMLSpanElement | null) => {
      disparadorRef.current = nodo
      const boton = nodo?.firstElementChild
      if (boton instanceof HTMLElement) boton.setAttribute('popovertarget', id)
    },
    [id],
  )

  return (
    <>
      <span ref={anclarDisparador} className={styles.disparador}>
        {trigger}
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
        {/*
          Los hijos se pintan TAL CUAL. El retardo escalonado lo resuelve
          `menu.module.css` con `nth-child`, por la misma razón que el
          disparador no se clona: estos hijos también cruzan la frontera RSC
          —`MenuItem`, `MenuSeparator`, `MenuTema` los monta el layout del
          servidor— y clonarlos rompía el menú entero.

          Además es lo que ya hace `layout.module.css` para `Stack` y `Grid`:
          escalonar con `nth-child` funciona con cualquier hijo sin tocarlo.
        */}
        {children}
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
  /**
   * Opción elegida dentro de un grupo excluyente (el tema, por ejemplo).
   *
   * Cuando se pasa —incluso `false`— el elemento deja de ser `menuitem` y pasa
   * a `menuitemradio` con `aria-checked`: es lo que le dice al lector de
   * pantalla que hay una elección y cuál está activa. El check visible es el
   * segundo portador; sin él la única señal sería el estado ARIA, invisible.
   */
  selected?: boolean
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
  selected,
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

  const excluyente = selected !== undefined

  const contenido = (
    <>
      {icon && <span className={styles.itemIcono}>{icon}</span>}
      {children}
      {/* Decorativo: quien lo necesita ya lo tiene en `aria-checked`. */}
      {selected && (
        <span className={styles.itemMarca} aria-hidden="true">
          <Check size={15} />
        </span>
      )}
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
      role={excluyente ? 'menuitemradio' : 'menuitem'}
      aria-checked={excluyente ? selected : undefined}
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

/**
 * Encabezado de un grupo de opciones.
 *
 * El `id` es opcional y existe para poder referenciarlo desde el
 * `aria-labelledby` de un `role="group"`: así el lector anuncia "Tema, Claro,
 * marcado" en vez de solo "Claro, marcado", sin repetir el texto en un
 * `aria-label` que podría desincronizarse del visible.
 */
export function MenuLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} className={styles.etiquetaGrupo}>
      {children}
    </div>
  )
}
