import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './como-funciona.module.css'

/*
  CÓMO FUNCIONA  ·  la duda inmediata después del héroe
  ---------------------------------------------------------------------------
  Va ANTES de la vitrina a propósito: enseñar comercios sin explicar el
  mecanismo («¿tengo que pagar en cada sitio?», «¿necesito una app?») genera más
  dudas que deseo.

  FRANJA DE CREMA HONDA, y la elección no es libre. `tokens.css` §1 mide
  `--tinta-3` a 4,18:1 y `--gold-700` a 4,21:1 sobre `--surface-alt-2`: los dos
  reprueban AA, así que esa superficie es de RELLENO y no admite texto tenue ni
  texto dorado. Esta sección es exactamente eso: tinta plena y tinta secundaria
  sobre un campo de color, sin tarjetas, sin metadatos y sin oro. Es la sección
  de la landing que mejor encaja ahí.

  LOS TRES PASOS NO SON ENCABEZADOS. Un paso de un proceso no es una sección con
  contenido propio: es una entrada de lista. De ahí el `<ol>`, con el número
  como parte del diseño visual y el nombre del paso en `<strong>`.

  El numeral NO va en oro. Es secuencia, no marca: colorearlo de dorado
  codificaría «importancia» por color, y aquí el color sería el único portador
  de esa idea. Lo que sí gana es el serif de display —la licencia v4 levantó la
  restricción de «serif solo en h1»— porque una cifra ceremonial en Fraunces se
  lee como numeral de índice y no como dato.

  Composición, no componente de sistema: rejilla más texto. No usa `Card`
  porque estas piezas no llevan superficie propia —son texto sobre el campo de
  la franja— y un componente reutilizable no debe imponer su propia tarjeta.
*/

const PASOS = [
  {
    titulo: 'Hazte socio',
    frase: 'Escríbenos por WhatsApp, elige tu plan y recibe tu carnet digital.',
  },
  {
    titulo: 'Muestra tu carnet',
    frase:
      'Al pagar, enseña el carnet desde tu teléfono. No hay que imprimir nada ni instalar nada.',
  },
  {
    titulo: 'Disfruta el beneficio',
    frase: 'El comercio aplica el descuento en el momento. Sin cupones ni trámites.',
  },
] as const

export function ComoFunciona() {
  return (
    <section
      className={[escaparate.franja, escaparate.tonoHonda, estilos.seccion].join(' ')}
      id="como-funciona"
    >
      {/*
        UN SOLO OBSERVADOR PARA TODA LA SECCIÓN.

        `modo="contenedor"` deja el envoltorio en `display: contents`, así que
        el `h2` y el `<ol>` siguen siendo hijos directos del flex de la sección
        y la maqueta no cambia ni un píxel. El escalonado lo escribe el módulo
        de aquí, que es el único que sabe qué hijos hay.
      */}
      <Revelar modo="contenedor">
        <h2 className={[escaparate.tituloSeccion, estilos.titulo].join(' ')}>
          Así funciona ORUM
        </h2>

        <ol className={estilos.pasos}>
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo} className={estilos.paso}>
              {/* El numeral es decoración: el orden ya lo transporta el `<ol>`,
                  así que repetirlo al lector de pantalla sería ruido. */}
              <span className={estilos.numero} aria-hidden="true">
                {indice + 1}
              </span>
              <p className={estilos.texto}>
                <strong className={estilos.pasoTitulo}>{paso.titulo}</strong>
                {paso.frase}
              </p>
            </li>
          ))}
        </ol>
      </Revelar>
    </section>
  )
}
