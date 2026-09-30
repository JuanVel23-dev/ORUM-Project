'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, IdCard, Maximize2, X } from 'lucide-react'
import { iniciales } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogoOrum, MonogramaOrum } from '@/components/ui/marca/marca'
import { Modal } from '@/components/ui/modal'
import { QrCode } from '@/components/ui/qr-code'
import type { DatosCarnet } from '@/lib/miembros/datos-carnet'
import estilos from './boton-carnet.module.css'

/*
  EL CARNET, ENCIMA DE CUALQUIER PANTALLA  ·  29/09/2026, rehecho el 30/09
  ---------------------------------------------------------------------------
  Encargo del propietario: en la cabecera, un botón «Carnet» que muestre el
  carnet encima de la página. La foto del socio aparece únicamente aquí.

  LA VENTANA ES EL CARNET (30/09/2026, «más elegante»): no hay una tarjeta
  dentro de un panel blanco. El `<dialog>` va `desnudo` y la tarjeta negra
  con plata es toda la superficie; la X vive dentro, en su esquina.

    · Plata y no oro: el logotipo plata solo se lee sobre negro («sobre
      negro, plata»), y por eso la tarjeta es negra.
    · Una sola familia, Montserrat: el nombre ya no va en Playfair ni el
      número en monoespaciada (cifras tabulares y tracking abierto bastan
      para dictarlo).
    · Sin estado ni «Vence en»: el carnet solo existe con membresía vigente
      (`obtenerDatosCarnet` devuelve `null` si no), y queda la fecha.
    · Tocar el QR lo amplía; tocar la foto lleva a cambiarla. Con ratón, al
      pasar por encima aparece un velo negro muy difuminado con el texto de
      la acción (el «frosted glass» de iOS/macOS: `backdrop-filter: blur` +
      negro translúcido); en táctil, donde no hay «encima», un icono pequeño
      en la esquina dice que se puede tocar.

  TRES PIEZAS, y no una: un `<dialog>` hereda las propiedades personalizadas
  de sus ancestros del DOM. Montada dentro de la cabecera (`data-theme="dark"`
  y el ámbito `sobreFoto`) la ventana heredaba sus tokens, así que el botón
  vive en la cabecera y la ventana fuera, y comparten el estado por contexto:

    · `ProveedorCarnet` — envuelve el portal y guarda el estado.
    · `BotonCarnet`     — el disparador, en la cabecera.
    · `VentanaCarnet`   — el diálogo, fuera de la cabecera.

  El QR va negro sobre blanco siempre: invertirlo rompe el escaneo en algunos
  lectores, delante del cajero.
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

export function VentanaCarnet({ datos }: { datos: DatosCarnet }) {
  const { abierto, soloQr, cerrar, verQr } = useCarnet()
  const { nombre, plan, numeroMembresia, vigencia, fotoUrl } = datos
  const etiquetaQr = `Código de la membresía ${numeroMembresia} de ${nombre}`

  return (
    <Modal
      open={abierto}
      onClose={cerrar}
      ariaLabel={soloQr ? 'Código QR del carnet' : 'Carnet de socio'}
      width="560px"
      desnudo
    >
      <article className={estilos.carnet}>
        {/* La firma de la marca, a sangre y casi transparente. */}
        <MonogramaOrum tono="plata" className={estilos.marcaAgua} />

        <div className={estilos.barra}>
          {soloQr ? (
            <button type="button" className={estilos.volver} onClick={() => verQr(false)}>
              <ArrowLeft size={16} aria-hidden="true" />
              Carnet
            </button>
          ) : (
            <LogoOrum variante="plata" className={estilos.logo} />
          )}
          <button type="button" className={estilos.cerrar} onClick={cerrar} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* `key`: cada vista entra con su propio fundido al intercambiarse. */}
        {soloQr ? (
          <div key="qr" className={`${estilos.vista} ${estilos.vistaQr}`} data-motion-esencial>
            <QrCode value={numeroMembresia} size={512} className={estilos.qrGrande} label={etiquetaQr} />
            <p className={estilos.numeroGrande}>{numeroMembresia}</p>
            <p className={estilos.nombreQr}>{nombre}</p>
          </div>
        ) : (
          <div key="carnet" className={`${estilos.vista} ${estilos.vistaCarnet}`}>
            <div className={estilos.identidad}>
              {/* Un formulario no navega: `/miembros/perfil/foto` se abre
                  encima por la ranura `@modal`. El carnet se cierra antes,
                  para no apilar dos ventanas. */}
              <Link
                href="/miembros/perfil/foto"
                className={estilos.foto}
                onClick={cerrar}
                aria-label="Cambiar foto"
              >
                {fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
                  <img src={fotoUrl} alt="" className={estilos.fotoImagen} decoding="async" />
                ) : (
                  <span className={estilos.iniciales} aria-hidden="true">
                    {iniciales(nombre)}
                  </span>
                )}
                <span className={estilos.velo} aria-hidden="true">
                  <Camera size={16} />
                  <span>Cambiar foto</span>
                </span>
                <span className={estilos.pista} aria-hidden="true">
                  <Camera size={12} />
                </span>
              </Link>

              <div className={estilos.quien}>
                <p className={estilos.nombre}>{nombre}</p>
                <p className={estilos.plan}>{plan}</p>
              </div>
            </div>

            <div className={estilos.pie}>
              <dl className={estilos.datos}>
                <div className={estilos.dato}>
                  <dt className={estilos.etiqueta}>Número</dt>
                  <dd className={estilos.numero}>{numeroMembresia}</dd>
                </div>
                <div className={estilos.dato}>
                  <dt className={estilos.etiqueta}>Vigente hasta</dt>
                  <dd className={estilos.valor}>{vigencia}</dd>
                </div>
              </dl>

              <button
                type="button"
                className={estilos.qr}
                onClick={() => verQr(true)}
                aria-label="Ampliar el código QR"
                data-motion-esencial
              >
                <QrCode value={numeroMembresia} size={256} className={estilos.qrMarco} label={etiquetaQr} />
                <span className={estilos.velo} aria-hidden="true">
                  <Maximize2 size={16} />
                  <span>Ampliar</span>
                </span>
                <span className={estilos.pista} aria-hidden="true">
                  <Maximize2 size={12} />
                </span>
              </button>
            </div>
          </div>
        )}
      </article>
    </Modal>
  )
}
