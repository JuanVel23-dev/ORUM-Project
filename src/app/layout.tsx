import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
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

/**
 * Fraunces — el SERIF DE DISPLAY de la dirección de arte v4 (§3).
 *
 * Solo titulares y cifras grandes, vía `.t-hero-*`. Inter se queda para toda
 * la interfaz: un serif a 13px en un botón se lee amateur, y en la Herramienta
 * de Comercios sería un estorbo.
 *
 * QUÉ SE PAGA POR ELLA, que es lo que hay que vigilar: una fuente más son
 * bytes en la primera carga de un teléfono de gama media. Se midió, no se
 * estimó — tamaños reales del subconjunto `latin` servido por Google:
 *
 *   Fraunces variable con `opsz` + `wght` ......... 65,7 KB
 *   Fraunces variable solo `wght` ................. 35,8 KB   <-- ESTA
 *   Fraunces estática 400 + 600 (dos archivos) .... 35,8 KB
 *   Fraunces estática 400 sola .................... 17,5 KB
 *   Playfair Display variable (referencia) ........ 37,5 KB
 *
 * EL EJE `opsz` SE DESCARTÓ, y duele, porque es la razón por la que esta
 * familia entró en la lista: habría hecho solo la mitad del «tracking
 * específico del tamaño» que la dirección exige. Pero cuesta 30 KB —casi el
 * doble de la fuente— en un archivo que solo sirve a los titulares de unas
 * pocas pantallas. Ese ajuste se hace a mano en los tres peldaños `hero` de
 * `tokens.css`: es trabajo que se paga una vez y no en cada carga.
 *
 * Con `wght` variable sale al mismo precio que dos pesos estáticos y cubre
 * TODO el rango en un solo archivo: si mañana un titular quiere 500, no hay
 * descarga nueva ni un peso sintético (que es lo que pasaría con la estática
 * de 400 sola, y un bold falso en una serif de contraste alto se ve).
 *
 *   · `subsets: ['latin']` — sin cirílico, griego ni `latin-ext`.
 *   · `display: 'swap'` — el titular se pinta con Georgia y se intercambia. Sin
 *     esto, el h1 de la primera pantalla queda invisible hasta que llega la
 *     fuente, que es justo el texto que dice de qué va el producto.
 *   · `SOFT` y `WONK` quedan en su valor por defecto (0), la forma sobria de la
 *     familia. Cada eje que no se pide es peso que no se descarga.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
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
  // v4: los dos son ahora CÁLIDOS y salen de `--w-0` y `--n-1000`. Aquí
  // TIENEN que ser literales —un `var()` no se resuelve en una meta— así que
  // si la paleta cambia, este par se cambia a mano o la PWA instalada aparece
  // con una franja del color de la dirección anterior.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFCFA' },
    { media: '(prefers-color-scheme: dark)', color: '#14100E' },
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
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
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
