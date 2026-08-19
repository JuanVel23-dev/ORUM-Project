import styles from './avatar.module.css'

/**
 * Iniciales de un nombre completo: primera letra del nombre y del primer
 * apellido. Con una sola palabra, sus dos primeras letras.
 *
 * Ignora partículas ("de", "del", "la"…), que son muy comunes en nombres
 * colombianos y producirían iniciales inútiles como "JD".
 */
export function iniciales(nombre: string): string {
  const particulas = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'da', 'do'])

  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !particulas.has(p.toLowerCase()))

  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()

  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase()
}

type Props = {
  /** Nombre completo. Se usa para las iniciales y como texto alternativo. */
  nombre: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  /** Realce dorado. Reservado al usuario de la sesión en el cromo. */
  brand?: boolean
  /**
   * El nombre ya está escrito al lado, así que el avatar no aporta
   * información: se oculta por completo al árbol de accesibilidad.
   *
   * Sin esto, un lector de pantalla lee "Daniel Usaquen Daniel Usaquen" en
   * cada fila de la lista, porque el avatar también anuncia el nombre.
   */
  decorativo?: boolean
  className?: string
}

export function Avatar({
  nombre,
  src,
  size = 'md',
  brand = false,
  decorativo = false,
  className,
}: Props) {
  return (
    <span
      className={[styles.avatar, styles[size], brand && styles.brand, className]
        .filter(Boolean)
        .join(' ')}
      title={decorativo ? undefined : nombre}
      aria-hidden={decorativo || undefined}
    >
      {src ? (
        /* Avatar de tamaño fijo (28–48px) y origen externo variable: la
           optimización de `next/image` no aporta nada a esta escala y
           obligaría a declarar dominios remotos. */
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.imagen} src={src} alt={decorativo ? '' : nombre} />
      ) : (
        <span aria-hidden="true">{iniciales(nombre)}</span>
      )}
      {!src && !decorativo && <span className="sr-only">{nombre}</span>}
    </span>
  )
}
