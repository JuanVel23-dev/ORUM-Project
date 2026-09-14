'use client'

import { Heart } from 'lucide-react'
import { toque } from '@/lib/shared/haptica'
import { useFavoritos } from './favoritos-contexto'
import estilos from './boton-favorito.module.css'

/*
  EL CORAZÓN  ·  encargo nº 3
  ---------------------------------------------------------------------------
  EL PROBLEMA DE FONDO: la tarjeta entera ES un enlace, y aquí hace falta una
  acción dentro de ella.

  Lo que NO se ha hecho, y por qué:

   · `<button>` dentro del `<a>` — marcado inválido. Un control interactivo no
     puede anidarse dentro de un enlace: el navegador reparenta el DOM, el
     lector de pantalla anuncia un híbrido y en algunos motores el botón deja de
     recibir el evento.
   · `<a>` con un `onClick` que llame a `preventDefault` — funciona hasta que
     falla: con JavaScript aún sin hidratar, el toque navega. Y ahí el socio ya
     está en otra pantalla.

  LO QUE SÍ: **el corazón no está dentro del enlace. Es su HERMANO** dentro de
  un contenedor posicionado (`.marco` en `comercio-card.module.css`). El enlace
  ocupa la tarjeta, el corazón se sitúa encima en la esquina con `position:
  absolute` y un `z-index`. Pulsarlo no navega porque **el evento nunca llega al
  enlace**, no porque se le haya parado a mano. Es estructura, no parche: no
  depende de que el JavaScript esté cargado ni de que nadie olvide un
  `stopPropagation`.

  Queda un `stopPropagation` en el `onClick` de todas formas: si algún día
  alguien vuelve a meter esto dentro del enlace, el fallo será visible en
  desarrollo en vez de silencioso en producción.

  ÁREA TÁCTIL: el dibujo mide 20px para no competir con el logo ni con el
  nombre; el área llega a `var(--tap-min)` con un `::after` centrado, que es el
  patrón exacto de `Copiar`. Agrandar el botón en vez del área taparía la
  cabecera de la tarjeta.

  EL ROJO AQUÍ SÍ ES DATO —lo dice la dirección de arte v3 §2.3— y por eso no es
  oro. Aun así el color NO es el único portador: el corazón pasa de contorno a
  RELLENO (cambio de forma), lleva `aria-pressed` y su etiqueta dice qué hace,
  no cómo está.
*/

export function BotonFavorito({
  comercioId,
  nombre,
  className,
}: {
  comercioId: number
  /** Para la etiqueta: "Guardar Casa Duarte en tus favoritos". */
  nombre: string
  className?: string
}) {
  const favoritos = useFavoritos()

  /* Sin proveedor no hay corazón. Ocurre si esta tarjeta se reutiliza fuera del
     catálogo; es mejor una tarjeta sin acción que una pantalla rota. */
  if (!favoritos) return null

  const marcado = favoritos.esFavorito(comercioId)
  const enCurso = favoritos.enCurso(comercioId)
  const fallo = favoritos.fallo(comercioId)

  const etiqueta = marcado
    ? `Quitar ${nombre} de tus favoritos`
    : `Guardar ${nombre} en tus favoritos`

  return (
    <span className={[estilos.marco, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={estilos.boton}
        data-pulsable="sm"
        /*
          `aria-pressed` y no `aria-checked`: esto es un interruptor de dos
          estados sobre una acción, no una casilla de un formulario.
        */
        aria-pressed={marcado}
        aria-label={etiqueta}
        data-marcado={marcado}
        data-en-curso={enCurso}
        /*
          FEEDBACK EN `pointerdown`, no en `click` — regla dura del proyecto.
          El háptico y el encogido ocurren aquí; el cambio de estado, en el
          `onClick`, que es el único evento que el teclado también dispara.

          `preventDefault` NO se llama: este botón no está dentro de un campo,
          así que no hay foco que robar, y prevenir el `pointerdown` cancelaría
          el `click` sintetizado en algunos navegadores.
        */
        onPointerDown={() => toque()}
        onClick={(e) => {
          /* Cinturón: hoy el botón no es descendiente del enlace y esto no hace
             nada. Ver la nota de arriba. */
          e.stopPropagation()
          favoritos.alternar(comercioId)
        }}
      >
        <Heart
          className={estilos.icono}
          aria-hidden="true"
          /* El relleno es lo que distingue marcado de no marcado SIN color:
             contorno vacío frente a corazón sólido. */
          fill={marcado ? 'currentColor' : 'none'}
          strokeWidth={marcado ? 1.5 : 2}
        />
      </button>

      {/*
        EL FALLO SE DICE, y se dice de las dos maneras.

        Visualmente: una etiqueta que sale bajo el corazón. Va en `position:
        absolute` para que aparecer no desplace ni un píxel de la tarjeta — un
        salto de layout en una rejilla de cien tarjetas es peor que el propio
        fallo.

        Y para quien no la ve: `role="status"`, que anuncia sin robar el foco.
        El botón sigue enfocado y el reintento es otro Enter.
      */}
      {fallo && (
        <span className={estilos.fallo} role="status">
          {fallo}
        </span>
      )}
    </span>
  )
}
