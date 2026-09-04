/**
 * ¿Está activo un destino de la navegación del Portal de Miembros?
 *
 * Vive aquí, y no dentro de `portal-nav.tsx`, por dos razones: es una función
 * pura —una cadena entra, un booleano sale— y `vitest` solo descubre `.test.ts`,
 * así que dentro de un componente de cliente no habría forma de cubrirla.
 *
 * Las tres formas de ruta que tiene que distinguir:
 *
 * - `/miembros` **no** puede compararse con `startsWith`: marcaría también
 *   `/miembros/perfil`, que es su hijo.
 * - Pero tampoco basta la igualdad estricta: dentro de una ficha
 *   (`/miembros/comercios/[id]`) ninguna pestaña quedaba activa y el socio
 *   perdía la referencia de dónde está. La ficha es contenido de "Inicio".
 * - `/miembros/inactiva` no activa ninguna pestaña: no es un destino de
 *   navegación, y allí la barra ni siquiera se muestra.
 */
export function esDestinoActivo(pathname: string, href: string): boolean {
  if (href !== INICIO) return pathname === href || pathname.startsWith(`${href}/`)

  if (pathname === INICIO) return true
  return HIJOS_DE_INICIO.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  )
}

const INICIO = '/miembros'

/**
 * Rutas que son contenido de "Inicio" aunque cuelguen de otro segmento.
 * Se listan a mano: una regla del tipo "todo lo que no sea /perfil" marcaría
 * también `/miembros/inactiva`.
 */
const HIJOS_DE_INICIO = ['/miembros/comercios']
