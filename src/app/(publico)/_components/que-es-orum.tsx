import { Sparkles, Target } from 'lucide-react'
import type { FotoPublica } from '@/lib/publico/datos-publicos'
import escaparate from '../escaparate.module.css'
import { CarruselFotos } from './carrusel-fotos'
import { Revelar } from './revelar'
import estilos from './que-es-orum.module.css'

/*
  QUÉ ES ORUM  ·  «Una red de valor que se nota»
  ---------------------------------------------------------------------------
  Dos columnas: el texto —qué es, misión y visión, una debajo de la otra con
  su insignia— y a su lado un carrusel de fotos reales de comercios aliados,
  estirado a la altura del texto para que no se vea más grande que él.

  Sin fotos cargadas, el carrusel no se pinta y el texto ocupa el ancho: un
  rectángulo negro vacío junto a «una red de valor que se nota» diría lo
  contrario de lo que dice el titular.

  Misión, visión y la definición de ORUM son TEXTO DEL CLIENTE, literal. No
  se resumen ni se reescriben: el boceto los acortó y el cliente pidió los
  suyos.

  Misión y visión son `article`: cada una se entiende sola.
*/

const PILARES = [
  {
    titulo: 'Misión',
    Icono: Target,
    texto:
      'Conectar consumidores y comercios locales mediante un ecosistema de beneficios que genere valor para ambas partes, impulse la recurrencia de compra y fortalezca las relaciones entre los negocios de una misma comunidad.',
  },
  {
    titulo: 'Visión',
    Icono: Sparkles,
    texto:
      'Convertirnos en el ecosistema de beneficios y conexión comercial más relevante de Colombia, transformando la manera en que las personas descubren, eligen y consumen en los negocios locales.',
  },
] as const

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
          <div className={estilos.texto}>
            <h2 id="titulo-nosotros" className={escaparate.tituloSeccion}>
              Una red de valor <br className={estilos.salto} />
              que <em className={escaparate.acento}>se nota</em>
            </h2>
            <p className={estilos.lede}>
              ORUM es una plataforma de beneficios que conecta consumidores y comercios locales
              dentro de un mismo ecosistema.
            </p>

            <div className={estilos.pilares}>
              {PILARES.map(({ titulo, Icono, texto }) => (
                <article key={titulo} className={estilos.pilar}>
                  <span className={estilos.insignia} aria-hidden="true">
                    <Icono size={20} />
                  </span>
                  <div>
                    <h3 className={estilos.pilarTitulo}>{titulo}</h3>
                    <p className={estilos.pilarTexto}>{texto}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {hayFotos && (
            <CarruselFotos
              fotos={fotos}
              etiqueta="Fotos de comercios aliados"
              className={estilos.carrusel}
            />
          )}
        </div>
      </Revelar>
    </section>
  )
}
