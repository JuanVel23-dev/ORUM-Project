-- El REVOKE anterior quito el grant individual de anon/authenticated, pero
-- Postgres otorga EXECUTE a PUBLIC (pseudo-rol = todos los roles) por defecto
-- al crear una funcion, y ese grant se suma via UNION independientemente de
-- los revokes individuales. Sin revocarlo tambien de PUBLIC, anon y
-- authenticated seguian pudiendo ejecutar registrar_venta por herencia.
revoke execute on function public.registrar_venta(
  bigint, numeric, public.metodo_registro_venta, text, uuid, bigint, numeric
) from public;
