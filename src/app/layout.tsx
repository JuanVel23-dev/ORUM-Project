import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeScript } from '@/components/theme/theme-script'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { RegistrarSW } from '@/components/pwa/registrar-sw'
import './globals.css'

/**
 * Inter Variable. Se auto-hospeda en build (sin peticiones a Google en
 * runtime) y da consistencia de marca en todos los dispositivos, a diferencia
 * de `system-ui`, que entrega SF en Apple pero Segoe/Roboto en el resto.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ORUM · Portal de Administración',
  description: 'Plataforma del club de beneficios ORUM.',

  // Nombre corto que iOS usa bajo el icono en la pantalla de inicio.
  applicationName: 'ORUM',

  appleWebApp: {
    // Abre a pantalla completa, sin la barra de Safari, cuando se instala
    // desde "Añadir a pantalla de inicio".
    capable: true,
    title: 'ORUM',
    // `black-translucent` deja que el contenido llegue hasta arriba del todo;
    // el espacio de la barra de estado lo reserva `env(safe-area-inset-top)`.
    statusBarStyle: 'black-translucent',
  },

  // Evita que iOS convierta números largos (cédulas, teléfonos, números de
  // membresía) en enlaces de llamada azules dentro de las tablas.
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Necesario para que `env(safe-area-inset-*)` tenga efecto: sin esto la tab
  // bar de la Fase C quedaría bajo la barra de gestos del iPhone.
  viewportFit: 'cover',
  // Tiñe la barra de estado del móvil. Crítico en PWA instalada: sin las dos
  // variantes la app aparece con una franja del color del tema contrario.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBFBFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0C' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    /*
      suppressHydrationWarning en <html>: el script anti-flash estampa
      `data-theme` antes de que React hidrate, así que el atributo no coincide
      con lo que renderizó el servidor. Es intencionado.

      En <body>: algunas extensiones del navegador (p. ej. Bitdefender con
      `bis_register`) inyectan atributos antes de que React cargue.
    */
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <RegistrarSW />
      </body>
    </html>
  )
}
