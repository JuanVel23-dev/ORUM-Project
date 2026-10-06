import { AdornoEstrella } from '@/components/ui/marca/marca'
import estilos from './titulo-seccion.module.css'

/*
  LOS TÍTULOS DEL PORTAL PÚBLICO, para quien los quiera  ·  29/09/2026
  ---------------------------------------------------------------------------
  El Portal Público no tiene UN título: tiene tres, y la jerarquía sale de
  alternarlos (medido en `cluborum.com`, no supuesto):

    · `seccion`  — 32→48px, Playfair 600, estrella dorada y la última
      palabra en cursiva dorada. Solo en las secciones NARRATIVAS: «Una red
      de valor que se nota», «Elige tu membresía», «Nuestro propósito».
    · `bloque`   — 26px, Playfair 700, estrella y cursiva igual. Para los
      bloques de USO que viven dentro de la página: «Así es como te unes»,
      «¿Tienes un negocio?».
    · `sobreNegro` (variante) — el de «Comercios destacados»: el título
      ENTERO en cursiva 500, en blanco, sin palabra dorada y con la estrella
      en plata (CLAUDE.md → «sobre negro, plata»).

  Poner todos los títulos en `seccion` fue el primer intento, y el
  propietario lo vio al instante: «muy grandes y los diseños muy iguales».
  Cada pantalla debe tener pocos títulos grandes y el resto compactos.

  La palabra en cursiva se calcula aquí —la última—, así cae siempre en el
  mismo sitio. El `<em>` es real: la cursiva porta el énfasis y el oro se
  suma encima.
*/

type Props = {
  texto: string
  /** Nivel del encabezado. Un `h1` por pantalla. */
  como?: 'h1' | 'h2'
  id?: string
  /**
   * `seccion` para las narrativas (grande), `bloque` para las de uso,
   * `pagina` para el `h1` de una pantalla de trabajo (`PageHeader`).
   */
  tamano?: 'seccion' | 'bloque' | 'pagina'
  /** `sobreNegro`: el título de las franjas negras del Portal Público. */
  variante?: 'normal' | 'sobreNegro'
  className?: string
}

export function TituloSeccion({
  texto,
  como = 'h2',
  id,
  tamano = 'seccion',
  variante = 'normal',
  className,
}: Props) {
  const Etiqueta = como
  const clases = [
    estilos.titulo,
    tamano === 'bloque' && estilos.bloque,
    tamano === 'pagina' && estilos.pagina,
    variante === 'sobreNegro' && estilos.sobreNegro,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (variante === 'sobreNegro') {
    return (
      <Etiqueta id={id} className={clases}>
        <AdornoEstrella tono="plata" />
        {texto}
      </Etiqueta>
    )
  }

  const corte = texto.lastIndexOf(' ')
  const cuerpo = corte === -1 ? '' : texto.slice(0, corte + 1)
  const acento = corte === -1 ? texto : texto.slice(corte + 1)

  return (
    <Etiqueta id={id} className={clases}>
      <AdornoEstrella />
      {cuerpo}
      <em className={estilos.acento}>{acento}</em>
    </Etiqueta>
  )
}
