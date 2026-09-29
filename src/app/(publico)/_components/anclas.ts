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
 * Cada uno existe en la portada: `inicio` (el héroe), `como-funciona` («Así
 * es como te unes»), `nosotros` («Qué es ORUM»), `membresias` («Elige tu
 * membresía») y `proposito` (misión y visión). Cambiar uno sin el otro deja
 * un enlace que no lleva a ninguna parte, sin error.
 */
/*
  29/09/2026 · ACTUALIZADA A LAS SECCIONES DE HOY (encargo del propietario:
  «la barra de opciones está desactualizada, mira cada sección del portal»).
  En el orden en que aparecen en la portada, más las dos páginas propias de
  la fachada: el directorio completo de comercios y la puerta de aliados.
  «Novedades» sigue fuera: no es una sección de la portada y se llega desde
  el banner de anuncios.
*/
export const ANCLAS = [
  { href: '/#inicio', texto: 'Inicio' },
  { href: '/#como-funciona', texto: 'Cómo funciona' },
  { href: '/#nosotros', texto: 'Nosotros' },
  /* El directorio COMPLETO, no la selección de destacados de la portada:
     quien pulsa «Comercios» quiere ver todos los aliados y filtrarlos. */
  { href: '/explorar', texto: 'Comercios' },
  { href: '/#membresias', texto: 'Membresías' },
  { href: '/#proposito', texto: 'Propósito' },
  { href: '/aliados', texto: 'Aliados' },
] as const

/** Destino de «Únete»: los planes, que es donde se decide y se adquiere. */
export const HREF_UNETE = '/#membresias'
