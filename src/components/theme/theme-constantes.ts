/**
 * LO QUE COMPARTEN EL SERVIDOR Y EL CLIENTE sobre el tema.
 *
 * Vive aparte de `theme-script.tsx` por una razón concreta y medida: aquel
 * archivo exporta el COMPONENTE `<script>` anti-fogonazo, y `theme-provider`
 * —que es `'use client'`— importaba de él la clave de `localStorage`. Un import
 * arrastra el módulo ENTERO, así que el componente `<script>` y su cadena de
 * código minificado acababan en el grafo del cliente.
 *
 * Dos consecuencias, y la segunda es la que se veía:
 *
 *   1. Se enviaban al navegador ~400 bytes de un script que el navegador ya
 *      había ejecutado desde el HTML. Peso puro.
 *   2. React advertía en consola: «Encountered a script tag while rendering
 *      React component. Scripts inside React components are never executed
 *      when rendering on the client.» Un `<script>` alcanzable desde el cliente
 *      es justo lo que esa comprobación busca.
 *
 * Es el mismo patrón que ya costó una vez en este proyecto: un archivo con
 * `'use server'` que exportaba constantes y tipos, y al empaquetar se quedaba
 * sin exports. La lección es la misma — **lo que comparten dos mundos va en un
 * tercer módulo que no pertenece a ninguno de los dos**.
 *
 * Aquí no hay JSX, ni `'use client'`, ni `server-only`: solo datos.
 */

/** La clave de `localStorage` donde vive la elección del usuario. */
export const THEME_STORAGE_KEY = 'orum-theme'

/** Los tres modos son estados reales. `system` no es «ausencia de elección». */
export type ThemeMode = 'system' | 'light' | 'dark'

/** Tema efectivo ya resuelto: lo que de verdad se pinta. */
export type ResolvedTheme = 'light' | 'dark'
