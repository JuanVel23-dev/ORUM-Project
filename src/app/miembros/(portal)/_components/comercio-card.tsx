import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  ciudades: string[]
  promociones: PromocionListada[]
}

/**
 * Cuántas promociones se listan antes de resumir el resto.
 *
 * Dos. Mantiene comparables las alturas —que es el propósito de la divisoria—
 * y le da a la ficha del comercio una razón de existir ya desde el catálogo.
 */
const TOPE_PROMOCIONES = 2

/*
  LA TARJETA ENTERA ES EL ENLACE, y el `h3` NO va envuelto en un segundo
  enlace: un enlace dentro de otro es marcado inválido y el lector lo anunciaría
  dos veces.

  La ruta `/miembros/comercios/[id]` ya existe (T15), así que el enlace es
  válido. No siempre lo fue, y ese es el motivo de que esto siga escrito: estos
  dos `<Link>` se publicaron ANTES que su destino, y durante varios commits
  cada tarjeta del catálogo llevó al socio a un 404. Un catálogo entero de
  enlaces roto es peor defecto que una tarjeta inerte.

  Nada lo delataba: compila, pasa el lint y el tipo de `href` es `string`.
  Solo lo ve quien abre la pantalla o busca la carpeta. Si vuelves a enlazar
  hacia algo que aún no has construido, deja la tarjeta sin `href`.

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

export function ComercioCard({
  comercio,
  mostrarCiudades = true,
  volver = null,
}: {
  comercio: ComercioListado
  /**
   * Repetir "Bogotá" en las cuatro tarjetas no informa de nada. Lo decide la
   * página, que es la única que sabe cuántas ciudades distintas hay en el
   * catálogo entero.
   */
  mostrarCiudades?: boolean
  /**
   * El catálogo tal y como el socio lo dejó. Viaja en el `href` para que el
   * botón de vuelta de la ficha lo devuelva a sus filtros aunque haya llegado
   * por enlace directo. `null` cuando no hay nada que conservar.
   */
  volver?: string | null
}) {
  const visibles = comercio.promociones.slice(0, TOPE_PROMOCIONES)
  const restantes = comercio.promociones.length - visibles.length
  const conCiudades = mostrarCiudades && comercio.ciudades.length > 0

  /*
    LOS DOS NOMBRES DE TRANSICIÓN VIVEN AQUÍ Y EN NINGUNA OTRA TARJETA (M5).

    Esta es la tarjeta de la REJILLA, la única lista del catálogo donde cada
    comercio aparece exactamente una vez. El carrusel de portada y
    `ComercioCardCompacta` enlazan al mismo destino y NO los llevan: un comercio
    puede salir a la vez en la portada, en una estantería y aquí, y dos
    elementos con el mismo `view-transition-name` vivos en el mismo documento
    rompen la transición ENTERA sin avisar.

    Si algún día la rejilla deja de ser la lista exhaustiva —paginación,
    secciones que repitan comercios—, esto hay que revisarlo antes que nada.
  */
  const transicion = transicionComercio(comercio.id)

  return (
    /*
      EL MARCO EXISTE PARA EL CORAZÓN, y no es una envoltura gratuita.

      La tarjeta entera es un enlace, y un `<button>` dentro de un `<a>` es
      marcado inválido: el navegador reparenta el DOM y el lector de pantalla
      anuncia un híbrido. La solución no es parchear el evento con
      `preventDefault` —que falla mientras el JavaScript no ha hidratado, y
      entonces el toque NAVEGA—, sino sacar el botón del enlace: aquí el corazón
      es HERMANO del `<Link>`, colocado encima por posición absoluta. Pulsarlo no
      navega porque el evento nunca llega al enlace.

      El marco es el hijo de la rejilla, así que se lleva el `height: 100%` que
      antes tenía el enlace; si no, la divisoria inferior de la tarjeta dejaría
      de alinearse entre tarjetas, que es para lo que existe.
    */
    <div className={styles.marco}>
      <Link href={hrefFicha(comercio.id, volver)} className={styles.enlace}>
        <Card interactive className={styles.superficie}>
          <div className={styles.tarjeta}>
            <div className={styles.cabecera}>
              {/* La placa es el mismo objeto que el hero de la ficha: misma
                  imagen, mismo comercio, misma posición relativa (a la izquierda
                  del nombre). Solo cambia de tamaño, que es justo lo que una
                  transición de elemento compartido sabe hacer bien. */}
              <ComercioLogo
                logoUrl={comercio.logoUrl}
                nombre={comercio.nombre}
                nombreTransicion={transicion.placa}
              />

              {/* Nombre + marca, el mismo par y en el mismo orden que el hero.
                  Se nombra el BLOQUE y no el `h3`: en la ficha el nodo es un
                  `h1`, y emparejar dos elementos de nivel distinto obliga a
                  repetir el nombre en dos sitios que no se parecen. El bloque sí
                  es el mismo objeto en las dos pantallas. */}
              <div className={styles.titulos} style={{ viewTransitionName: transicion.titulos }}>
                  {/*
                    `h3`, y antes era `h2`.

                    El comentario que había aquí decía: "el único consumidor de
                    esta tarjeta es el catálogo, cuyo `PageHeader` pone el `h1` y
                    no intercala ningún `h2`; con `h3` el documento saltaba de
                    nivel". Era CIERTO con el layout viejo y por eso no se borra:
                    es lo que evita que alguien lo revierta creyendo que arregla
                    un salto.

                    La premisa dejó de serlo: ahora la rejilla lleva su propio
                    `h2` visible ("Todos los comercios") y cada estantería el
                    suyo, así que `h3` es el nivel correcto y no hay salto por
                    ninguna rama.
                  */}
                  <h3 className={styles.nombre}>{comercio.nombre}</h3>
                {comercio.marcaNombre && <p className={styles.marca}>{comercio.marcaNombre}</p>}
              </div>
            </div>

            {comercio.descripcion && <p className={styles.descripcion}>{comercio.descripcion}</p>}

            {conCiudades && (
              <p className={styles.ciudades}>
                {/* El texto que sigue ya dice las ciudades. */}
                <MapPin size={13} aria-hidden />
                <span className={styles.ciudadesTexto}>{comercio.ciudades.join(' · ')}</span>
              </p>
            )}

            {visibles.length === 0 ? (
              /*
                El caso FRECUENTE, no la excepción: con las promociones caducadas
                ya filtradas, la mayoría de las tarjetas está aquí. Tiene que verse
                terminada.

                Cómo se distingue de un beneficio, para que nadie lo confunda: un
                beneficio es una píldora dorada a la derecha con una cifra dentro;
                esto es texto plano, sin píldora, sin oro, en --text-3 y a
                --t-caption. Cuatro diferencias a la vez: forma, color, peso y
                tamaño.

                El copy dice lo que ocurre y nada más. NO dice "pregunta en el
                local": la caja del comercio RECHAZA una promoción no vigente, y
                prometer lo que el sistema deniega delante del cliente es
                exactamente el defecto que se acaba de cerrar.
              */
              <p className={styles.sinBeneficio}>
                {comercio.categoriaNombre && (
                  <span className={styles.categoria}>{comercio.categoriaNombre}</span>
                )}
                <span>Sin beneficio vigente hoy</span>
              </p>
            ) : (
              <ul className={styles.promociones}>
                {visibles.map((p) => (
                  <li key={p.id} className={styles.promocion}>
                    <span className={styles.promocionTitulo}>{p.titulo}</span>
                    {/*
                      El beneficio es la cifra que el miembro busca: va en oro.
                      Es el único uso ceremonial del oro en esta pantalla, y la
                      cifra va DENTRO de la píldora, así que el color nunca es el
                      único portador del significado.
                    */}
                    <Badge tone="gold" size="sm">
                      {formatearBeneficio(p.tipoCodigo, p.valor)}
                    </Badge>
                  </li>
                ))}

                {restantes > 0 && (
                  <li className={styles.masBeneficios}>
                    +{restantes} beneficio{restantes === 1 ? '' : 's'} más
                  </li>
                )}
              </ul>
            )}
          </div>
        </Card>
      </Link>

      {/*
        EL CORAZÓN, FUERA DEL ENLACE Y ENCIMA DE ÉL.

        Su sitio —esquina superior derecha— lo pone `.corazon` en el módulo de
        esta tarjeta, no el propio botón: la superficie la pone quien la usa.
      */}
      <BotonFavorito
        comercioId={comercio.id}
        nombre={comercio.nombre}
        className={styles.corazon}
      />
    </div>
  )
}

/**
 * La tarjeta de una estantería: placa, nombre y el beneficio destacado.
 *
 * Sin descripción y sin ciudades — eso es justo lo que la comprime. Su ancho lo
 * fija `--carril-tarjeta-w` desde la pista, no ella.
 *
 * SIN `view-transition-name`, y es deliberado (M5). Las estanterías —«Nuevos en
 * el club», «Beneficios del momento»— se surten de la MISMA lista que la
 * rejilla, así que un comercio nuevo con beneficio vigente sale hasta tres
 * veces en la misma pantalla contando la portada. Dos elementos con el mismo
 * nombre vivos a la vez no degradan la transición: la anulan entera, en
 * silencio, también para el resto de tarjetas. El nombre lo lleva solo
 * `ComercioCard`, la de la rejilla. Es la misma restricción que ya estaba
 * escrita en `carrusel-destacados.tsx`.
 *
 * Lo que el socio pierde al tocar aquí es el morfo de la placa, no el feedback:
 * `.enlace:active` sigue dando su respuesta de opacidad, y la ficha sigue
 * entrando con el fundido de página.
 */
export function ComercioCardCompacta({
  comercio,
  volver = null,
}: {
  comercio: ComercioListado
  volver?: string | null
}) {
  /*
    "El mejor beneficio" es, literalmente, el primero de la lista, que llega
    ordenada por título. No hay ningún dato con el que rankearlos: ninguna
    tabla tiene columna de prioridad, orden ni destacado. Inventar un criterio
    —el porcentaje más alto, por ejemplo— compararía un 30 % con un 2x1 y con
    un regalo, que no son la misma magnitud.
  */
  const destacado = comercio.promociones[0]

  return (
    /* Mismo marco y por la misma razón que en la tarjeta de la rejilla: el
       corazón no puede vivir dentro del enlace. Ver la nota de `ComercioCard`. */
    <div className={styles.marco}>
      <Link href={hrefFicha(comercio.id, volver)} className={styles.enlace}>
        {/* `sm`: 24px de relleno sobre una tarjeta de 200px dejarían 152 de
            contenido, y el nombre empezaría a truncarse antes de tiempo. */}
        <Card padding="sm" interactive className={styles.superficie}>
          <div className={styles.compacta}>
            <ComercioLogo logoUrl={comercio.logoUrl} nombre={comercio.nombre} />

            <h3 className={styles.nombre}>{comercio.nombre}</h3>

            {destacado ? (
              <Badge tone="gold" size="sm">
                {formatearBeneficio(destacado.tipoCodigo, destacado.valor)}
              </Badge>
            ) : (
              <span className={styles.sinBeneficioCompacta}>Sin beneficio vigente hoy</span>
            )}
          </div>
        </Card>
      </Link>

      <BotonFavorito
        comercioId={comercio.id}
        nombre={comercio.nombre}
        className={styles.corazon}
      />
    </div>
  )
}
