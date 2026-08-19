'use client'

import { Scanner } from '@yudiel/react-qr-scanner'
import styles from './verificar.module.css'

type CodigoDetectado = { rawValue: string }

/**
 * Escáner de QR con cámara. Si la cámara falla o no hay permiso, `onError` la
 * cierra y el operador sigue con el número a mano, que siempre está visible.
 */
export function EscanerQr({
  onDetectado,
  onError,
}: {
  onDetectado: (valor: string) => void
  onError: () => void
}) {
  return (
    <div>
      <div className={styles.escaner}>
        <Scanner
          onScan={(codigos: CodigoDetectado[]) => {
            const valor = codigos[0]?.rawValue
            if (valor) onDetectado(valor)
          }}
          onError={onError}
          components={{ finder: false }}
        />
        {/* Mira propia: la del paquete no sigue el sistema. */}
        <div className={styles.mira} aria-hidden="true" />
      </div>

      <p className={styles.escanerNota}>
        Apunta al código del carnet del miembro
      </p>
    </div>
  )
}
