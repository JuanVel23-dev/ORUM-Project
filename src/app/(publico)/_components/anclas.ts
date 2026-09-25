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
 * Son los de la guía de marca, y cada uno existe en `page.tsx`: `inicio` (el
 * héroe), `nosotros` («Qué es ORUM»), `comercios` («Comercios destacados») y
 * `membresias` («Elige tu membresía»). Cambiar uno sin el otro deja un enlace
 * que no lleva a ninguna parte, sin error.
 */
export const ANCLAS = [
  { href: '/#inicio', texto: 'Inicio' },
  { href: '/#nosotros', texto: 'Nosotros' },
  { href: '/#comercios', texto: 'Comercios' },
  { href: '/#membresias', texto: 'Membresías' },
  /* No es un ancla: es la página de anuncios del club (`/novedades`). */
  { href: '/novedades', texto: 'Novedades' },
] as const

/** Destino de «Únete»: los planes, que es donde se decide y se adquiere. */
export const HREF_UNETE = '/#membresias'
