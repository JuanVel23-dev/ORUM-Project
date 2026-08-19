-- registrar_venta no valida que la promocion sea del comercio ni revalida su
-- vigencia, y confia en el descuento recibido por parametro. El codigo de la
-- app no la usa (registra ventas con un insert propio y validaciones en
-- servidor); se revoca el acceso publico para cerrar esa superficie.
revoke execute on function public.registrar_venta(
  bigint, numeric, public.metodo_registro_venta, text, uuid, bigint, numeric
) from anon, authenticated;
