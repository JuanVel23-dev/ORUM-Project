import QRCode from 'react-qr-code'
import styles from './qr-code.module.css'

type QrCodeProps = {
  value: string
  size?: number
  /** Texto alternativo. Describe QUÉ identifica el código, no que es un QR. */
  label?: string
  className?: string
}

/**
 * Código QR con su marco blanco.
 *
 * Se mantiene en negro sobre blanco en ambos temas a propósito: ver
 * `qr-code.module.css` para por qué invertirlo rompería el escaneo.
 */
export function QrCode({ value, size = 200, label, className }: QrCodeProps) {
  return (
    <div
      className={[styles.marco, className].filter(Boolean).join(' ')}
      role="img"
      aria-label={label ?? `Código de la membresía ${value}`}
    >
      <QRCode value={value} size={size} />
    </div>
  )
}
