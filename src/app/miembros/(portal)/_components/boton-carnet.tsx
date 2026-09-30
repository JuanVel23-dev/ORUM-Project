'use client'

import { createContext, useContext, useId, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, IdCard, Maximize2, X } from 'lucide-react'
import { iniciales } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogoOrum } from '@/components/ui/marca/marca'
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
    · Una sola familia, Montserrat, y UN solo tratamiento (encargo del
      30/09: «la tipografía sigue sin ser la misma»): sin versalitas
      espaciadas ni número abierto, que se leían como otras letras. Las
      etiquetas se distinguen por peso y tono, no por forma.
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
        <MarcaAgua />

        {/* En el carnet la X va en la esquina, fuera del flujo; en el QR
            ampliado comparte barra con «volver». */}
        {soloQr ? (
          <div className={estilos.barra}>
            <button type="button" className={estilos.volver} onClick={() => verQr(false)}>
              <ArrowLeft size={16} aria-hidden="true" />
              Carnet
            </button>
            <button type="button" className={estilos.cerrar} onClick={cerrar} aria-label="Cerrar">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`${estilos.cerrar} ${estilos.cerrarEsquina}`}
            onClick={cerrar}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {/* `key`: cada vista entra con su propio fundido al intercambiarse. */}
        {soloQr ? (
          <div key="qr" className={`${estilos.vista} ${estilos.vistaQr}`} data-motion-esencial>
            <div className={estilos.aroQrGrande}>
              <QrCode value={numeroMembresia} size={512} className={estilos.qrGrande} label={etiquetaQr} />
            </div>
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
                {/* Foto y velo en el MISMO círculo recortado: al acercarse
                    la foto bajo el velo, no se sale por el borde. */}
                <span className={estilos.recorte}>
                  {fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
                    <img src={fotoUrl} alt="" className={estilos.fotoImagen} decoding="async" />
                  ) : (
                    <span className={estilos.iniciales} aria-hidden="true">
                      {iniciales(nombre)}
                    </span>
                  )}
                  {/* El velo de la foto no usa `backdrop-filter` (desenfocaba
                      también el aro de plata y dejaba un halo claro en el
                      borde): lleva una copia de la foto ya desenfocada. */}
                  <span className={`${estilos.velo} ${estilos.veloConFoto}`} aria-hidden="true">
                    {fotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- la misma URL, desenfocada
                      <img src={fotoUrl} alt="" className={estilos.veloCopia} decoding="async" />
                    )}
                    <Camera size={16} />
                    <span>Cambiar foto</span>
                  </span>
                </span>
                <span className={estilos.pista} aria-hidden="true">
                  <Camera size={12} />
                </span>
              </Link>

              <div className={estilos.quien}>
                <p className={estilos.nombre}>{nombre}</p>
                <p className={estilos.plan}>{plan}</p>
              </div>

              {/* El logotipo a la DERECHA, a la altura del nombre (retro de
                  diseño, 30/09/2026: «hay mucho peso en la izquierda»). La
                  columna derecha queda X · logo · QR frente a foto · nombre ·
                  datos. En teléfono no cabe junto al nombre: sube a su línea. */}
              <span className={estilos.marca}>
                <LogoOrum variante="plata" className={estilos.logo} />
              </span>
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

/*
  EL MONOGRAMA, DIBUJADO Y NO RASTERIZADO. El PNG del cliente mide 240 px y
  aquí se ve a más de 400: salía borroso («no se ve con tanta calidad»). Es
  la misma figura —el aro más grueso a la izquierda, como trazado a pluma, y
  la estrella de cuatro puntas— en vectores, con el degradado de plata
  bruñida de la foto y el QR. Decorativo.
*/
function MarcaAgua() {
  const id = useId()
  return (
    <svg className={estilos.marcaAgua} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={estilos.plata1} />
          <stop offset="0.45" className={estilos.plata2} />
          <stop offset="0.7" className={estilos.plata3} />
          <stop offset="1" className={estilos.plata4} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        fillRule="evenodd"
        d="M3 50a47 47 0 1 0 94 0a47 47 0 1 0 -94 0ZM8.5 50a43.5 43.5 0 1 0 87 0a43.5 43.5 0 1 0 -87 0Z"
      />
      <path
        fill={`url(#${id})`}
        d="M50 30C51.5 45 55 48.5 66 50C55 51.5 51.5 55 50 70C48.5 55 45 51.5 34 50C45 48.5 48.5 45 50 30Z"
      />
    </svg>
  )
}
