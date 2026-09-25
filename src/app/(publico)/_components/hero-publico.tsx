import Link from 'next/link'
import { ArrowDown } from 'lucide-react'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
import type { RecursoPublico } from '@/lib/sitio/recursos'
import escaparate from '../escaparate.module.css'
import { CtaSocio } from './cta-socio'
import { PortadaHeroe } from './portada-heroe'
import estilos from './hero-publico.module.css'

/*
  EL HÉROE  ·  propuesta de valor + la única decisión que importa
  ---------------------------------------------------------------------------
  Todo lo demás en la página existe para reforzar esta decisión, no para
  sustituirla: alguien que ya está convencido no debería tener que desplazarse.

  ES UNA FRANJA DE CACAO A ANCHO COMPLETO, y esa es la decisión de la v4 que
  más cambia esta pantalla. No es estética: es la única condición bajo la que
  el titular puede ir en oro. `--gold-400` sobre crema da 1,99:1 —ni el 3:1 de
  texto grande— y sobre `--cacao-bg` da 7,83:1. El oro grande no vive sobre
  claro; vive aquí.

  Las clases de franja vienen de `../escaparate.module.css`, el módulo que también
  importa `page.tsx`. Esto es literal, no decorativo: la trampa nº 1 del log de
  Y1 fue escribir las clases en un módulo que el componente no importaba, con
  el resultado de que `estilos.franja` salía `undefined` y no pasaba nada —sin
  un solo error, compilando y pasando lint—.

  DOS COLUMNAS EN ESCRITORIO, y no una franja centrada, porque HAY CONTENIDO
  REAL que poner al lado: la vitrina adelantada como collage. Es la diferencia
  con las pantallas de acceso, donde la columna estrecha se justifica
  precisamente porque no hay nada que poner al lado.

  LA IMAGEN VA DEBAJO DEL TEXTO EN MÓVIL, NUNCA DETRÁS. Texto sobre imagen deja
  el contraste en manos de lo que suba cada comercio, y eso deja de ser un
  número que se pueda firmar.
*/

/** Cuántos logotipos entran en el collage. Tres llenan la rejilla sin apretarla. */
const TOPE_COLLAGE = 3

type Props = {
  soporte: string | null
  /** Los mismos comercios de la vitrina. Si no hay, el héroe va a una columna. */
  comercios: ComercioVitrina[]
  /** Si la vitrina no se renderiza, el ancla secundaria no tiene destino. */
  hayVitrina: boolean
  /**
   * La imagen principal, administrada desde `/admin/recursos`. Si hay al
   * menos una visible MANDA SOBRE EL COLLAGE, y si hay varias se alternan.
   *
   * El collage no se borra: pasa a ser el respaldo. Una portada sin imagen
   * subida no puede quedarse con una columna vacía —y este archivo no puede
   * decidir que la segunda columna desaparezca, porque entonces el día que el
   * propietario borre la última foto la pantalla cambiaría de maquetación sin
   * que nadie haya tocado nada—.
   */
  portadas: RecursoPublico[]
}

export function HeroPublico({ soporte, comercios, hayVitrina, portadas }: Props) {
  const collage = comercios.slice(0, TOPE_COLLAGE)
  const hayPortada = portadas.length > 0

  return (
    <section
      className={[
        escaparate.franja,
        escaparate.tonoCacao,
        escaparate.filoInferior,
        estilos.hero,
      ].join(' ')}
    >
      <div className={estilos.rejilla}>
        <div className={estilos.textos}>
          {/* Versalitas pequeñas con tracking abierto: el otro extremo del
              mismo principio que el titular. No es un encabezado —no hay
              contenido colgando de él—, así que es un párrafo. */}
          <p className={estilos.overline}>Club de beneficios por membresía</p>

          {/* El único h1 de la página. La cabecera no lleva ninguno: su
              wordmark es un enlace de marca, no un encabezado. */}
          <h1 className={estilos.titular}>
            Tu carnet para{' '}
            <span className={estilos.destacado}>vivir la ciudad distinto</span>.
          </h1>

          <p className={estilos.lede}>
            Un solo club, decenas de aliados en gastronomía, salud y belleza.
            Muestra tu carnet y listo.
          </p>

          <div className={estilos.acciones}>
            <CtaSocio soporte={soporte} size="lg" avisarSinNumero />

            {/* Acción secundaria: un ancla, no una navegación. Solo existe si
                hay vitrina a la que bajar — un enlace a una sección que no se
                pinta deja al visitante al final de la página sin entender por
                qué. */}
            {hayVitrina && (
              <Link href="#comercios-aliados" className={estilos.ancla}>
                Ver comercios aliados
                <ArrowDown
                  size={16}
                  aria-hidden="true"
                  className={estilos.anclaIcono}
                />
              </Link>
            )}
          </div>
        </div>

        {/*
          LA SEGUNDA COLUMNA, en dos estados y con el mismo hueco.

          Con imagen principal subida manda ella. Sin ninguna, el collage de
          aliados — que es decorativo a propósito: son comercios reales y esos
          mismos comercios aparecen nombrados en la vitrina de más abajo, así
          que anunciarlos aquí otra vez al lector de pantalla sería repetir la
          lista dos veces. `ComercioLogo` ya va `aria-hidden` por dentro; el
          contenedor lo marca entero.
        */}
        {hayPortada ? (
          <PortadaHeroe imagenes={portadas} />
        ) : (
          collage.length > 0 && (
            <div className={estilos.collage} aria-hidden="true">
              {collage.map((comercio) => (
                <CeldaCollage key={comercio.id} comercio={comercio} />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  )
}

/*
  UNA CELDA  ·  foto si la hay, retrato de marca si no.

  El apilado es requisito y no sugerencia: el material con la placa del
  logotipo es SIEMPRE la capa de fondo y la foto va encima. Si la foto falla no
  pinta nada —`alt` vacío— y lo que queda es el estado sin foto, sin escuchador
  de `onError`, sin `'use client'` y sin salto de layout.
*/
function CeldaCollage({ comercio }: { comercio: ComercioVitrina }) {
  const portadaUrl = (comercio.portadaUrl ?? '').trim()

  return (
    <div className={estilos.celda}>
      {portadaUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
        <img
          src={portadaUrl}
          /* Decorativa: el collage entero va `aria-hidden` y los mismos
             comercios están nombrados en texto más abajo. */
          alt=""
          className={estilos.foto}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* El velo solo existe cuando hay foto: está para que la placa no flote
          sobre un punto claro de la imagen, y sin imagen no tiene trabajo. */}
      {portadaUrl && <span className={estilos.velo} />}

      <ComercioLogo
        logoUrl={comercio.logoUrl}
        nombre={comercio.nombre}
        /* Con foto la placa es una firma en la esquina; sin foto, la placa ES
           la cubierta. La marca está presente en los dos estados, que es lo
           que le da un ancla común a una fila mezclada. */
        variante={portadaUrl ? 'tarjeta' : 'portada'}
        className={portadaUrl ? estilos.placaSobreFoto : undefined}
      />
    </div>
  )
}
