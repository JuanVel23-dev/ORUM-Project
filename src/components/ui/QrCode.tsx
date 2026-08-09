import QRCode from 'react-qr-code'

/**
 * El QR debe verse siempre en negro sobre blanco para poder escanearse,
 * independientemente del tema (claro/oscuro) de la página — por eso el fondo
 * blanco va forzado en vez de usar `--orum-surface`.
 */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="orum-card" style={{ display: 'inline-flex', padding: '1rem', background: '#fff' }}>
      <QRCode value={value} size={size} />
    </div>
  )
}
