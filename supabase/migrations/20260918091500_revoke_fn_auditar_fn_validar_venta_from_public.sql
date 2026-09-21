-- Mismo caso que 20260819120100_revoke_registrar_venta_execute_from_public.sql:
-- revocar de anon/authenticated no alcanza si la funcion sigue teniendo
-- EXECUTE otorgado a PUBLIC (grant que Postgres da por defecto al crear una
-- funcion) -- ese grant se suma via UNION sin importar los revokes
-- individuales. fn_auditar se revoco solo de anon/authenticated en
-- 20260918090000 y por eso get_advisors la seguia marcando; fn_validar_venta
-- se creo en esa misma migracion sin revocar nada.
revoke execute on function public.fn_auditar() from public;
revoke execute on function public.fn_validar_venta() from public, anon, authenticated;
