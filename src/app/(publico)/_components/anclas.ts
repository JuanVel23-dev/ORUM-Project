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
 * Y había un segundo problema encima del primero: `menu-movil-publico.tsx`
 * lleva `'use client'`, así que al importar del encabezado arrastraba un módulo
 * de servidor al grafo del cliente.
 *
 * Una constante compartida por dos módulos va en un tercero. Sin JSX y sin
 * `'use client'`: lo pueden leer los dos lados.
 *
 * ── Por qué ruta absoluta (`/#…`) y no solo `#…` ──────────────────────────
 *
 * Esta cabecera la comparten la landing y `/aliados`. Con `#como-funciona` a
 * secas, pulsarla desde `/aliados` no haría nada: ahí esa sección no existe.
 * Con `/#como-funciona`, Next navega a la landing y luego desplaza; dentro de
 * la propia landing se comporta como un ancla normal, sin recargar.
 */
export const ANCLAS = [
  { href: '/#que-es-orum', texto: 'Qué es ORUM' },
  { href: '/#como-funciona', texto: 'Cómo funciona' },
  { href: '/#comercios-aliados', texto: 'Comercios aliados' },
] as const
