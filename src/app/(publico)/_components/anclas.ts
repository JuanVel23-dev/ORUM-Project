/**
 * LAS ANCLAS DE LA CABECERA PÚBLICA, en su propio módulo.
 *
 * Vivían dentro de `encabezado-publico.tsx` y eso creaba un CICLO DE IMPORTS:
 * el encabezado importa `MenuMovilPublico` para pintarlo, y el menú móvil
 * importaba `ANCLAS` de vuelta del encabezado. Un ciclo no falla al compilar
 * ni al tipar — falla en tiempo de ejecución, y de la peor manera: el módulo
 * que se carga segundo ve el binding del primero todavía sin inicializar, así
 * que `MenuMovilPublico` llega como `undefined` y React lanza
 * «Element type is invalid: … but got: undefined».
 *
 * Una constante compartida por dos módulos va en un tercero. Sin JSX y sin
 * `'use client'`: lo pueden leer los dos lados.
 *
 * ── Por qué ruta absoluta (`/#…`) y no solo `#…` ──────────────────────────
 *
 * Esta cabecera la comparten la landing, `/explorar` y `/aliados`. Con
 * `#nosotros` a secas, pulsarla desde `/explorar` no haría nada: ahí esa
 * sección no existe. Con `/#nosotros`, Next navega a la landing y luego
 * desplaza; dentro de la propia landing se comporta como un ancla normal.
 *
 * ── Los ids que apuntan ─────────────────────────────────────────────────
 *
 * Cada uno existe en la portada: `inicio` (el héroe), `nosotros` («Qué es
 * ORUM»), `comercios` («Comercios destacados»), `membresias` («Elige tu
 * membresía») y `proposito` (misión y visión). Cambiar uno sin el otro deja
 * un enlace que no lleva a ninguna parte, sin error.
 */
/*
  29/09/2026 · LOS CINCO DESTINOS DEL PROPIETARIO, y solo esos: Inicio,
  Nosotros, Comercios, Membresías y Propósito, todos secciones de la
  portada. «Comercios» baja a los destacados de la portada, NO al
  directorio (`/explorar`): es lo que pidió. «Cómo funciona» y «Aliados» se
  probaron y se retiraron. «Novedades» sigue fuera: se llega desde el banner
  de anuncios.
*/
export const ANCLAS = [
  { href: '/#inicio', texto: 'Inicio' },
  { href: '/#nosotros', texto: 'Nosotros' },
  { href: '/#comercios', texto: 'Comercios' },
  { href: '/#membresias', texto: 'Membresías' },
  { href: '/#proposito', texto: 'Propósito' },
] as const

/** Destino de «Únete»: los planes, que es donde se decide y se adquiere. */
export const HREF_UNETE = '/#membresias'
