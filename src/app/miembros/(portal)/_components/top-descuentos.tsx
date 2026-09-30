import Link from 'next/link'
import { TicketPercent } from 'lucide-react'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { LogoOrum } from '@/components/ui/marca/marca'
import { formatearBeneficioCorto } from '@/lib/comercios/beneficios-formato'
import { mereceMarquesina, type TopDescuento } from '@/lib/comercios/top-descuentos'
import { hrefFicha } from './comercio-card'
import estilos from './top-descuentos.module.css'

/*
  TOP 5 DEL CLUB  ·  rediseño del 27/09/2026 (`Miembros.dc.html`)
  ---------------------------------------------------------------------------
  Global, no personal: lo que más usa el club entero. No confundir con "Los que
  más usas", que es del socio y sale de otra función.

  ANTES era una marquesina de filas planas en movimiento. El propietario la
  pidió rediseñada («no me gusta el diseño, mejóralo»): ahora son CINCO
  TARJETAS-FOTO quietas, la misma pieza que «Comercios destacados» del Portal
  Público —fondo oscuro, velo inferior, logo y nombre montados abajo— con dos
  añadidos propios de un ranking: la insignia del puesto y el beneficio como
  píldora dorada.

  Al quedarse quieta se van de golpe las cuatro salvaguardas de WCAG 2.2.2 que
  exigía la marquesina (botón de pausa, hover, foco, toque): nada se mueve
  solo, así que no hay nada que pausar. Y deja de ser componente de cliente.

  EL LOGO DE ORUM LLENA EL HUECO. Sin foto que enseñar, el fondo de la tarjeta
  era un degradado vacío («pon aquí el logo de ORUM para que llene el espacio
  en blanco»). Va en PLATA y muy tenue: sobre negro manda la plata, nunca el
  oro, y es una marca de agua, no un segundo titular.

  Vive siempre sobre la franja `cacao` —la única sección ceremonial del
  catálogo—, que remapea los tokens de texto hacia dentro.
*/

/** Una portada, no el ranking entero: cinco caben en una fila de escritorio. */
const TOPE_VISIBLE = 5

export function TopDescuentos({
  items,
  volver = null,
  apoyo = 'Los descuentos que más usan los socios',
  portadas,
}: {
  items: TopDescuento[]
  volver?: string | null
  /** El criterio del ranking, en palabras: por uso o, de respaldo, por descuento. */
  apoyo?: string
  /** La foto de portada de cada comercio, por id. Sin foto, la marca de agua. */
  portadas?: ReadonlyMap<number, string | null>
}) {
  /*
    LA PUERTA. Con menos de tres, la sección NO SE PINTA: ni encabezado ni
    hueco reservado. Con la función `top_descuentos` todavía sin aplicar en la
    base, `items` llega vacío y esto se sale por aquí. El catálogo sigue entero.
  */
  if (!mereceMarquesina(items)) return null

  const visibles = items.slice(0, TOPE_VISIBLE)

  return (
    <section className={estilos.seccion} aria-labelledby="titulo-top">
      <div className={estilos.cabecera}>
        {/* `h2`, el mismo nivel que las estanterías y que "Todos los
            comercios". Sin saltos. */}
        <TituloSeccion id="titulo-top" texto={`Top ${visibles.length} del club`} variante="sobreNegro" />
        <p className={estilos.apoyo}>{apoyo}</p>
      </div>

      {/* `<ol>`: es un ranking, el orden ES el dato. */}
      <ol className={estilos.rejilla}>
        {visibles.map((item) => (
          <li key={item.promocionId} className={estilos.celda}>
            {/*
              NINGÚN `view-transition-name` aquí: un comercio puede salir a la
              vez en esta sección y en la rejilla, y dos nombres iguales vivos
              en el mismo documento anulan la transición ENTERA en silencio.
            */}
            <Link href={hrefFicha(item.comercioId, volver)} className={estilos.tarjeta}>
              {portadas?.get(item.comercioId) ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
                <img
                  src={portadas.get(item.comercioId) ?? undefined}
                  alt=""
                  className={estilos.foto}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <LogoOrum variante="plata" className={estilos.marcaAgua} />
              )}
              <span className={estilos.velo} aria-hidden="true" />

              {/* El número visible es lo que convierte una fila de beneficios
                  en un ranking; el orden de la lista lo dice al lector. */}
              <span className={estilos.puesto}>
                <span className="sr-only">Puesto </span>
                {item.puesto}
              </span>

              <span className={estilos.pie}>
                <span className={estilos.identidad}>
                  <span className={estilos.logo}>
                    <ComercioLogo logoUrl={item.logoUrl} nombre={item.comercioNombre} />
                  </span>
                  <span className={estilos.nombre}>{item.comercioNombre}</span>
                </span>

                <span className={estilos.beneficio}>
                  <TicketPercent size={12} aria-hidden="true" />
                  {formatearBeneficioCorto(item.tipoCodigo, item.valor)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
