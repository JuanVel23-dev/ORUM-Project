-- ORUM · Auditoría del 1/10/2026 · punto 4 (menores)
--
-- (a) Políticas que evaluaban auth.*() por cada fila.
--     `auth.uid()` / `auth.role()` sin `(select …)` se recalculan por fila; con
--     el envoltorio Postgres lo evalúa una vez por consulta (initplan). Mismo
--     criterio que ya usan el resto de políticas del esquema. No cambia QUIÉN
--     puede qué, solo cuánto cuesta decidirlo.

alter policy "ventas_insert_comercio_propio" on public.ventas
  with check (
    registrada_por_perfil = (select auth.uid())
    and sucursal_id in (
      select s.id
      from public.sucursales s
      join public.comercios c on c.id = s.comercio_id
      where c.perfil_id = (select auth.uid())
    )
  );

alter policy "anuncios_public_select" on public.anuncios
  using (
    activo
    and deleted_at is null
    and (mostrar_publico or (select auth.role()) = 'authenticated')
  );

-- (b) Índices en tres claves foráneas que se unen o se consultan.
--     (Las otras seis avisadas por el linter son de auditoría —creado_por,
--     actor_id, registrada_por_perfil— y de uso raro: no compensan el coste de
--     escritura.)

create index idx_membresias_plan on public.membresias (plan_id);
create index idx_ventas_membresia on public.ventas (membresia_id);
create index idx_promociones_tipo_beneficio on public.promociones (tipo_beneficio_id);

-- (c) Función de trigger con search_path fijo. Solo usa now() (pg_catalog).

alter function public.fn_set_updated_at() set search_path = public;

-- (d) El rol anónimo no escribe en ninguna tabla.
--
--     Hoy RLS ya lo impide —se comprobó que ninguna política deja escribir a
--     anon ni a public— y la aplicación nunca escribe sin sesión. Esto es una
--     segunda barrera: si algún día una política se escribe mal, anon sigue sin
--     poder escribir. SELECT se conserva: las políticas de lectura pública
--     (comercios, sucursales, anuncios…) lo necesitan.
--
--     El `alter default privileges` evita que las tablas FUTURAS nazcan con
--     esos permisos para anon (Supabase los concede por defecto).

revoke insert, update, delete, truncate on all tables in schema public from anon;

alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate on tables from anon;
