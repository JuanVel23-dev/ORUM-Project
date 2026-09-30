import Link from 'next/link'
import { Lock, TicketPercent } from 'lucide-react'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
import estilos from './tarjeta-directorio.module.css'

/*
  LA TARJETA DEL DIRECTORIO  ·  la comparten `/explorar` y `/miembros`
  ---------------------------------------------------------------------------
  Foto arriba, y debajo el logotipo GRANDE junto al nombre, la categoría con
  la ciudad y el beneficio.

  EL BENEFICIO DEPENDE DE QUIÉN MIRA (29/09/2026):
    · En el Portal Público se ve DESENFOCADO: quien no es socio ve que hay
      algo y no puede leerlo. Para un lector de pantalla el texto
      desenfocado no existe (`aria-hidden`) y se anuncia «Beneficio
      exclusivo para socios»; el candado es el segundo portador.
    · En el Portal de Miembros (`socio`) se LEE: el socio ya pagó por verlo.

  La tarjeta entera es UN enlace a la ficha: en la fachada se abre encima
  (ruta interceptada, `scroll={false}` conserva la posición); en miembros va
  a la ficha del socio, que es página completa.
*/
export function TarjetaDirectorio({
  comercio,
  socio = false,
}: {
  comercio: ComercioVitrina
  /** Portal de Miembros: beneficio legible y ficha de socio. */
  socio?: boolean
}) {
  const detalle = [comercio.categoriaNombre, comercio.ciudades.join(', ')]
    .filter(Boolean)
    .join(' · ')

  const href = socio ? `/miembros/comercios/${comercio.id}` : `/explorar/${comercio.id}`

  return (
    <Link href={href} className={estilos.tarjeta} scroll={socio ? undefined : false}>
      <span className={estilos.portada}>
        {comercio.portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
          <img
            src={comercio.portadaUrl}
            alt=""
            className={estilos.foto}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={estilos.sinFoto} aria-hidden="true" />
        )}
      </span>

      <span className={estilos.cuerpo}>
        <ComercioLogo logoUrl={comercio.logoUrl} nombre={comercio.nombre} />
        <span className={estilos.textos}>
          <span className={estilos.nombre}>{comercio.nombre}</span>
          {detalle && <span className={estilos.detalle}>{detalle}</span>}
          {comercio.beneficioDestacado &&
            (socio ? (
              <span className={estilos.beneficio}>
                <TicketPercent size={13} aria-hidden="true" className={estilos.candado} />
                {/* La cifra va sola («10%»): el icono y el sitio ya dicen que
                    es un descuento. El lector de pantalla no ve el icono. */}
                <span className="sr-only">Beneficio: </span>
                <span className={estilos.legible}>{comercio.beneficioDestacado}</span>
              </span>
            ) : (
              <span className={estilos.beneficio}>
                <Lock size={13} aria-hidden="true" className={estilos.candado} />
                <span className={estilos.borroso} aria-hidden="true">
                  {comercio.beneficioDestacado}
                </span>
                <span className="sr-only">Beneficio exclusivo para socios</span>
              </span>
            ))}
        </span>
      </span>
    </Link>
  )
}
