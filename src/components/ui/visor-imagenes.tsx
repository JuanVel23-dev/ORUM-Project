'use client'

import {
  createContext,
  useContext,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Modal } from './modal'
import estilos from './visor-imagenes.module.css'

/*
  VISOR DE IMÁGENES  ·  tocar una foto la amplía (30/09/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario, en la ficha del comercio: «cuando le dé clic al
  logo o a alguna foto, se agrande para que la pueda ver mejor».

  Dos piezas, porque las imágenes viven en sitios distintos de una página que
  es Server Component (la portada arriba, el logo en su canto, la galería
  abajo):

    · `VisorImagenes` — envuelve la ficha, conoce la lista y pinta el visor.
    · `Ampliable`     — el botón que rodea cada imagen y abre el visor en su
                        índice. La imagen de dentro llega renderizada desde el
                        servidor como `children`: aquí no se hidrata nada más.

  El visor es un `Modal desnudo`: negro, la imagen entera (`contain`, nunca
  recortada), la X, y con varias imágenes flechas, ←/→ y deslizar.
*/

export type ImagenVisor = {
  url: string
  alt: string
  /** El logotipo se enseña sobre su placa blanca, como en el resto del sistema. */
  tipo?: 'foto' | 'logo'
}

const ContextoVisor = createContext<((indice: number) => void) | null>(null)

export function VisorImagenes({
  imagenes,
  children,
}: {
  imagenes: ImagenVisor[]
  children: ReactNode
}) {
  const [indice, setIndice] = useState<number | null>(null)
  const inicioGesto = useRef<{ x: number; y: number } | null>(null)

  const total = imagenes.length
  const actual = indice === null ? null : imagenes[indice]
  const cerrar = () => setIndice(null)
  const mover = (paso: number) =>
    setIndice((i) => (i === null ? i : (i + paso + total) % total))

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (total < 2) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      mover(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      mover(-1)
    }
  }

  // Deslizar: se decide al soltar, por el desplazamiento horizontal.
  function alApretar(e: PointerEvent<HTMLDivElement>) {
    inicioGesto.current = { x: e.clientX, y: e.clientY }
  }

  function alSoltar(e: PointerEvent<HTMLDivElement>) {
    const inicio = inicioGesto.current
    inicioGesto.current = null
    if (!inicio || total < 2) return
    const dx = e.clientX - inicio.x
    const dy = e.clientY - inicio.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? 1 : -1)
  }

  return (
    <ContextoVisor.Provider value={setIndice}>
      {children}

      <Modal
        open={actual !== null}
        onClose={cerrar}
        ariaLabel={actual?.alt || 'Imagen ampliada'}
        width="1040px"
        className={estilos.dialogo}
        desnudo
      >
        {actual && (
          <div
            className={estilos.visor}
            onKeyDown={alTeclear}
            onPointerDown={alApretar}
            onPointerUp={alSoltar}
          >
            <button type="button" className={estilos.cerrar} onClick={cerrar} aria-label="Cerrar">
              <X size={20} aria-hidden="true" />
            </button>

            {/* `key`: cada imagen entra con su fundido al cambiar. */}
            <figure key={indice} className={estilos.figura}>
              <span
                className={[estilos.marco, actual.tipo === 'logo' && estilos.marcoLogo]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local */}
                <img
                  src={actual.url}
                  alt={actual.alt}
                  className={estilos.imagen}
                  draggable={false}
                  decoding="async"
                />
              </span>
              {total > 1 && (
                <figcaption className={estilos.contador} aria-live="polite">
                  {(indice ?? 0) + 1} de {total}
                </figcaption>
              )}
            </figure>

            {total > 1 && (
              <>
                <button
                  type="button"
                  className={`${estilos.flecha} ${estilos.anterior}`}
                  onClick={() => mover(-1)}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${estilos.flecha} ${estilos.siguiente}`}
                  onClick={() => mover(1)}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
    </ContextoVisor.Provider>
  )
}

/** El botón que rodea una imagen y la abre en el visor. */
export function Ampliable({
  indice,
  etiqueta,
  className,
  children,
}: {
  indice: number
  /** Nombre accesible: qué se amplía («Ampliar la foto de portada»). */
  etiqueta: string
  className?: string
  children: ReactNode
}) {
  const abrir = useContext(ContextoVisor)
  if (!abrir) return <>{children}</>

  return (
    <button
      type="button"
      className={[estilos.ampliable, className].filter(Boolean).join(' ')}
      onClick={() => abrir(indice)}
      aria-label={etiqueta}
    >
      {children}
    </button>
  )
}
