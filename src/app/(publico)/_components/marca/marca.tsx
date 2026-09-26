import Image from 'next/image'
import estrella from './estrella.png'
import monograma from './monograma.png'
import orumBlanco from './orum-blanco.png'
import orumDorado from './orum-dorado.png'
import orumNegro from './orum-negro.png'
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

  Los tamaños los pone quien los usa, con una clase y SOLO el alto: el ancho
  sale de la proporción del archivo (`width: auto` en `marca.module.css`).
*/

type Variante = 'dorado' | 'blanco' | 'negro'

const LOGOS = { dorado: orumDorado, blanco: orumBlanco, negro: orumNegro } as const

type LogoProps = {
  /**
   * `dorado` sobre negro (la cabecera y el pie de la fachada); `blanco` y
   * `negro` para fondos donde el dorado no se lea.
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
export function LogoOrum({ variante = 'dorado', className, preload = false }: LogoProps) {
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

/** El monograma: la «O» con la estrella dentro. Decorativo. */
export function MonogramaOrum({ className }: { className?: string }) {
  return (
    <Image
      src={monograma}
      alt=""
      aria-hidden="true"
      className={[estilos.imagen, className].filter(Boolean).join(' ')}
      sizes="120px"
    />
  )
}

/** La estrella dorada de cuatro puntas. Decorativa: sustituye al «✦» tipográfico. */
export function EstrellaOrum({ className }: { className?: string }) {
  return (
    <Image
      src={estrella}
      alt=""
      aria-hidden="true"
      className={[estilos.imagen, className].filter(Boolean).join(' ')}
      sizes="48px"
    />
  )
}
