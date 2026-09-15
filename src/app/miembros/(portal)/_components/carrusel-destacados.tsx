import Link from 'next/link'
import { TicketPercent } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Carril, CarrilPista } from '@/components/ui/carril'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { Skeleton } from '@/components/ui/feedback'
import { formatearBeneficioCorto } from '@/lib/comercios/beneficios-formato'
import {
  MINIMO_DESTACADOS,
  TOPE_DESTACADOS,
  apoyoDestacados,
} from '@/lib/comercios/estanterias'
import { retardoEscalonado } from '@/lib/shared/motion'
import { hrefFicha, type ComercioListado } from './comercio-card'
import estilos from './carrusel-destacados.module.css'

/*
  LA PORTADA DEL PORTAL  ·  "Conoce a tus aliados"
  ---------------------------------------------------------------------------
  Lo primero que el socio ve al abrir la aplicación. No es una tercera
  estantería: una estantería es un atajo —fila comprimida, sin imagen,
  subordinada a la rejilla— y esto es una portada, con cubierta dominante y
  peso editorial. La rejilla se lee; una portada se mira.

  SERVER COMPONENT, y no por purismo: toda la animación es CSS, así que el
  coste de hidratar hasta seis tarjetas sería un gasto a cambio de nada.
  Cero `'use client'`, cero bytes de JavaScript añadidos al bundle, la
  animación en el compositor y no en el hilo principal, y la pieza funciona sin
  JavaScript igual que el carril.

  El deslizamiento sigue siendo SCROLL NATIVO. El navegador ya da seguimiento
  1:1, resistencia elástica y la proyección de momento del sistema operativo,
  que es la que el dedo espera; reimplementarlo con `proyectarMomento` sería
  peor y habría que auditarlo entero.

  Vive en `_components/` de la ruta y no en `src/components/ui/` porque consume
  `ComercioListado`, que es el modelo de ESTA pantalla: un componente del
  sistema que importara de una ruta invertiría la dependencia. Lo genérico que
  usa —`Carril`, `Card`, `Badge`, `ComercioLogo`— sí está en `ui/`.

  SIN AUTOPLAY. Un carrusel que se mueve solo roba el control, obliga a
  perseguir el contenido y es un fallo conocido de WCAG 2.2.2. El encargo pide
  atractivo, no movimiento involuntario.

  SIN `view-transition-name` en estas tarjetas: un comercio que sale aquí y
  también en la rejilla tendría dos elementos con el mismo nombre en el mismo
  documento, y la transición se rompe SIN AVISAR. El nombre lo lleva solo la
  tarjeta de la rejilla.
*/

/**
 * Desfase de la entrada escalonada (A1), en milisegundos.
 *
 * Vive en TypeScript y no en el CSS por la misma razón que
 * `data-list.tsx`: el retardo por tarjeta se inyecta como token dinámico
 * (`--retardo`), que es el único uso de `style` que la norma admite. Así el
 * CSS no lleva ni un literal de duración.
 *
 * EL PASO SALE DEL SISTEMA, no de aquí. Este archivo tenía un `35` escrito a
 * mano con un comentario que afirmaba que era «el mismo número que resuelve
 * `Stack`/`Grid`». No lo era: `--escalonado` y `ESCALONADO_MS` valen **40**, y
 * la portada, los dos carriles y la rejilla entran en el mismo pantallazo — dos
 * cadencias distintas se leen como dos componentes que no se conocen.
 *
 * Es además la reincidencia exacta del bug que `CLAUDE.md` documenta: el paso
 * estuvo escrito a mano siete veces en `layout.module.css` y una octava,
 * distinto, en el menú. Por eso ahora se llama a `retardoEscalonado`, que trae
 * el paso Y el tope — y el tope es la parte importante, porque sin él el último
 * hermano llega tarde y eso se percibe como lentitud, no como elegancia.
 */

/** Cuántas siluetas dibuja el esqueleto: una completa y el arranque de las siguientes. */
const TARJETAS_ESQUELETO = 3

/**
 * Un comercio del catálogo, más la portada que **todavía no existe**.
 *
 * `comercios` tiene una sola imagen, `logo_url`; la fotografía del negocio o de
 * sus productos —lo que el encargo pide literalmente— necesita
 * `comercios.portada_url`, que está propuesto al backend (B9/C1) y no se puede
 * crear desde aquí (`SCOPE.md §2`).
 *
 * La tarjeta se escribe igualmente con su hueco de imagen y sus tres estados de
 * relleno, de modo que el día que la columna exista **la foto entra por datos y
 * no por una reescritura**. Hoy el campo llega `undefined` en el 100 % de los
 * casos y el coste en ejecución es cero.
 */
export type ComercioDestacado = ComercioListado & {
  portadaUrl?: string | null
}

type CarruselDestacadosProps = {
  /** Ya seleccionados y ordenados por `seleccionarDestacados`. */
  destacados: ComercioDestacado[]
  /**
   * Cuántos comercios hay en el resultado completo, o sea en la rejilla de
   * abajo. Solo decide cuál de las tres líneas de apoyo dice la verdad.
   */
  comerciosDelResultado: number
  /**
   * Lo decide la página, que es la única que sabe cuántas ciudades distintas
   * hay en el catálogo entero. Repetir "Bogotá" en las cuatro tarjetas no
   * informa de nada.
   */
  mostrarCiudades?: boolean
  /** El catálogo tal y como el socio lo dejó. Viaja en el `href` de la tarjeta. */
  volver?: string | null
}

export function CarruselDestacados({
  destacados,
  comerciosDelResultado,
  mostrarCiudades = true,
  volver = null,
}: CarruselDestacadosProps) {
  /*
    E2/E3, y la puerta se cierra AQUÍ además de en el selector.

    `seleccionarDestacados` ya devuelve lista vacía por debajo del mínimo, así
    que esto es redundante para el único consumidor de hoy. Se escribe porque el
    umbral no es una optimización: dos portadas no son una selección, se leen
    como contenido faltante y el hueco de ~390px a la derecha en escritorio
    parece un error de maquetación. Un consumidor futuro que pase una lista de
    dos no puede saltárselo sin querer.

    Y no se renderiza NADA: ni encabezado, ni pista, ni hueco reservado. Esos
    comercios están en la rejilla, como todos.
  */
  if (destacados.length < MINIMO_DESTACADOS) return null

  return (
    <Carril
      titulo="Conoce a tus aliados"
      apoyo={apoyoDestacados(destacados, comerciosDelResultado)}
      pistaClassName={estilos.pistaDestacados}
    >
      {destacados.slice(0, TOPE_DESTACADOS).map((comercio, indice) => (
        <TarjetaDestacada
          key={comercio.id}
          comercio={comercio}
          indice={indice}
          mostrarCiudades={mostrarCiudades}
          volver={volver}
        />
      ))}
    </Carril>
  )
}

/*
  LA TARJETA  ·  cubierta + pie, y el orden en que lee el ojo
  ---------------------------------------------------------------------------
   1. CUBIERTA — reconocer. Es preatentiva: ocupa más de la mitad de la tarjeta
      y el "ah, ese sitio" ocurre aquí, sin leer.
   2. NOMBRE — identificar. Primer texto y el más grande.
   3. BENEFICIO — convencer. Es el dato más valioso y AUN ASÍ no es el primero
      que se lee: "-20 %" no significa nada; "-20 % en Casa Duarte", sí.
   4. CATEGORÍA Y CIUDAD — descartar. Es un filtro mental, no un gancho: por eso
      lleva el menor peso visual.

  NINGÚN TEXTO SE APOYA SOBRE LA CUBIERTA, y es regla de entrada y no una mejora
  posterior: en cuanto haya fotos, el contraste dejaría de ser propiedad de un
  token y pasaría a depender de lo que suba cada comercio. Nombre, meta e
  insignia viven BAJO la cubierta, sobre `--surface` sólido. Lo único que monta
  encima es la placa del logotipo, que lleva su propio fondo opaco y su
  contraste ya firmado (`T4 §4.3`).

  La tarjeta entera es el enlace y el `h3` NO va envuelto en un segundo enlace:
  un enlace dentro de otro es marcado inválido. Tampoco hay ninguna acción
  secundaria dentro: un botón dentro de un enlace le robaría el área de toque a
  la tarjeta completa.

  `/miembros/comercios/[id]` existe (T15, commit 2341cc7) y el enlace se
  construye con `hrefFicha`, el mismo helper que la rejilla: dos funciones que
  montan el mismo enlace se desincronizan a la primera reorganización. Como el
  carrusel solo se renderiza SIN filtros, `volver` será `null` en la práctica y
  la URL sale limpia — eso es lo correcto, no un bug: `?volver=%2Fmiembros` es
  ruido en una URL que el socio puede pasar por WhatsApp.
*/
function TarjetaDestacada({
  comercio,
  indice,
  mostrarCiudades,
  volver,
}: {
  comercio: ComercioDestacado
  indice: number
  mostrarCiudades: boolean
  volver: string | null
}) {
  const beneficio = comercio.promociones[0]
  const descripcion = (comercio.descripcion ?? '').trim()
  const ciudades = mostrarCiudades ? comercio.ciudades.join(' · ') : ''
  const meta = [comercio.categoriaNombre, ciudades].filter(Boolean).join(' · ')

  return (
    <Link
      href={hrefFicha(comercio.id, volver)}
      className={estilos.enlace}
      /* Token dinámico, el único uso de `style` que la norma admite: inyectar
         un valor, nunca maquetar. Es lo que escalona la entrada (A1). */
      style={{ '--retardo': `${retardoEscalonado(indice)}ms` } as CSSProperties}
    >
      <Card padding="none" interactive className={estilos.superficie}>
        <Cubierta comercio={comercio} />

        <div className={estilos.pie}>
          {/*
            `h3`: la jerarquía de la página queda h1 del encabezado, h2 del
            carrusel, h2 de cada estantería, h2 "Todos los comercios" y h3 en
            cada tarjeta. Sin saltos de nivel.
          */}
          <h3 className={estilos.nombre}>{comercio.nombre}</h3>

          {/* La línea se renderiza siempre, aunque quede vacía: la anatomía es
              invariante entre I1, I2 e I3, y es lo que hace que una fila
              mezclada se lea uniforme. */}
          <p className={estilos.meta}>{meta}</p>

          {/*
            LA RANURA INFERIOR, que es una cascada y no una frase fija:
            beneficio → descripción a una línea → nada, conservando la altura.

            Y NO dice "Sin beneficio vigente hoy", que sí sigue viva en la
            rejilla y en la ficha. Tres razones: el encabezado de esta pieza no
            promete beneficios, así que no hay nada que desmentir; repetir la
            misma negación hasta seis veces en el primer pantallazo se lee como
            catálogo roto, no como información; y el orden del selector pone
            delante a quien sí tiene algo que enseñar.

            Tampoco hay píldora vacía ni guion: silencio, no promesa.
          */}
          <div className={estilos.ranura}>
            {beneficio ? (
              <Badge
                tone="gold"
                size="sm"
                className={estilos.beneficio}
                /*
                  El icono hace el trabajo que hacía la palabra «descuento»:
                  dice de qué va la cifra sin gastar ancho. Con él, «20%» en una
                  píldora dorada no es ambiguo — y con la frase entera la
                  insignia se salía de la tarjeta.
                */
                icon={<TicketPercent size={12} aria-hidden="true" />}
              >
                {formatearBeneficioCorto(beneficio.tipoCodigo, beneficio.valor)}
              </Badge>
            ) : descripcion ? (
              <p className={estilos.frase}>{descripcion}</p>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}

/*
  LA CUBIERTA, POR CAPAS  ·  I1 / I2 / I3
  ---------------------------------------------------------------------------
  I1  hay foto ............ la foto, `object-fit: cover`, con su velo
  I2  no hay foto ......... material con el logotipo centrado y grande.
                            HOY ES EL 100 % DE LOS CASOS
  I3  ni foto ni logotipo . la inicial sobre la placa, como en `ComercioLogo`

  I2 NO ES UN HUECO DE IMAGEN: es el retrato de marca, y es el único sitio del
  producto donde el logotipo de un aliado se muestra a tamaño completo —en la
  rejilla mide 72×48, en la ficha 144—. Hoy el logotipo es el único activo
  visual que un comercio tiene, y el trabajo de una portada es enseñar lo mejor
  que hay, no lamentar lo que falta. Ni una palabra dentro de la cubierta sobre
  imágenes que faltan: eso convertiría el estado en una disculpa.

  EL APILADO RESUELVE E6 SIN JAVASCRIPT, y es requisito, no sugerencia: el
  material de I2 es SIEMPRE la capa de fondo y la foto va encima. Si la foto
  falla no pinta nada —su `alt` está vacío— y el material queda a la vista. Sin
  escuchador de `onError`, sin `'use client'` y sin salto de layout, porque la
  proporción la fija el contenedor y no la imagen.
*/
function Cubierta({ comercio }: { comercio: ComercioDestacado }) {
  const portadaUrl = (comercio.portadaUrl ?? '').trim()

  return (
    <div className={estilos.cubierta}>
      {/* La capa que se desplaza con el dedo (A2). En I2 lleva el material; en
          I1, la fotografía. Es la única capa compuesta persistente por
          tarjeta, que es el presupuesto de gama baja. */}
      <span className={estilos.capa} aria-hidden="true">
        {portadaUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
          <img
            src={portadaUrl}
            /* Decorativa: el nombre del comercio está en texto justo debajo.
               Con `alt=""` un fallo de carga no pinta texto alternativo ni
               glifo de rotura, y el material de I2 queda a la vista (E6). */
            alt=""
            className={estilos.foto}
            loading="lazy"
            decoding="async"
          />
        )}
      </span>

      {/* El velo solo existe cuando hay foto: está para que la placa no flote
          sobre un punto claro de la imagen, y sin imagen no tiene trabajo. */}
      {portadaUrl && <span className={estilos.velo} aria-hidden="true" />}

      <ComercioLogo
        logoUrl={comercio.logoUrl}
        nombre={comercio.nombre}
        /* Con foto la placa es una firma en la esquina; sin foto, la placa ES
           la cubierta. La marca está presente en los tres estados, y eso es lo
           que le da un ancla común a una fila mezclada (E5). */
        variante={portadaUrl ? 'tarjeta' : 'portada'}
        className={portadaUrl ? estilos.placaSobreFoto : undefined}
      />
    </div>
  )
}

/**
 * El esqueleto de la portada, para `loading.tsx`.
 *
 * Vive aquí, junto al componente real, para que la silueta no pueda divergir:
 * usa las MISMAS clases —la pista con su sangrado, la cubierta con su
 * proporción y su radio, el pie con sus tres líneas—. Si mañana cambia la
 * geometría de la tarjeta, cambia también el esqueleto.
 *
 * Se dibuja SIEMPRE, aunque `loading.tsx` no reciba props y por tanto no pueda
 * saber si habrá filtros y si el carrusel se renderizará. Es la decisión
 * correcta: la entrada sin filtros es la dominante —es la pestaña "Inicio", el
 * destino de la PWA y el de cada toque de la barra—, y no dibujarlo haría
 * saltar el caso dominante. Con filtros, lo que se desplaza al resolverse es la
 * rejilla, y la búsqueda —donde está mirando quien filtra— no se mueve, porque
 * el carrusel va debajo de ella.
 *
 * No lo "arregles" quitando el bloque: cambiaría el salto de un caso raro a un
 * caso permanente.
 */
export function CarruselDestacadosEsqueleto() {
  return (
    <div className={estilos.esqueleto}>
      <Skeleton width="200px" height="24px" />
      <Skeleton width="260px" height="14px" />

      <CarrilPista className={`${estilos.pistaDestacados} ${estilos.pistaEsqueleto}`}>
        {Array.from({ length: TARJETAS_ESQUELETO }, (_, i) => (
          <div key={i} className={estilos.celda}>
            <Card padding="none" className={estilos.superficie}>
              <div className={estilos.cubierta}>
                {/* La cubierta REAL recorta este bloque con su proporción y su
                    radio, así que el relevo no salta. */}
                <Skeleton height="100%" />
              </div>

              <div className={estilos.pie}>
                <Skeleton width="70%" height="20px" />
                <Skeleton width="45%" height="14px" />
                <div className={estilos.ranura}>
                  <Skeleton width="88px" height="16px" radius="var(--radius-full)" />
                </div>
              </div>
            </Card>
          </div>
        ))}
      </CarrilPista>
    </div>
  )
}
