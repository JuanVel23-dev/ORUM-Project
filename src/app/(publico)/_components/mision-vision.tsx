import { Sparkles, Target } from 'lucide-react'
import escaparate from '../escaparate.module.css'
import { AdornoEstrella } from '@/components/ui/marca/marca'
import { Revelar } from './revelar'
import { REVELAR, revelarEscalonado } from './revelado'
import estilos from './mision-vision.module.css'

/*
  MISIÓN Y VISIÓN  ·  su propia sección, después de «Hazte socio hoy»
  ---------------------------------------------------------------------------
  Encargo del cliente: no las quiere tan arriba. Vivían dentro de «Qué es
  ORUM», justo después de la tarjeta de pasos; ahí se leían antes de que el
  visitante supiera qué ofrece el club. Ahora cierran la página: quien ha
  llegado hasta el final ya sabe qué es ORUM, y lo que queda por contarle es
  por qué existe.

  Dos tarjetas blancas levantadas por la sombra, lado a lado en escritorio y
  una debajo de otra en móvil. Cada una se entiende sola: `article`.

  El texto es DEL CLIENTE, literal. No se resume ni se reescribe.
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

export function MisionVision() {
  return (
    <section
      className={[escaparate.franja, escaparate.tonoPapel, estilos.seccion].join(' ')}
      aria-labelledby="titulo-proposito"
    >
      <Revelar>
        <div className={estilos.bloque}>
          <h2
            id="titulo-proposito"
            className={[escaparate.tituloSeccion, estilos.titulo, REVELAR].join(' ')}
          >
            <AdornoEstrella />
            Nuestro <em className={escaparate.acento}>propósito</em>
          </h2>

          <div className={estilos.pilares}>
            {PILARES.map(({ titulo, Icono, texto }, i) => (
              /* El revelado en un envoltorio: la tarjeta se levanta al
                 apuntarla, y la animación le fijaría el `translate`. */
              <div key={titulo} className={revelarEscalonado(i)}>
                <article className={estilos.pilar}>
                  <span className={estilos.insignia} aria-hidden="true">
                    <Icono size={22} />
                  </span>
                  <h3 className={estilos.pilarTitulo}>{titulo}</h3>
                  <p className={estilos.pilarTexto}>{texto}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </Revelar>
    </section>
  )
}
