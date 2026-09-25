import Link from 'next/link'
import type { RecursoPublico } from '@/lib/sitio/recursos'
import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './promos-sitio.module.css'

/*
  PROMOCIONES DEL CLUB  ·  los carteles que administra el panel
  ---------------------------------------------------------------------------
  Encargo del propietario (25/09/2026): un apartado en la página de inicio,
  junto a la misión y la visión, donde poner promociones; las imágenes se
  suben, se borran y se eligen desde `/admin/recursos`.

  ⚠️ ESTO NO SON LAS `promociones` DE LOS COMERCIOS. Aquellas son el descuento
  concreto de un aliado —«2x1 en almuerzos», con su tipo de beneficio y su
  vigencia— y se pintan en la vitrina y en la ficha. Estos son los carteles
  del propio club en su portada. El parecido de nombre es la trampa: de ahí
  que el modelo se llame `recursos_sitio` y la ubicación `promo`.

  VA JUSTO DESPUÉS DE «¿QUÉ ES ORUM?» y en tono CREMA: la franja anterior es
  papel y la siguiente («Así funciona») es crema honda, así que ninguna
  sección repite el tono de su vecina. Si esta no se pinta —que es lo normal
  hasta que alguien suba el primer cartel— el ritmo vuelve a ser el de antes,
  papel → honda, sin que nadie tenga que tocar nada.

  SI NO HAY NADA VISIBLE, NO HAY SECCIÓN. Un encabezado «Promociones» sobre un
  hueco dice que el club no tiene ninguna, que es bastante peor que no decir
  nada. Lo decide `page.tsx`, que es quien tiene los datos.
*/

export function PromosSitio({ promos }: { promos: RecursoPublico[] }) {
  return (
    <section
      className={[escaparate.franja, escaparate.tonoCrema].join(' ')}
      id="promociones"
      aria-labelledby="titulo-promociones"
    >
      <Revelar className={estilos.bloque}>
        <h2 id="titulo-promociones" className={escaparate.tituloSeccion}>
          Promociones
        </h2>

        <ul className={estilos.rejilla}>
          {promos.map((promo) => (
            <li key={promo.id} className={estilos.celda}>
              <Cartel promo={promo} />
            </li>
          ))}
        </ul>
      </Revelar>
    </section>
  )
}

/*
  UN CARTEL  ·  enlace si tiene destino, imagen quieta si no.

  El `alt` sale del texto alternativo que escribió quien lo subió. Vacío
  significa DECORATIVO, y entonces la imagen se marca como tal en vez de
  caerse al título —que es un nombre interno, del tipo «cartel septiembre», y
  leérselo en voz alta a quien usa lector de pantalla no informa de nada—.

  Con enlace, el caso cambia: un enlace sin nombre accesible es un callejón
  sin salida para el teclado. Ahí el `aria-label` sí usa el título como último
  recurso, porque «enlace, imagen» es peor que un nombre imperfecto.
*/
function Cartel({ promo }: { promo: RecursoPublico }) {
  const alternativo = (promo.descripcion ?? '').trim()

  const imagen = (
    // eslint-disable-next-line @next/next/no-img-element -- URL de Storage arbitraria, no un asset local
    <img
      src={promo.url}
      alt={alternativo}
      className={estilos.imagen}
      loading="lazy"
      decoding="async"
    />
  )

  if (!promo.enlaceUrl) return imagen

  // Interno o externo. `validarEnlaceRecurso` ya garantizó en el servidor que
  // solo puede ser `https://…` o `/…`, así que aquí basta con distinguirlos
  // para elegir entre `Link` (prefetch, navegación de cliente) y `<a>`.
  const externo = promo.enlaceUrl.startsWith('https://')

  const contenido = (
    <>
      {imagen}
      {/* El filo dorado de «me estás señalando». Va en un hijo y no en el
          enlace para no competir con el recorte de la imagen. */}
      <span className={estilos.filo} aria-hidden="true" />
    </>
  )

  if (externo) {
    return (
      <a
        href={promo.enlaceUrl}
        className={estilos.enlace}
        aria-label={alternativo || promo.titulo}
        target="_blank"
        // `noopener` no es opcional: sin él la pestaña nueva conserva
        // `window.opener` y puede reescribir la pestaña de origen.
        rel="noopener noreferrer"
      >
        {contenido}
      </a>
    )
  }

  return (
    <Link
      href={promo.enlaceUrl}
      className={estilos.enlace}
      aria-label={alternativo || promo.titulo}
    >
      {contenido}
    </Link>
  )
}
