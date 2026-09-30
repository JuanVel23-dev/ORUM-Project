import { CarruselFotos } from '@/components/ui/carrusel-fotos'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import { REVELAR_DER, REVELAR_IZQ } from '@/lib/shared/revelado'
import estilos from './seccion-novedades.module.css'

/*
  NOVEDADES DEL CLUB  ·  29/09/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «ponlo igual al del portal público, igual al
  apartado de "Una red de valor que se nota"», con un texto alusivo a las
  novedades, y SIN enlaces: la página `/miembros/novedades` se retiró, las
  novedades viven solo aquí.

  Dos columnas, la misma composición que «Qué es ORUM» de la fachada: el
  texto a la izquierda y, a su lado, el carrusel de fotos compartido
  (`CarruselFotos`: fundido cruzado, pausa visible, sin movimiento con
  `prefers-reduced-motion`) con las imágenes de los anuncios. El título de
  cada anuncio viaja como `alt` de su foto.

  Sin ninguna imagen, el carrusel no se pinta y el texto ocupa el ancho. Sin
  anuncios, la sección no existe: prometer novedades sobre un hueco sería lo
  contrario de lo que dice el titular.

  Server Component: lo único que se hidrata es el carrusel.
*/

/** Una portada, no el historial: el carrusel no necesita más que esto. */
const TOPE = 6

export function SeccionNovedades({ anuncios }: { anuncios: AnuncioResumen[] }) {
  if (anuncios.length === 0) return null

  const fotos = anuncios
    .filter((a) => a.imagenUrl)
    .slice(0, TOPE)
    .map((a) => ({ url: a.imagenUrl as string, alt: a.titulo }))
  const hayFotos = fotos.length > 0

  return (
    <section id="novedades" className={estilos.seccion} aria-labelledby="titulo-novedades">
      <div className={[estilos.bloque, hayFotos && estilos.conFotos].filter(Boolean).join(' ')}>
        <div className={[estilos.texto, REVELAR_IZQ].join(' ')}>
          <TituloSeccion id="titulo-novedades" texto="Novedades del club" />
          <p className={estilos.lede}>
            Aquí te contamos todo lo nuevo de ORUM: los aliados que se suman, los beneficios que
            estrenan y las fechas especiales para socios. Vuelve seguido, siempre hay algo nuevo
            para disfrutar.
          </p>
        </div>

        {hayFotos && (
          <CarruselFotos
            fotos={fotos}
            etiqueta="Novedades del club"
            className={[estilos.carrusel, REVELAR_DER].join(' ')}
          />
        )}
      </div>
    </section>
  )
}
