import Link from 'next/link'
import { Lock } from 'lucide-react'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
import estilos from './tarjeta-directorio.module.css'

/*
  LA TARJETA DEL DIRECTORIO
  ---------------------------------------------------------------------------
  Foto arriba, y debajo el logotipo GRANDE junto al nombre —para que la
  marca se distinga de verdad, no un círculo perdido en una esquina—, la
  categoría con la ciudad y el beneficio.

  EL BENEFICIO SE VE, PERO DESENFOCADO. Encargo del cliente: que quien no es
  socio vea que hay algo y no pueda leerlo. Para un lector de pantalla el
  texto desenfocado no existe (`aria-hidden`) y en su lugar se anuncia lo que
  un vidente entiende al verlo: «Beneficio exclusivo para socios». El
  candado es el segundo portador; el desenfoque solo no lo sería.

  Sin corazón de favorito: aquí no hay sesión con la que guardarlo, y un
  control que no hace nada es peor que ninguno.

  La tarjeta entera es UN enlace a la ficha, que se abre encima gracias a la
  ruta interceptada; `scroll={false}` conserva la posición del directorio.
*/
export function TarjetaDirectorio({ comercio }: { comercio: ComercioVitrina }) {
  const detalle = [comercio.categoriaNombre, comercio.ciudades.join(', ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/explorar/${comercio.id}`} className={estilos.tarjeta} scroll={false}>
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
          {comercio.beneficioDestacado && (
            <span className={estilos.beneficio}>
              <Lock size={13} aria-hidden="true" className={estilos.candado} />
              <span className={estilos.borroso} aria-hidden="true">
                {comercio.beneficioDestacado}
              </span>
              <span className="sr-only">Beneficio exclusivo para socios</span>
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}
