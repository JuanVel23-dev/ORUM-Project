'use client'

import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useMediaQuery } from '@/components/use-media-query'
import {
  MS_POR_IMAGEN_HEROE,
  siguienteIndice,
  type RecursoPublico,
} from '@/lib/sitio/recursos'
import estilos from './portada-heroe.module.css'

/*
  LA IMAGEN PRINCIPAL DE LA PORTADA
  ---------------------------------------------------------------------------
  Encargo del propietario (25/09/2026): poder cambiar la imagen principal, o
  poner varias para que se vayan alternando cada cierto tiempo. Las sube y las
  enciende `/admin/recursos`; aquí solo llegan las que están visibles.

  TRES COMPORTAMIENTOS, Y LOS TRES IMPORTAN:

    · Ninguna imagen → este componente no se monta. Lo decide `HeroPublico`,
      que cae al collage de comercios aliados. La portada nunca se queda con
      un hueco.
    · Una imagen    → se pinta quieta. Sin temporizador, sin controles, sin
      una sola línea de JavaScript corriendo en bucle en la primera pantalla
      del sitio. Es el caso más probable y es el que tiene que salir gratis.
    · Varias        → se alternan con un fundido cruzado.

  POR QUÉ UN FUNDIDO Y NO UN CARRUSEL QUE SE DESLIZA. Un desplazamiento
  lateral es movimiento vestibular y compite con la lectura del titular, que
  está justo al lado y es lo único que esta pantalla necesita que se lea. La
  opacidad cambia lo que se ve sin mover nada: es la regla de «solo transform
  y opacity» resuelta por el lado barato.

  EL BOTÓN DE PAUSA NO ES OPCIONAL. WCAG 2.2.2 exige poder parar cualquier
  contenido que se mueva o se actualice solo durante más de cinco segundos, y
  seis es justo lo que dura cada imagen. No basta con pararlo al señalar con
  el ratón: quien navega con teclado o con lector de pantalla no señala nada.

  Y `prefers-reduced-motion` lo para de raíz: ahí no rota, se queda con la
  primera. Eso NO es quedarse sin feedback —no hay ningún gesto del usuario
  que quedara sin respuesta—, es que la rotación entera era el movimiento.
*/

export function PortadaHeroe({ imagenes }: { imagenes: RecursoPublico[] }) {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)

  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Una sola imagen no rota, así que no hay temporizador que montar. La
  // condición vive en el efecto y no fuera porque los hooks no se pueden
  // llamar condicionalmente.
  const rota = imagenes.length > 1 && !pausado && !reduce

  useEffect(() => {
    if (!rota) return

    const id = setInterval(() => {
      setIndice((actual) => siguienteIndice(actual, imagenes.length))
    }, MS_POR_IMAGEN_HEROE)

    return () => clearInterval(id)
  }, [rota, imagenes.length])

  /*
    Si alguien apaga imágenes desde el panel mientras la página está abierta,
    el índice puede quedar apuntando fuera de la lista. Se recoloca en vez de
    pintar `undefined`.
  */
  const actual = indice < imagenes.length ? indice : 0

  return (
    <div className={estilos.portada}>
      {/*
        TODAS las imágenes se montan y se apilan; lo que cambia es cuál está
        opaca. Montar solo la visible obligaría al navegador a descargar la
        siguiente en el momento del cambio, y el fundido entraría a un hueco.

        `aria-hidden` en el apilado entero: el texto alternativo de cada
        cartel describe una fotografía decorativa de la portada, y anunciar
        tres seguidas mientras el titular está justo al lado es ruido. El
        contenido real de esta pantalla es el h1.
      */}
      <div className={estilos.pila} aria-hidden="true">
        {imagenes.map((imagen, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- URL de Storage arbitraria, no un asset local
          <img
            key={imagen.id}
            src={imagen.url}
            alt=""
            className={estilos.imagen}
            data-visible={i === actual}
            /* La primera entra con la pantalla: es la imagen más grande de la
               portada y diferirla la convierte en el peor LCP del sitio. Las
               demás no se ven hasta dentro de seis segundos como mínimo. */
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            decoding="async"
          />
        ))}
      </div>

      {/* Con una sola imagen no hay nada que pausar, y con movimiento
          reducido tampoco: el control sobraría y sería una promesa falsa. */}
      {imagenes.length > 1 && !reduce && (
        <button
          type="button"
          className={estilos.pausa}
          onClick={() => setPausado((p) => !p)}
          /* El nombre dice qué HACE el botón, no en qué estado está: es lo que
             espera quien lo oye antes de pulsarlo. */
          aria-label={pausado ? 'Reanudar las imágenes' : 'Pausar las imágenes'}
        >
          {pausado ? (
            <Play size={16} aria-hidden="true" />
          ) : (
            <Pause size={16} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
}
