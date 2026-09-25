import { ImageResponse } from 'next/og'

/**
 * Icono para la pantalla de inicio de iOS.
 *
 * Safari NO acepta SVG como `apple-touch-icon`, así que aquí se genera un PNG
 * en tiempo de build. Se dibuja con cajas y bordes en lugar de un SVG porque
 * el motor de `ImageResponse` solo entiende un subconjunto de CSS.
 *
 * Sin esquinas redondeadas a propósito: iOS aplica su propia máscara, y un
 * icono ya redondeado quedaría con un borde negro alrededor.
 */

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111114', // --n-1000 (negro neutro) — sin cambios en la v6
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 96,
            border: '10px solid #DFAF35', // --gold-500 (oro de marca) — sin cambios en la v6
          }}
        />
      </div>
    ),
    size,
  )
}
