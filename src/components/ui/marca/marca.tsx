import Image from 'next/image'
import estrella from './estrella.png'
import estrellaPlata from './estrella-plata.png'
import monograma from './monograma.png'
import monogramaPlata from './monograma-plata.png'
import orumBlanco from './orum-blanco.png'
import orumDorado from './orum-dorado.png'
import orumNegro from './orum-negro.png'
import orumPlata from './orum-plata.png'
import estilos from './marca.module.css'

/*
  LA IDENTIDAD VISUAL DE ORUM  ·  logo, monograma y estrella del cliente
  ---------------------------------------------------------------------------
  Los archivos originales viven en Supabase (`recursos-sitio/logo/…` y
  `recursos-sitio/general/…`), pero venían en lienzos de 1280×720 con casi
  todo el lienzo transparente —el monograma y la estrella, incluso
  descentrados—. Se recortaron a su contenido visible (con un margen para la
  sombra incorporada) y se guardan aquí, junto a quien los usa:

    · `next/image` los sirve optimizados y con su tamaño intrínseco conocido,
      así que no hay salto de maquetación al cargar.
    · No dependen de la red de Supabase para pintar la cabecera: el logotipo
      es parte del LCP de cada página pública.

  Si el cliente cambia el logo, se reemplaza el PNG aquí (recortado igual).

  LA REGLA DEL METAL: SOBRE NEGRO, PLATA; SOBRE BLANCO, ORO. El logo dorado
  sobre la banda negra «casi no se veía» (propietario, 26/09): el oro del
  cliente es oscuro y de brillo cálido, y sobre negro pierde el contorno. Las
  piezas `-plata` se generaron desaturando las doradas —conservan su
  sombreado metálico— y aclarándolas hacia un gris plata claro. Sobre blanco
  la plata desaparecería, así que ahí sigue mandando el oro.

  Los tamaños los pone quien los usa, con una clase y SOLO el alto: el ancho
  sale de la proporción del archivo (`width: auto` en `marca.module.css`).
*/

type Variante = 'plata' | 'dorado' | 'blanco' | 'negro'

const LOGOS = {
  plata: orumPlata,
  dorado: orumDorado,
  blanco: orumBlanco,
  negro: orumNegro,
} as const

/** El metal de las piezas pequeñas: plata sobre negro, oro sobre blanco. */
export type Tono = 'oro' | 'plata'

type LogoProps = {
  /**
   * `plata` sobre negro (la cabecera y el pie de la fachada); `dorado` sobre
   * blanco; `blanco` y `negro` quedan para fondos donde ninguno de los dos
   * metales se lea.
   */
  variante?: Variante
  /** Clase que fija el ALTO. */
  className?: string
  /** Para el logo de la cabecera, que está en la primera pantalla. */
  preload?: boolean
}

/**
 * El logotipo «ORUM» con su estrella dentro de la O.
 *
 * `alt="ORUM"`: es el nombre de la marca y, dentro de un enlace, su nombre
 * accesible. Donde el nombre ya esté escrito al lado, pásalo por un
 * contenedor `aria-hidden`.
 */
export function LogoOrum({ variante = 'plata', className, preload = false }: LogoProps) {
  return (
    <Image
      src={LOGOS[variante]}
      alt="ORUM"
      className={[estilos.imagen, className].filter(Boolean).join(' ')}
      sizes="240px"
      preload={preload}
    />
  )
}

/**
 * EL LOGOTIPO QUE SIGUE AL TEMA: plata en oscuro, oro en claro.
 *
 * Existe para el cromo que —a diferencia de una franja fija— cambia de fondo
 * con el tema del portal: la cabecera del Portal de Miembros es material
 * blanco en claro y material casi negro en oscuro. Ahí ninguna variante fija
 * sirve a los dos casos.
 *
 * Las DOS imágenes se montan a la vez, superpuestas en la misma celda de
 * grid, y CSS decide cuál se ve — el mismo selector de tres ramas que ya usa
 * `globals.css` para todo lo que depende de `data-theme` (explícito en
 * `[data-theme]`, o la preferencia del sistema si el script anti-flash
 * todavía no estampó el atributo). Cero JavaScript: no hace falta saber el
 * tema en el servidor para elegir la imagen correcta.
 *
 * Las DOS llevan `alt="ORUM"`: nunca están visibles a la vez, así que no hay
 * nombre accesible duplicado — la que CSS oculta con `display: none` sale
 * también del árbol de accesibilidad, sea cual sea el motivo del ocultado.
 */
export function LogoOrumTema({ className, preload = false }: { className?: string; preload?: boolean }) {
  return (
    <span className={[estilos.logoTema, className].filter(Boolean).join(' ')}>
      <Image
        src={orumDorado}
        alt="ORUM"
        className={[estilos.imagen, estilos.logoTemaOro].join(' ')}
        sizes="240px"
        preload={preload}
      />
      <Image
        src={orumPlata}
        alt="ORUM"
        className={[estilos.imagen, estilos.logoTemaPlata].join(' ')}
        sizes="240px"
        preload={preload}
      />
    </span>
  )
}

/** El monograma: la «O» con la estrella dentro. Decorativo. */
export function MonogramaOrum({ className, tono = 'oro' }: { className?: string; tono?: Tono }) {
  return (
    <Image
      src={tono === 'plata' ? monogramaPlata : monograma}
      alt=""
      aria-hidden="true"
      className={[estilos.imagen, className].filter(Boolean).join(' ')}
      sizes="120px"
    />
  )
}

/** La estrella de cuatro puntas. Decorativa: sustituye al «✦» tipográfico. */
export function EstrellaOrum({ className, tono = 'oro' }: { className?: string; tono?: Tono }) {
  return (
    <Image
      src={tono === 'plata' ? estrellaPlata : estrella}
      alt=""
      aria-hidden="true"
      className={[estilos.imagen, className].filter(Boolean).join(' ')}
      sizes="48px"
    />
  )
}

/**
 * EL ADORNO DE TÍTULO: la estrella AL LADO de un encabezado de sección, no
 * encima (encargo del propietario). Va DENTRO del `<h2>`, como primer hijo,
 * así se alinea con la primera línea del título y lo acompaña al centrarse o
 * al partirse en dos renglones. Es un acento de marca —la misma estrella que
 * vive en la O del logotipo—, nunca un portador de significado: `aria-hidden`
 * y `alt=""`, así que no altera el nombre accesible del título.
 */
export function AdornoEstrella({ tono = 'oro', className }: { tono?: Tono; className?: string }) {
  return (
    <span aria-hidden="true" className={[estilos.adorno, className].filter(Boolean).join(' ')}>
      <EstrellaOrum tono={tono} className={estilos.estrellaAdorno} />
    </span>
  )
}
