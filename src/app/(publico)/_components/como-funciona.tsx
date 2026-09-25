import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './como-funciona.module.css'

/*
  «ASÍ ES COMO TE UNES»  ·  la tarjeta montada sobre el filo del héroe
  ---------------------------------------------------------------------------
  Sustituye a dos piezas anteriores: la tarjeta de beneficios genéricos que
  flotaba aquí y la franja independiente «Así funciona ORUM» más abajo. La
  pregunta que queda viva justo después del héroe no es «qué gano» —eso ya lo
  dijo el titular— sino «qué tengo que hacer», y la respuesta son tres pasos.

  ES UNA TARJETA, NO UNA FRANJA TEÑIDA: es de las pocas superficies de la
  landing que de verdad está levantada —se monta sobre la foto— y por eso
  lleva `--shadow-flotante`. Sin trazo: la sombra la separa del fondo.

  LOS TRES PASOS NO SON ENCABEZADOS. Un paso de un proceso es una entrada de
  lista: `<ol>`, con el número como parte del diseño y el nombre del paso en
  `<strong>`. El numeral va en oro legible sobre crema (`--brand`, 4,87:1),
  en Playfair: es índice, no dato.

  «Muestra tu carnet» dice «desde tu teléfono o con tu tarjeta física», y no
  «nada que imprimir» como el boceto: la sección de planes promete tarjeta
  física, y las dos frases no pueden contradecirse en la misma página.
*/

const PASOS = [
  {
    titulo: 'Hazte socio.',
    frase: 'Escríbenos por WhatsApp, elige tu plan y recibe tu carnet.',
  },
  {
    titulo: 'Muestra tu carnet.',
    frase: 'Al pagar, enséñalo desde tu teléfono o con tu tarjeta física.',
  },
  {
    titulo: 'Disfruta el beneficio.',
    frase: 'El comercio aplica el descuento al momento.',
  },
] as const

export function ComoFunciona() {
  return (
    <section
      className={[escaparate.franja, escaparate.tonoPapel, estilos.seccion].join(' ')}
      aria-labelledby="titulo-como-te-unes"
    >
      {/* El `Revelar` envuelve a la tarjeta y no ES la tarjeta: su clase fija
          `display: block` y la de la tarjeta `flex`, y con la misma
          especificidad ganaría la hoja que Next inyecte después. */}
      <Revelar>
        <div className={estilos.tarjeta}>
        <h2 id="titulo-como-te-unes" className={estilos.titulo}>
          Así es como <em className={escaparate.acento}>te unes</em>
        </h2>

        <ol className={estilos.pasos}>
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo} className={estilos.paso}>
              {/* Decorativo: el orden ya lo transporta el `<ol>`. */}
              <span className={estilos.numero} aria-hidden="true">
                {indice + 1}
              </span>
              <p className={estilos.texto}>
                <strong className={estilos.pasoTitulo}>{paso.titulo}</strong> {paso.frase}
              </p>
            </li>
          ))}
        </ol>
        </div>
      </Revelar>
    </section>
  )
}
