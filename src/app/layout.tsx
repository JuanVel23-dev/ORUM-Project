import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeScript } from '@/components/theme/theme-script'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { RegistrarSW } from '@/components/pwa/registrar-sw'
import './globals.css'

/**
 * PLUS JAKARTA SANS — la ÚNICA familia del sistema (dirección de arte v5, §4).
 *
 * Encargo literal del propietario: «tipografía similar a la de Avianca. Y que
 * toda sea de la misma familia, no combinar». Esto deroga la v4, que emparejaba
 * Inter (interfaz) con Fraunces (serif de display). Las dos salen.
 *
 * POR QUÉ ESTA, que es la parte que no se ve en el diff. La de Avianca es una
 * geométrica humanista: caja alta grande, aperturas abiertas, formas basadas en
 * el círculo pero corregidas para leer. De lo que hay en el catálogo libre:
 *
 *   · OUTFIT es la que más se le parece de lejos, y la que peor envejece de
 *     cerca: sus letras son círculos casi perfectos, y a 13px la `a`, la `o` y
 *     la `e` comparten demasiada silueta. Esta aplicación es en buena parte
 *     tablas de cédulas, montos y fechas — ahí eso se paga en lecturas dobles.
 *   · DM SANS habría servido. Es la más neutra de las tres y por eso la menos
 *     característica: no aporta nada que `system-ui` no diera ya.
 *   · PLUS JAKARTA SANS  <-- ESTA. Geométrica con correcciones humanistas:
 *     terminales cortadas en ángulo, `a` de doble piso, caja alta grande.
 *     Sostiene la lectura geométrica a 72px y sigue siendo distinguible a 13px.
 *
 * QUÉ SE PAGA, y aquí la noticia es buena: la v4 cargaba DOS familias (Inter
 * para la interfaz + 35,8 KB de Fraunces para los titulares). La v5 carga UNA,
 * así que el presupuesto de fuentes de la primera carga baja, no sube — que
 * importa porque el socio abre esto en un teléfono de gama media, de pie, en la
 * caja de un comercio.
 *
 * MEDIDO en el `build` de esta tanda (`.next/static/media`): 57,6 KB de woff2
 * en total, de los cuales `next/font` PRECARGA 26,6 KB — el resto son cortes de
 * `unicode-range` que solo se descargan si aparece un carácter que los use.
 *
 *   · Es VARIABLE en `wght` (200–800) y se pide el eje entero. Ese rango es lo
 *     que permite que una sola familia sostenga toda la jerarquía: el cuerpo a
 *     400 y el titular a 800 salen del MISMO archivo, sin una descarga por peso
 *     y sin pesos sintéticos. Con una familia de peso único habría hecho falta
 *     un segundo tipo, que es justo lo que el encargo prohíbe.
 *   · `subsets: ['latin']` — sin cirílico, griego ni `latin-ext`.
 *   · `display: 'swap'` — el titular se pinta con la pila del sistema y se
 *     intercambia. Sin esto, el h1 de la primera pantalla queda invisible hasta
 *     que llega la fuente, que es justo el texto que dice de qué va el producto.
 *   · Se auto-hospeda en build: cero peticiones a Google en runtime.
 *   · El ajuste de métricas del fallback lo calcula `next/font` por defecto, así
 *     que el intercambio desplaza poco. La pila de reserva está en
 *     `--font-sans` (`tokens.css` §7), no aquí.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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
  //
  // v5: el par pasa a los neutros de la nueva paleta — `--w-0` (#FFFFFF) y
  // `--n-1000` (#111114). Aquí TIENEN que ser literales, porque un `var()` no
  // se resuelve dentro de una meta etiqueta, así que este es un sitio donde la
  // paleta está copiada a mano y hay que moverla con ella.
  //
  // ⚠️ NO ES EL ÚNICO SITIO. Hay otras tres copias a mano de la paleta, y las
  // cuatro tienen que moverse JUNTAS o la aplicación instalada arranca con los
  // colores de una dirección de arte retirada — que es lo que pasó al cambiar
  // a la v5 y hubo que corregir después:
  //   · `src/app/manifest.ts` ..... background_color y theme_color → --n-1000
  //   · `src/app/apple-icon.tsx` .. fondo → --n-1000, anillo → --gold-500
  //   · `src/app/icon.svg` ........ fondo → --n-1000 y las cuatro paradas del
  //     barrido → --gold-300 / 500 / 600 / 400
  // Ninguno puede leer una variable CSS: el manifiesto y los iconos los
  // resuelve el sistema operativo antes de que exista una hoja de estilos.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#111114' },
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
    <html lang="es" className={jakarta.variable} suppressHydrationWarning>
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
