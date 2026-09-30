'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Pause, Play } from 'lucide-react'
import { useMediaQuery } from '@/components/use-media-query'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import estilos from './carrusel-novedades.module.css'

/*
  NOVEDADES  ·  los anuncios de ORUM, como un carrusel de imágenes
  ---------------------------------------------------------------------------
  Rediseño del 27/09/2026 (`Miembros.dc.html`). Encargo del propietario:
  «cuando me refería a los anuncios es como la principal, que es un apartado
  de imágenes». Sustituye al `AnuncioBanner` de texto: ahora cada anuncio es
  una foto a todo el ancho del contenido que se releva sola, con su título
  encima, y el título lleva al historial completo (`/miembros/novedades`).

  Es el mismo mecanismo que `CarruselFotos` del Portal Público —fundido
  cruzado, solo `opacity`, fotos apiladas en la misma caja— con las mismas
  salvaguardas de WCAG 2.2.2:
    · Botón de pausa VISIBLE (el hover no existe en táctil).
    · Se detiene mientras el ratón está encima o el foco está dentro.
    · Con `prefers-reduced-motion` NO arranca: se pasa con los puntos.

  Un anuncio sin imagen no se salta: se pinta sobre el degradado negro de la
  casa. Quitarlo haría que el carrusel contara menos novedades de las que hay.

  No se pinta con cero anuncios — sin sección, sin hueco. Tope de cinco: es
  una portada, no el historial, y el historial está a un toque.
*/

const INTERVALO_MS = 4500
const TOPE = 5

export function CarruselNovedades({ anuncios }: { anuncios: AnuncioResumen[] }) {
  const reducirMovimiento = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [actual, setActual] = useState(0)
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false)
  const [enfocado, setEnfocado] = useState(false)

  const lista = anuncios.slice(0, TOPE)
  const total = lista.length
  const rotando = total > 1 && !pausadoPorUsuario && !enfocado && !reducirMovimiento

  useEffect(() => {
    if (!rotando) return
    const temporizador = window.setInterval(() => {
      setActual((i) => (i + 1) % total)
    }, INTERVALO_MS)
    return () => window.clearInterval(temporizador)
  }, [rotando, total])

  if (total === 0) return null

  const vigente = lista[Math.min(actual, total - 1)]

  return (
    <section className={estilos.seccion} aria-labelledby="titulo-novedades">
      <div className={estilos.cabecera}>
        <TituloSeccion id="titulo-novedades" texto="Novedades del club" />
        <p className={estilos.apoyo}>Lo último que se sumó al club.</p>
      </div>

      <div
        className={estilos.carrusel}
        role="group"
        aria-roledescription="carrusel"
        aria-label="Novedades del club"
        onMouseEnter={() => setEnfocado(true)}
        onMouseLeave={() => setEnfocado(false)}
        onFocus={() => setEnfocado(true)}
        onBlur={(e) => {
          // Solo cuando el foco sale del carrusel entero, no al pasar entre sus botones.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEnfocado(false)
        }}
      >
        {/* Las diapositivas son decorativas: el contenido que se lee —el
            título— va en el enlace de abajo. */}
        <div className={estilos.diapositivas} aria-hidden="true">
          {lista.map((anuncio, i) => (
            <div key={anuncio.id} className={estilos.diapositiva} data-activa={i === actual}>
              {anuncio.imagenUrl && (
                <>
                  {/*
                    DOS COPIAS DE LA MISMA IMAGEN. Los anuncios no son fotos:
                    muchos son carteles con texto, y recortarlos a la caja
                    apaisada partía las frases. La de delante va ENTERA
                    (`contain`); la de detrás, ampliada y desenfocada, llena
                    los márgenes con sus propios colores para que no queden
                    dos bandas vacías. El navegador la descarga una sola vez.
                  */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local */}
                  <img
                    src={anuncio.imagenUrl}
                    alt=""
                    className={estilos.fondo}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local */}
                  <img
                    src={anuncio.imagenUrl}
                    alt=""
                    className={estilos.foto}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <div className={estilos.velo} aria-hidden="true" />

        {/* Mientras rota solo, no se anuncia: el lector hablaría cada cuatro
            segundos sin que nadie se lo pidiera. Parado, sí. */}
        <div className={estilos.pie} aria-live={rotando ? 'off' : 'polite'}>
          <Link href="/miembros/novedades" className={estilos.enlace}>
            <span className={estilos.etiqueta}>{vigente.titulo}</span>
            <ArrowRight size={16} aria-hidden="true" className={estilos.flecha} />
          </Link>
        </div>

        {total > 1 && (
          <div className={estilos.controles}>
            <button
              type="button"
              className={estilos.pausa}
              onClick={() => setPausadoPorUsuario((p) => !p)}
              aria-label={pausadoPorUsuario ? 'Reanudar las novedades' : 'Pausar las novedades'}
            >
              {pausadoPorUsuario ? (
                <Play size={14} aria-hidden="true" />
              ) : (
                <Pause size={14} aria-hidden="true" />
              )}
            </button>

            <div className={estilos.puntos}>
              {lista.map((anuncio, i) => (
                <button
                  key={anuncio.id}
                  type="button"
                  className={estilos.punto}
                  onClick={() => setActual(i)}
                  aria-label={`Novedad ${i + 1} de ${total}`}
                  aria-current={i === actual ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
