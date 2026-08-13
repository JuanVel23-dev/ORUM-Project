'use client'

import { Scanner } from '@yudiel/react-qr-scanner'

type CodigoDetectado = { rawValue: string }

/**
 * Escáner de QR con cámara. Si la cámara falla o no hay permiso, `onError` la
 * cierra y el operador sigue usando el input manual (siempre disponible).
 */
export function EscanerQr({
  onDetectado,
  onError,
}: {
  onDetectado: (valor: string) => void
  onError: () => void
}) {
  return (
    <div className="orum-card" style={{ maxWidth: 360, marginTop: '0.75rem' }}>
      <Scanner
        onScan={(codigos: CodigoDetectado[]) => {
          const valor = codigos[0]?.rawValue
          if (valor) onDetectado(valor)
        }}
        onError={onError}
      />
    </div>
  )
}
