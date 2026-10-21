'use client'

import Link from 'next/link'
import { ArrowRight, Megaphone, X } from 'lucide-react'
import { usePreferenciaLocal } from '@/components/use-preferencia-local'
import { useHidratado } from '@/components/use-hidratado'
import { formatearFechaNovedad } from '@/lib/anuncios/fecha'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import styles from './anuncio-banner.module.css'

/*
  EL AVISO DE LA ÚLTIMA NOVEDAD, EN LA PORTADA  ·  rediseño del 21/10/2026
  ---------------------------------------------------------------------------
  Encargo: «no me gusta cómo se ven, el fondo negro no me agrada». Era una
  franja negra (`Section tono="negro"`) con un megáfono y el texto. Ahora es
  una TARJETA BLANCA con su sombra, como el resto de la fachada:

    · Su imagen en miniatura (16:9), o el megáfono en un aro dorado si no
      tiene.
    · «Novedad» y la fecha, el título y el comienzo del texto.
    · Toda la tarjeta lleva a ESA novedad en `/novedades` (`#novedad-{id}`),
      no al principio de la página; «Ver más» lo dice con palabras.
    · La X la cierra y se recuerda por id (`anuncio-cerrado-{id}`): una
      novedad nueva vuelve a aparecer aunque se cerrara la anterior.
*/
export function AnuncioBanner({
  anuncio,
  hrefHistorial,
}: {
  anuncio: AnuncioResumen | null
  /** `/novedades` en el Portal Público. */
  hrefHistorial: string
}) {
  const [cerrado, cerrar] = usePreferenciaLocal(
    anuncio ? `anuncio-cerrado-${anuncio.id}` : 'anuncio-cerrado-ninguno',
    false,
  )
  const hidratado = useHidratado()

  /*
    Sin `hidratado`, el snapshot de servidor de `usePreferenciaLocal` (siempre
    `false`) pintaría el aviso en cada carga y lo haría desaparecer justo
    después de hidratar para quien ya lo había cerrado — parpadeo y salto de
    layout en la página más visitada. Se espera a que el cliente confirme
    AMBAS cosas: que hay anuncio y que no fue cerrado.
  */
  if (!hidratado || !anuncio || cerrado) return null

  return (
    <aside className={styles.aviso} aria-label="Novedad del club">
      <div className={styles.tarjeta}>
        <span className={styles.miniatura} aria-hidden="true">
          {anuncio.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa de Storage
            <img src={anuncio.imagenUrl} alt="" decoding="async" />
          ) : (
            <span className={styles.icono}>
              <Megaphone size={20} />
            </span>
          )}
        </span>

        <div className={styles.textos}>
          <p className={styles.meta}>
            <span className={styles.etiqueta}>Novedad</span>
            <time dateTime={anuncio.createdAt}>{formatearFechaNovedad(anuncio.createdAt)}</time>
          </p>
          {/* El enlace se estira a toda la tarjeta (`::after`): se toca en cualquier sitio. */}
          <Link href={`${hrefHistorial}#novedad-${anuncio.id}`} className={styles.titulo}>
            {anuncio.titulo}
          </Link>
          <p className={styles.extracto}>{anuncio.cuerpo}</p>
        </div>

        <span className={styles.verMas} aria-hidden="true">
          Ver más
          <ArrowRight size={16} />
        </span>

        <button
          type="button"
          className={styles.cerrar}
          aria-label="Cerrar aviso"
          onClick={() => cerrar(true)}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
