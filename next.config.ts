import type { NextConfig } from 'next'

/*
  Cabeceras de seguridad.

  El navegador solo aplica lo que le decimos que aplique: sin estas cabeceras,
  cualquier página del panel se puede meter en un <iframe> ajeno, el navegador
  adivina tipos MIME, y la URL completa —con identificadores de miembro— viaja
  como `Referer` a cualquier dominio externo que se enlace.

  No hay CSP todavía a propósito: Next inyecta scripts en línea y una CSP mal
  puesta rompe la aplicación entera en producción sin avisar en desarrollo.
  Necesita hacerse con nonces y probarse desplegada; queda anotado como tarea.
*/
const cabecerasSeguridad = [
  // Nadie puede embeber el panel: defensa contra clickjacking.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Y su equivalente moderno, que además cubre <embed> y <object>.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },

  // El navegador respeta el Content-Type declarado en vez de adivinarlo.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  /*
    Al salir a un dominio externo —el enlace de WhatsApp, el logo de un
    comercio— solo se envía el origen, nunca la ruta. Sin esto,
    `/admin/miembros/42/editar` acabaría en los registros de terceros.
  */
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  /*
    Se deniegan por defecto las capacidades que el panel no usa. La cámara se
    permite en el MISMO origen porque el Portal de Comercios escanea códigos QR:
    denegarla del todo rompería la herramienta de caja.
  */
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
  },

  /*
    HTTPS obligatorio durante un año, subdominios incluidos.

    El navegador solo la respeta si ya llegó por HTTPS, así que en local no
    estorba. Sin ella, la primera visita de cada usuario viaja en claro y la
    cookie de sesión es interceptable en una red compartida.
  */
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  experimental: {
    // Habilita <ViewTransition> de React para transiciones de ruta con
    // elemento compartido. Validado en la Fase C: compila y no rompe nada.
    // Las transiciones concretas se aplican pantalla por pantalla en la
    // Fase E, cuando cada ruta tenga su diseño definitivo y se sepa qué
    // elemento debe persistir entre ellas.
    viewTransition: true,
  },

  async headers() {
    return [{ source: '/:path*', headers: cabecerasSeguridad }]
  },
}

export default nextConfig
