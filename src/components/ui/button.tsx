import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './spinner'
import styles from './button.module.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'brand'
  | 'gold'
export type ButtonSize = 'sm' | 'md' | 'lg'

type Base = {
  /**
   * `primary` es TINTA (negro en claro, blanco en oscuro).
   *
   * `brand` es la acción ceremonial: relleno dorado PLANO (`--action-gold`)
   * con texto en tinta, 5,40:1. Habilitada en el recorrido del cliente y en
   * las seis pantallas de acceso; dentro del panel y de la herramienta de
   * comercios el primario sigue siendo tinta. Una sola por pantalla: si el
   * oro aparece en todas partes deja de significar algo.
   *
   * `gold` es el barrido metálico (`--gold-sheen`) y NO admite texto encima:
   * en tema claro el barrido baja hasta #5c4b25, que da 2,34:1 contra la
   * tinta y reprueba WCAG 1.4.3 en el 62% del recorrido del botón. Sirve
   * para superficies sin texto —filos, wordmark con `background-clip`, la
   * barra de `ProgressBar`—. Para un botón con etiqueta, usa `brand`.
   */
  variant?: ButtonVariant
  size?: ButtonSize
  /** Muestra el spinner sin que el botón cambie de ancho. */
  loading?: boolean
  /** Botón cuadrado de solo icono. Exige `aria-label`. */
  iconOnly?: boolean
  fullWidth?: boolean
  /** Icono a la izquierda del texto. */
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

type ComoBoton = Base &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Base> & { href?: undefined }

type ComoEnlace = Base &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Base> & { href: string }

export type ButtonProps = ComoBoton | ComoEnlace

function clases(
  variant: ButtonVariant,
  size: ButtonSize,
  iconOnly: boolean,
  fullWidth: boolean,
  extra?: string,
) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly && styles.iconOnly,
    fullWidth && styles.fullWidth,
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Botón del sistema.
 *
 * Con `href` renderiza un `<Link>` de Next con el mismo aspecto, para no tener
 * que duplicar clases en los enlaces que se ven como botón.
 *
 * No lleva `'use client'`: no usa hooks, así que puede renderizarse tanto en
 * Server Components como en Client Components.
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    iconOnly = false,
    fullWidth = false,
    icon,
    children,
    className,
    ...resto
  } = props

  const contenido = (
    <>
      <span className={styles.contenido} data-cargando={loading}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className={styles.cargador}>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} label={null} />
        </span>
      )}
    </>
  )

  const nombreClase = clases(variant, size, iconOnly, fullWidth, className)

  if (typeof resto.href === 'string') {
    const { href, ...propsEnlace } = resto as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string
    }
    return (
      <Link
        href={href}
        className={nombreClase}
        // Un enlace no puede deshabilitarse de verdad: se marca para
        // lectores de pantalla y se bloquea la navegación con CSS.
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
        {...propsEnlace}
      >
        {contenido}
      </Link>
    )
  }

  const propsBoton = resto as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button
      type={propsBoton.type ?? 'button'}
      className={nombreClase}
      disabled={propsBoton.disabled || loading}
      aria-busy={loading || undefined}
      {...propsBoton}
    >
      {contenido}
    </button>
  )
}
