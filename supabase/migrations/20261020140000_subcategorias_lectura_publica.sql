-- Igual que `categorias`: el catálogo de subcategorías es información pública
-- (la ficha del Portal de Miembros lee con la sesión del socio, no con la
-- service_role) y solo la administración escribe.
create policy subcat_subcategorias_select on public.subcategorias
  for select to anon, authenticated using (true);

create policy subcat_subcategorias_admin on public.subcategorias
  for all to authenticated using (es_admin()) with check (es_admin());
