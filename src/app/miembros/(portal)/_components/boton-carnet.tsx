'use client'

import { useState, type ReactNode } from 'react'
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

  Dos vistas en la misma ventana, no dos ventanas: lo que se enseña en la
  caja es el QR, y pasar de una a otra sin cerrar nada es lo más rápido con
  el cajero delante. Al reabrir siempre empieza en el carnet.

  Las dos vistas llegan ya renderizadas desde el servidor (el layout crea los
  elementos): este componente solo guarda dos booleanos. No se hidrata ni el
  QR ni el retrato.

  `Overlay`: diálogo centrado en escritorio, hoja inferior en móvil.
*/

type Props = {
  /** El carnet completo (variante ampliada), creado en el servidor. */
  carnet: ReactNode
  /** Solo el QR en grande, creado en el servidor. */
  qr: ReactNode
  /** Clase del botón: la pone la cabecera, que decide su aspecto. */
  className?: string
}

export function BotonCarnet({ carnet, qr, className }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [soloQr, setSoloQr] = useState(false)

  const abrir = () => {
    setSoloQr(false)
    setAbierto(true)
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        pildora
        icon={<IdCard size={15} aria-hidden="true" />}
        onClick={abrir}
        aria-haspopup="dialog"
        className={className}
      >
        Carnet
      </Button>

      <Overlay
        open={abierto}
        onClose={() => setAbierto(false)}
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
                onClick={() => setSoloQr(false)}
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
                  onClick={() => setSoloQr(true)}
                >
                  Ampliar
                </Button>
                {/* Un formulario no navega: `/miembros/perfil/foto` se abre
                    encima por la ranura `@modal`. Se cierra esta ventana
                    antes, para no apilar dos. */}
                <Link
                  href="/miembros/perfil/foto"
                  className={estilos.cambiarFoto}
                  onClick={() => setAbierto(false)}
                >
                  <Camera size={14} aria-hidden="true" />
                  Cambiar foto
                </Link>
              </>
            )}
          </div>
        </div>
      </Overlay>
    </>
  )
}
