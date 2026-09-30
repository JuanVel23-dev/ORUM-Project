'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, IdCard, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Overlay } from '@/components/ui/overlay'
import estilos from './boton-carnet.module.css'

/*
  EL CARNET, ENCIMA DE CUALQUIER PANTALLA  ·  29/09/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: en la cabecera, un botón «Carnet» que muestre el
  carnet en una ventana encima de la página; al darle «Ampliar», solo el QR.
  La foto del socio ya no está en la cabecera: aparece únicamente aquí.

  TRES PIEZAS, y no una, por un motivo concreto: un `<dialog>` hereda las
  propiedades personalizadas de sus ancestros del DOM aunque se pinte en la
  capa superior. Montada dentro de la cabecera (`data-theme="dark"` y el
  ámbito `sobreFoto`), la ventana salía NEGRA con el carnet blanco dentro.
  Así que el botón vive en la cabecera y la ventana fuera de ella, sobre el
  fondo claro del portal, y comparten el estado por contexto:

    · `ProveedorCarnet` — envuelve el portal y guarda el estado.
    · `BotonCarnet`     — el disparador, en la cabecera.
    · `VentanaCarnet`   — el `Overlay`, fuera de la cabecera.

  Dos vistas en la misma ventana: el carnet y, al «Ampliar», solo el QR, sin
  cerrar nada —con el cajero delante, cada toque cuenta—. Al reabrir siempre
  empieza en el carnet. Las dos vistas llegan renderizadas desde el
  servidor: aquí solo viven dos booleanos.
*/

type Estado = {
  abierto: boolean
  soloQr: boolean
  abrir: () => void
  cerrar: () => void
  verQr: (si: boolean) => void
}

const ContextoCarnet = createContext<Estado | null>(null)

export function ProveedorCarnet({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const [soloQr, setSoloQr] = useState(false)

  const estado: Estado = {
    abierto,
    soloQr,
    abrir: () => {
      setSoloQr(false)
      setAbierto(true)
    },
    cerrar: () => setAbierto(false),
    verQr: setSoloQr,
  }

  return <ContextoCarnet.Provider value={estado}>{children}</ContextoCarnet.Provider>
}

function useCarnet(): Estado {
  const estado = useContext(ContextoCarnet)
  if (!estado) throw new Error('BotonCarnet y VentanaCarnet van dentro de ProveedorCarnet')
  return estado
}

export function BotonCarnet() {
  const { abrir } = useCarnet()

  return (
    <Button
      variant="secondary"
      size="sm"
      pildora
      icon={<IdCard size={15} aria-hidden="true" />}
      onClick={abrir}
      aria-haspopup="dialog"
    >
      Carnet
    </Button>
  )
}

type VentanaProps = {
  /** El carnet completo (variante ampliada), creado en el servidor. */
  carnet: ReactNode
  /** Solo el QR en grande, creado en el servidor. */
  qr: ReactNode
}

export function VentanaCarnet({ carnet, qr }: VentanaProps) {
  const { abierto, soloQr, cerrar, verQr } = useCarnet()

  return (
    <Overlay
      open={abierto}
      onClose={cerrar}
      ariaLabel={soloQr ? 'Código QR del carnet' : 'Carnet de socio'}
      detent="large"
      width="460px"
    >
      <div className={estilos.contenido}>
        {soloQr ? qr : carnet}

        <div className={estilos.acciones}>
          {soloQr ? (
            <Button
              variant="secondary"
              pildora
              fullWidth
              icon={<ArrowLeft size={16} aria-hidden="true" />}
              onClick={() => verQr(false)}
            >
              Ver el carnet
            </Button>
          ) : (
            <>
              <Button
                variant="brand"
                pildora
                fullWidth
                icon={<Maximize2 size={16} aria-hidden="true" />}
                onClick={() => verQr(true)}
              >
                Ampliar
              </Button>
              {/* Un formulario no navega: `/miembros/perfil/foto` se abre
                  encima por la ranura `@modal`. Esta ventana se cierra antes,
                  para no apilar dos. */}
              <Link href="/miembros/perfil/foto" className={estilos.cambiarFoto} onClick={cerrar}>
                <Camera size={14} aria-hidden="true" />
                Cambiar foto
              </Link>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}
