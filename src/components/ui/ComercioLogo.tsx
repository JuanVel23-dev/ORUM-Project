export function ComercioLogo({
  logoUrl,
  nombre,
  size = 48,
}: {
  logoUrl: string | null
  nombre: string
  size?: number
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
      <img
        src={logoUrl}
        alt={`Logo de ${nombre}`}
        className="orum-logo"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="orum-logo orum-logo--placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}
