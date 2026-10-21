import Link from 'next/link'
import { ChevronRight, Megaphone } from 'lucide-react'
import { formatearFechaNovedad } from '@/lib/anuncios/fecha'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import styles from './aviso-novedad.module.css'

/*
  EL AVISO DE LA ÚLTIMA NOVEDAD, EN LA PORTADA  ·  21/10/2026
  ---------------------------------------------------------------------------
  Una tarjeta blanca con su sombra (el fondo negro de antes no gustó): la
  miniatura, «Novedad» y la fecha, el título y una línea del texto.

  LA TARJETA ENTERA ES EL ENLACE (segundo encargo del mismo día: «le doy a
  "Ver más" y no me lleva a ningún lado; quita el "Ver más" y que funcione
  al darle clic»). Antes era un enlace estirado con un `::after` sobre la
  tarjeta, y un «Ver más» decorativo encima: en el navegador del
  propietario el clic no llegaba. Ahora el `<a>` ES la tarjeta: no hay nada
  encima que pueda quedarse con el clic.

  NO SE PUEDE CERRAR (mismo encargo: «no considero que se deba poder quitar
  el anuncio, o que se quite y al recargar vuelva a aparecer»). Sin la X ni
  el recuerdo en `localStorage`, ya no hace falta esperar a hidratar: el
  aviso sale pintado desde el servidor, sin parpadeo.

  ⚠️ NINGÚN NOMBRE CON «anuncio» NI «banner» en lo que llega al navegador
  (este archivo se llamaba `anuncio-banner` y sus clases salían como
  `anuncio-banner-module__…`): los bloqueadores de publicidad ocultan o
  anulan lo que lleva esas palabras. Ver `CLAUDE.md`, publicidad.
*/
export function AvisoNovedad({ novedad }: { novedad: AnuncioResumen | null }) {
  if (!novedad) return null

  return (
    <Link
      href={`/novedades#novedad-${novedad.id}`}
      className={styles.aviso}
      aria-label={`Novedad: ${novedad.titulo}. Ver la novedad.`}
    >
      <span className={styles.miniatura} aria-hidden="true">
        {novedad.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa de Storage
          <img src={novedad.imagenUrl} alt="" decoding="async" />
        ) : (
          <span className={styles.icono}>
            <Megaphone size={20} />
          </span>
        )}
      </span>

      <span className={styles.textos}>
        <span className={styles.meta}>
          <span className={styles.etiqueta}>Novedad</span>
          <time dateTime={novedad.createdAt}>{formatearFechaNovedad(novedad.createdAt)}</time>
        </span>
        <span className={styles.titulo}>{novedad.titulo}</span>
        <span className={styles.extracto}>{novedad.cuerpo}</span>
      </span>

      {/* La flecha dice «se abre»: sin texto, la tarjeta entera es el botón. */}
      <span className={styles.flecha} aria-hidden="true">
        <ChevronRight size={20} />
      </span>
    </Link>
  )
}
