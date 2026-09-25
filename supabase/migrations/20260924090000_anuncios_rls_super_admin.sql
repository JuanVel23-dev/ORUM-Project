-- ORUM · Novedades del club: RLS de anuncios a super_admin, y cerrar la fuga
-- de "solo socios" a `anon`.
--
-- Sigue a 20260923140000_anuncios.sql, ya aplicada en producción — este es un
-- follow-up, no una edición del archivo original.
--
-- Motivo 1 — `es_admin()` incluye `empleado`, y el encargo no.
-- `es_admin()` es `r.codigo in ('super_admin','empleado')`, sin comprobar
-- `activo`. Las server actions de `src/app/admin/anuncios/actions.ts` ya
-- exigen `super_admin` (`exigirSuperAdmin`), pero la política de RLS era más
-- permisiva que el propio código de la aplicación: una sesión `empleado`
-- podía INSERT/UPDATE/DELETE filas de `anuncios` directo por PostgREST, y
-- también escribir en el bucket `imagenes-anuncios`. El spec
-- (docs/superpowers/specs/2026-09-23-anuncios-novedades-design.md) es
-- explícito: los empleados no publican novedades. Se usa
-- `public.es_super_admin()`, que ya existe en este proyecto.
--
-- Motivo 2 — `anuncios_public_select` dejaba leer a `anon` incluso los
-- anuncios "solo socios" (`mostrar_publico = false`). El formulario de admin
-- promete «La ven los socios con membresía vigente» para esa casilla; hoy
-- ningún código explota la fuga porque el portal público lee con el cliente
-- admin (que salta RLS), pero la política debe cumplir lo que promete por sí
-- sola, no depender de que nadie use el cliente anónimo por error.

drop policy if exists "anuncios_admin" on public.anuncios;
create policy "anuncios_admin"
on public.anuncios for all to authenticated
using (public.es_super_admin())
with check (public.es_super_admin());

drop policy if exists "imganu_escritura_admin" on storage.objects;
create policy "imganu_escritura_admin"
on storage.objects for all to authenticated
using (bucket_id = 'imagenes-anuncios' and public.es_super_admin())
with check (bucket_id = 'imagenes-anuncios' and public.es_super_admin());

drop policy if exists "anuncios_public_select" on public.anuncios;
create policy "anuncios_public_select"
on public.anuncios for select to anon, authenticated
using (activo and deleted_at is null and (mostrar_publico or auth.role() = 'authenticated'));
