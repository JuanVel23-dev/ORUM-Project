import styles from './comercio-logo.module.css'

type ComercioLogoProps = {
  logoUrl: string | null
  nombre: string
  size?: number
  className?: string
}

/**
 * Logo de un comercio aliado, con respaldo tipográfico cuando no hay imagen.
 *
 * El respaldo NO es un icono genérico: es la inicial del comercio, igual que
 * `Avatar` hace con las personas. Un catálogo donde la mitad de las tarjetas
 * muestran el mismo icono de tienda se lee como incompleto; con la inicial,
 * cada tarjeta sigue siendo distinguible de un vistazo.
 */
export function ComercioLogo({ logoUrl, nombre, size = 48, className }: ComercioLogoProps) {
  const clases = [styles.logo, className].filter(Boolean).join(' ')

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
      <img
        src={logoUrl}
        alt={`Logo de ${nombre}`}
        className={clases}
        style={{ width: size, height: size }}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <div
      className={[clases, styles.placeholder].join(' ')}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {nombre.charAt(0)}
    </div>
  )
}
