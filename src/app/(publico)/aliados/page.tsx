import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import {
  obtenerInstanteServidor,
  obtenerWhatsappSoporte,
} from '@/lib/publico/datos-publicos'
import escaparate from '../escaparate.module.css'
import { FormularioAliado } from './_components/formulario-aliado'
import estilos from './aliados.module.css'

export const metadata: Metadata = {
  title: 'Alía tu negocio · ORUM',
  description:
    'Suma tu negocio al club ORUM y llega a socios que buscan dónde gastar. Cuéntanos de ti y te contactamos.',
  openGraph: {
    title: 'Alía tu negocio con ORUM',
    description:
      'Suma tu negocio al club ORUM y llega a socios que buscan dónde gastar.',
    type: 'website',
  },
}

/**
 * La página real del formulario de comercio aliado.
 *
 * NO es la alternativa al overlay de la landing: es su RESPALDO OBLIGATORIO.
 * Sin ella, un enlace compartido por WhatsApp, un resultado de buscador o un
 * visitante sin JavaScript no tendrían forma de llegar al formulario. El
 * `<Link>` de la landing apunta aquí de verdad; el overlay solo intercepta el
 * clic cuando hay JavaScript.
 *
 * La tarjeta la pone esta página, no el formulario: la superficie es cosa de
 * quien usa el componente, y en la landing esa superficie es el `Overlay`.
 */
/*
  SE RENDERIZA EN CADA PETICIÓN, y hay que decirlo explícitamente.

  La landing `/` ya es dinámica por sí sola: comprueba la sesión y eso lee
  cookies. Esta página no lee ninguna, así que Next la prerenderizaba en el
  build —salía como `○ (Static)`— y eso rompía dos cosas en silencio:

  1. `obtenerInstanteServidor()` quedaba congelado en el instante del build, de
     modo que la comprobación anti-robot comparaba contra una fecha de hace
     días y la daba por buena siempre.
  2. El WhatsApp de soporte quedaba fijado al valor que hubiera en la base
     durante el build: un administrador podía cambiarlo y no verlo nunca.

  Ninguna de las dos falla ruidosamente. De ahí que valga la línea.
*/
export const dynamic = 'force-dynamic'

export default async function AliadosPage() {
  const [soporte, abiertoEn] = await Promise.all([
    obtenerWhatsappSoporte(),
    obtenerInstanteServidor(),
  ])

  return (
    <div className={estilos.pagina}>
      <header className={estilos.encabezado}>
        {/*
          EL MISMO PELDAÑO CEREMONIAL QUE LOS ENCABEZADOS DE LA LANDING.

          `escaparate.tituloSeccion` es Playfair Display a 32–48px con el tracking
          interpolado por tamaño. Se reutiliza en vez de copiarse: esa
          interpolación son cuatro números atados a dos anchos de ventana
          concretos, y una tercera copia es una tercera oportunidad de que una
          se quede atrás. Aquí viste un `h1` y allí un `h2`; la clase es una
          ESCALA, no un nivel de encabezado.

          El serif es legal aquí porque `/aliados` es fachada pública —el
          recorrido del cliente—, no una pantalla de trabajo. En Administración
          y en la Herramienta de Comercios seguiría prohibido.
        */}
        <h1 className={[escaparate.tituloSeccion, estilos.titulo].join(' ')}>
          Alía tu negocio con ORUM
        </h1>
        <p className={estilos.bajada}>
          Nuestros socios buscan dónde comer, cuidarse y consentirse. Si tu negocio
          puede ofrecerles un beneficio, cuéntanos y lo evaluamos contigo.
        </p>
      </header>

      <Card padding="lg">
        {/*
          `Date.now()` del SERVIDOR, y ese es el punto: el reloj del visitante
          puede ir mal o estar manipulado, así que la comprobación anti-robot se
          hace contra el único reloj del que nos fiamos. Esta ruta se renderiza
          en cada petición —lee el WhatsApp de soporte—, así que el instante es
          siempre el del pintado real y no uno congelado en el build.
        */}
        <FormularioAliado superficie="pagina" abiertoEn={abiertoEn} soporte={soporte} />
      </Card>
    </div>
  )
}
