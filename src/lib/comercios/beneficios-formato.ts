import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

/** Texto amigable para mostrar un beneficio en el portal de miembros. */
export function formatearBeneficio(tipoCodigo: TipoBeneficioCodigo, valor: number | null): string {
  switch (tipoCodigo) {
    case 'porcentaje':
      return `${valor ?? 0}% de descuento`
    case 'monto_fijo':
      return `$${(valor ?? 0).toLocaleString('es-CO')} de descuento`
    case 'dos_por_uno':
      return '2x1'
    case 'regalo':
      return 'Regalo'
  }
}

/**
 * LA FORMA CORTA, para la insignia de una tarjeta.
 *
 * `formatearBeneficio` devuelve la frase completa —«$50.000 de descuento»— y
 * eso es lo correcto en la ficha, donde hay ancho de sobra y el socio está
 * leyendo los detalles. En una tarjeta de estantería, no: son ~150px de texto
 * que no parte dentro de una píldora, en una tarjeta que deja 176 de contenido.
 * Se salía por el lado, y es lo que el propietario veía una y otra vez.
 *
 * Arreglarlo con CSS —dejar que la píldora parta en dos líneas, o recortarla—
 * trata el síntoma: una insignia de dos líneas desequilibra la fila entera, y
 * recortar se come justo el final. Lo que sobra es el texto, no el espacio.
 *
 * Aquí la cifra va sola porque el CONTEXTO ya dice el resto: es la única
 * píldora dorada de una tarjeta de comercio, en la ranura del beneficio, y
 * quien la consume le pone además el icono del descuento al lado. «20%» en ese
 * sitio no es ambiguo; «20% de descuento» solo repite lo que ya se sabe.
 *
 * Función pura: se prueba sin DOM.
 */
export function formatearBeneficioCorto(
  tipoCodigo: TipoBeneficioCodigo,
  valor: number | null,
): string {
  switch (tipoCodigo) {
    case 'porcentaje':
      return `${valor ?? 0}%`
    case 'monto_fijo':
      return `$${(valor ?? 0).toLocaleString('es-CO')}`
    case 'dos_por_uno':
      return '2x1'
    case 'regalo':
      return 'Regalo'
  }
}
