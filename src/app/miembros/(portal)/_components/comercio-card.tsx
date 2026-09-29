import Link from 'next/link'
import { TicketPercent } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { transicionComercio } from '@/lib/comercios/transiciones'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import { BotonFavorito } from './boton-favorito'
import styles from './comercio-card.module.css'

export type PromocionListada = {
  id: number
  titulo: string
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

export type ComercioListado = {
  id: number
  nombre: string
  descripcion: string | null
  marcaNombre: string | null
  categoriaNombre: string | null
  logoUrl: string | null
  createdAt: string | null
  /** Foto del local para la portada del carrusel. Opcional: la rejilla no la usa. */
  portadaUrl?: string | null
  ciudades: string[]
  promociones: PromocionListada[]
}


/*
  LA TARJETA ENTERA ES EL ENLACE, y el `h3` NO va envuelto en un segundo
  enlace: un enlace dentro de otro es marcado inválido y el lector lo anunciaría
  dos veces.

  La ruta `/miembros/comercios/[id]` existe (T15), así que el enlace es válido.

  `Card interactive` aporta hover, `:active` y la elevación. El anillo de foco,
  en cambio, lo pone el `<Link>`: el foco vive en el enlace y no en el `div` de
  la tarjeta, así que el `:focus-visible` propio de `Card` nunca llegaría a
  dispararse.
*/

/**
 * `/miembros/comercios/[id]`, conservando a dónde hay que volver.
 *
 * EXPORTADO, y no por comodidad: el carrusel de portada enlaza al mismo sitio,
 * y dos funciones que construyen el mismo enlace se desincronizan a la primera
 * reorganización. Quien enlace a una ficha usa esta; nadie monta el `?volver=`
 * a mano.
 */
export function hrefFicha(id: number, volver: string | null): string {
  const base = `/miembros/comercios/${id}`
  /*
    Sin filtros no se añade el parámetro: la ficha ya cae al catálogo limpio
    por defecto, y un `?volver=%2Fmiembros` es ruido en una URL que el socio
    puede pasarle a otro por WhatsApp.
  */
  return volver ? `${base}?volver=${encodeURIComponent(volver)}` : base
}

/**
 * «Categoría · Ciudad», la línea de contexto bajo el nombre (maqueta del
 * 29/09/2026). Con varias ciudades se nombran todas; sin datos, nada.
 */
function lineaContexto(comercio: ComercioListado, conCiudades: boolean): string {
  const partes = [comercio.categoriaNombre, conCiudades ? comercio.ciudades.join(' · ') : null]
  return partes.filter(Boolean).join(' · ')
}

/*
  EL BENEFICIO QUE SE ANUNCIA EN LA TARJETA es el primero de la lista, que
  llega ordenada por título. No hay ningún dato con el que rankearlos: ninguna
  tabla tiene columna de prioridad. Inventar un criterio —el porcentaje más
  alto, por ejemplo— compararía un 30 % con un 2x1 y con un regalo, que no son
  la misma magnitud. El resto está a un toque, en la ficha.
*/

/**
 * LA TARJETA DE LA REJILLA  ·  maqueta del 29/09/2026 (`Miembros.dc.html`)
 *
 * Foto 4:3 arriba, a todo el ancho; debajo, la placa del logo a la izquierda y
 * a su derecha el nombre en serif, «Categoría · Ciudad» y el beneficio en oro.
 * El corazón, sobre la foto. Nada de descripción ni lista de promociones: la
 * tarjeta se compara de un vistazo y el detalle vive en la ficha.
 */
export function ComercioCard({
  comercio,
  mostrarCiudades = true,
  volver = null,
}: {
  comercio: ComercioListado
  mostrarCiudades?: boolean
  volver?: string | null
}) {
  const destacado = comercio.promociones[0]
  const contexto = lineaContexto(comercio, mostrarCiudades && comercio.ciudades.length > 0)

  /*
    LOS DOS NOMBRES DE TRANSICIÓN VIVEN AQUÍ Y EN NINGUNA OTRA TARJETA (M5).
    Esta es la única lista del catálogo donde cada comercio aparece
    exactamente una vez: dos elementos con el mismo `view-transition-name`
    vivos en el mismo documento rompen la transición ENTERA sin avisar.
  */
  const transicion = transicionComercio(comercio.id)

  return (
    /*
      EL MARCO EXISTE PARA EL CORAZÓN: un `<button>` dentro de un `<a>` es
      marcado inválido, así que el corazón es HERMANO del enlace, colocado
      encima por posición absoluta. Pulsarlo no navega porque el evento nunca
      llega al enlace.
    */
    <div className={`${styles.marco} revelar-vista`}>
      <Link href={hrefFicha(comercio.id, volver)} className={styles.enlace}>
        <Card interactive padding="none" className={styles.superficie}>
          {/* LA FOTO ES LA PROTAGONISTA. Sin portada, el degradado negro de la
              casa, para que la tarjeta no se vea a medias. */}
          <div className={styles.cubierta}>
            {comercio.portadaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
              <img
                src={comercio.portadaUrl}
                alt=""
                className={styles.foto}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className={styles.cubiertaVacia} aria-hidden="true" />
            )}
          </div>

          <div className={styles.tarjeta}>
            {/* La placa es el mismo objeto que el hero de la ficha: misma
                imagen, misma posición relativa (a la izquierda del nombre). */}
            <ComercioLogo
              logoUrl={comercio.logoUrl}
              nombre={comercio.nombre}
              nombreTransicion={transicion.placa}
              className={styles.logoGrande}
            />

            {/* Se nombra el BLOQUE y no el `h3`: en la ficha el nodo es un
                `h1`, y el bloque sí es el mismo objeto en las dos pantallas. */}
            <div className={styles.titulos} style={{ viewTransitionName: transicion.titulos }}>
              {/* `h3`: la rejilla lleva su propio `h2` («Todos los comercios»). */}
              <h3 className={styles.nombre}>{comercio.nombre}</h3>
              {contexto && <p className={styles.contexto}>{contexto}</p>}

              {destacado ? (
                <p className={styles.beneficioLinea}>
                  <TicketPercent size={13} aria-hidden="true" />
                  {formatearBeneficio(destacado.tipoCodigo, destacado.valor)}
                </p>
              ) : (
                /* El caso frecuente, no la excepción. Dice lo que ocurre y
                   nada más: la caja RECHAZA una promoción no vigente, así que
                   no se promete «pregunta en el local». */
                <p className={styles.sinBeneficio}>Sin beneficio vigente hoy</p>
              )}
            </div>
          </div>
        </Card>
      </Link>

      <BotonFavorito comercioId={comercio.id} nombre={comercio.nombre} className={styles.corazon} />
    </div>
  )
}

/**
 * LA TARJETA DE ESTANTERÍA  ·  «Tus favoritos» y «Más recientes»
 *
 * Maqueta del 29/09/2026: pequeña, vertical y centrada — placa del logo,
 * nombre en serif y, debajo, el beneficio en píldora dorada (favoritos) o
 * «Categoría · Ciudad» con la insignia «Nuevo» en la esquina (recientes).
 *
 * Sin corazón: el sitio para marcar y desmarcar es la rejilla, y aquí la
 * esquina la ocupa «Nuevo». NINGÚN `view-transition-name`: un comercio puede
 * salir a la vez aquí y en la rejilla.
 */
export function ComercioCardCompacta({
  comercio,
  volver = null,
  modo = 'favorito',
}: {
  comercio: ComercioListado
  volver?: string | null
  /** `nuevo` pone la insignia «Nuevo» y la línea de contexto en vez del beneficio. */
  modo?: 'favorito' | 'nuevo'
}) {
  const destacado = comercio.promociones[0]
  const contexto = lineaContexto(comercio, comercio.ciudades.length > 0)

  return (
    <Link href={hrefFicha(comercio.id, volver)} className={`${styles.enlace} ${styles.enlaceCompacta}`}>
      <Card padding="none" interactive className={styles.superficie}>
        <div className={styles.compacta}>
          {modo === 'nuevo' && <span className={styles.nuevo}>Nuevo</span>}

          <ComercioLogo
            logoUrl={comercio.logoUrl}
            nombre={comercio.nombre}
            className={styles.logoCompacta}
          />

          <h3 className={styles.nombreCompacta}>{comercio.nombre}</h3>

          {modo === 'nuevo' ? (
            contexto && <p className={styles.contexto}>{contexto}</p>
          ) : destacado ? (
            <span className={styles.pildora}>
              {formatearBeneficio(destacado.tipoCodigo, destacado.valor)}
            </span>
          ) : (
            <span className={styles.sinBeneficio}>Sin beneficio vigente hoy</span>
          )}
        </div>
      </Card>
    </Link>
  )
}
