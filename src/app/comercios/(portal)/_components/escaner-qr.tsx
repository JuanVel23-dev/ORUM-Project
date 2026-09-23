'use client'

import { useEffect, useState } from 'react'
import { Scanner, type IScannerError } from '@yudiel/react-qr-scanner'
import styles from './verificar.module.css'

type CodigoDetectado = { rawValue: string }

/*
  QUÉ SALIÓ MAL CON LA CÁMARA, DICHO CON PALABRAS.

  El comportamiento anterior era cerrar el visor sin decir nada: un cajero que
  denegó el permiso sin querer —o que tiene la cámara tomada por la aplicación
  de la caja— veía desaparecer la pantalla y no tenía forma de saber por qué
  «no pasó nada». Volvía a pulsar, y volvía a no pasar nada.

  La spec daba por dudoso que la librería distinguiera el motivo. Verificado en
  `@yudiel/react-qr-scanner`: `onError` entrega un `IScannerError` con un campo
  `kind` tipado, así que sí se puede distinguir. Cada motivo lleva la salida
  concreta que lo resuelve, y todos terminan en la misma puerta: escribir el
  número, que nunca depende de la cámara.
*/
const MENSAJE: Record<IScannerError['kind'], string> = {
  'permission-denied':
    'No pudimos acceder a la cámara. Actívala en los ajustes del navegador o escribe el número.',
  security:
    'No pudimos acceder a la cámara. Actívala en los ajustes del navegador o escribe el número.',
  'no-camera': 'Este dispositivo no tiene cámara. Escribe el número del carnet.',
  'in-use':
    'La cámara está siendo usada por otra aplicación. Ciérrala o escribe el número.',
  overconstrained: 'No pudimos usar la cámara de este dispositivo. Escribe el número.',
  'insecure-context':
    'La cámara solo funciona sobre una conexión segura. Escribe el número del carnet.',
  unsupported: 'Este navegador no puede escanear. Escribe el número del carnet.',
  aborted: 'Se interrumpió la cámara. Vuelve a intentarlo o escribe el número.',
  'type-error': 'No pudimos abrir la cámara. Escribe el número del carnet.',
  unknown: 'No pudimos abrir la cámara. Escribe el número del carnet.',
}

/**
 * Cuánto se espera antes de ofrecer la salida de teclado.
 *
 * No cierra la cámara ni interrumpe nada: solo cambia el tono de la
 * instrucción. Diez segundos apuntando sin leer nada suele ser un carnet
 * rayado, una funda con brillo o poca luz — y en todos esos casos insistir
 * cuesta más que teclear ocho dígitos.
 */
const MS_SIN_LECTURA = 10_000

/**
 * Escáner de QR con cámara.
 *
 * Detectar **es** buscar: no hay un «Verificar» aparte. El toque que se ahorra
 * es el que ocurre con el cliente delante y el teléfono en alto.
 */
export function EscanerQr({
  onDetectado,
  onFallo,
  onEscribirNumero,
}: {
  onDetectado: (valor: string) => void
  /** Motivo legible del fallo de cámara. Lo pinta el formulario, no este visor. */
  onFallo: (mensaje: string) => void
  onEscribirNumero: () => void
}) {
  const [cuestaEnfocar, setCuestaEnfocar] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setCuestaEnfocar(true), MS_SIN_LECTURA)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div>
      <div className={styles.escaner}>
        <Scanner
          onScan={(codigos: CodigoDetectado[]) => {
            const valor = codigos[0]?.rawValue
            if (valor) onDetectado(valor)
          }}
          onError={(error: IScannerError) => onFallo(MENSAJE[error.kind] ?? MENSAJE.unknown)}
          components={{ finder: false }}
        />
        {/* Mira propia: la del paquete no sigue el sistema. */}
        <div className={styles.mira} aria-hidden="true" />
      </div>

      {/* `polite` y no un `Alert`: el cambio de instrucción es una ayuda, no un
          fallo, y no debe cortar lo que el lector esté diciendo. */}
      <p className={styles.escanerNota} aria-live="polite">
        {cuestaEnfocar ? (
          <>
            ¿No logras enfocarlo? Acércate más o{' '}
            <button type="button" className={styles.enlaceTexto} onClick={onEscribirNumero}>
              escribe el número
            </button>
          </>
        ) : (
          'Apunta al código del carnet del socio'
        )}
      </p>
    </div>
  )
}
