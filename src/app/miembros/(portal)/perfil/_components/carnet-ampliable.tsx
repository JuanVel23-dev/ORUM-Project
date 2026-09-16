'use client'

import { useState, type ReactNode } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  en móvil hoja inferior con detents, que es exactamente la forma correcta de
  enseñar algo con una mano estando de pie en una caja. `detent="large"`
  porque aquí NO conviene ver el fondo: el carnet ocupa la atención entera
  mientras el cajero escanea.

  `ariaLabel` y no `title`: el carnet no lleva título visible dentro del
  overlay —sería cromo impreso sobre la credencial— y sin nombre accesible el
  lector anunciaría «diálogo» a secas. El `<h1>` de la página no sirve: el rol
  de diálogo lo tiene el `<dialog>`, no lo que hay dentro.

  LA FRECUENCIA MANDA SOBRE EL MOVIMIENTO. Abrir el carnet es de las acciones
  más repetidas del producto —se hace en cada caja—, así que aquí no se añade
  NI UNA animación propia: ni escalonado, ni entrada de la tarjeta, ni
  resorte. Lo único que se mueve es lo que ya trae `Overlay` (~0,30 s de
  entrada y ~0,20 de salida, sin rebote). La copia ampliada cuelga
  DIRECTAMENTE del overlay y no de `.carnetCaja`, así que tampoco hereda la
  entrada de 180 ms de la versión de página: dos animaciones encadenadas en la
  acción más repetida del producto es justo lo que hace que una pantalla
  rápida se sienta lenta.

  Los dos carnets llegan ya renderizados desde el servidor (`page.tsx` crea
  los elementos y los pasa como props): este componente solo guarda el
  booleano. No se hidrata ni el QR ni el retrato.
*/

type Props = {
  /** El carnet tal y como se ve en la página. */
  children: ReactNode
  /** El mismo carnet en su variante `ampliado`, para el overlay. */
  ampliado: ReactNode
  /** Acciones de mantenimiento que acompañan al carnet («Cambiar foto»). */
  acciones?: ReactNode
}

export function CarnetAmpliable({ children, ampliado, acciones }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <div className={estilos.carnetCaja}>
        {children}

        {/*
          El disparador va FUERA de la tarjeta, no impreso encima: lo que se
          enseña en una caja no lleva botones. Y es un `<button>` real —no un
          `div` con `onClick`—, así que hereda `:focus-visible`, el acuse de
          pulsación de `globals.css` §4b y el teclado.

          `size="lg"` (52px) y no `md` (44px): es la acción más frecuente de
          la pantalla y se pulsa de pie, con una mano y con prisa. El mínimo
          táctil es un suelo, no un objetivo.

          `variant="brand"` es el relleno dorado con texto en tinta
          (`--gold-600` + `--tinta-1`: 4,84:1 para 1.4.3 y 3,51:1 de filo
          sobre papel para 1.4.11). Está habilitado porque esto es el
          recorrido del socio; en Administración este mismo botón iría en
          tinta.

          `aria-haspopup="dialog"` avisa de que abre algo por encima en vez
          de navegar.
        */}
        <div className={estilos.acciones}>
          <Button
            variant="brand"
            size="lg"
            icon={<Maximize2 size={17} aria-hidden="true" />}
            onClick={() => setAbierto(true)}
            aria-haspopup="dialog"
          >
            Ampliar carnet
          </Button>

          {acciones}
        </div>
      </div>

      <Overlay
        open={abierto}
        onClose={() => setAbierto(false)}
        ariaLabel="Carnet de socio ampliado"
        detent="large"
        /*
          520px de diálogo menos los 24px de relleno a cada lado del cuerpo
          dejan 472px de carnet: unos 60px más de objeto que en la página, y
          sitio de sobra para que el QR llegue a su tope de 320px.
        */
        /* 460 y no 520: el carnet tope a 420 + el relleno del diálogo. Un overlay
           más ancho que su contenido deja dos franjas muertas a los lados. */
        width="460px"
      >
        {ampliado}
      </Overlay>
    </>
  )
}
