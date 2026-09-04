/**
 * Destino seguro del botón «‹ Comercios» de la ficha de un comercio.
 *
 * La ficha recibe en `?volver=` la URL del catálogo tal y como el socio la
 * dejó —con su búsqueda, su categoría y sus filtros— para poder devolverlo
 * exactamente ahí sin guardar estado en ningún sitio.
 *
 * ESE PARÁMETRO ES ENTRADA NO CONFIABLE. Cualquiera puede enviar un enlace
 * con `?volver=https://otro-sitio.com` y, sin esta guarda, el botón de vuelta
 * de una pantalla autenticada llevaría a donde el atacante quisiera: una
 * redirección abierta de manual, y de las peores, porque el socio la pulsa
 * confiando en que vuelve al catálogo.
 *
 * Por eso la lista es blanca y no negra: se aceptan DOS formas y se descarta
 * todo lo demás, en vez de intentar enumerar lo que es peligroso.
 *
 * - Exactamente `/miembros`.
 * - `/miembros?…` con cualquier consulta.
 *
 * Nada más pasa. En particular no pasan `//otro-sitio.com` (que el navegador
 * lee como protocolo relativo y sale del dominio), `/miembros@otro-sitio.com`,
 * ni `/miembros/perfil`, que es una ruta del portal pero no es el catálogo y
 * haría mentir a la etiqueta del botón.
 *
 * Next entrega `string[]` cuando el parámetro se repite en la URL, así que esa
 * normalización se hace aquí y no en la página: es parte de sanear la entrada.
 */
export function resolverVolverAlCatalogo(
  valor: string | string[] | undefined,
): string {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  if (typeof crudo !== 'string') return CATALOGO
  if (crudo === CATALOGO) return CATALOGO
  return crudo.startsWith(`${CATALOGO}?`) ? crudo : CATALOGO
}

const CATALOGO = '/miembros'
