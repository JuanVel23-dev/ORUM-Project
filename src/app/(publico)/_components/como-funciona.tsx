import estilos from './como-funciona.module.css'

/*
  CÓMO FUNCIONA  ·  la duda inmediata después del héroe
  ---------------------------------------------------------------------------
  Va ANTES de la vitrina a propósito: enseñar comercios sin explicar el
  mecanismo («¿tengo que pagar en cada sitio?», «¿necesito una app?») genera más
  dudas que deseo.

  LOS TRES PASOS NO SON ENCABEZADOS. Un paso de un proceso no es una sección con
  contenido propio: es una entrada de lista. De ahí el `<ol>`, con el número
  como parte del diseño visual y el nombre del paso en `<strong>`.

  El numeral NO va en oro. Es secuencia, no marca: colorearlo de dorado
  codificaría «importancia» por color, y aquí el color sería el único portador
  de esa idea.

  Composición, no componente de sistema: rejilla más texto. No usa `Card`
  porque estas piezas no llevan superficie propia —son texto sobre el fondo de
  la sección— y `CLAUDE.md` prohíbe que un componente reutilizable imponga su
  propia tarjeta.
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
    <section className={estilos.seccion} id="como-funciona">
      <h2 className={estilos.titulo}>Así funciona ORUM</h2>

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
    </section>
  )
}
