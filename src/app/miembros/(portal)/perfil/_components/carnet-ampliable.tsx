'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { Maximize2 } from 'lucide-react'
import { Overlay } from '@/components/ui/overlay'
import estilos from '../perfil.module.css'

/*
  AMPLIAR EL CARNET  ·  la única pieza de cliente de esta pantalla
  --------------------------------------------------------------------------
  Encargo del propietario, literal: «que se pueda agrandar y poner por encima
  como cuando abro mi usuario para cambiar tema o cerrar sesión». O sea, la
  mecánica del menú del avatar: se abre ENCIMA, con velo, y se cierra sin
  navegar.

  Por eso `<Overlay>` y no una ruta: en escritorio resuelve diálogo centrado y
  en móvil hoja inferior con detents. `detent="large"` porque aquí NO conviene
  ver el fondo: el carnet ocupa la atención entera mientras el cajero escanea.

  29/09/2026 · EL BOTÓN VIVE DENTRO DE LA TARJETA. La maqueta aprobada
  (`MiembrosCarnet.dc.html`) pone «Ampliar» y «Cambiar foto» en la misma fila
  que la credencial, como su última columna: «nada de un hueco vacío debajo
  de la credencial». La tarjeta la pinta el servidor, así que el botón no
  puede recibir el `setState` por props: lo lee de un CONTEXTO que abre este
  componente. `BotonAmpliarCarnet` es la única hoja de cliente dentro del
  carnet; el QR y el retrato siguen siendo marcado de servidor.

  LA FRECUENCIA MANDA SOBRE EL MOVIMIENTO. Abrir el carnet es de las acciones
  más repetidas del producto, así que aquí no se añade NI UNA animación
  propia: lo único que se mueve es lo que ya trae `Overlay`.
*/

const AbrirCarnet = createContext<(() => void) | null>(null)

type Props = {
  children: ReactNode
  ampliado: ReactNode
}

export function CarnetAmpliable({ children, ampliado }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <AbrirCarnet.Provider value={() => setAbierto(true)}>
      <div className={estilos.carnetCaja}>{children}</div>

      <Overlay
        open={abierto}
        onClose={() => setAbierto(false)}
        ariaLabel="Carnet de socio ampliado"
        detent="large"
        /* El carnet ampliado siempre cae en su rama apilada: un overlay más
           ancho que su contenido deja dos franjas muertas a los lados. */
        width="460px"
      >
        {ampliado}
      </Overlay>
    </AbrirCarnet.Provider>
  )
}

/**
 * «Ampliar», la acción más frecuente de la pantalla.
 *
 * Píldora de oro claro con texto en tinta (12,65:1) y filo `--gold-600`
 * (3,27:1 sobre crema, WCAG 1.4.11): el relleno pálido de la maqueta no marca
 * límite por sí solo contra el crema, y el filo es lo que lo sostiene. Es un
 * `<button>` real: hereda `:focus-visible`, el acuse de pulsación y el
 * teclado. `aria-haspopup` avisa de que abre algo encima en vez de navegar.
 */
export function BotonAmpliarCarnet() {
  const abrir = useContext(AbrirCarnet)
  if (!abrir) return null

  return (
    <button type="button" className={estilos.botonAmpliar} onClick={abrir} aria-haspopup="dialog">
      <Maximize2 size={15} aria-hidden="true" />
      Ampliar
    </button>
  )
}
