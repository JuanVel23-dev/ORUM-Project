import { Eye, Target } from 'lucide-react'
import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './que-es-orum.module.css'

/*
  QUÉ ES ORUM  ·  la identidad del club, justo después del héroe
  ---------------------------------------------------------------------------
  Texto entregado por el propietario: qué es ORUM, su misión y su visión. Va
  antes de «Así funciona» porque responde a la pregunta anterior: antes de
  saber CÓMO se usa, quien llega quiere saber QUÉ es.

  Franja de PAPEL entre el héroe (champán en claro) y «Así funciona» (gris
  hondo): ninguna sección repite el tono de su vecina.

  Misión y visión son dos piezas hermanas, cada una con su glifo y su título:
  `article`, porque cada una se entiende sola.
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
    Icono: Eye,
    texto:
      'Convertirnos en el ecosistema de beneficios y conexión comercial más relevante de Colombia, transformando la manera en que las personas descubren, eligen y consumen en los negocios locales.',
  },
] as const

export function QueEsOrum() {
  return (
    <section
      className={[escaparate.franja, escaparate.tonoPapel].join(' ')}
      id="que-es-orum"
      aria-labelledby="titulo-que-es-orum"
    >
      <Revelar className={estilos.bloque}>
        <div className={estilos.cabecera}>
          <h2 id="titulo-que-es-orum" className={escaparate.tituloSeccion}>
            ¿Qué es ORUM?
          </h2>
          <p className={estilos.lede}>
            ORUM es una plataforma de beneficios que conecta consumidores y comercios locales
            dentro de un mismo ecosistema.
          </p>
        </div>

        <div className={estilos.pilares}>
          {PILARES.map(({ titulo, Icono, texto }) => (
            <article key={titulo} className={estilos.pilar}>
              <span className={estilos.icono} aria-hidden="true">
                <Icono size={22} />
              </span>
              <h3 className={estilos.pilarTitulo}>{titulo}</h3>
              <p className={estilos.pilarTexto}>{texto}</p>
            </article>
          ))}
        </div>
      </Revelar>
    </section>
  )
}
