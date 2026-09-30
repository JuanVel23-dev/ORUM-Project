import type { FotoPublica } from '@/lib/publico/datos-publicos'
import escaparate from '../escaparate.module.css'
import { CarruselFotos } from '@/components/ui/carrusel-fotos'
import { AdornoEstrella } from '@/components/ui/marca/marca'
import { Revelar } from './revelar'
import { REVELAR_DER, REVELAR_IZQ } from '@/lib/shared/revelado'
import estilos from './que-es-orum.module.css'

/*
  QUÉ ES ORUM  ·  «Una red de valor que se nota»
  ---------------------------------------------------------------------------
  Dos columnas: el texto —qué es ORUM— y a su lado un carrusel de fotos
  reales de comercios aliados.

  Misión y visión ya NO viven aquí: el cliente no las quería tan arriba, y
  pasaron a su propia sección después de «Hazte socio hoy»
  (`mision-vision.tsx`).

  Sin fotos cargadas, el carrusel no se pinta y el texto ocupa el ancho: un
  rectángulo negro vacío junto a «una red de valor que se nota» diría lo
  contrario de lo que dice el titular.

  La definición de ORUM es TEXTO DEL CLIENTE, literal.
*/


export function QueEsOrum({ fotos }: { fotos: FotoPublica[] }) {
  const hayFotos = fotos.length > 0

  return (
    <section
      id="nosotros"
      className={[escaparate.franja, escaparate.tonoPapel].join(' ')}
      aria-labelledby="titulo-nosotros"
    >
      <Revelar>
        <div className={[estilos.bloque, hayFotos && estilos.conFotos].filter(Boolean).join(' ')}>
          <div className={[estilos.texto, REVELAR_IZQ].join(' ')}>
            <h2 id="titulo-nosotros" className={escaparate.tituloSeccion}>
              <AdornoEstrella />
              Una red de valor <br className={estilos.salto} />
              que <em className={escaparate.acento}>se nota</em>
            </h2>
            <p className={estilos.lede}>
              ORUM es una plataforma de beneficios que conecta consumidores y comercios locales
              dentro de un mismo ecosistema.
            </p>
          </div>

          {hayFotos && (
            <CarruselFotos
              fotos={fotos}
              etiqueta="Fotos de comercios aliados"
              className={[estilos.carrusel, REVELAR_DER].join(' ')}
            />
          )}
        </div>
      </Revelar>
    </section>
  )
}
