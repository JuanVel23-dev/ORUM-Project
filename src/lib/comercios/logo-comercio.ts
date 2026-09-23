/**
 * Resuelve qué logo se muestra para un comercio: **el suyo → el de su marca → ninguno**.
 *
 * Un comercio de una cadena que no tiene logo propio sí tiene uno disponible —el de la
 * marca—, y hasta ahora nadie lo usaba: la tarjeta caía directamente al respaldo
 * tipográfico. Devolver `null` es el último eslabón, y quien pinta decide qué hacer con
 * él (hoy, la inicial del comercio).
 *
 * `logo_url` es una columna de texto que rellena un administrador. La acción de comercios
 * normaliza la cadena vacía a `null`, pero `marcas` no tiene formulario en la aplicación
 * y sus filas se cargaron a mano: una cadena vacía o con solo espacios llegaría aquí como
 * un valor «presente» y cortaría la cadena en seco. Por eso se recorta y se comprueba,
 * en vez de un `??`.
 */
export function resolverLogoComercio(
  logoComercio: string | null,
  logoMarca: string | null,
): string | null {
  return normalizar(logoComercio) ?? normalizar(logoMarca)
}

function normalizar(url: string | null): string | null {
  const limpia = (url ?? '').trim()
  return limpia === '' ? null : limpia
}
