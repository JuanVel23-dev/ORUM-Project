/**
 * Descuento automático para promociones de tipo `porcentaje` o `monto_fijo`.
 * `dos_por_uno` y `regalo` no se calculan aquí: el comercio los digita a mano
 * porque el sistema no conoce precios de artículos individuales.
 */
export function calcularDescuento(
  tipoCodigo: 'porcentaje' | 'monto_fijo',
  valorPromocion: number,
  valorCompra: number,
): number {
  if (tipoCodigo === 'porcentaje') {
    return Math.round((valorCompra * valorPromocion) / 100)
  }
  return Math.min(valorPromocion, valorCompra)
}

/** Valor final de la venta: compra menos descuento, nunca negativo. */
export function calcularValorFinal(valorCompra: number, valorDescuento: number): number {
  return Math.max(0, valorCompra - valorDescuento)
}
