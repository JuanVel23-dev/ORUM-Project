import type { ImgHTMLAttributes } from 'react'
import estilos from './imagen-completa.module.css'

/*
  UNA IMAGEN QUE SE VE ENTERA, PINTE DONDE PINTE  ·  23/10/2026
  ---------------------------------------------------------------------------
  Encargo del cliente: «todo lo que tenga que ver como imagen se muestra
  completo; ya en la edición el usuario decide si recortar o no». Antes cada
  sitio pintaba la foto con `object-fit: cover`, y una caja de otra
  proporción que la de la foto —la tarjeta 4:3 del directorio, la 3:4 de
  destacados, la miniatura cuadrada de la galería— le cortaba los lados.

  Aquí la foto va con `contain` (entera) y el hueco que deje lo llena la
  MISMA foto, difuminada: es el relleno que el editor pone en el archivo
  cuando se elige «Imagen completa», así que una foto ya ajustada a su
  marco se ve igual que antes y una de otra proporción no pierde nada.

  `className` va en la CAJA: es la que se coloca y se dimensiona en la
  hoja de quien la usa, como antes el `<img>` (posición, tamaño, `scale` al
  apuntar…). Sin JavaScript: sirve en un Server Component.
*/
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'className' | 'src' | 'alt'> & {
  src: string
  alt: string
  className?: string
}

export function ImagenCompleta({ src, alt, className, 'aria-hidden': oculta, ...img }: Props) {
  return (
    <span className={[estilos.caja, className].filter(Boolean).join(' ')} aria-hidden={oculta}>
      <span className={estilos.lienzo}>
        {/* eslint-disable-next-line @next/next/no-img-element -- URL de Storage o externa, no un asset local */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={estilos.relleno}
          loading={img.loading}
          decoding={img.decoding}
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- URL de Storage o externa, no un asset local */}
        <img src={src} alt={alt} className={estilos.imagen} {...img} />
      </span>
    </span>
  )
}
