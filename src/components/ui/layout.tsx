import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import styles from './layout.module.css'

/** Pasos de la rejilla de 4pt. Ningún espaciado fuera de esta escala. */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

const gapVar = (step: SpaceStep) => `var(--space-${step})`

/* --- Stack ---------------------------------------------------------------- */

type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'column'
  gap?: SpaceStep
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: boolean
  /**
 * Entrada escalonada de los hijos directos (§4.2 de la dirección de arte):
 * 35 ms entre piezas, con tope de 8.
 *
 * Opcional a propósito. Escalonar una lista que el usuario ya tenía delante
 * —tras filtrar, tras paginar— vuelve a hacerle esperar por algo que ya
 * había leído, y eso se percibe como lentitud, no como elegancia. Úsalo en
 * la primera pintura de una rejilla, no en cada actualización.
 */
  escalonado?: boolean
  children: ReactNode
}

/** Apilado con espaciado tokenizado. Evita `margin` suelto entre hermanos. */
export function Stack({
  direction = 'column',
  gap = 4,
  align,
  justify,
  wrap = false,
  escalonado = false,
  className,
  style,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={[
        styles.stack,
        wrap && styles.wrap,
        escalonado && styles.escalonado,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--direccion': direction,
          '--gap': gapVar(gap),
          ...(align && { '--alinear': align }),
          ...(justify && { '--justificar': justify }),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

/* --- Grid ----------------------------------------------------------------- */

type GridProps = HTMLAttributes<HTMLDivElement> & {
  /** Ancho mínimo de columna. La rejilla se adapta sola, sin media queries. */
  min?: string
  gap?: SpaceStep
  /**
 * Entrada escalonada de los hijos directos (§4.2 de la dirección de arte):
 * 35 ms entre piezas, con tope de 8.
 *
 * Opcional a propósito. Escalonar una lista que el usuario ya tenía delante
 * —tras filtrar, tras paginar— vuelve a hacerle esperar por algo que ya
 * había leído, y eso se percibe como lentitud, no como elegancia. Úsalo en
 * la primera pintura de una rejilla, no en cada actualización.
 */
  escalonado?: boolean
  children: ReactNode
}

export function Grid({
  min = '240px',
  gap = 4,
  escalonado = false,
  className,
  style,
  children,
  ...props
}: GridProps) {
  return (
    <div
      className={[styles.grid, escalonado && styles.escalonado, className]
        .filter(Boolean)
        .join(' ')}
      style={{ '--min': min, '--gap': gapVar(gap), ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  )
}

/* --- Divider -------------------------------------------------------------- */

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={[styles.divider, className].filter(Boolean).join(' ')} />
  }

  return (
    <div
      className={[styles.dividerConTexto, className].filter(Boolean).join(' ')}
      role="separator"
    >
      {label}
    </div>
  )
}

/* --- Section -------------------------------------------------------------- */

/**
 * El TONO de una sección: la herramienta que abre la dirección de arte v4 §1.
 *
 * Alternar `papel` y `crema` divide una pantalla larga SIN DIBUJAR UNA SOLA
 * LÍNEA. Es lo que resuelve el encargo del propietario sobre los espacios
 * vacíos de escritorio: el vacío no sobraba, le faltaba estructura.
 *
 * - `papel`  sin fondo. El valor por defecto, y el que debe seguir siendo
 *            mayoría: si todo es una franja, no hay franjas.
 * - `crema`  1,04:1 contra el papel. Separa sin trazo. Admite los tres pesos
 *            de tinta y el oro de texto.
 * - `honda`  más tinte. Es superficie de RELLENO: NO lleva `--text-3` ni oro
 *            de texto (4,18:1 y 4,21:1, reprueban AA). Ver `tokens.css` §1.
 * - `cacao`  la franja oscura, y el ÚNICO sitio donde vive el oro de display.
 *            No sigue al tema: es cacao en claro y en oscuro. Su contenido
 *            hereda `--text`/`--text-2`/`--text-3` ya remapeados a los tonos
 *            que sí contrastan sobre cacao, así que un `<Card>` dentro no hay
 *            que vestirlo a mano.
 *
 * ⚠️ La franja NO SANGRA hasta el borde del viewport: es una superficie
 * redondeada dentro del ancho de contenido. El sangrado completo depende del
 * relleno del contenedor de cada portal y lo decide la página, no este
 * componente.
 */
export type SectionTono = 'papel' | 'crema' | 'honda' | 'cacao'

type SectionProps = {
  /** Encabezado en mayúsculas pequeñas: agrupa sin competir con el título. */
  title?: string
  actions?: ReactNode
  gap?: SpaceStep
  /** Superficie tonal de la franja. Ver `SectionTono`. */
  tono?: SectionTono
  className?: string
  children: ReactNode
}

const TONOS: Record<SectionTono, string | false> = {
  papel: false,
  crema: styles.tonoCrema,
  honda: styles.tonoHonda,
  cacao: styles.tonoCacao,
}

export function Section({
  title,
  actions,
  gap = 4,
  tono = 'papel',
  className,
  children,
}: SectionProps) {
  return (
    <section
      className={[styles.section, TONOS[tono], className].filter(Boolean).join(' ')}
      style={{ '--gap': gapVar(gap) } as CSSProperties}
    >
      {(title || actions) && (
        <div className={styles.sectionCabecera}>
          {title && <h2 className={styles.sectionTitulo}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/* --- PageHeader ----------------------------------------------------------- */

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Acción primaria de la pantalla. En móvil pasa a ocupar todo el ancho. */
  actions?: ReactNode
  /**
   * El `h1` en el SERIF DE DISPLAY, a 44–72px (v4 §3).
   *
   * ⛔ NO en Administración ni en la Herramienta de Comercios. Son pantallas
   * de trabajo, y por eso esto es opt-in y no el valor por defecto: si el
   * serif colgara de `.t-display-*`, el panel se lo llevaría entero sin que
   * nadie lo pidiera.
   *
   * Su sitio es el recibimiento del socio y las seis puertas de acceso — donde
   * el titular ES el contenido, no una etiqueta encima de una tabla.
   */
  display?: boolean
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  display = false,
  className,
}: PageHeaderProps) {
  return (
    <header className={[styles.pageHeader, className].filter(Boolean).join(' ')}>
      <div className={styles.pageTextos}>
        <h1 className={[styles.pageTitulo, display && styles.pageTituloDisplay]
          .filter(Boolean)
          .join(' ')}
        >
          {title}
        </h1>
        {description && <p className={styles.pageDescripcion}>{description}</p>}
      </div>
      {actions && <div className={styles.pageAcciones}>{actions}</div>}
    </header>
  )
}
