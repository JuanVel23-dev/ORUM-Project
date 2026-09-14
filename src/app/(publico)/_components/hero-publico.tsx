import Link from 'next/link'
import { ArrowDown } from 'lucide-react'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
import { CtaSocio } from './cta-socio'
import estilos from './hero-publico.module.css'

/*
  EL HÉROE  ·  propuesta de valor + la única decisión que importa
  ---------------------------------------------------------------------------
  Todo lo demás en la página existe para reforzar esta decisión, no para
  sustituirla: alguien que ya está convencido no debería tener que desplazarse.

  DOS COLUMNAS EN ESCRITORIO, y no una franja centrada, porque HAY CONTENIDO
  REAL que poner al lado —la propia vitrina adelantada como collage—. Es la
  diferencia con las pantallas de acceso, donde la columna estrecha se justifica
  precisamente porque no hay nada que poner al lado.

  LA IMAGEN VA DEBAJO DEL TEXTO EN MÓVIL, NUNCA DETRÁS. Texto sobre imagen deja
  el contraste en manos de lo que suba cada comercio, y eso deja de ser un
  número que se pueda firmar.

  `PageHeader` no sirve aquí: está pensado para una página de trabajo dentro de
  una aplicación —título, descripción y una acción— y esto es un bloque de
  persuasión con dos CTAs jerarquizados y una composición propia. Forzarlo daría
  un `PageHeader` con props que no le corresponden.
*/

/** Cuántos logotipos entran en el collage. Tres llenan la rejilla sin apretarla. */
const TOPE_COLLAGE = 3

type Props = {
  soporte: string | null
  /** Los mismos comercios de la vitrina. Si no hay, el héroe va a una columna. */
  comercios: ComercioVitrina[]
  /** Si la vitrina no se renderiza, el ancla secundaria no tiene destino. */
  hayVitrina: boolean
}

export function HeroPublico({ soporte, comercios, hayVitrina }: Props) {
  const collage = comercios.slice(0, TOPE_COLLAGE)

  return (
    <section className={estilos.hero}>
      <div className={estilos.textos}>
        {/* El único h1 de la página. La cabecera no lleva ninguno: su wordmark
            es un enlace de marca, no un encabezado. */}
        <h1 className={estilos.titular}>Tu carnet para vivir la ciudad distinto.</h1>

        <p className={estilos.lede}>
          Un solo club, decenas de aliados en gastronomía, salud y belleza.
          Muestra tu carnet y listo.
        </p>

        <div className={estilos.acciones}>
          <CtaSocio soporte={soporte} size="lg" avisarSinNumero />

          {/* Acción secundaria: un ancla, no una navegación. Solo existe si hay
              vitrina a la que bajar — un enlace a una sección que no se pinta
              deja al visitante al final de la página sin entender por qué. */}
          {hayVitrina && (
            <Link href="#comercios-aliados" className={estilos.ancla}>
              Ver comercios aliados
              <ArrowDown size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {/*
        EL COLLAGE, decorativo a propósito.

        Son los logotipos de aliados reales, y esos mismos comercios aparecen
        nombrados en la vitrina de más abajo: anunciarlos aquí otra vez al
        lector de pantalla sería repetir la lista dos veces. `ComercioLogo` ya
        va `aria-hidden` por dentro; el contenedor lo marca entero.

        HOY SON LOGOTIPOS, NO FOTOGRAFÍAS. `comercios.portada_url` está prevista
        en la migración `20260913120000_imagenes_y_avatares.sql`, pero NO está
        aplicada ni existe en `database.types.ts`: consultarla rompería el
        tipado. La geometría de cada celda ya es la de una cubierta 4:3, así que
        el día que la columna exista la foto entra por datos, sin rehacer esto.
      */}
      {collage.length > 0 && (
        <div className={estilos.collage} aria-hidden="true">
          {collage.map((comercio) => (
            <div key={comercio.id} className={estilos.celda}>
              <ComercioLogo
                logoUrl={comercio.logoUrl}
                nombre={comercio.nombre}
                variante="portada"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
