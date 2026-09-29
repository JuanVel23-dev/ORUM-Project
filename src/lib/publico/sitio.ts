/**
 * El origen canónico del sitio, sin barra final.
 *
 * FIJO EN CÓDIGO y no leído de `NEXT_PUBLIC_SITE_URL`, a propósito: esa
 * variable existe para los enlaces de correo, y en el entorno local llegó a
 * valer `https://www.cluborum.com/activar-cuenta` (con `www` y con una ruta).
 * Un sitemap o una canónica construidos sobre ella listan URLs que no existen,
 * y el fallo es silencioso: nadie ve el sitemap hasta que Google lo rechaza.
 *
 * El dominio final es `cluborum.com` SIN `www`; `www` redirige (308) a él en
 * Vercel. Si el dominio cambia, se cambia aquí, en un solo sitio.
 */
export const URL_SITIO = 'https://cluborum.com'

export const NOMBRE_SITIO = 'ORUM'

/**
 * INTERRUPTOR: ¿se indexan las páginas que enseñan el catálogo de comercios?
 *
 * Son la portada (`/`, «Comercios destacados») y `/explorar` (el directorio):
 * los dos pintan en su texto el nombre de TODOS los comercios activos, lo
 * que el `indexable` por comercio no controla. Mientras los comercios sean
 * datos de prueba se quedan en `false`: `noindex` en ambas y fuera del sitemap.
 *
 * Cuando haya comercios reales, se pone en `true` (y se enciende el
 * interruptor «Aparecer en buscadores» de cada comercio real).
 */
export const INDEXAR_CATALOGO = false
